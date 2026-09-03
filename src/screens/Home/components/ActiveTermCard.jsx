import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../config/supabase';
import SkeletonBox from '../../../components/SkeletonLoader';

const SEMESTER_LABEL = { 1: '1st Semester', 2: '2nd Semester', 3: 'Summer' };

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ActiveTermCard({ refreshKey }) {
  const [term, setTerm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('academic_terms')
      .select('school_year, semester, start_date, end_date, is_active')
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        setTerm(data ?? null);
        setLoading(false);
      });
  }, [refreshKey]);

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <Ionicons name="calendar" size={18} color="#2A7AB6" />
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.label}>ACTIVE TERM</Text>
          {loading ? (
            <View style={{ gap: 6, marginTop: 4 }}>
              <SkeletonBox width={120} height={14} borderRadius={6} />
              <SkeletonBox width={80} height={11} borderRadius={5} />
              <SkeletonBox width={140} height={10} borderRadius={5} />
            </View>
          ) : term ? (
            <>
              <Text style={styles.termName}>
                {SEMESTER_LABEL[term.semester] ?? `Semester ${term.semester}`}
              </Text>
              <Text style={styles.schoolYear}>A.Y. {term.school_year}</Text>
              {(term.start_date || term.end_date) ? (
                <Text style={styles.dates}>
                  {formatDate(term.start_date)} – {formatDate(term.end_date)}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.noTerm}>No active term set</Text>
          )}
        </View>
      </View>
      {term && (
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Active</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#EBF4FC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8BA4BC',
    letterSpacing: 1.5,
  },
  termName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a3c5e',
    letterSpacing: -0.2,
  },
  schoolYear: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5A7A9A',
  },
  dates: {
    fontSize: 11,
    color: '#8BA4BC',
    marginTop: 1,
  },
  noTerm: {
    fontSize: 13,
    color: '#8BA4BC',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5EE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1a6e4a',
  },
  activeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a6e4a',
  },
});
