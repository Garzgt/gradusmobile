import React, { useCallback, useState } from 'react';
import { View, Text, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SkeletonBox from '../../components/SkeletonLoader';
import FadeInSection from '../../components/animated/FadeInSection';
import StaggeredList from '../../components/animated/StaggeredList';
import PressableScale from '../../components/animated/PressableScale';
import CountUpNumber from '../../components/animated/CountUpNumber';
import AnimatedBar from '../../components/animated/AnimatedBar';
import AnimatedChevron from '../../components/animated/AnimatedChevron';
import useParallaxMotion from '../../animations/useParallaxMotion';
import { duration as motionDuration } from '../../animations/motionTokens';
import GradeStatusBadge from './components/GradeStatusBadge';
import { fetchGradeDetail, formatCreditUnits } from './services/gradeService';
import styles from './SubjectGradeDetail.styles';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTermLabel(term) {
  if (!term) return '—';
  return `${term.semester === 1 ? '1st Sem' : '2nd Sem'} ${term.school_year}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The per-item quiz/activity/exam dates on grade_period_settings are stored as
// free-form text, not a real date column. In practice teachers enter bare
// "M-D" or "M/D" (e.g. "9-15" for Sept 15) with no year, since the year is
// implied by the class term. `new Date("9-15")` fills in a placeholder year to
// make it a real date, and that placeholder is NOT consistent across JS
// engines — Node/V8 defaults to 2001, Hermes (React Native's engine) landed on
// year 10 for an equivalent value, which is the "May 2, 0010" bug. So a bare
// month-day string is parsed by hand and shown with no year at all, and Date
// is only used for strings that already carry an explicit 4-digit year, where
// parsing is unambiguous. Anything else is shown exactly as the teacher typed
// it rather than risking a wrong reformat.
function formatFlexibleDate(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const bareMonthDay = trimmed.match(/^(\d{1,2})[-/](\d{1,2})$/);
  if (bareMonthDay) {
    const month = Number(bareMonthDay[1]);
    const day = Number(bareMonthDay[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${MONTH_ABBR[month - 1]} ${day}`;
    }
    return trimmed;
  }

  if (/\d{4}/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  return trimmed;
}

const ATT_CFG = {
  10: { label: 'Present', color: '#16A34A', bg: '#DCFCE7', icon: 'checkmark-circle' },
  5:  { label: 'Late',    color: '#D97706', bg: '#FEF3C7', icon: 'time-outline'     },
  0:  { label: 'Absent',  color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle'     },
};

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, last }) {
  return (
    <>
      <View style={styles.infoRow}>
        <View style={styles.infoIconWrap}>
          <Ionicons name={icon} size={14} color="#2A7AB6" />
        </View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value ?? '—'}</Text>
      </View>
      {!last && <View style={styles.divider} />}
    </>
  );
}

// ─── Score row with mini progress bar ────────────────────────────────────────

function ScoreRow({ label, score, max, date }) {
  if (score == null) return null;
  const maxN   = max != null ? Number(max) : null;
  const scoreN = Number(score);
  const hasMax = maxN != null && maxN > 0;
  const pct    = hasMax ? Math.min((scoreN / maxN) * 100, 100) : null;
  const dateLabel = formatFlexibleDate(date);
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreLabelCol}>
        <Text style={styles.scoreLabel}>{label}</Text>
        {dateLabel ? <Text style={styles.scoreDate}>{dateLabel}</Text> : null}
      </View>
      <View style={styles.scoreRight}>
        {hasMax && (
          <AnimatedBar pct={pct} trackStyle={styles.miniBarBg} fillStyle={styles.miniBarFill} />
        )}
        <Text style={styles.scoreText}>
          {scoreN % 1 === 0 ? scoreN : scoreN.toFixed(2)}
          {hasMax && (
            <Text style={styles.scoreMax}> / {maxN % 1 === 0 ? maxN : maxN.toFixed(2)}</Text>
          )}
        </Text>
      </View>
    </View>
  );
}

// ─── Attendance ───────────────────────────────────────────────────────────────

