import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import SkeletonBox from '../../components/SkeletonLoader';
import { fetchMyHonors, fetchStudentRankings } from './services/recognitionService';
import HonorCard from './components/HonorCard';
import RankingCard from './components/RankingCard';
import routes from '../../config/routes';

export default function MyRecognition() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [honors, setHonors] = useState([]);
  const [rankings, setRankings] = useState(null);
  const [programCode, setProgramCode] = useState(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); return; }
    if (!isRefresh) setLoading(true);
    setError('');

    const [honorsRes, rankingsRes] = await Promise.all([
      fetchMyHonors(user.id),
      fetchStudentRankings(user.id),
    ]);

    if (honorsRes.error) {
      setError('Could not load recognition. Pull down to retry.');
    } else {
      setHonors(honorsRes.data);
    }

    if (!rankingsRes.error && rankingsRes.data) {
      setRankings(rankingsRes.data.rankings);
      setProgramCode(rankingsRes.data.programCode);
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
        <Text style={styles.headerTitle}>My Recognition</Text>
        <Text style={styles.headerSub}>Academic honors & awards</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2A7AB6"
            colors={['#2A7AB6']}
          />
        }
      >
        <TouchableOpacity
          style={styles.criteriaBtn}
          onPress={() => navigation.navigate(routes.RECOGNITION_CRITERIA)}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle-outline" size={16} color="#2A7AB6" />
          <Text style={styles.criteriaBtnText}>View Honor Criteria</Text>
          <Ionicons name="chevron-forward" size={14} color="#2A7AB6" />
        </TouchableOpacity>

        {rankings && (
          <RankingCard rankings={rankings} programCode={programCode} />
        )}

        <View style={styles.listSection}>
          <View style={styles.sectionLabelCard}>
            <Text style={styles.sectionLabelText}>Earned Honors</Text>
          </View>

          {loading ? (
            <RecognitionSkeleton />
          ) : error ? (
            <View style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={32} color="#C8DFF0" />
              <Text style={styles.emptyTitle}>{error}</Text>
            </View>
          ) : honors.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="trophy-outline" size={36} color="#C8DFF0" />
              <Text style={styles.emptyTitle}>No honors yet</Text>
              <Text style={styles.emptyText}>
                Keep your GWA within the qualifying range and complete all subjects to earn an academic honor.
              </Text>
            </View>
          ) : (
            honors.map(item => (
              <HonorCard
                key={item.id}
                item={item}
                user={user}
                onCertificateGenerated={(id, url) => {
                  setHonors(prev => prev.map(h => (h.id === id ? { ...h, certificate_url: url } : h)));
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecognitionSkeleton() {
  return (
    <View style={{ paddingHorizontal: 10, gap: 10 }}>
      {[1, 2].map(i => (
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
  headerTop: {
    paddingTop: 8,
    paddingBottom: 6,
  },
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
  criteriaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EBF4FC',
    borderRadius: 12,
    marginHorizontal: 10,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  criteriaBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#2A7AB6',
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
    padding: 32,
    alignItems: 'center',
    gap: 10,
    elevation: 1,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
