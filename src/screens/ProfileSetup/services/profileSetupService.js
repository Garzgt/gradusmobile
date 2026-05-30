import { supabase } from '../../../config/supabase';

export async function fetchPrograms() {
  const { data, error } = await supabase
    .from('programs')
    .select('id, code, name')
    .order('code');
  return { data, error };
}

export async function saveStudentProfile({ userId, email, firstName, middleName, lastName, programId, contactNumber }) {
  const studentNumber = email.split('@')[0];

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      email,
      full_name: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim(),
      app_role: 'student',
    });

  if (profileError) return { error: profileError };

  const { error: studentError } = await supabase.rpc('setup_student_profile', {
    p_student_number:  studentNumber,
    p_email:           email,
    p_first_name:      firstName,
    p_middle_name:     middleName || '',
    p_last_name:       lastName,
    p_program_id:      programId,
    p_contact_number:  contactNumber || '',
  });

  return { error: studentError };
}
