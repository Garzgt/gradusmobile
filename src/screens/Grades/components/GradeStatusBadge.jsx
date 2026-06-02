import React from 'react';
import { View, Text } from 'react-native';
import styles from './GradeStatusBadge.styles';

const CONFIG = {
  PASSED:  { bg: '#D1FAE5', text: '#065F46' },
  FAILED:  { bg: '#FEE2E2', text: '#991B1B' },
  DROPPED: { bg: '#FEF3C7', text: '#92400E' },
  INC:     { bg: '#DBEAFE', text: '#1E40AF' },
};
const DEFAULT = { bg: '#F1F5F9', text: '#475569' };

export default function GradeStatusBadge({ remarks }) {
  const cfg = CONFIG[remarks] ?? DEFAULT;
  const label = remarks ?? 'PENDING';
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.label, { color: cfg.text }]}>{label}</Text>
    </View>
  );
}
