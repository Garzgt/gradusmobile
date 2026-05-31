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

      // Set student and term first — must not be blocked by scan/selection parsing below
      console.log('[ADVISING] studentResp:', studentResp?.data, 'termResp:', termResp?.data);
      setStudent(studentResp?.data ?? null);
      setActiveTerm(termResp?.data?.[0] ?? null);

      // Parse scan data in isolation so a corrupt cache doesn't block the above
      try {
        const parsed = scanRaw ? JSON.parse(scanRaw) : null;
        console.log('[ADVISING] scanData loaded:', parsed ? `${parsed.subjects?.length} subjects` : 'null');
        setScanData(parsed);
      } catch {
        console.log('[ADVISING] scanData parse failed');
        setScanData(null);
      }

      // Parse saved selection in isolation
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
    } catch (loadError) {
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
    ? `${activeTerm.school_year} - ${formatSemesterLabel(activeTerm.semester)}`
    : 'Active term not set';
  const yearLabel = student?.current_year_level
    ? `${student.current_year_level} Year`
    : 'Year level not set';
  const scannedAtLabel = formatTimestamp(scanData?.scannedAt);
  const scanCount = Array.isArray(scanData?.subjects) ? scanData.subjects.length : 0;
  const scanSemesterSummary = useMemo(() => {
    if (!Array.isArray(scanData?.subjects)) return '';
    const counts = scanData.subjects.reduce((acc, subject) => {
      const semester = Number(subject.semester) || 0;
      if (!semester) return acc;
      acc[semester] = (acc[semester] || 0) + 1;
      return acc;
    }, {});
    const keys = Object.keys(counts).sort();
    if (!keys.length) return '';
    return keys.map((key) => `Sem ${key}: ${counts[key]}`).join(' · ');
  }, [scanData]);

  const { eligibleBack, eligibleCurrent, blocked } = useMemo(() => {
    if (!scanData?.subjects?.length || !student?.current_year_level || !termSemester) {
      return { eligibleBack: [], eligibleCurrent: [], blocked: [] };
    }
    const pools = buildEligiblePools({
      subjects: scanData.subjects,
      currentYearLevel: student.current_year_level,
      currentSemester: termSemester,
    });
    console.log('[ADVISING] buildEligiblePools:', {
      currentYearLevel: student.current_year_level,
      currentSemester: termSemester,
      totalScanned: scanData.subjects?.length,
      eligibleBack: pools.eligibleBack?.length,
      eligibleCurrent: pools.eligibleCurrent?.length,
      blocked: pools.blocked?.length,
    });
    return pools;
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
    if (!activeTerm?.id || !eligibleCodesKey) {
      console.log('[ADVISING] entries fetch skipped — activeTerm.id:', activeTerm?.id, 'eligibleCodesKey:', eligibleCodesKey);
      return;
    }
    const codes = eligibleCodesKey.split(',').filter(Boolean);
    console.log('[ADVISING] fetching entries for', codes.length, 'subjects, termId:', activeTerm.id);
    fetchScheduleEntriesForSubjects(activeTerm.id, codes, supabase)
      .then((result) => {
        console.log('[ADVISING] availableEntries result keys:', Object.keys(result));
        setAvailableEntries(result);
      })
      .catch((err) => console.log('[ADVISING] fetchScheduleEntriesForSubjects error:', err));
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
          // Student picked a teacher → filter to only that teacher's entries, system picks best slot
          entriesToUse[subjectCode] = availableEntries[subjectCode].filter(
            (e) => e.teacher_id === chosen.teacherId,
          );
        } else if (availableEntries[subjectCode]?.length) {
          // No teacher picked → auto-assign from all available entries across all teachers
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
    } catch (err) {
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
  const semesterLabel = formatSemesterLabel(termSemester);
  const selectedCount = selectedKeys.size;
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
        <Text style={styles.headerTitle}>Advising Plan</Text>
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
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#2A7AB6" />
          <Text style={styles.infoText}>
            Only subjects from the same semester are eligible. Completed subjects are based on blue rows.
          </Text>
        </View>

        <View style={styles.termCard}>
          <View style={styles.termRow}>
            <Ionicons name="calendar-outline" size={18} color="#2A7AB6" />
            <Text style={styles.termTitle}>Active term</Text>
          </View>
          <Text style={styles.termValue}>{termLabel}</Text>
          <Text style={styles.termMeta}>{yearLabel}</Text>
          {scannedAtLabel ? (
            <Text style={styles.termMeta}>Last scan: {scannedAtLabel}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.termAction}
            onPress={() => navigation.navigate(routes.EVALUATION_VIEWER)}
            activeOpacity={0.8}
          >
            <Ionicons name="scan-outline" size={16} color="#2A7AB6" />
            <Text style={styles.termActionText}>Open Evaluation Viewer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scanStatusCard}>
          <View style={styles.scanStatusRow}>
            <Ionicons name="clipboard-outline" size={16} color="#2A7AB6" />
            <Text style={styles.scanStatusTitle}>Scan status</Text>
          </View>
          <Text style={styles.scanStatusValue}>
            {scanCount > 0 ? `${scanCount} subject(s) loaded` : 'No scan data found'}
          </Text>
          <Text style={styles.scanStatusMeta}>
            {scannedAtLabel ? `Last scan: ${scannedAtLabel}` : 'Run a scan to load subjects.'}
          </Text>
          {scanSemesterSummary ? (
            <Text style={styles.scanStatusMeta}>Scan semesters: {scanSemesterSummary}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.scanReload}
            onPress={() => loadData(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={14} color="#2A7AB6" />
            <Text style={styles.scanReloadText}>Reload scan data</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#C0392B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {missingSetup ? (
          <View style={styles.setupBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#B7770D" />
            <Text style={styles.setupText}>
              Missing active term or student year level. Update your profile or set an active term.
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <View style={{ gap: 10 }}>
              <SkeletonBox width="100%" height={14} borderRadius={7} />
              <SkeletonBox width="70%" height={14} borderRadius={7} />
              <SkeletonBox width="85%" height={14} borderRadius={7} />
            </View>
          </View>
        ) : !hasScan ? (
          <View style={styles.emptyCard}>
            <Ionicons name="scan-outline" size={24} color="#8BA4BC" />
            <Text style={styles.emptyTitle}>No scan data</Text>
            <Text style={styles.emptyText}>
              Scan your evaluation to build a subject plan.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate(routes.EVALUATION_VIEWER)}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Scan now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>ELIGIBLE SUBJECTS</Text>

            <SubjectPoolList
              title="Back subjects"
              subtitle={`Previous year subjects for ${semesterLabel}`}
              subjects={eligibleBackWithKeys}
              selectedKeys={selectedKeys}
              onToggle={toggleSubject}
              emptyLabel="No eligible back subjects."
              availableEntries={availableEntries}
              teacherSelections={teacherSelections}
              onTeacherSelect={setTeacherForSubject}
            />

            <SubjectPoolList
              title="Current year subjects"
              subtitle={`Current year subjects for ${semesterLabel}`}
              subjects={eligibleCurrentWithKeys}
              selectedKeys={selectedKeys}
              onToggle={toggleSubject}
              emptyLabel="No eligible current subjects."
              availableEntries={availableEntries}
              teacherSelections={teacherSelections}
              onTeacherSelect={setTeacherForSubject}
            />

            {noEligibleSubjects ? (
              <View style={styles.emptyEligibility}>
                <Ionicons name="information-circle-outline" size={16} color="#8BA4BC" />
                <Text style={styles.emptyEligibilityText}>
                  No eligible subjects for this term. Check your evaluation scan and term details.
                </Text>
              </View>
            ) : null}

            {blocked.length > 0 ? (
              <View style={styles.blockedBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#B7770D" />
                <Text style={styles.blockedText}>
                  {blocked.length} subject(s) are blocked by prerequisites.
                </Text>
              </View>
            ) : null}

            <View style={styles.footerCard}>
              <Text style={styles.footerTitle}>Selected: {selectedCount} subject{selectedCount !== 1 ? 's' : ''}</Text>
              <Text style={styles.footerText}>
                The app will auto-assign the best available schedule for each subject and flag any conflicts.
              </Text>
              {selectionSavedAt ? (
                <Text style={styles.footerMeta}>Last saved: {formatTimestamp(selectionSavedAt)}</Text>
              ) : null}
              <TouchableOpacity
                style={[styles.generateBtn, (selectedCount === 0 || generating) && styles.generateBtnDisabled]}
                onPress={handleGeneratePlan}
                disabled={selectedCount === 0 || generating}
                activeOpacity={0.8}
              >
                {generating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
                )}
                <Text style={styles.generateBtnText}>
                  {generating ? 'Generating...' : 'Generate Plan'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
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
    paddingBottom: 28,
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
    lineHeight: 18,
  },
  scroll: { flex: 1, backgroundColor: '#F2F6FA' },
  content: { padding: 16, paddingTop: 22 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8BA4BC',
    letterSpacing: 2,
    marginBottom: 10,
    marginLeft: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EBF4FC',
    borderRadius: 14,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#2A7AB6',
    lineHeight: 18,
  },
  termCard: {
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
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  termTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A7AB6',
  },
  termValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2A3A',
    marginTop: 6,
  },
  termMeta: {
    fontSize: 12,
    color: '#8BA4BC',
    marginTop: 4,
  },
  termAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF4FC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  termActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A7AB6',
  },
  scanStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  scanStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanStatusTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A7AB6',
  },
  scanStatusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2A3A',
    marginTop: 6,
  },
  scanStatusMeta: {
    fontSize: 12,
    color: '#8BA4BC',
    marginTop: 4,
  },
  scanReload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#EBF4FC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  scanReloadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A7AB6',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FADBD8',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#C0392B',
    flex: 1,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  loadingText: {
    fontSize: 12,
    color: '#8BA4BC',
  },
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2A3A',
  },
  emptyText: {
    fontSize: 12,
    color: '#8BA4BC',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: '#2A7AB6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDEBD0',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  blockedText: {
    fontSize: 12,
    color: '#B7770D',
    flex: 1,
  },
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDEBD0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  setupText: {
    fontSize: 12,
    color: '#B7770D',
    flex: 1,
  },
  emptyEligibility: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EEF4FA',
  },
  emptyEligibilityText: {
    fontSize: 12,
    color: '#8BA4BC',
    flex: 1,
  },
  footerCard: {
    backgroundColor: '#EBF4FC',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2A3A',
    marginBottom: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#2A7AB6',
    lineHeight: 17,
  },
  footerMeta: {
    fontSize: 11,
    color: '#8BA4BC',
    marginTop: 6,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a3c5e',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  generateBtnDisabled: {
    backgroundColor: '#C8DFF0',
  },
  generateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
