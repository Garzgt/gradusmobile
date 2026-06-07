import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EnrollmentSummary({ activeTerm, enrollments }) {
  const sem = activeTerm?.semester === 1 ? '1st Semester' : '2nd Semester';
  const termLabel = activeTerm ? `${sem} ${activeTerm.school_year}` : 'No Active Term';
  const totalUnits = enrollments.reduce(
    (sum, e) => sum + (parseFloat(e.subject?.credit_units) || 0),
    0
  );

  return (
    <View style={styles.card}>
      <View style={styles.termRow}>
        <View style={styles.termIcon}>
          <Ionicons name="calendar-outline" size={14} color="#2A7AB6" />
        </View>
        <Text style={styles.termLabel}>{termLabel}</Text>
        <View style={styles.enrolledBadge}>
          <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
          <Text style={styles.enrolledText}>Enrolled</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{enrollments.length}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{totalUnits}</Text>
          <Text style={styles.statLabel}>Total Units</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 10,
    marginTop: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  termIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#EBF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  termLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2A3A',
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5EE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  enrolledText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF4FA',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a3c5e',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8BA4BC',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#EEF4FA',
  },
});
