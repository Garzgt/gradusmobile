import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import SkeletonBox from '../../../components/SkeletonLoader';
import { fetchEnrollmentStatus } from './services/enrollmentStatusService';
import EnrollmentSummary from './components/EnrollmentSummary';
import EnrolledSubjectCard from './components/EnrolledSubjectCard';

export default function EnrollmentStatus() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [activeTerm, setActiveTerm] = useState(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); return; }
    if (!isRefresh) setLoading(true);
    setError('');

    const { data, error: err } = await fetchEnrollmentStatus(user.id);
    if (err) {
      setError('Could not load enrollment. Pull down to retry.');
    } else {
      setEnrollments(data?.enrollments ?? []);
      setActiveTerm(data?.activeTerm ?? null);
    }
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.decOrb} />
        <Text style={styles.headerLabel}>ENROLLMENT</Text>
        <Text style={styles.headerTitle}>My Enrollment</Text>
        <Text style={styles.headerSub}>Active term subjects</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2A7AB6"
            colors={['#2A7AB6']}
          />
        }
      >
        {loading ? (
          <EnrollmentSkeleton />
        ) : error ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={32} color="#C8DFF0" />
            <Text style={styles.emptyTitle}>{error}</Text>
          </View>
        ) : enrollments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="school-outline" size={36} color="#C8DFF0" />
            <Text style={styles.emptyTitle}>No enrolled subjects</Text>
            <Text style={styles.emptyText}>
              Your enrolled subjects will appear here once you are added to a class for the active term.
            </Text>
          </View>
        ) : (
          <>
            <EnrollmentSummary activeTerm={activeTerm} enrollments={enrollments} />

            <View style={styles.listSection}>
              <View style={styles.sectionLabelCard}>
                <Text style={styles.sectionLabelText}>Enrolled Subjects</Text>
              </View>
              {enrollments.map(item => (
                <EnrolledSubjectCard key={item.classOfferingId} item={item} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EnrollmentSkeleton() {
  return (
    <View style={{ padding: 10, gap: 12 }}>
      <SkeletonBox width="100%" height={100} borderRadius={16} />
      <SkeletonBox width="100%" height={40} borderRadius={12} />
      {[1, 2, 3, 4].map(i => (
        <SkeletonBox key={i} width="100%" height={90} borderRadius={14} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1a3c5e',
  },
  header: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 20,
    paddingTop: 10,
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
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  scroll: {
    backgroundColor: '#F2F6FA',
  },
  listSection: {
    marginTop: 16,
  },
  sectionLabelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8BA4BC',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 10,
    marginTop: 24,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    elevation: 2,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2A3A',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#8BA4BC',
    textAlign: 'center',
    lineHeight: 19,
  },
});
