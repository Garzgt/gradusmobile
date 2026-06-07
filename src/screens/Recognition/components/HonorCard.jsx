import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HONOR_CONFIG = {
  presidents_list: {
    label: "President's List",
    icon: 'trophy',
    color: '#D97706',
    bg: '#FEF3C7',
    badgeText: '#D97706',
  },
  deans_list: {
    label: "Dean's List",
    icon: 'ribbon',
    color: '#2A7AB6',
    bg: '#EBF4FC',
    badgeText: '#2A7AB6',
  },
};

function termLabel(term) {
  if (!term) return '—';
  const sem = term.semester === 1 ? '1st Semester' : '2nd Semester';
  return `${sem} ${term.school_year}`;
}

export default function HonorCard({ item }) {
  const config = HONOR_CONFIG[item.honor_type] ?? HONOR_CONFIG.deans_list;

  return (
    <View style={[styles.card, { borderLeftColor: config.color }]}>
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={26} color={config.color} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Text style={[styles.badgeText, { color: config.badgeText }]}>
              {config.label}
            </Text>
          </View>
          {item.term?.is_active && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current</Text>
            </View>
          )}
        </View>
        <Text style={styles.term}>{termLabel(item.term)}</Text>
        <View style={styles.gwaRow}>
          <Text style={styles.gwaLabel}>GWA</Text>
          <Text style={[styles.gwaValue, { color: config.color }]}>
            {parseFloat(item.gwa).toFixed(2)}
          </Text>
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
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  currentBadge: {
    backgroundColor: '#E8F5EE',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  term: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2A3A',
  },
  gwaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gwaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8BA4BC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gwaValue: {
    fontSize: 16,
    fontWeight: '800',
  },
});
