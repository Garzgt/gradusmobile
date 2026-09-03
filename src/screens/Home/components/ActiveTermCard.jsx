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

  let progressPct = null;
  let daysLeft = null;
  if (term?.start_date && term?.end_date) {
    const start = new Date(term.start_date).getTime();
    const end = new Date(term.end_date).getTime();
    const now = Date.now();
    if (end > start) {
      progressPct = Math.min(Math.max((now - start) / (end - start), 0), 1);
      daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          <View style={styles.iconBox}>
            <Ionicons name="calendar" size={20} color="#2A7AB6" />
          </View>
          <View style={styles.textGroup}>
            <Text style={styles.label}>ACTIVE TERM</Text>
            {loading ? (
              <View style={{ gap: 6, marginTop: 4 }}>
                <SkeletonBox width={130} height={16} borderRadius={6} />
                <SkeletonBox width={90} height={12} borderRadius={5} />
              </View>
            ) : term ? (
              <>
                <Text style={styles.termName}>
                  {SEMESTER_LABEL[term.semester] ?? `Semester ${term.semester}`}
                </Text>
                <Text style={styles.schoolYear}>A.Y. {term.school_year}</Text>
              </>
            ) : (
              <Text style={styles.noTerm}>No active term set</Text>
            )}
          </View>
        </View>
        {term && !loading && (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Active</Text>
          </View>
        )}
      </View>

      {!loading && term && (term.start_date || term.end_date) && (
        <View style={styles.footer}>
          <Text style={styles.dates}>
            {formatDate(term.start_date)} – {formatDate(term.end_date)}
          </Text>
          {progressPct != null && (
            <>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
              </View>
              <Text style={styles.daysLeft}>
                {daysLeft === 0 ? 'Ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#1a3c5e',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  schoolYear: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5A7A9A',
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
  footer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F6FC',
  },
  dates: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8BA4BC',
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EEF4FA',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#2A7AB6',
  },
  daysLeft: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2A7AB6',
    marginTop: 6,
  },
});
