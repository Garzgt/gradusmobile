import { supabase } from '../../../config/supabase';

export async function fetchMyHonors(userId) {
  const { data: student, error: sErr } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (sErr || !student) return { data: null, error: sErr ?? new Error('Student not found') };

  const { data, error } = await supabase
    .from('academic_honors')
    .select(`
      id,
      honor_type,
      gwa,
      awarded_at,
      certificate_url,
      term:academic_terms!term_id (
        id,
        school_year,
        semester,
        is_active
      )
    `)
    .eq('student_id', student.id)
    .order('awarded_at', { ascending: false });

  if (error) return { data: null, error };
  return { data: data ?? [], error: null };
}