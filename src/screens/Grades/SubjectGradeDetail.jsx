import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SkeletonBox from '../../components/SkeletonLoader';
import GradeStatusBadge from './components/GradeStatusBadge';
import { fetchGradeDetail } from './services/gradeService';
import styles from './SubjectGradeDetail.styles';

function formatTermLabel(term) {
  if (!term) return '—';
  const sem = term.semester === 1 ? '1st Sem' : '2nd Sem';
  return `${sem} ${term.school_year}`;
}

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

function ComponentRow({ label, value }) {
  if (value == null) return null;
  return (
    <View style={styles.compRow}>
      <Text style={styles.compLabel}>{label}</Text>
      <Text style={styles.compValue}>{parseFloat(value).toFixed(2)}</Text>
    </View>
  );
}

function PeriodCard({ component, label }) {
  const hasAnyComponent =
    component.attendance_weighted != null ||
    component.quizzes_weighted    != null ||
    component.activities_weighted != null ||
    component.recitation_weighted != null ||
    component.laboratory_weighted != null ||
    component.major_exam_weighted != null;

  return (
    <View style={styles.periodCard}>
      <Text style={styles.periodLabel}>{label}</Text>
      {component.term_grade_numeric != null && (
        <Text style={styles.periodGrade}>
          {parseFloat(component.term_grade_numeric).toFixed(2)}
        </Text>
      )}
      {hasAnyComponent && (
        <View style={styles.compList}>
          <ComponentRow label="Attendance"  value={component.attendance_weighted} />
          <ComponentRow label="Quizzes"     value={component.quizzes_weighted} />
          <ComponentRow label="Activities"  value={component.activities_weighted} />
          <ComponentRow label="Recitation"  value={component.recitation_weighted} />
          <ComponentRow label="Laboratory"  value={component.laboratory_weighted} />
          <ComponentRow label="Major Exam"  value={component.major_exam_weighted} />
        </View>
      )}
    </View>
  );
}

export default function SubjectGradeDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { classOfferingId, studentId, subjectTitle } = route.params ?? {};

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!classOfferingId || !studentId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    const { data: result, error: err } = await fetchGradeDetail(classOfferingId, studentId);
    if (err || !result) {
      setError('Could not load grade details.');
    } else {
      setData(result);
    }
    setLoading(false);
  }, [classOfferingId, studentId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const subject = data?.subject;
  const teacher = data?.teacher;
  const section = data?.section;
  const term    = data?.term;

  const equivalentDisplay = data?.equivalent != null
    ? data.equivalent.toFixed(2)
    : '—';

  const equivalentStyle = [
    styles.equivalentGrade,
    data?.remarks === 'PASSED'  && { color: '#4ADE80' },
    data?.remarks === 'FAILED'  && { color: '#F87171' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.decOrb} />
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>SUBJECT GRADE</Text>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {subject?.title ?? subjectTitle ?? 'Grade Detail'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
      >
        {loading ? (
          <View style={{ padding: 16, gap: 12 }}>
            <SkeletonBox width="100%" height={180} borderRadius={16} />
            <SkeletonBox width="100%" height={160} borderRadius={16} />
            <SkeletonBox width="100%" height={140} borderRadius={16} />
          </View>
        ) : error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Subject info */}
            <View style={styles.infoCard}>
              <InfoRow label="Subject Code" value={subject?.subject_code} />
              <InfoRow label="Credit Units"  value={subject?.credit_units} />
              <InfoRow
                label="Teacher"
                value={teacher ? `${teacher.first_name} ${teacher.last_name}` : null}
              />
              <InfoRow label="Section" value={section?.section_code} />
              <InfoRow label="Term" value={formatTermLabel(term)} last />
            </View>

            {/* Grade summary */}
            <View style={styles.gradeCard}>
              <View style={styles.decOrbCard} />
              <View style={styles.gradeCardTop}>
                <Text style={styles.gradeCardTitle}>Final Grade</Text>
                <GradeStatusBadge remarks={data?.remarks} />
              </View>
              <Text style={equivalentStyle}>{equivalentDisplay}</Text>
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
            </View>

            {/* Component breakdown */}
            {(data?.midtermComponent || data?.finalComponent) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Grade Breakdown</Text>
                {data.midtermComponent && (
                  <PeriodCard component={data.midtermComponent} label="Midterm" />
                )}
                {data.finalComponent && (
                  <PeriodCard component={data.finalComponent} label="Final Term" />
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
