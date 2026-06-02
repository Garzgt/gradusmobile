import React from 'react';
import { View, Text } from 'react-native';
import styles from './GwaSummaryCard.styles';

function getGwaColor(gwa) {
  if (gwa == null) return '#8BA4BC';
  const n = parseFloat(gwa);
  if (n <= 1.75) return '#4ADE80';
  if (n <= 2.5)  return '#60A5FA';
  if (n <= 3.0)  return '#FBBF24';
  return '#F87171';
}

export default function GwaSummaryCard({ gwa, termLabel, subjectCount, passedCount }) {
  const display = gwa != null ? parseFloat(gwa).toFixed(2) : '—';
  const color = getGwaColor(gwa);

  return (
    <View style={styles.card}>
      <View style={styles.decOrb} />
      <View style={styles.left}>
        <Text style={styles.smallLabel}>GWA</Text>
        <Text style={[styles.gwaNumber, { color }]}>{display}</Text>
        <Text style={styles.description}>General Weighted Average</Text>
        {termLabel ? <Text style={styles.termLabel}>{termLabel}</Text> : null}
      </View>
      <View style={styles.right}>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{passedCount}</Text>
          <Text style={styles.statLabel}>Passed</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{subjectCount}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
      </View>
    </View>
  );
}
