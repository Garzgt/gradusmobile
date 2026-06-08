import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RankingCard({ rankings, programCode }) {
  const { department_rank, campus_rank, in_top25_department, in_top25_campus } = rankings;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="stats-chart-outline" size={14} color="#2A7AB6" />
        <Text style={styles.cardHeaderText}>LIVE RANKING</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.rankItem}>
          <View style={styles.rankTop}>
            <Ionicons name="school-outline" size={13} color="#8BA4BC" />
            <Text style={styles.rankScope}>BY DEPARTMENT</Text>
          </View>
          {in_top25_department ? (
            <View style={styles.rankValueRow}>
              <Text style={styles.rankNumber}># {department_rank}</Text>
              <Text style={styles.rankLabel}>{programCode ?? 'Department'}</Text>
            </View>
          ) : (
            <Text style={styles.notRanked}>Not in Top 25 yet</Text>
          )}
        </View>

        {in_top25_campus && (
          <>
            <View style={styles.divider} />
            <View style={styles.rankItem}>
              <View style={styles.rankTop}>
                <Ionicons name="globe-outline" size={13} color="#8BA4BC" />
                <Text style={styles.rankScope}>CAMPUS-WIDE</Text>
              </View>
              <View style={styles.rankValueRow}>
                <Text style={[styles.rankNumber, { color: '#D97706' }]}># {campus_rank}</Text>
                <Text style={styles.rankLabel}>All Programs</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 10,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF4FC',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cardHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2A7AB6',
    letterSpacing: 1.2,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  rankItem: {
    flex: 1,
    gap: 6,
  },
  rankTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rankScope: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8BA4BC',
    letterSpacing: 0.8,
  },
  rankValueRow: {
    gap: 2,
  },
  rankNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2A7AB6',
    letterSpacing: -0.5,
  },
  rankLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A7A9A',
  },
  notRanked: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C8DFF0',
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: '#EEF4FA',
    alignSelf: 'stretch',
  },
});
