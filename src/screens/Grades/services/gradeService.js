import { supabase } from '../../../config/supabase';

// --- Grade computation: mirrors Desktop gradeCompute.js ---

const GRADE_EQUIV = {
  100: 1.00, 99: 1.05, 98: 1.10, 97: 1.15, 96: 1.20,
  95: 1.25,  94: 1.30, 93: 1.35, 92: 1.40, 91: 1.45,
  90: 1.50,  89: 1.60, 88: 1.70, 87: 1.80, 86: 1.90,
  85: 2.00,  84: 2.10, 83: 2.20, 82: 2.30, 81: 2.40,
  80: 2.50,  79: 2.60, 78: 2.70, 77: 2.80, 76: 2.90,
  75: 3.00,  74: 3.00,
};

function lookupEquivalent(points) {
  const floored = Math.floor(points);
  if (floored < 74) return 5.00;
  return GRADE_EQUIV[Math.min(floored, 100)] ?? 5.00;
}

function computeGradeEntry(midRow, finRow) {
  const isDropped =
    midRow?.term_grade_label === 'FA'  || midRow?.term_grade_label === 'DRP' ||
    finRow?.term_grade_label  === 'FA' || finRow?.term_grade_label  === 'DRP';

  if (isDropped) {
    return {
      midGrade: midRow?.term_grade_numeric ?? null,
      finGrade: finRow?.term_grade_numeric ?? null,
      finalPoints: null,
      equivalent: null,
      remarks: 'DROPPED',
    };
  }

  const midGrade = midRow?.term_grade_numeric != null ? Number(midRow.term_grade_numeric) : null;
  const finGrade = finRow?.term_grade_numeric != null ? Number(finRow.term_grade_numeric) : null;

  if (midGrade === null || finGrade === null) {
    return { midGrade, finGrade, finalPoints: null, equivalent: null, remarks: 'INC' };
  }

  const finalPoints = midGrade * 0.5 + finGrade * 0.5;
  const equivalent  = lookupEquivalent(Math.round(finalPoints));
  const remarks     = equivalent >= 5.00 ? 'FAILED' : 'PASSED';
  return { midGrade, finGrade, finalPoints, equivalent, remarks };
}

// --- Supabase select strings ---

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

const COMPONENT_FIELDS = `
  class_offering_id,
  period,
  term_grade_numeric,
  term_grade_label,
  quizzes_weighted,
  quizzes_raw,
  activities_weighted,
  activities_raw,
  attendance_weighted,
  attendance_raw,
  recitation_weighted,
  recitation_raw,
  laboratory_weighted,
  laboratory_raw,
  major_exam_weighted,
  major_exam_raw
`;

// --- Public API ---

export async function fetchStudentGrades(userId) {
  const { data: student, error: sErr } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (sErr || !student) {
    return { data: null, error: sErr ?? new Error('Student not found') };
  }

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

  const { data: components, error: cErr } = await supabase
    .from('grade_components')
    .select(COMPONENT_FIELDS)
    .eq('student_id', student.id)
    .in('class_offering_id', offeringIds);

  if (cErr) return { data: null, error: cErr };

  // Build per-offering component map: id → { midterm, final }
  const compMap = {};
  for (const comp of components ?? []) {
    const id = comp.class_offering_id;
    if (!compMap[id]) compMap[id] = {};
    compMap[id][comp.period] = comp;
  }

  const grades = enrollments.map(enrollment => {
    const offering = enrollment.class_offering;
    const midRow   = compMap[enrollment.class_offering_id]?.midterm ?? null;
    const finRow   = compMap[enrollment.class_offering_id]?.final   ?? null;
    return {
      classOfferingId:  enrollment.class_offering_id,
      studentId:        student.id,
      subject:          offering?.subject  ?? null,
      term:             offering?.term     ?? null,
      teacher:          offering?.teacher  ?? null,
      section:          offering?.section  ?? null,
      midtermComponent: midRow,
      finalComponent:   finRow,
      ...computeGradeEntry(midRow, finRow),
    };
  });

  // Group by term, sort newest first
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
  const [offeringRes, componentsRes] = await Promise.all([
    supabase.from('class_offerings').select(OFFERING_FIELDS).eq('id', classOfferingId).maybeSingle(),
    supabase.from('grade_components').select('*').eq('class_offering_id', classOfferingId).eq('student_id', studentId),
  ]);

  if (offeringRes.error) return { data: null, error: offeringRes.error };

  const offering    = offeringRes.data;
  const components  = componentsRes.data ?? [];
  const midRow      = components.find(c => c.period === 'midterm') ?? null;
  const finRow      = components.find(c => c.period === 'final')   ?? null;

  return {
    data: {
      classOfferingId,
      studentId,
      subject:          offering?.subject  ?? null,
      term:             offering?.term     ?? null,
      teacher:          offering?.teacher  ?? null,
      section:          offering?.section  ?? null,
      midtermComponent: midRow,
      finalComponent:   finRow,
      components,
      ...computeGradeEntry(midRow, finRow),
    },
    error: null,
  };
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
  return (weighted / totalUnits).toFixed(2);
}
