import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import SkeletonBox from '../../components/SkeletonLoader';
import FadeInSection from '../../components/animated/FadeInSection';
import CountUpNumber from '../../components/animated/CountUpNumber';
import useParallaxMotion from '../../animations/useParallaxMotion';
import ScheduleGrid from '../AdvisingPlan/components/ScheduleGrid';
import CourseTableView from '../AdvisingPlan/components/CourseTableView';
import usePublishedSchedule from '../../hooks/usePublishedSchedule';
import useDayEndTime from '../../hooks/useDayEndTime';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTermLabel(term) {
  if (!term) return '';
  return `${term.semester === 1 ? '1st Sem' : '2nd Sem'} ${term.school_year}`;
}

function colorFromHex(hex) {
  if (!hex) return null;
  return { bg: hex, text: '#111111', border: hex };
}

const FALLBACK_COLOR = { bg: '#2A7AB6', text: '#FFFFFF', border: '#2A7AB6' };

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchStudentSchedule(userId) {
  const { data: student, error: sErr } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (sErr || !student) return { data: null, error: sErr ?? new Error('Student not found') };

  const { data: enrollments, error: eErr } = await supabase
    .from('class_students')
    .select(`
      class_offering_id,
      class_offering:class_offerings!class_offering_id (
        section_id,
        subject_id,
        term:academic_terms!term_id (id, school_year, semester, is_active)
      )
    `)
    .eq('student_id', student.id)
    .eq('is_active', true);

  if (eErr) return { data: null, error: eErr };
  if (!enrollments?.length) return { data: { entries: [], term: null }, error: null };

  const activeTerm = enrollments.find(e => e.class_offering?.term?.is_active)?.class_offering?.term
    ?? enrollments[0]?.class_offering?.term ?? null;

  const activeEnrollments = enrollments.filter(e => e.class_offering?.term?.id === activeTerm?.id);
  const sectionIds = [...new Set(activeEnrollments.map(e => e.class_offering?.section_id).filter(Boolean))];
  const subjectIds = [...new Set(activeEnrollments.map(e => e.class_offering?.subject_id).filter(Boolean))];

  if (!sectionIds.length) return { data: { entries: [], term: activeTerm }, error: null };

  const { data: entries, error: enErr } = await supabase
    .from('schedule_entries')
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      section_id,
      subject_id,
      subjects:subjects!subject_id (
        subject_code, title, credit_units, lec_units, lab_units, color_hex
      ),
      sections:sections!section_id (section_code),
      teachers:teachers!teacher_id (first_name, last_name),
      venues:venues!venue_id (name)
    `)
    .eq('term_id', activeTerm.id)
    .in('section_id', sectionIds)
    .in('subject_id', subjectIds)
    .order('day_of_week', { ascending: true })
    .order('start_time',  { ascending: true });

  if (enErr) return { data: null, error: enErr };

  return { data: { entries: entries ?? [], term: activeTerm }, error: null };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WeeklySchedule() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entries,    setEntries]    = useState([]);
  const [term,       setTerm]       = useState(null);
  const [error,      setError]      = useState('');

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const orbStyle = useParallaxMotion(scrollY, { factor: 0.25, clamp: 200 });

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); return; }
    if (!isRefresh) setLoading(true);
    setError('');
    const { data, error: err } = await fetchStudentSchedule(user.id);
    if (err) setError('Could not load schedule. Pull down to retry.');
    else { setEntries(data?.entries ?? []); setTerm(data?.term ?? null); }
    setLoading(false);
  }, [user]);

  const {
    isPublished: scheduleIsPublished,
    loading: scheduleCheckLoading,
    refetch: refetchPublishedSchedule,
  } = usePublishedSchedule(term?.id);
  const { dayEndMinutes, refetch: refetchDayEndTime } = useDayEndTime();

  useFocusEffect(useCallback(() => {
    loadData();
    refetchPublishedSchedule();
    refetchDayEndTime();
  }, [loadData, refetchPublishedSchedule, refetchDayEndTime]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(true), refetchPublishedSchedule(), refetchDayEndTime()]);
    setRefreshing(false);
  };

  // Build color map from subject color_hex
  const subjectColors = {};
  entries.forEach(e => {
    const key = e.subjects?.subject_code;
    if (key && !subjectColors[key]) {
      subjectColors[key] = colorFromHex(e.subjects?.color_hex) ?? FALLBACK_COLOR;
    }
  });

  // Unique subjects for summary totals
  const seen = new Set();
  const uniqueSubjects = entries.filter(e => {
    const key = e.subjects?.subject_code;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const totalUnits = uniqueSubjects.reduce((s, e) => s + (Number(e.subjects?.credit_units) || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Animated.View style={[styles.decOrb, orbStyle]} />
        <Text style={styles.headerLabel}>SCHEDULE</Text>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <Text style={styles.headerSub}>{term ? formatTermLabel(term) : 'Active Term'}</Text>
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing} onRefresh={onRefresh}
            tintColor="#2A7AB6" colors={['#2A7AB6']}
          />
        }
      >
        {loading || (term && scheduleCheckLoading) ? (
          <ScheduleSkeleton />
        ) : error ? (
          <FadeInSection style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={32} color="#C8DFF0" />
            <Text style={styles.emptyTitle}>{error}</Text>
          </FadeInSection>
        ) : term && !scheduleIsPublished ? (
          /* Entries may already exist for this term, but the admin hasn't published
             them yet — the timetable could still change, so it stays hidden until
             publish rather than showing a draft that might not match the final one. */
          <FadeInSection style={styles.lockedCard}>
            <View style={styles.lockedIconWrap}>
              <Ionicons name="hourglass-outline" size={30} color="#B7770D" />
            </View>
            <View style={styles.lockedTermPill}>
              <Text style={styles.lockedTermPillText}>{formatTermLabel(term)}</Text>
            </View>
            <Text style={styles.lockedTitle}>Schedule Not Published Yet</Text>
            <Text style={styles.lockedText}>
              The Admin hasn't published the class schedule for this term yet.
              Your timetable will appear here as soon as it's live.
            </Text>
            <View style={styles.lockedNotifyRow}>
              <Ionicons name="notifications-outline" size={14} color="#2A7AB6" />
              <Text style={styles.lockedNotifyText}>We'll notify you the moment it's published</Text>
            </View>
            <Text style={styles.lockedHint}>Pull down to check again</Text>
          </FadeInSection>
        ) : entries.length === 0 ? (
          <FadeInSection style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color="#C8DFF0" />
            <Text style={styles.emptyTitle}>No schedule yet</Text>
            <Text style={styles.emptyText}>
              Your class schedule will appear here once your teacher sets it up.
            </Text>
          </FadeInSection>
        ) : (
          <>
            {/* Summary strip */}
            <FadeInSection index={0} style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <CountUpNumber value={uniqueSubjects.length} decimals={0} style={styles.summaryNum} />
                <Text style={styles.summaryLbl}>Subjects</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <CountUpNumber
                  value={totalUnits}
                  decimals={Number.isInteger(totalUnits) ? 0 : 1}
                  style={styles.summaryNum}
                />
                <Text style={styles.summaryLbl}>Total Units</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <CountUpNumber value={entries.length} decimals={0} style={styles.summaryNum} />
                <Text style={styles.summaryLbl}>Meetings</Text>
              </View>
            </FadeInSection>

            {/* Weekly grid */}
            <FadeInSection index={1}>
              <View style={styles.sectionLabelCard}>
                <Text style={styles.sectionLabelText}>Weekly Schedule</Text>
              </View>
              <ScheduleGrid entries={entries} subjectColors={subjectColors} dayEndMinutes={dayEndMinutes} />
            </FadeInSection>

            {/* Course table */}
            <FadeInSection index={2}>
              <View style={[styles.sectionLabelCard, { marginTop: 12 }]}>
                <Text style={styles.sectionLabelText}>Enrolled Subjects</Text>
              </View>
              <CourseTableView assigned={entries} subjectColors={subjectColors} />
            </FadeInSection>
          </>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function ScheduleSkeleton() {
  return (
    <View style={{ gap: 10 }}>
      <SkeletonBox width="100%" height={72} borderRadius={14} />
      <SkeletonBox width="100%" height={40} borderRadius={12} />
      <SkeletonBox width="100%" height={300} borderRadius={2} />
      <SkeletonBox width="100%" height={40} borderRadius={12} />
      <SkeletonBox width="100%" height={180} borderRadius={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#1a3c5e' },
  scroll: { flex: 1, backgroundColor: '#F2F6FA' },
  content: { paddingHorizontal: 10, paddingTop: 14, gap: 0 },

  header: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
    overflow: 'hidden',
  },
  decOrb: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(42,122,182,0.15)', top: -60, right: -30,
  },
  headerLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2, marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2,
  },

  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#1a3c5e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
    marginBottom: 10,
  },
  summaryItem:   { alignItems: 'center', gap: 2 },
  summaryNum:    { fontSize: 22, fontWeight: '800', color: '#1a3c5e', letterSpacing: -0.5 },
  summaryLbl:    { fontSize: 11, color: '#8BA4BC', fontWeight: '500' },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#EEF4FA' },

  sectionLabelCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingVertical: 9, alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#1A2A3A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  sectionLabelText: {
    fontSize: 11, fontWeight: '700', color: '#8BA4BC',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },

  emptyCard: {
    alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, marginTop: 12,
    elevation: 1,
    shadowColor: '#1A2A3A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A2A3A' },
  emptyText:  { fontSize: 12, color: '#8BA4BC', textAlign: 'center', lineHeight: 18 },

  // "Not published yet" lock state
  lockedCard: {
    alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 28, marginTop: 12,
    elevation: 1,
    shadowColor: '#1A2A3A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  lockedIconWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#FDEBD0',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  lockedTermPill: {
    backgroundColor: '#EBF4FC', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  lockedTermPillText: { fontSize: 11, fontWeight: '700', color: '#2A7AB6', letterSpacing: 0.3 },
  lockedTitle: { fontSize: 16, fontWeight: '800', color: '#1A2A3A', marginTop: 4 },
  lockedText: {
    fontSize: 12.5, color: '#5A7A9A', textAlign: 'center', lineHeight: 19,
    paddingHorizontal: 6,
  },
  lockedNotifyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EBF4FC', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 7,
    marginTop: 6,
  },
  lockedNotifyText: { fontSize: 11.5, fontWeight: '600', color: '#2A7AB6' },
  lockedHint: { fontSize: 11, color: '#B0C4D8', marginTop: 8 },
});
