import { supabase } from '../../../config/supabase';

const OFFERING_FIELDS = `
  id,
  subject:subjects!subject_id (
    id,
    subject_code,
    title,
    credit_units,
    lec_units,
    lab_units,
    color_hex
  ),
  term:academic_terms!term_id (
    id,
    school_year,
    semester,
    is_active
  ),
  teacher:teachers!teacher_id (
    id,
    first_name,
    last_name
  ),
  section:sections!section_id (
    id,
    section_code
  )
`;

const POSTED_GRADE_FIELDS = `
  class_offering_id,
  midterm_points,
  final_term_points,
  final_points,
  equivalent_grade,
  remarks,
  status
`;

// --- Public API ---

export async function fetchStudentGrades(userId) {
  const { data: student, error: sErr } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (sErr || !student) return { data: null, error: sErr ?? new Error('Student not found') };

  const { data: enrollments, error: eErr } = await supabase
    .from('class_students')
    .select(`
      class_offering_id,
      class_offering:class_offerings!class_offering_id (${OFFERING_FIELDS})
    `)
    .eq('student_id', student.id)
    .eq('is_active', true);

  if (eErr) return { data: null, error: eErr };
  if (!enrollments?.length) return { data: { studentId: student.id, terms: [] }, error: null };

  const offeringIds = enrollments.map(e => e.class_offering_id);

  const { data: postedGrades, error: gErr } = await supabase
    .from('grades')
    .select(POSTED_GRADE_FIELDS)
    .eq('student_id', student.id)
    .in('status', ['posted', 'approved'])
    .in('class_offering_id', offeringIds);

  if (gErr) return { data: null, error: gErr };

  const gradeMap = {};
  for (const g of postedGrades ?? []) {
    gradeMap[g.class_offering_id] = g;
  }

  const grades = enrollments.map(enrollment => {
    const offering = enrollment.class_offering;
    const posted   = gradeMap[enrollment.class_offering_id] ?? null;
    return {
      classOfferingId: enrollment.class_offering_id,
      studentId:       student.id,
      subject:         offering?.subject  ?? null,
      term:            offering?.term     ?? null,
      teacher:         offering?.teacher  ?? null,
      section:         offering?.section  ?? null,
      midGrade:    posted?.midterm_points    != null ? Number(posted.midterm_points)    : null,
      finGrade:    posted?.final_term_points != null ? Number(posted.final_term_points) : null,
      finalPoints: posted?.final_points      != null ? Number(posted.final_points)      : null,
      equivalent:  posted?.equivalent_grade  != null ? Number(posted.equivalent_grade)  : null,
      remarks:     posted?.remarks ?? null,
      gradeStatus: posted?.status ?? null,
    };
  });

  // Group by term, newest first
  const termMap = {};
  for (const grade of grades) {
    const term = grade.term;
    if (!term) continue;
    if (!termMap[term.id]) termMap[term.id] = { term, grades: [] };
    termMap[term.id].grades.push(grade);
  }

  const terms = Object.values(termMap).sort((a, b) => {
    const yCmp = b.term.school_year.localeCompare(a.term.school_year);
    return yCmp !== 0 ? yCmp : b.term.semester - a.term.semester;
  });

  return { data: { studentId: student.id, terms }, error: null };
}

export async function fetchGradeDetail(classOfferingId, studentId) {
  const [
    offeringRes,
    postedGradeRes,
    componentsRes,
    sheetSettingsRes,
    periodSettingsRes,
    attendanceRes,
  ] = await Promise.all([
    supabase.from('class_offerings').select(OFFERING_FIELDS).eq('id', classOfferingId).maybeSingle(),
    supabase.from('grades')
      .select(POSTED_GRADE_FIELDS)
      .eq('class_offering_id', classOfferingId)
      .eq('student_id', studentId)
      .eq('status', 'posted')
      .maybeSingle(),
    supabase.from('grade_components').select('*').eq('class_offering_id', classOfferingId).eq('student_id', studentId),
    supabase.from('grade_sheet_settings').select('*').eq('class_offering_id', classOfferingId).maybeSingle(),
    supabase.from('grade_period_settings').select('*').eq('class_offering_id', classOfferingId),
    supabase.from('grade_attendance_entries')
      .select('meeting_date, meeting_number, attendance_value, period')
      .eq('class_offering_id', classOfferingId)
      .eq('student_id', studentId)
      .order('meeting_number', { ascending: true }),
  ]);

  if (offeringRes.error) return { data: null, error: offeringRes.error };

  const offering          = offeringRes.data;
  const postedGrade       = postedGradeRes.data ?? null;
  const components        = componentsRes.data  ?? [];
  const midRow            = components.find(c => c.period === 'midterm') ?? null;
  const finRow            = components.find(c => c.period === 'final')   ?? null;
  const sheetSettings     = sheetSettingsRes.data ?? null;
  const periodSettings    = periodSettingsRes.data ?? [];
  const midPeriodSettings = periodSettings.find(p => p.period === 'midterm') ?? null;
  const finPeriodSettings = periodSettings.find(p => p.period === 'final')   ?? null;
  const attendance        = attendanceRes.data ?? [];

  return {
    data: {
      classOfferingId,
      studentId,
      subject:            offering?.subject  ?? null,
      term:               offering?.term     ?? null,
      teacher:            offering?.teacher  ?? null,
      section:            offering?.section  ?? null,
      midtermComponent:   midRow,
      finalComponent:     finRow,
      sheetSettings,
      midPeriodSettings,
      finPeriodSettings,
      midAttendance:  attendance.filter(a => a.period === 'midterm'),
      finAttendance:  attendance.filter(a => a.period === 'final'),
      components,
      // Grade values only populated when teacher has posted grades
      hasPostedGrade: postedGrade != null,
      midGrade:    postedGrade?.midterm_points    != null ? Number(postedGrade.midterm_points)    : null,
      finGrade:    postedGrade?.final_term_points != null ? Number(postedGrade.final_term_points) : null,
      finalPoints: postedGrade?.final_points      != null ? Number(postedGrade.final_points)      : null,
      equivalent:  postedGrade?.equivalent_grade  != null ? Number(postedGrade.equivalent_grade)  : null,
      remarks:     postedGrade?.remarks ?? null,
    },
    error: null,
  };
}

// "2(1)" for a subject with both lecture and lab units (e.g. 2 lec + 1 lab),
// plain "3" for lecture-only subjects (or PE, which has no lab component) —
// matches the lec(lab) notation already used on the printed Pre-Registration Form.
export function formatCreditUnits(subject) {
  const lec = subject?.lec_units;
  const lab = subject?.lab_units;
  if (lec != null && lab != null && Number(lab) > 0) {
    return `${lec}(${lab})`;
  }
  return subject?.credit_units ?? '—';
}

export function computeTermGwa(grades) {
  const eligible = grades.filter(g => g.equivalent != null && g.remarks !== 'DROPPED');
  if (!eligible.length) return null;
  const totalUnits = eligible.reduce((s, g) => s + (parseFloat(g.subject?.credit_units) || 0), 0);
  if (!totalUnits) return null;
  const weighted = eligible.reduce((s, g) => {
    const u = parseFloat(g.subject?.credit_units) || 0;
    return s + g.equivalent * u;
  }, 0);
  return (weighted / totalUnits).toFixed(4);
}
