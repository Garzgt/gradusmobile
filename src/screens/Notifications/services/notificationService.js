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

// ─── Live inbox ───────────────────────────────────────────────────────────────
//
// One shared channel, fanned out to every listener. Supabase keys channels by
// topic, so two components each calling supabase.channel() with the same name
// get handed the same already-subscribed instance — and attaching a
// postgres_changes handler to a subscribed channel throws.
//
// Requires the `notifications` table to be in the `supabase_realtime`
// publication. DELETE events additionally need REPLICA IDENTITY FULL on the
// table — without it Postgres only ships the primary key, so a filter on
// recipient_user_id can never match and deletions never arrive.

let channel = null;
let channelUserId = null;
const listeners = new Set();

function emit(kind, payload) {
  listeners.forEach((handlers) => handlers[kind]?.(payload));
}

function teardown() {
  if (channel) supabase.removeChannel(channel);
  channel = null;
  channelUserId = null;
}

function ensureChannel(userId) {
  if (channel && channelUserId === userId) return;
  if (channel) teardown();

  channelUserId = userId;
  const filter = `recipient_user_id=eq.${userId}`;

  channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter },
      (payload) => emit('onInsert', payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'notifications', filter },
      (payload) => emit('onUpdate', payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'notifications', filter },
      (payload) => emit('onDelete', payload.old?.id)
    )
    .subscribe();
}

// Returns an unsubscribe function. The channel is torn down once the last
// listener detaches, so nothing stays open behind an unmounted screen.
export function subscribeToNotifications(userId, handlers = {}) {
  if (!userId) return () => {};

  listeners.add(handlers);
  ensureChannel(userId);

  return () => {
    listeners.delete(handlers);
    if (listeners.size === 0) teardown();
  };
}
