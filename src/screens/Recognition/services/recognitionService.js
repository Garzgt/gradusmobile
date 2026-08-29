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
      rank,
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

export async function fetchStudentRankings(userId) {
  const { data: student, error: sErr } = await supabase
    .from('students')
    .select('id, programs(code)')
    .eq('user_id', userId)
    .maybeSingle();

  if (sErr || !student) return { data: null, error: sErr ?? new Error('Student not found') };

  const { data: term, error: tErr } = await supabase
    .from('academic_terms')
    .select('id')
    .eq('is_active', true)
    .maybeSingle();

  if (tErr || !term) return { data: null, error: tErr ?? new Error('No active term') };

  console.log('[rankings] student:', student.id, '| term:', term.id);

  const { data, error } = await supabase.rpc('get_student_rankings', {
    p_student_id: student.id,
    p_term_id: term.id,
  });

  console.log('[rankings] result:', JSON.stringify(data), '| error:', error);

  if (error) return { data: null, error };
  return {
    data: { rankings: data, programCode: student.programs?.code ?? null },
    error: null,
  };
}
