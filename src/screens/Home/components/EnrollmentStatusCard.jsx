import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../config/supabase';
import SkeletonBox from '../../../components/SkeletonLoader';

const STATUS_CONFIG = {
  enrolled: { label: 'Enrolled', color: '#1a6e4a', bg: '#E8F5EE', icon: 'checkmark-circle' },
  default:  { label: 'Not Enrolled', color: '#8BA4BC', bg: '#EEF4FA', icon: 'time-outline' },
};

export default function EnrollmentStatusCard({ studentId, ready = false }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!studentId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from('class_students')
      .select(`
        class_offering:class_offerings!class_offering_id (
          subject:subjects!subject_id (
            subject_code,
            title
          ),
          term:academic_terms!term_id (
            is_active
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('is_active', true)
      .limit(3)
      .then(({ data }) => {
        setSubjects(data ?? []);
        setLoading(false);
      });
  }, [studentId, ready]);

  const isEnrolled = subjects.length > 0;
  const status = isEnrolled ? STATUS_CONFIG.enrolled : STATUS_CONFIG.default;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleIcon}>
            <Ionicons name="school-outline" size={14} color="#2A7AB6" />
          </View>
          <Text style={styles.title}>Enrollment</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={12} color={status.color} />
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.dividerLine} />

      {loading ? (
        <View style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <SkeletonBox width={72} height={24} borderRadius={8} />
              <SkeletonBox width={140} height={13} borderRadius={6} />
            </View>
          ))}
        </View>
      ) : isEnrolled ? (
        <View style={styles.subjectList}>
          {subjects.map((row, i) => {
            const subject = row.class_offering?.subject;
            const code = subject?.subject_code ?? '—';
            const name = subject?.title ?? '';
            return (
              <View key={i}>
                {i > 0 && <View style={styles.rowDivider} />}
                <View style={styles.subjectRow}>
                  <View style={styles.codeTag}>
                    <Text style={styles.subjectCode}>{code}</Text>
                  </View>
                  {name ? (
                    <Text style={styles.subjectName} numberOfLines={1}>{name}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
          {subjects.length === 3 && (
            <Text style={styles.more}>+ more subjects enrolled</Text>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={30} color="#C8DFF0" />
          <Text style={styles.emptyText}>No enrolled subjects for this term.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#EBF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2A3A',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#EEF4FA',
    marginBottom: 12,
  },
  subjectList: {
    gap: 0,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F5F9FD',
    marginVertical: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeTag: {
    backgroundColor: '#EBF4FC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A7AB6',
  },
  subjectName: {
    fontSize: 13,
    color: '#5A7A9A',
    flex: 1,
  },
  more: {
    fontSize: 12,
    color: '#8BA4BC',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#8BA4BC',
    textAlign: 'center',
  },
});
