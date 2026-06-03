import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import routes from '../../config/routes';
import SkeletonBox from '../../components/SkeletonLoader';
import { fetchStudentGrades, computeTermGwa } from './services/gradeService';
import GwaSummaryCard from './components/GwaSummaryCard';
import SubjectCard from './components/SubjectCard';
import styles from './GradesOverview.styles';

function formatTermLabel(term) {
  if (!term) return '';
  const sem = term.semester === 1 ? '1st Sem' : '2nd Sem';
  return `${sem} ${term.school_year}`;
}

export default function GradesOverview() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [terms, setTerms] = useState([]);
  const [activeTermIdx, setActiveTermIdx] = useState(0);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); return; }
    if (!isRefresh) setLoading(true);
    setError('');

    const { data, error: err } = await fetchStudentGrades(user.id);
    if (err) {
      setError('Could not load grades. Pull down to retry.');
    } else {
      const loaded = data?.terms ?? [];
      setTerms(loaded);
      const activeIdx = loaded.findIndex(t => t.term?.is_active);
      setActiveTermIdx(activeIdx >= 0 ? activeIdx : 0);
    }
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const selectedTerm = terms[activeTermIdx] ?? null;
  const activeGrades = selectedTerm?.grades ?? [];
  const gwa = computeTermGwa(activeGrades);
  const passedCount = activeGrades.filter(g => g.remarks === 'PASSED').length;
  const hasHistory = terms.length > 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.decOrb} />
        <Text style={styles.headerLabel}>GRADES</Text>
        <Text style={styles.headerTitle}>My Grades</Text>
        <View style={styles.headerBottom}>
          <Text style={styles.headerSub}>Your academic performance</Text>
          {terms.length > 0 && (
            <TouchableOpacity
              style={styles.termSelector}
              onPress={() => setShowHistory(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.termSelectorText} numberOfLines={1}>
                {formatTermLabel(selectedTerm?.term) || 'Select Term'}
              </Text>
              <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2A7AB6" colors={['#2A7AB6']} />
        }
      >
        {loading ? (
          <GradesSkeleton />
        ) : error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : terms.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No enrolled subjects</Text>
            <Text style={styles.emptySubText}>
              Your subjects will appear here once you are added to a class.
            </Text>
          </View>
        ) : (
          <>
            <GwaSummaryCard
              gwa={gwa}
              termLabel={formatTermLabel(selectedTerm?.term)}
              subjectCount={activeGrades.length}
              passedCount={passedCount}
            />
            <View style={styles.listSection}>
              <View style={styles.sectionTitleCard}>
                <Text style={styles.sectionTitle}>Enrolled Subjects</Text>
              </View>
              {activeGrades.map(grade => (
                <SubjectCard
                  key={grade.classOfferingId}
                  grade={grade}
                  onPress={() =>
                    navigation.navigate(routes.SUBJECT_GRADE_DETAIL, {
                      classOfferingId: grade.classOfferingId,
                      studentId: grade.studentId,
                      subjectTitle: grade.subject?.title ?? 'Subject',
                    })
                  }
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Grade history bottom sheet */}
      <Modal visible={showHistory} transparent animationType="slide" onRequestClose={() => setShowHistory(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowHistory(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Ionicons name="time-outline" size={18} color="#1a3c5e" />
              <Text style={styles.modalTitle}>Grade History</Text>
            </View>
            {terms.map((t, idx) => {
              const isSelected = idx === activeTermIdx;
              const isCurrent = t.term?.is_active;
              return (
                <TouchableOpacity
                  key={t.term.id}
                  style={[styles.termRow, isSelected && styles.termRowSelected]}
                  onPress={() => { setActiveTermIdx(idx); setShowHistory(false); }}
                  activeOpacity={0.7}
                >
                  <View style={styles.termRowLeft}>
                    <Text style={[styles.termRowLabel, isSelected && styles.termRowLabelSelected]}>
                      {formatTermLabel(t.term)}
                    </Text>
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.termRowRight}>
                    <Text style={styles.termRowCount}>{t.grades?.length ?? 0} subjects</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#2A7AB6" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function GradesSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <SkeletonBox width="100%" height={100} borderRadius={16} />
      <SkeletonBox width="100%" height={40} borderRadius={12} />
      {[1, 2, 3].map(i => (
        <SkeletonBox key={i} width="100%" height={130} borderRadius={14} />
      ))}
    </View>
  );
}
