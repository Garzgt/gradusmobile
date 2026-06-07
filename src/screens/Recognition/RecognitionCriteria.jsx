import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const CRITERIA = [
  {
    honor: "President's List",
    icon: 'trophy',
    color: '#D97706',
    bg: '#FEF3C7',
    gwaRange: '1.00 – 1.25',
    requirements: [
      { icon: 'school-outline',          label: 'Regular Student' },
      { icon: 'bar-chart-outline',       label: 'GWA 1.00 – 1.25' },
      { icon: 'checkmark-done-outline',  label: 'All Subjects Graded' },
      { icon: 'close-circle-outline',    label: 'No Failed / INC / Dropped' },
    ],
  },
  {
    honor: "Dean's List",
    icon: 'ribbon',
    color: '#2A7AB6',
    bg: '#EBF4FC',
    gwaRange: '1.26 – 1.75',
    requirements: [
      { icon: 'school-outline',          label: 'Regular Student' },
      { icon: 'bar-chart-outline',       label: 'GWA 1.26 – 1.75' },
      { icon: 'checkmark-done-outline',  label: 'All Subjects Graded' },
      { icon: 'close-circle-outline',    label: 'No Failed / INC / Dropped' },
    ],
  },
];

export default function RecognitionCriteria() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.decOrb} />
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerLabel}>RECOGNITION</Text>
        <Text style={styles.headerTitle}>Honor Criteria</Text>
        <Text style={styles.headerSub}>Pampanga State University</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: 16 }}
      >
        {CRITERIA.map(c => (
          <View key={c.honor} style={styles.card}>
            <View style={[styles.cardTop, { backgroundColor: c.color }]}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Ionicons name={c.icon} size={28} color="#FFFFFF" />
              </View>
              <View style={styles.cardTopText}>
                <Text style={styles.honorTitle}>{c.honor}</Text>
                <View style={styles.gwaChip}>
                  <Text style={[styles.gwaChipText, { color: c.color }]}>{c.gwaRange}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardBody}>
              {c.requirements.map((req, i) => (
                <View key={i} style={[styles.reqRow, i < c.requirements.length - 1 && styles.reqBorder]}>
                  <View style={[styles.reqIcon, { backgroundColor: c.bg }]}>
                    <Ionicons name={req.icon} size={14} color={c.color} />
                  </View>
                  <Text style={styles.reqLabel}>{req.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a3c5e' },
  header: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 20,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  decOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60,
    right: -40,
  },
  headerTop: { paddingTop: 8, paddingBottom: 6 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  scroll: { backgroundColor: '#F2F6FA' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 10,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTopText: {
    flex: 1,
    gap: 8,
  },
  honorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  gwaChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  gwaChipText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  reqBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F6FC',
  },
  reqIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2A3A',
  },
});
