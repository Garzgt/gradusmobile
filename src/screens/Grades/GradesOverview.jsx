import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import routes from '../../config/routes';
import SkeletonBox from '../../components/SkeletonLoader';
import { fetchStudentGrades, computeTermGwa } from './services/gradeService';
import GwaSummaryCard from './components/GwaSummaryCard';
import GradePeriodTabs from './components/GradePeriodTabs';
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
      // Default to the active term; fall back to index 0 (newest)
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.decOrb} />
        <Text style={styles.headerLabel}>GRADES</Text>
        <Text style={styles.headerTitle}>My Grades</Text>
        <Text style={styles.headerSub}>Your academic performance</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
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
            <GradePeriodTabs
              terms={terms.map(t => formatTermLabel(t.term))}
              activeIndex={activeTermIdx}
              onSelect={setActiveTermIdx}
            />
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
    </SafeAreaView>
  );
}

function GradesSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[100, 90, 80].map((w, i) => (
          <SkeletonBox key={i} width={w} height={34} borderRadius={20} />
        ))}
      </View>
      <SkeletonBox width="100%" height={116} borderRadius={20} />
      <SkeletonBox width={140} height={14} borderRadius={6} />
      {[1, 2, 3].map(i => (
        <SkeletonBox key={i} width="100%" height={140} borderRadius={18} />
      ))}
    </View>
  );
}
