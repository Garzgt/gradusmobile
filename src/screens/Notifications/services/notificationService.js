import { supabase } from '../../../config/supabase';

export async function fetchUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_user_id', userId)
    .eq('is_read', false);

  if (error) return { count: 0, error };
  return { count: count ?? 0, error: null };
}

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, notification_type, title, message, is_read, created_at, link, metadata')
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error };
  return { data: data ?? [], error: null };
}

export async function markOneAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);
  return { error };
}

export async function markAllAsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_user_id', userId)
    .eq('is_read', false);
  return { error };
}

export async function deleteNotifications(ids) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .in('id', ids);
  return { error };
}
