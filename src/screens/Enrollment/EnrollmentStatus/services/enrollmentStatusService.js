import { supabase } from '../../../config/supabase';

export async function fetchEnrollmentStatus(userId) {
  const { data: student, error: sErr } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (sErr || !student) return { data: null, error: sErr ?? new Error('Student not found') };

  const { data: rows, error: eErr } = await supabase
    .from('class_students')
    .select(`
      class_offering_id,
      class_offering:class_offerings!class_offering_id (
        id,
        subject:subjects!subject_id (
          subject_code,
          title,
          credit_units,
          lec_units,
          lab_units,
          color_hex
        ),
        section:sections!section_id (
          section_code,
          year_level
        ),
        teacher:teachers!teacher_id (
          first_name,
          last_name
        ),
        term:academic_terms!term_id (
          id,
          school_year,
          semester,
          is_active
        )
      )
    `)
    .eq('student_id', student.id)
    .eq('is_active', true);

  if (eErr) return { data: null, error: eErr };
  if (!rows?.length) return { data: { studentId: student.id, enrollments: [], activeTerm: null }, error: null };

  const activeRows = rows.filter(r => r.class_offering?.term?.is_active);
  const activeTerm = activeRows[0]?.class_offering?.term ?? null;

  const enrollments = activeRows.map(r => {
    const o = r.class_offering;
    return {
      classOfferingId: r.class_offering_id,
      subject: o?.subject ?? null,
      section: o?.section ?? null,
      teacher: o?.teacher ?? null,
      term: o?.term ?? null,
    };
  });

  return { data: { studentId: student.id, enrollments, activeTerm }, error: null };
}
