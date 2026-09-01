import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SkeletonBox from '../../components/SkeletonLoader';
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

const ATT_CFG = {
  10: { label: 'Present', color: '#16A34A', bg: '#DCFCE7', icon: 'checkmark-circle' },
  5:  { label: 'Late',    color: '#D97706', bg: '#FEF3C7', icon: 'time-outline'     },
  0:  { label: 'Absent',  color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle'     },
};

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, last }) {
  return (
    <>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value ?? '—'}</Text>
      </View>
      {!last && <View style={styles.divider} />}
    </>
  );
}

// ─── Score row with mini progress bar ────────────────────────────────────────

function ScoreRow({ label, score, max }) {
  if (score == null) return null;
  const maxN   = max != null ? Number(max) : null;
  const scoreN = Number(score);
  const hasMax = maxN != null && maxN > 0;
  const pct    = hasMax ? Math.min((scoreN / maxN) * 100, 100) : null;
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreRight}>
        {hasMax && (
          <View style={styles.miniBarBg}>
            <View style={[styles.miniBarFill, { width: `${pct}%` }]} />
          </View>
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

function SubtotalChips({ raw, transmuted, weighted }) {
  if (raw == null && transmuted == null && weighted == null) return null;
  return (
    <View style={styles.subtotalRow}>
      {raw != null && (
        <View style={styles.subtotalChip}>
          <Text style={styles.subtotalChipLabel}>Raw</Text>
          <Text style={styles.subtotalChipVal}>{Number(raw).toFixed(1)}%</Text>
        </View>
      )}
      {transmuted != null && (
        <View style={styles.subtotalChip}>
          <Text style={styles.subtotalChipLabel}>Transmuted</Text>
          <Text style={styles.subtotalChipVal}>{Number(transmuted).toFixed(1)}%</Text>
        </View>
      )}
      {weighted != null && (
        <View style={styles.subtotalChip}>
          <Text style={styles.subtotalChipLabel}>Weighted</Text>
          <Text style={[styles.subtotalChipVal, { color: '#2A7AB6' }]}>{Number(weighted).toFixed(2)}</Text>
        </View>
      )}
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
            <Text style={[styles.attSummaryNum, { color: item.color }]}>{item.val}</Text>
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
      {showDates && attendance.map((entry, i) => <AttendanceDayRow key={i} entry={entry} />)}
      <TouchableOpacity style={styles.attToggle} onPress={() => setShowDates(s => !s)} activeOpacity={0.7}>
        <Ionicons
          name={showDates ? 'chevron-up-outline' : 'calendar-outline'}
          size={13}
          color="#2A7AB6"
        />
        <Text style={styles.attToggleText}>
          {showDates ? 'Hide dates' : `View all ${attendance.length} meeting dates`}
        </Text>
      </TouchableOpacity>
    </>
  );
}

// ─── Component block (collapsible accordion) ──────────────────────────────────

function ComponentBlock({ icon, title, weighted, raw, transmuted, children }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.compBlock}>
      <TouchableOpacity style={styles.compBlockHeader} onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
        <View style={styles.compBlockLeft}>
          <View style={styles.compBlockIconWrap}>
            <Ionicons name={icon} size={13} color="#2A7AB6" />
          </View>
          <Text style={styles.compBlockTitle}>{title}</Text>
        </View>
        <View style={styles.compBlockRight}>
          {weighted != null && (
            <View style={styles.compBlockScore}>
              <Text style={styles.compBlockScoreVal}>{Number(weighted).toFixed(2)}</Text>
              <Text style={styles.compBlockScoreMax}> pts</Text>
            </View>
          )}
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color="#8BA4BC" />
        </View>
      </TouchableOpacity>
      {open && (
        <>
          {children && <View style={styles.compBlockBody}>{children}</View>}
          <SubtotalChips raw={raw} transmuted={transmuted} weighted={weighted} />
        </>
      )}
    </View>
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
    <View style={styles.weightsCard}>
      <TouchableOpacity style={styles.weightsHeader} onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
        <View style={styles.weightsIconWrap}>
          <Ionicons name="options-outline" size={14} color="#2A7AB6" />
        </View>
        <Text style={styles.weightsTitle}>Grade Weights</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color="#8BA4BC" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>
      {open && (
        <>
          <View style={styles.weightsDivider} />
          {rows.map((r, i) => (
            <View key={r.label} style={[styles.weightsRow, i > 0 && styles.weightsRowBorder]}>
              <Text style={styles.weightsLabel}>{r.label}</Text>
              <View style={styles.weightsBarBg}>
                <View style={[styles.weightsBarFill, { width: `${Math.min((r.value / total) * 100, 100)}%` }]} />
              </View>
              <Text style={styles.weightsValue}>{r.value}%</Text>
            </View>
          ))}
          {s.transmutation_base != null && (
            <View style={styles.transmuteRow}>
              <Text style={styles.transmuteLabel}>Transmutation Base</Text>
              <Text style={styles.transmuteValue}>{s.transmutation_base}%</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ─── Period section ───────────────────────────────────────────────────────────

function PeriodSection({ component, label, settings: s, periodSettings: ps, attendance }) {
  if (!component) return null;

  const grade = component.term_grade_numeric;

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

  const hasQuiz = [q1max, q2max, q3max, q4max, q5max].some(m => m > 0)
    || [component.q1_score, component.q2_score, component.q3_score, component.q4_score, component.q5_score].some(v => v != null)
    || (Number(component.quizzes_weighted) > 0);

  const hasAct = [a1max, a2max, a3max, a4max, a5max].some(m => m > 0)
    || [component.a1_score, component.a2_score, component.a3_score, component.a4_score, component.a5_score].some(v => v != null)
    || (Number(component.activities_weighted) > 0);

  return (
    <View style={styles.periodSection}>
      <View style={styles.periodHeader}>
        <Text style={styles.periodHeaderLabel}>{label.toUpperCase()}</Text>
        {grade != null && (
          <View style={styles.periodHeaderRight}>
            <Text style={styles.periodHeaderGrade}>{Number(grade).toFixed(2)}</Text>
            <Text style={styles.periodHeaderSub}>term grade</Text>
          </View>
        )}
      </View>

      <View style={styles.compBlocksWrap}>

        {/* 1. Attendance */}
        {s?.weight_attendance > 0 && (
          <ComponentBlock icon="calendar-outline" title="Attendance"
            weighted={component.attendance_weighted}
          >
            <AttendanceContent attendance={attendance} />
          </ComponentBlock>
        )}

        {/* 2. Quizzes */}
        {hasQuiz && (
          <ComponentBlock icon="help-circle-outline" title="Quizzes"
            weighted={component.quizzes_weighted}
            raw={component.quizzes_raw} transmuted={component.quizzes_transmuted}
          >
            <ScoreRow label="Quiz 1" score={component.q1_score} max={q1max} />
            <ScoreRow label="Quiz 2" score={component.q2_score} max={q2max} />
            <ScoreRow label="Quiz 3" score={component.q3_score} max={q3max} />
            <ScoreRow label="Quiz 4" score={component.q4_score} max={q4max} />
            <ScoreRow label="Quiz 5" score={component.q5_score} max={q5max} />
          </ComponentBlock>
        )}

        {/* 3. Activities */}
        {hasAct && (
          <ComponentBlock icon="create-outline" title="Activities"
            weighted={component.activities_weighted}
            raw={component.activities_raw} transmuted={component.activities_transmuted}
          >
            <ScoreRow label="Activity 1" score={component.a1_score} max={a1max} />
            <ScoreRow label="Activity 2" score={component.a2_score} max={a2max} />
            <ScoreRow label="Activity 3" score={component.a3_score} max={a3max} />
            <ScoreRow label="Activity 4" score={component.a4_score} max={a4max} />
            <ScoreRow label="Activity 5" score={component.a5_score} max={a5max} />
          </ComponentBlock>
        )}

        {/* 4. Recitation */}
        {s?.weight_recitation > 0 && (
          <ComponentBlock icon="mic-outline" title="Recitation"
            weighted={component.recitation_weighted}
            transmuted={component.recitation_transmuted}
          >
            <ScoreRow label="Score" score={component.recitation_raw} max={recMax} />
          </ComponentBlock>
        )}

        {/* 5. Laboratory */}
        {s?.weight_laboratory > 0 && (
          <ComponentBlock icon="flask-outline" title="Laboratory"
            weighted={component.laboratory_weighted}
            raw={component.laboratory_raw} transmuted={component.laboratory_transmuted}
          >
            <ScoreRow label="Score" score={component.laboratory_raw} max={labMax} />
          </ComponentBlock>
        )}

        {/* 6. Major Exam */}
        {s?.weight_major_exam > 0 && (
          <ComponentBlock icon="document-text-outline" title="Major Exam"
            weighted={component.major_exam_weighted}
            raw={component.major_exam_raw} transmuted={component.major_exam_transmuted}
          >
            <ScoreRow label="Score" score={component.major_exam_raw} max={examMax} />
          </ComponentBlock>
        )}

        {/* Fallback when no settings */}
        {!s && [
          { icon: 'calendar-outline',      title: 'Attendance', w: component.attendance_weighted  },
          { icon: 'help-circle-outline',   title: 'Quizzes',    w: component.quizzes_weighted    },
          { icon: 'create-outline',        title: 'Activities', w: component.activities_weighted  },
          { icon: 'mic-outline',           title: 'Recitation', w: component.recitation_weighted  },
          { icon: 'flask-outline',         title: 'Laboratory', w: component.laboratory_weighted  },
          { icon: 'document-text-outline', title: 'Major Exam', w: component.major_exam_weighted  },
        ].filter(b => b.w != null).map(b => (
          <ComponentBlock key={b.title} icon={b.icon} title={b.title} weighted={b.w} />
        ))}
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

  const [loading,   setLoading]   = useState(true);
  const [data,      setData]      = useState(null);
  const [error,     setError]     = useState('');
  const [activeTab, setActiveTab] = useState('midterm');

  const loadData = useCallback(async () => {
    if (!classOfferingId || !studentId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    const { data: result, error: err } = await fetchGradeDetail(classOfferingId, studentId);
    if (err || !result) setError('Could not load grade details.');
    else setData(result);
    setLoading(false);
  }, [classOfferingId, studentId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const subject      = data?.subject;
  const teacher      = data?.teacher;
  const equivDisplay = data?.equivalent != null ? data.equivalent.toFixed(2) : '—';
  const equivStyle   = [
    styles.equivalentGrade,
    data?.remarks === 'PASSED' && { color: '#4ADE80' },
    data?.remarks === 'FAILED' && { color: '#F87171' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.decOrb} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>SUBJECT GRADE</Text>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {subject?.title ?? subjectTitle ?? 'Grade Detail'}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}>
        {loading ? (
          <View style={{ padding: 16, gap: 12 }}>
            <SkeletonBox width="100%" height={180} borderRadius={16} />
            <SkeletonBox width="100%" height={160} borderRadius={16} />
            <SkeletonBox width="100%" height={320} borderRadius={16} />
          </View>
        ) : error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Subject info card */}
            <View style={styles.infoCard}>
              <InfoRow label="Subject Code" value={subject?.subject_code} />
              <InfoRow label="Credit Units"  value={formatCreditUnits(subject)} />
              <InfoRow label="Teacher" value={teacher ? `${teacher.first_name} ${teacher.last_name}` : null} />
              <InfoRow label="Section" value={data?.section?.section_code} />
              <InfoRow label="Term"    value={formatTermLabel(data?.term)} last />
            </View>

            {/* Final grade card — only shown once teacher posts grades */}
            {data.hasPostedGrade && <View style={styles.gradeCard}>
              <View style={styles.decOrbCard} />
              <View style={styles.gradeCardTop}>
                <Text style={styles.gradeCardTitle}>Final Grade</Text>
                <GradeStatusBadge remarks={data?.remarks} />
              </View>
              <Text style={equivStyle}>{equivDisplay}</Text>
              <View style={styles.gradeRow}>
                <View style={styles.gradeChip}>
                  <Text style={styles.gradeChipLabel}>Midterm</Text>
                  <Text style={styles.gradeChipValue}>
                    {data?.midGrade != null ? data.midGrade.toFixed(2) : '—'}
                  </Text>
                </View>
                <View style={styles.gradeSep} />
                <View style={styles.gradeChip}>
                  <Text style={styles.gradeChipLabel}>Final Term</Text>
                  <Text style={styles.gradeChipValue}>
                    {data?.finGrade != null ? data.finGrade.toFixed(2) : '—'}
                  </Text>
                </View>
              </View>
            </View>}

            {/* Grade breakdown */}
            {(data?.midtermComponent || data?.finalComponent) ? (
              <View style={styles.breakdownWrap}>
                <View style={styles.sectionLabel}>
                  <Text style={styles.sectionLabelText}>Grade Breakdown</Text>
                </View>

                {/* Midterm / Final Term tab switcher */}
                <View style={styles.periodTabBar}>
                  {[
                    { key: 'midterm', label: 'Midterm' },
                    { key: 'final',   label: 'Final Term' },
                  ].map(tab => (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.periodTab, activeTab === tab.key && styles.periodTabActive]}
                      onPress={() => setActiveTab(tab.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.periodTabText, activeTab === tab.key && styles.periodTabTextActive]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {activeTab === 'midterm' ? (
                  data.midtermComponent ? (
                    <PeriodSection
                      component={data.midtermComponent}
                      label="Midterm"
                      settings={data.sheetSettings}
                      periodSettings={data.midPeriodSettings}
                      attendance={data.midAttendance ?? []}
                    />
                  ) : (
                    <View style={styles.noGradeBox}>
                      <Ionicons name="document-outline" size={36} color="#C8DFF0" />
                      <Text style={styles.noGradeText}>Midterm grades not yet recorded</Text>
                    </View>
                  )
                ) : (
                  data.finalComponent ? (
                    <PeriodSection
                      component={data.finalComponent}
                      label="Final Term"
                      settings={data.sheetSettings}
                      periodSettings={data.finPeriodSettings}
                      attendance={data.finAttendance ?? []}
                    />
                  ) : (
                    <View style={styles.noGradeBox}>
                      <Ionicons name="document-outline" size={36} color="#C8DFF0" />
                      <Text style={styles.noGradeText}>Final term grades not yet recorded</Text>
                    </View>
                  )
                )}

                <GradeWeightsCard settings={data.sheetSettings} />
              </View>
            ) : (
              <View style={styles.noGradeBox}>
                <Ionicons name="document-outline" size={36} color="#C8DFF0" />
                <Text style={styles.noGradeText}>No grades recorded yet</Text>
                <Text style={styles.noGradeSubText}>
                  Your teacher hasn't entered grades for this subject.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
