import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPE_CONFIG } from './NotificationCard';

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function NotificationDetailModal({ item, onClose }) {
  const visible = !!item;
  const config = item ? (TYPE_CONFIG[item.notification_type] ?? TYPE_CONFIG.general) : TYPE_CONFIG.general;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          {item && (
            <>
              <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon} size={26} color={config.color} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.time}>{formatFullDate(item.created_at)}</Text>
              <View style={styles.divider} />
              <Text style={styles.message}>{item.message}</Text>
              <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
                <Text style={styles.closeBtnText}>Close</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26,60,94,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A2A3A',
    textAlign: 'center',
  },
  time: {
    fontSize: 12,
    color: '#8BA4BC',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF4FA',
    alignSelf: 'stretch',
    marginVertical: 16,
  },
  message: {
    fontSize: 14,
    color: '#5A7490',
    lineHeight: 21,
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: 22,
    alignSelf: 'stretch',
    backgroundColor: '#1a3c5e',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
