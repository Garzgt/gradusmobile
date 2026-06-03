import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import routes from '../../config/routes';
import SkeletonBox from '../../components/SkeletonLoader';
import SubjectPoolList from './components/SubjectPoolList';
import { buildEligiblePools, formatSemesterLabel, fetchScheduleEntriesForSubjects } from './services/advisingPlanService';
import { autoAssignFromSchedule } from './services/advisingValidationService';

const SCAN_STORAGE_KEY = 'advising.evaluationScan';
const SELECTION_STORAGE_KEY = 'advising.selectedSubjects';

const makeSubjectKey = (subject) => (
  `${subject.subjectCode}|${subject.yearLevel || 'x'}|${subject.semester || 'x'}`
);

const formatTimestamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

export default function BuildAdvisingPlan() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [student, setStudent] = useState(null);
  const [activeTerm, setActiveTerm] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [selectionSavedAt, setSelectionSavedAt] = useState('');
  const [availableEntries, setAvailableEntries] = useState({});
  const [teacherSelections, setTeacherSelections] = useState({});
  const [error, setError] = useState('');
  const hasLoadedRef = useRef(false);
  const hasAutoSelectedRef = useRef(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const [scanRaw, selectionRaw, studentResp, termResp] = await Promise.all([
        AsyncStorage.getItem(SCAN_STORAGE_KEY),
        AsyncStorage.getItem(SELECTION_STORAGE_KEY),
        supabase
          .from('students')
          .select('id, program_id, current_year_level, programs(code, name)')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('academic_terms')
          .select('id, semester, school_year')
          .eq('is_active', true)
          .limit(1),
      ]);

      setStudent(studentResp?.data ?? null);
      setActiveTerm(termResp?.data?.[0] ?? null);

      try {
        const parsed = scanRaw ? JSON.parse(scanRaw) : null;
        setScanData(parsed);
      } catch {
        setScanData(null);
      }

      try {
        if (selectionRaw) {
          const parsedSelection = JSON.parse(selectionRaw);
          const storedKeys = Array.isArray(parsedSelection?.selectedKeys)
            ? parsedSelection.selectedKeys
            : [];
          setSelectedKeys(new Set(storedKeys));
          setSelectionSavedAt(parsedSelection?.updatedAt || '');
        }
      } catch {
        // leave selection as default empty
      }
    } catch {
      setError('Failed to load advising data. Please try again.');
    }
    setLoading(false);
    if (!hasLoadedRef.current) hasLoadedRef.current = true;
  }, [user]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }, [loadData]);

  const termSemester = activeTerm?.semester || null;
  const termLabel = activeTerm
    ? `${activeTerm.school_year} — ${formatSemesterLabel(activeTerm.semester)}`
    : 'Active term not set';
  const scannedAtLabel = formatTimestamp(scanData?.scannedAt);
  const scanCount = Array.isArray(scanData?.subjects) ? scanData.subjects.length : 0;

  const { eligibleBack, eligibleCurrent, blocked } = useMemo(() => {
    if (!scanData?.subjects?.length || !student?.current_year_level || !termSemester) {
      return { eligibleBack: [], eligibleCurrent: [], blocked: [] };
    }
    return buildEligiblePools({
      subjects: scanData.subjects,
      currentYearLevel: student.current_year_level,
      currentSemester: termSemester,
    });
  }, [scanData, student, termSemester]);

  const eligibleBackWithKeys = useMemo(
    () => eligibleBack.map((subject) => ({ ...subject, key: makeSubjectKey(subject) })),
    [eligibleBack]
  );
  const eligibleCurrentWithKeys = useMemo(
    () => eligibleCurrent.map((subject) => ({ ...subject, key: makeSubjectKey(subject) })),
    [eligibleCurrent]
  );
  const allEligible = useMemo(
    () => [...eligibleBackWithKeys, ...eligibleCurrentWithKeys],
    [eligibleBackWithKeys, eligibleCurrentWithKeys]
  );

  // Display list: back subjects first (flagged with isBack), then current
  const allEligibleDisplay = useMemo(
    () => [
      ...eligibleBackWithKeys.map((s) => ({ ...s, isBack: true })),
      ...eligibleCurrentWithKeys,
    ],
    [eligibleBackWithKeys, eligibleCurrentWithKeys]
  );

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const validKeys = new Set(allEligible.map((subject) => subject.key));
    setSelectedKeys((prev) => {
      const next = new Set(Array.from(prev).filter((key) => validKeys.has(key)));
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [allEligible]);

  // Auto-select all back subjects on first load (they are priority).
  useEffect(() => {
    if (hasAutoSelectedRef.current) return;
    if (!hasLoadedRef.current) return;
    if (eligibleBackWithKeys.length === 0) return;
    hasAutoSelectedRef.current = true;
    setSelectedKeys((prev) => {
      if (prev.size > 0) return prev; // respect restored selection from storage
      return new Set(eligibleBackWithKeys.map((s) => s.key));
    });
  }, [eligibleBackWithKeys]);

  // Fetch published schedule entries for all eligible subjects whenever the list changes.
  const eligibleCodesKey = useMemo(
    () => allEligible.map((s) => s.subjectCode).sort().join(','),
    [allEligible]
  );
  useEffect(() => {
    if (!activeTerm?.id || !eligibleCodesKey) return;
    const codes = eligibleCodesKey.split(',').filter(Boolean);
    fetchScheduleEntriesForSubjects(activeTerm.id, codes, supabase)
      .then((result) => setAvailableEntries(result))
      .catch(() => {});
  }, [activeTerm?.id, eligibleCodesKey]);

  const setTeacherForSubject = useCallback((subjectKey, entry) => {
    setTeacherSelections((prev) => ({ ...prev, [subjectKey]: entry }));
  }, []);

  const toggleSubject = useCallback((key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectedSubjects = useMemo(
    () => allEligible.filter((subject) => selectedKeys.has(subject.key)),
    [allEligible, selectedKeys]
  );

  const handleGeneratePlan = useCallback(async () => {
    if (!selectedSubjects.length || !activeTerm?.id) return;
    setGenerating(true);
    setError('');
    try {
      const entriesToUse = {};
      const notFound = [];

      selectedSubjects.forEach((subject) => {
        const { subjectCode, key } = subject;
        const chosen = teacherSelections[key];
        if (chosen?.teacherId && availableEntries[subjectCode]?.length) {
          // Student picked a teacher → filter to only that teacher's entries
          entriesToUse[subjectCode] = availableEntries[subjectCode].filter(
            (e) => e.teacher_id === chosen.teacherId,
          );
        } else if (availableEntries[subjectCode]?.length) {
          // No teacher picked → auto-assign from all available entries
          entriesToUse[subjectCode] = availableEntries[subjectCode];
        } else {
          notFound.push({ subjectCode, reason: 'No available schedule found.' });
        }
      });

      const { assigned, unscheduled } = autoAssignFromSchedule(entriesToUse);

      navigation.navigate(routes.ADVISING_FORM_PREVIEW, {
        assigned,
        unscheduled: [...unscheduled, ...notFound],
        termLabel,
        termId: activeTerm.id,
        selectedSubjects,
        termSemester: activeTerm.semester,
        schoolYear: activeTerm.school_year,
      });
    } catch {
      setError('Failed to generate plan. Please try again.');
    }
    setGenerating(false);
  }, [selectedSubjects, activeTerm, navigation, termLabel, teacherSelections, availableEntries]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const payload = {
      selectedKeys: Array.from(selectedKeys),
      selectedSubjects,
      updatedAt: new Date().toISOString(),
      termId: activeTerm?.id || null,
    };
    AsyncStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(payload));
    setSelectionSavedAt(payload.updatedAt);
  }, [selectedKeys, selectedSubjects, activeTerm]);

  const hasScan = scanData?.subjects?.length > 0;
  const selectedCount = selectedKeys.size;
  const totalEligible = allEligible.length;
  const missingSetup = hasScan && (!student?.current_year_level || !termSemester);
  const noEligibleSubjects = hasScan
    && eligibleBackWithKeys.length === 0
    && eligibleCurrentWithKeys.length === 0
    && blocked.length === 0
    && !missingSetup;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.decOrb} />
        <Text style={styles.headerLabel}>ADVISING</Text>
        <Text style={styles.headerTitle}>Build Plan</Text>
        <Text style={styles.headerSub}>Select subjects for this term</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2A7AB6" />
        }
      >
        {/* Info strip */}
        <View style={styles.infoStrip}>
          <View style={styles.infoStripLeft}>
            <Text style={styles.infoStripTerm} numberOfLines={1}>{termLabel}</Text>
            <View style={styles.infoChipRow}>
              {student?.current_year_level ? (
                <View style={styles.infoChip}>
                  <Text style={styles.infoChipText}>{student.current_year_level} Year</Text>
                </View>
              ) : null}
              {student?.programs?.code ? (
                <View style={styles.infoChip}>
                  <Text style={styles.infoChipText}>{student.programs.code}</Text>
                </View>
              ) : null}
            </View>
            {scannedAtLabel ? (
              <Text style={styles.infoStripMeta}>Scan: {scannedAtLabel}</Text>
            ) : null}
          </View>
          <View style={styles.infoStripRight}>
            {scanCount > 0 && (
              <View style={styles.scanCountPill}>
                <Text style={styles.scanCountText}>{scanCount}</Text>
                <Text style={styles.scanCountLabel}>scanned</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.viewerBtn}
              onPress={() => navigation.navigate(routes.EVALUATION_VIEWER)}
              activeOpacity={0.8}
            >
              <Ionicons name="scan-outline" size={15} color="#2A7AB6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error banner */}
        {error ? (
          <View style={styles.alertBanner}>
            <Ionicons name="alert-circle-outline" size={15} color="#C0392B" />
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        {/* Missing setup warning */}
        {missingSetup ? (
          <View style={[styles.alertBanner, styles.alertWarn]}>
            <Ionicons name="alert-circle-outline" size={15} color="#B7770D" />
            <Text style={[styles.alertText, { color: '#B7770D' }]}>
              Missing active term or year level. Check your profile.
            </Text>
          </View>
        ) : null}

        {/* Loading skeleton */}
        {loading ? (
          <View style={styles.subjectCard}>
            <View style={{ gap: 10 }}>
              <SkeletonBox width="100%" height={14} borderRadius={7} />
              <SkeletonBox width="70%" height={14} borderRadius={7} />
              <SkeletonBox width="85%" height={14} borderRadius={7} />
            </View>
          </View>
        ) : !hasScan ? (
          /* No scan state */
          <View style={styles.emptyCard}>
            <Ionicons name="scan-outline" size={28} color="#C8DFF0" />
            <Text style={styles.emptyTitle}>No scan data</Text>
            <Text style={styles.emptyText}>Scan your evaluation to load subjects.</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate(routes.EVALUATION_VIEWER)}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Open Evaluation Viewer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Subject list card */}
            <View style={styles.subjectCard}>
              <View style={styles.subjectCardHeader}>
                <Text style={styles.subjectCardTitle}>ELIGIBLE SUBJECTS</Text>
                {totalEligible > 0 && (
                  <View style={styles.selectionPill}>
                    <Text style={styles.selectionPillText}>{selectedCount}/{totalEligible}</Text>
                  </View>
                )}
              </View>

              {noEligibleSubjects ? (
                <View style={styles.emptyInCard}>
                  <Ionicons name="information-circle-outline" size={15} color="#8BA4BC" />
                  <Text style={styles.emptyInCardText}>
                    No eligible subjects for this term.
                  </Text>
                </View>
              ) : (
                <SubjectPoolList
                  subjects={allEligibleDisplay}
                  selectedKeys={selectedKeys}
                  onToggle={toggleSubject}
                  availableEntries={availableEntries}
                  teacherSelections={teacherSelections}
                  onTeacherSelect={setTeacherForSubject}
                />
              )}
            </View>

            {/* Generate button */}
            <TouchableOpacity
              style={[styles.generateBtn, (selectedCount === 0 || generating) && styles.generateBtnDisabled]}
              onPress={handleGeneratePlan}
              disabled={selectedCount === 0 || generating}
              activeOpacity={0.85}
            >
              {generating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="flash-outline" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.generateBtnText}>
                {generating
                  ? 'Generating…'
                  : selectedCount > 0
                    ? `Generate Plan · ${selectedCount} subject${selectedCount !== 1 ? 's' : ''}`
                    : 'Generate Plan'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a3c5e' },
  header: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  decOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(42,122,182,0.18)',
    top: -60,
    right: -40,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  scroll: { flex: 1, backgroundColor: '#F2F6FA' },
  content: { paddingHorizontal: 10, paddingTop: 18, paddingBottom: 32 },

  // Compact info strip
  infoStrip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoStripLeft: { flex: 1, gap: 6 },
  infoStripTerm: { fontSize: 14, fontWeight: '800', color: '#1A2A3A' },
  infoChipRow: { flexDirection: 'row', gap: 6 },
  infoChip: {
    backgroundColor: '#EBF4FC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  infoChipText: { fontSize: 11, fontWeight: '700', color: '#2A7AB6' },
  infoStripMeta: { fontSize: 11, color: '#B0C4D8' },
  infoStripRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 },
  scanCountPill: {
    backgroundColor: '#EBF4FC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    minWidth: 52,
  },
  scanCountText: { fontSize: 20, fontWeight: '800', color: '#1a3c5e' },
  scanCountLabel: { fontSize: 9, fontWeight: '600', color: '#8BA4BC', letterSpacing: 0.5 },
  viewerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EBF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Alert banners
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FADBD8',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  alertWarn: { backgroundColor: '#FDEBD0' },
  alertText: { fontSize: 12, color: '#C0392B', flex: 1 },

  // Subject card
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  subjectCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subjectCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8BA4BC',
    letterSpacing: 2,
  },
  selectionPill: {
    backgroundColor: '#EBF4FC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  selectionPillText: { fontSize: 12, fontWeight: '700', color: '#2A7AB6' },
  emptyInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  emptyInCardText: { fontSize: 12, color: '#8BA4BC', flex: 1 },

  // No-scan empty state
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    marginTop: 12,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A2A3A' },
  emptyText: { fontSize: 12, color: '#8BA4BC', textAlign: 'center' },
  emptyButton: {
    marginTop: 6,
    backgroundColor: '#2A7AB6',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  emptyButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  generateBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a3c5e',
    borderRadius: 14,
    paddingVertical: 14,
  },
  generateBtnDisabled: { backgroundColor: '#C8DFF0' },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
