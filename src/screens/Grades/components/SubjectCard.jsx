import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradeStatusBadge from './GradeStatusBadge';
import styles from './SubjectCard.styles';

const BANNER_ICONS = [
  'book-outline', 'laptop-outline', 'calculator-outline',
  'flask-outline', 'globe-outline', 'code-slash-outline',
  'construct-outline', 'pulse-outline',
];

export default function SubjectCard({ grade, onPress }) {
  const { subject, equivalent, remarks, teacher } = grade;
  const accentColor = subject?.color_hex ?? '#2A7AB6';
  const gradeDisplay = equivalent != null ? equivalent.toFixed(2) : '—';
  const iconIdx = (subject?.subject_code?.charCodeAt(0) ?? 0) % BANNER_ICONS.length;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.banner, { backgroundColor: accentColor }]}>
        <View style={styles.bannerOverlay} />
        <Ionicons
          name={BANNER_ICONS[iconIdx]}
          size={60}
          color="rgba(255,255,255,0.12)"
          style={styles.bgIcon}
        />
        <View style={styles.bannerTop}>
          <Text style={styles.subjectCode}>{subject?.subject_code ?? '—'}</Text>
          <GradeStatusBadge remarks={remarks} />
        </View>
        <Text style={styles.subjectTitle} numberOfLines={2}>{subject?.title ?? '—'}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <View style={styles.unitChip}>
            <Ionicons name="school-outline" size={11} color="#2A7AB6" />
            <Text style={styles.unitText}>{subject?.credit_units ?? '—'} units</Text>
          </View>
          {teacher && (
            <Text style={styles.teacherText} numberOfLines={1}>
              {teacher.first_name} {teacher.last_name}
            </Text>
          )}
        </View>
        <View style={styles.gradeRow}>
          <Text style={styles.gradeLabel}>Equivalent Grade</Text>
          <Text style={[styles.gradeValue, equivalent == null && styles.gradeValuePending]}>
            {gradeDisplay}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
