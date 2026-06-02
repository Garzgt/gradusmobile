import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradeStatusBadge from './GradeStatusBadge';
import styles from './GradeCard.styles';

export default function GradeCard({ grade, onPress }) {
  const { subject, equivalent, remarks } = grade;
  const accentColor    = subject?.color_hex ?? '#3b82f6';
  const gradeDisplay   = equivalent != null ? equivalent.toFixed(2) : '—';
  const hasGrade       = equivalent != null;

  const gradeStyle = [
    styles.grade,
    remarks === 'PASSED'  && styles.gradePassed,
    remarks === 'FAILED'  && styles.gradeFailed,
    !hasGrade             && styles.gradePending,
  ];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.code} numberOfLines={1}>{subject?.subject_code ?? '—'}</Text>
          <GradeStatusBadge remarks={remarks} />
        </View>
        <Text style={styles.title} numberOfLines={2}>{subject?.title ?? '—'}</Text>
        <Text style={styles.units}>{subject?.credit_units ?? '—'} units</Text>
      </View>
      <View style={styles.right}>
        <Text style={gradeStyle}>{gradeDisplay}</Text>
        <Ionicons name="chevron-forward" size={16} color="#8BA4BC" />
      </View>
    </TouchableOpacity>
  );
}
