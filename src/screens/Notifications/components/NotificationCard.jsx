import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TYPE_CONFIG = {
  grade_posted:  { icon: 'school-outline',          color: '#2A7AB6', bg: '#EBF4FC' },
  enrollment:    { icon: 'checkmark-circle-outline', color: '#1a6e4a', bg: '#E8F5EE' },
  advising:      { icon: 'document-text-outline',    color: '#1a3c5e', bg: '#EEF4FA' },
  announcement:  { icon: 'megaphone-outline',        color: '#5A7A9A', bg: '#F0F6FC' },
  general:       { icon: 'notifications-outline',    color: '#5A7A9A', bg: '#F0F6FC' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export default function NotificationCard({ item, onPress }) {
  const config = TYPE_CONFIG[item.notification_type] ?? TYPE_CONFIG.general;
  const unread = !item.is_read;

  return (
    <TouchableOpacity
      style={[styles.card, unread && styles.cardUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      {unread && <View style={styles.unreadStrip} />}
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    elevation: 1,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardUnread: {
    backgroundColor: '#FAFCFF',
    elevation: 2,
  },
  unreadStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#2A7AB6',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#5A7A9A',
  },
  titleUnread: {
    fontWeight: '700',
    color: '#1A2A3A',
  },
  time: {
    fontSize: 11,
    color: '#8BA4BC',
    flexShrink: 0,
  },
  message: {
    fontSize: 12,
    color: '#8BA4BC',
    lineHeight: 17,
  },
});