function AttendanceDayRow({ entry }) {
  const cfg = ATT_CFG[entry.attendance_value] ?? {
    label: '—', color: '#8BA4BC', bg: '#F1F5F9', icon: 'help-circle-outline',
  };
  return (
    <View style={styles.attRow}>
      <View style={[styles.attIconWrap, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={14} color={cfg.color} />
      </View>
      <Text style={styles.attMeeting}>Mtg {entry.meeting_number}</Text>
      <Text style={styles.attDate}>{formatDate(entry.meeting_date)}</Text>
      <View style={[styles.attBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.attBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

function AttendanceSummary({ entries }) {
  const p = entries.filter(e => e.attendance_value === 10).length;
  const l = entries.filter(e => e.attendance_value === 5).length;
  const a = entries.filter(e => e.attendance_value === 0).length;
  const items = [
    { val: p, label: 'Present', color: '#16A34A' },
    { val: l, label: 'Late',    color: '#D97706' },
    { val: a, label: 'Absent',  color: '#DC2626' },
    { val: entries.length, label: 'Total', color: '#1A2A3A' },
  ];
  return (
    <View style={styles.attSummary}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          <View style={styles.attSummaryItem}>
            <CountUpNumber value={item.val} decimals={0} style={[styles.attSummaryNum, { color: item.color }]} />
            <Text style={styles.attSummaryLabel}>{item.label}</Text>
          </View>
          {i < items.length - 1 && <View style={styles.attSummarySep} />}
        </React.Fragment>
      ))}
    </View>
  );
}

function AttendanceContent({ attendance }) {
  const [showDates, setShowDates] = useState(false);
  if (!attendance.length) {
    return <Text style={styles.noDataText}>No attendance records yet</Text>;
  }
  return (
    <>
      <AttendanceSummary entries={attendance} />
      {showDates && (
        <Animated.View entering={FadeIn.duration(motionDuration.base)} exiting={FadeOut.duration(motionDuration.fast)}>
          <StaggeredList step={30}>
            {attendance.map((entry, i) => <AttendanceDayRow key={i} entry={entry} />)}
          </StaggeredList>
        </Animated.View>
      )}
      <PressableScale style={styles.attToggle} scaleTo={0.97} onPress={() => setShowDates(s => !s)}>
        <Ionicons
          name={showDates ? 'chevron-up-outline' : 'calendar-outline'}
          size={13}
          color="#2A7AB6"
        />
        <Text style={styles.attToggleText}>
          {showDates ? 'Hide dates' : `View all ${attendance.length} meeting dates`}
        </Text>
      </PressableScale>
    </>
  );
}

// ─── Component block (collapsible accordion) ──────────────────────────────────

function ComponentBlock({ icon, title, weightPct, children }) {
  const [open, setOpen] = useState(false);
  return (
    <Animated.View style={styles.compBlock} layout={LinearTransition.duration(motionDuration.base)}>
      <PressableScale style={styles.compBlockHeader} scaleTo={0.985} onPress={() => setOpen(o => !o)}>
        <View style={styles.compBlockLeft}>
          <View style={styles.compBlockIconWrap}>
            <Ionicons name={icon} size={13} color="#2A7AB6" />
          </View>
          <Text style={styles.compBlockTitle}>{title}</Text>
          {weightPct > 0 && (
            <View style={styles.compBlockWeightChip}>
              <Text style={styles.compBlockWeightText}>{weightPct}%</Text>
            </View>
          )}
        </View>
        <View style={styles.compBlockRight}>
          <AnimatedChevron open={open} size={15} color="#8BA4BC" />
        </View>
      </PressableScale>
      {open && children && (
        <Animated.View
          entering={FadeIn.duration(motionDuration.base)}
          exiting={FadeOut.duration(motionDuration.fast)}
        >
          <View style={styles.compBlockBody}>{children}</View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── Grade weights summary card ───────────────────────────────────────────────

function GradeWeightsCard({ settings: s }) {
  const [open, setOpen] = useState(false);
  if (!s) return null;

  const rows = [
    { label: 'Attendance',  value: s.weight_attendance  },
    { label: 'Quizzes',     value: s.weight_quizzes     },
    { label: 'Activities',  value: s.weight_activities  },
    { label: 'Recitation',  value: s.weight_recitation  },
    { label: 'Laboratory',  value: s.weight_laboratory  },
    { label: 'Major Exam',  value: s.weight_major_exam  },
  ].filter(r => r.value > 0);

  const total = rows.reduce((sum, r) => sum + Number(r.value), 0);

  return (
    <Animated.View style={styles.weightsCard} layout={LinearTransition.duration(motionDuration.base)}>
      <PressableScale style={styles.weightsHeader} scaleTo={0.985} onPress={() => setOpen(o => !o)}>
        <View style={styles.weightsIconWrap}>
          <Ionicons name="options-outline" size={14} color="#2A7AB6" />
        </View>
        <Text style={styles.weightsTitle}>Grade Weights</Text>
        <AnimatedChevron open={open} size={15} color="#8BA4BC" style={{ marginLeft: 'auto' }} />
      </PressableScale>
      {open && (
        <Animated.View
          entering={FadeIn.duration(motionDuration.base)}
          exiting={FadeOut.duration(motionDuration.fast)}
        >
          <View style={styles.weightsDivider} />
          <StaggeredList step={40}>
            {rows.map((r, i) => (
              <View key={r.label} style={[styles.weightsRow, i > 0 && styles.weightsRowBorder]}>
                <Text style={styles.weightsLabel}>{r.label}</Text>
                <AnimatedBar
                  pct={Math.min((r.value / total) * 100, 100)}
                  delay={i * 40}
                  trackStyle={styles.weightsBarBg}
                  fillStyle={styles.weightsBarFill}
                />
                <Text style={styles.weightsValue}>{r.value}%</Text>
              </View>
            ))}
          </StaggeredList>
          {s.transmutation_base != null && (
            <View style={styles.transmuteRow}>
              <Text style={styles.transmuteLabel}>Transmutation Base</Text>
              <Text style={styles.transmuteValue}>{s.transmutation_base}%</Text>
            </View>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── Period section ───────────────────────────────────────────────────────────

function PeriodSection({ component = {}, label, settings: s, periodSettings: ps, attendance = [] }) {

  // term_grade_numeric is the raw weighted score before incentive — the teacher's incentive
  // points (set via SOG) are applied on top when computing the final blended grade, so the
  // period grade shown here needs the same addition to match what actually counts.
  const incentive = Number(component.incentive_points) || 0;
  const grade = component.term_grade_numeric != null
    ? Number(component.term_grade_numeric) + incentive
    : null;

  const q1max = Number(ps?.q1_max ?? s?.q1_max ?? 0);
  const q2max = Number(ps?.q2_max ?? s?.q2_max ?? 0);
  const q3max = Number(ps?.q3_max ?? s?.q3_max ?? 0);
  const q4max = Number(ps?.q4_max ?? s?.q4_max ?? 0);
  const q5max = Number(ps?.q5_max ?? s?.q5_max ?? 0);
  const a1max = Number(ps?.a1_max ?? s?.a1_max ?? 0);
  const a2max = Number(ps?.a2_max ?? s?.a2_max ?? 0);
  const a3max = Number(ps?.a3_max ?? s?.a3_max ?? 0);
  const a4max = Number(ps?.a4_max ?? s?.a4_max ?? 0);
  const a5max = Number(ps?.a5_max ?? s?.a5_max ?? 0);
  const recMax  = Number(ps?.recitation_max ?? s?.recitation_max ?? 100);
  const labMax  = Number(ps?.lab_max        ?? s?.lab_max        ?? 30);
  const examMax = Number(ps?.exam_max       ?? s?.exam_max       ?? 100);

  // grade_period_settings.exam_date is the period-scoped text field (matches
  // whichever tab is active); grade_sheet_settings splits the same date by
  // period as a proper `date` column. Prefer the period-scoped one, since it's
  // what a teacher would edit alongside this period's other item dates.
  const examDate = ps?.exam_date ?? (label === 'Midterm' ? s?.exam_date_midterm : s?.exam_date_final);

  // Whether every score in a category is still unset — drives the "No ... yet"
  // placeholder so an opened, empty card says so instead of showing nothing.
  const noQuizData = [component.q1_score, component.q2_score, component.q3_score, component.q4_score, component.q5_score]
    .every(v => v == null);
  const noActData = [component.a1_score, component.a2_score, component.a3_score, component.a4_score, component.a5_score]
    .every(v => v == null);
  const noRecData = component.recitation_raw == null;
  const noLabData = component.laboratory_raw == null;
  const noExamData = component.major_exam_raw == null;

  return (
    <View style={styles.periodSection}>
      <View style={styles.periodHeader}>
        <Text style={styles.periodHeaderLabel}>{label.toUpperCase()}</Text>
        {grade != null && (
          <View style={styles.periodHeaderRight}>
            <CountUpNumber value={grade} decimals={2} style={styles.periodHeaderGrade} />
            <Text style={styles.periodHeaderSub}>term grade</Text>
            {incentive > 0 && (
              <Text style={styles.periodHeaderIncentive}>incl. +{incentive.toFixed(2)} incentive</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.compBlocksWrap}>

        {/* All six standard categories always show, per term — regardless of
            whether this subject has configured weights yet or this student has
            any saved score. ComponentBlock already hides the weight-% badge when
            weightPct is 0/undefined, and AttendanceContent/ScoreRow already show
            nothing for a field with no data, so an unconfigured category simply
            reads as empty rather than being hidden entirely. */}

        {/* 1. Attendance */}
        <ComponentBlock icon="calendar-outline" title="Attendance"
          weightPct={s?.weight_attendance}
        >
          <AttendanceContent attendance={attendance} />
        </ComponentBlock>

        {/* 2. Quizzes */}
        <ComponentBlock icon="help-circle-outline" title="Quizzes"
          weightPct={s?.weight_quizzes}
        >
          {noQuizData ? (
            <Text style={styles.noDataText}>No quizzes recorded yet</Text>
          ) : (
            <>
              <ScoreRow label="Quiz 1" score={component.q1_score} max={q1max} date={ps?.q1_date} />
              <ScoreRow label="Quiz 2" score={component.q2_score} max={q2max} date={ps?.q2_date} />
              <ScoreRow label="Quiz 3" score={component.q3_score} max={q3max} date={ps?.q3_date} />
              <ScoreRow label="Quiz 4" score={component.q4_score} max={q4max} date={ps?.q4_date} />
              <ScoreRow label="Quiz 5" score={component.q5_score} max={q5max} date={ps?.q5_date} />
            </>
          )}
        </ComponentBlock>

        {/* 3. Activities */}
        <ComponentBlock icon="create-outline" title="Activities"
          weightPct={s?.weight_activities}
        >
          {noActData ? (
            <Text style={styles.noDataText}>No activities recorded yet</Text>
          ) : (
            <>
              <ScoreRow label="Activity 1" score={component.a1_score} max={a1max} date={ps?.a1_date} />
              <ScoreRow label="Activity 2" score={component.a2_score} max={a2max} date={ps?.a2_date} />
              <ScoreRow label="Activity 3" score={component.a3_score} max={a3max} date={ps?.a3_date} />
              <ScoreRow label="Activity 4" score={component.a4_score} max={a4max} date={ps?.a4_date} />
              <ScoreRow label="Activity 5" score={component.a5_score} max={a5max} date={ps?.a5_date} />
            </>
          )}
        </ComponentBlock>

        {/* 4. Recitation */}
        <ComponentBlock icon="mic-outline" title="Recitation"
          weightPct={s?.weight_recitation}
        >
          {noRecData ? (
            <Text style={styles.noDataText}>No recitation recorded yet</Text>
          ) : (
            <ScoreRow label="Score" score={component.recitation_raw} max={recMax} />
          )}
        </ComponentBlock>

        {/* 5. Laboratory — the one category still gated, on class_type rather than
            weight, since a non-lab subject shouldn't show it even once weights and
            scores exist for the other five. */}
        {s?.class_type === 'lab' && (
          <ComponentBlock icon="flask-outline" title="Laboratory"
            weightPct={s?.weight_laboratory}
          >
            {noLabData ? (
              <Text style={styles.noDataText}>No laboratory scores recorded yet</Text>
            ) : (
              <ScoreRow label="Score" score={component.laboratory_raw} max={labMax} date={ps?.lab_date} />
            )}
          </ComponentBlock>
        )}

        {/* 6. Major Exam */}
        <ComponentBlock icon="document-text-outline" title="Major Exam"
          weightPct={s?.weight_major_exam}
        >
          {noExamData ? (
            <Text style={styles.noDataText}>No major exam recorded yet</Text>
          ) : (
            <ScoreRow label="Score" score={component.major_exam_raw} max={examMax} date={examDate} />
          )}
        </ComponentBlock>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SubjectGradeDetail() {
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();
  const { classOfferingId, studentId, subjectTitle } = route.params ?? {};

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data,       setData]       = useState(null);
  const [error,      setError]      = useState('');
  const [activeTab,  setActiveTab]  = useState('midterm');

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const orbStyle = useParallaxMotion(scrollY, { factor: 0.25, clamp: 200 });

  const loadData = useCallback(async (isRefresh = false) => {
    if (!classOfferingId || !studentId) { setLoading(false); return; }
    if (!isRefresh) setLoading(true);
    setError('');
    const { data: result, error: err } = await fetchGradeDetail(classOfferingId, studentId);
    if (err || !result) setError('Could not load grade details.');
    else setData(result);
    setLoading(false);
  }, [classOfferingId, studentId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const subject      = data?.subject;
  const teacher      = data?.teacher;
  const equivStyle   = [
    styles.equivalentGrade,
    data?.remarks === 'PASSED' && { color: '#4ADE80' },
    data?.remarks === 'FAILED' && { color: '#F87171' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Animated.View style={[styles.decOrb, orbStyle]} />
        <PressableScale style={styles.backBtn} scaleTo={0.86} hitSlop={8} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </PressableScale>
        <Text style={styles.headerLabel}>SUBJECT GRADE</Text>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {subject?.title ?? subjectTitle ?? 'Grade Detail'}
        </Text>
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2A7AB6" colors={['#2A7AB6']} />
        }
      >
        {loading ? (
          <View style={{ padding: 16, gap: 12 }}>
            <SkeletonBox width="100%" height={180} borderRadius={16} />
            <SkeletonBox width="100%" height={160} borderRadius={16} />
            <SkeletonBox width="100%" height={320} borderRadius={16} />
          </View>
        ) : error ? (
          <FadeInSection style={styles.emptyBox}>
            <Text style={styles.emptyText}>{error}</Text>
          </FadeInSection>
        ) : (
          <>
            {/* Final grade card — only shown once teacher posts grades */}
            {data.hasPostedGrade && <FadeInSection index={0} style={styles.gradeCard}>
              <View style={styles.decOrbCard} />
              <View style={styles.gradeCardTop}>
                <Text style={styles.gradeCardTitle}>Final Grade</Text>
              </View>
              <CountUpNumber value={data?.equivalent} decimals={2} style={equivStyle} />
              <View style={styles.gradeRow}>
                <View style={styles.gradeChip}>
                  <Text style={styles.gradeChipLabel}>Midterm</Text>
                  <CountUpNumber
                    value={data?.midGrade != null ? data.midGrade + (data.midtermIncentive || 0) : null}
                    decimals={2}
                    style={styles.gradeChipValue}
                  />
                  {data?.midtermIncentive > 0 && (
                    <Text style={styles.incentiveNote}>incl. +{data.midtermIncentive.toFixed(2)} incentive</Text>
                  )}
                </View>
                <View style={styles.gradeSep} />
                <View style={styles.gradeChip}>
                  <Text style={styles.gradeChipLabel}>Final Term</Text>
                  <CountUpNumber
                    value={data?.finGrade != null ? data.finGrade + (data.finalTermIncentive || 0) : null}
                    decimals={2}
                    style={styles.gradeChipValue}
                  />
                  {data?.finalTermIncentive > 0 && (
                    <Text style={styles.incentiveNote}>incl. +{data.finalTermIncentive.toFixed(2)} incentive</Text>
                  )}
                </View>
              </View>
              <View style={styles.finalGradeFooter}>
                <View style={styles.convertArrowRow}>
                  <Ionicons name="arrow-up" size={14} color="rgba(255,255,255,0.4)" />
                </View>
                <View style={styles.rawFinalGradeRow}>
                  <Text style={styles.rawFinalGradeLabel}>Final Grade</Text>
                  <CountUpNumber value={data?.finalPoints} decimals={2} style={styles.rawFinalGradeValue} />
                </View>
                {data?.gradeIncentive > 0 && (
                  <View style={styles.gradeIncentiveRow}>
                    <Ionicons name="star" size={12} color="#4ADE80" />
                    <Text style={styles.gradeIncentiveText}>
                      +{data.gradeIncentive.toFixed(2)} final grade incentive from your teacher
                    </Text>
                  </View>
                )}
                <View style={styles.statusBadgeBottom}>
                  <GradeStatusBadge remarks={data?.remarks} />
                </View>
              </View>
            </FadeInSection>}

            {/* Grade breakdown — always shown. PeriodSection falls back to the six
                standard categories (Attendance, Quizzes, Activities, Recitation,
                Laboratory, Major Exam) even when this subject has no sheet settings
                and this student has no saved component row yet, so the student always
                sees the shape of the grade rather than a blank "not recorded" box. */}
            <FadeInSection index={1} style={styles.breakdownWrap}>
              <View style={styles.sectionLabel}>
                <Text style={styles.sectionLabelText}>Grade Breakdown</Text>
              </View>

              {/* Midterm / Final Term tab switcher */}
              <View style={styles.periodTabBar}>
                {[
                  { key: 'midterm', label: 'Midterm' },
                  { key: 'final',   label: 'Final Term' },
                ].map(tab => (
                  <PressableScale
                    key={tab.key}
                    style={[styles.periodTab, activeTab === tab.key && styles.periodTabActive]}
                    scaleTo={0.95}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text style={[styles.periodTabText, activeTab === tab.key && styles.periodTabTextActive]}>
                      {tab.label}
                    </Text>
                  </PressableScale>
                ))}
              </View>

              <Animated.View
                key={activeTab}
                entering={FadeIn.duration(motionDuration.base)}
              >
              {activeTab === 'midterm' ? (
                <PeriodSection
                  component={data?.midtermComponent ?? {}}
                  label="Midterm"
                  settings={data?.sheetSettings}
                  periodSettings={data?.midPeriodSettings}
                  attendance={data?.midAttendance ?? []}
                />
              ) : (
                <PeriodSection
                  component={data?.finalComponent ?? {}}
                  label="Final Term"
                  settings={data?.sheetSettings}
                  periodSettings={data?.finPeriodSettings}
                  attendance={data?.finAttendance ?? []}
                />
              )}

              </Animated.View>

              <GradeWeightsCard settings={data?.sheetSettings} />
            </FadeInSection>

            {/* Subject info card */}
            <FadeInSection index={2} style={styles.infoCard}>
              <InfoRow icon="pricetag-outline" label="Subject Code" value={subject?.subject_code} />
              <InfoRow icon="school-outline" label="Credit Units" value={formatCreditUnits(subject)} />
              <InfoRow icon="person-outline" label="Teacher" value={teacher ? `${teacher.first_name} ${teacher.last_name}` : null} />
              <InfoRow icon="people-outline" label="Section" value={data?.section?.section_code} />
              <InfoRow icon="calendar-outline" label="Term" value={formatTermLabel(data?.term)} last />
            </FadeInSection>
          </>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
