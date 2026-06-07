import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EnrolledSubjectCard({ item }) {
  const { subject, section, teacher } = item;
  const colorStrip = subject?.color_hex ?? '#2A7AB6';
  const teacherName = teacher
    ? `${teacher.first_name} ${teacher.last_name}`
    : 'TBA';
  const units = parseFloat(subject?.credit_units) || 0;
  const hasLab = parseFloat(subject?.lab_units) > 0;

  return (
    <View style={styles.card}>
      <View style={[styles.colorStrip, { backgroundColor: colorStrip }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.codeChip}>
            <Text style={styles.codeText}>{subject?.subject_code ?? '—'}</Text>
          </View>
          <View style={styles.rightBadges}>
            {hasLab && (
              <View style={styles.labBadge}>
                <Text style={styles.labText}>LAB</Text>
              </View>
            )}
            <View style={styles.unitsBadge}>
              <Text style={styles.unitsText}>{units} {units === 1 ? 'unit' : 'units'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {subject?.title ?? 'Unknown Subject'}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={12} color="#8BA4BC" />
            <Text style={styles.metaText}>{section?.section_code ?? '—'}</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={[styles.metaItem, { flex: 1 }]}>
            <Ionicons name="person-outline" size={12} color="#8BA4BC" />
            <Text style={styles.metaText} numberOfLines={1}>{teacherName}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 10,
    marginBottom: 10,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  colorStrip: {
    width: 5,
    borderRadius: 0,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeChip: {
    backgroundColor: '#EBF4FC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2A7AB6',
    letterSpacing: 0.3,
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labBadge: {
    backgroundColor: '#F0F6FC',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  labText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5A7A9A',
    letterSpacing: 0.5,
  },
  unitsBadge: {
    backgroundColor: '#EEF4FA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unitsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A7A9A',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2A3A',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#8BA4BC',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C8DFF0',
    marginHorizontal: 8,
  },
});
