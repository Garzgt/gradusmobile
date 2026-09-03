import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../config/supabase';
import routes from '../../../config/routes';
import SkeletonBox from '../../../components/SkeletonLoader';
import { computeTermGwa } from '../../Grades/services/gradeService';

export default function GradeSnapshotCard({ studentId, refreshKey }) {
  const navigation = useNavigation();
  const [gwa, setGwa] = useState(null);
  const [termLabel, setTermLabel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);

    async function load() {
      const { data: term } = await supabase
        .from('academic_terms')
        .select('id, school_year, semester')
        .eq('is_active', true)
        .maybeSingle();

      if (!term) { setLoading(false); return; }

      const sem = term.semester === 1 ? '1st Sem' : '2nd Sem';
      setTermLabel(`${sem} ${term.school_year}`);

      // Only count grades tied to a still-active enrollment — a grade can
      // outlive a class_students row that was later deactivated/removed.
      const { data: activeEnrollments } = await supabase
        .from('class_students')
        .select('class_offering_id')
        .eq('student_id', studentId)
        .eq('is_active', true);

      const activeOfferingIds = (activeEnrollments ?? []).map(e => e.class_offering_id);

      if (activeOfferingIds.length) {
        const { data: grades } = await supabase
          .from('grades')
          .select(`
            equivalent_grade,
            remarks,
            class_offering:class_offerings!class_offering_id!inner (
              term_id,
              subject:subjects!subject_id ( credit_units )
            )
          `)
          .eq('student_id', studentId)
          .eq('class_offering.term_id', term.id)
          .in('class_offering_id', activeOfferingIds)
          .in('status', ['posted', 'approved']);

        if (grades?.length) {
          const termGrades = grades.map(g => ({
            equivalent: g.equivalent_grade != null ? Number(g.equivalent_grade) : null,
            remarks: g.remarks,
            subject: g.class_offering?.subject,
          }));
          const result = computeTermGwa(termGrades);
          if (result) setGwa(result);
        }
      }
      setLoading(false);
    }

    load();
  }, [studentId, refreshKey]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate(routes.GRADES)}
      activeOpacity={0.85}
    >
      <View style={styles.left}>
        <Text style={styles.label}>CURRENT GWA</Text>
        {loading ? (
          <SkeletonBox width={110} height={52} borderRadius={10} style={{ marginTop: 6, marginBottom: 4 }} />
        ) : (
          <Text style={[styles.gwa, !gwa && styles.gwaDash]}>{gwa ?? '—'}</Text>
        )}
        <Text style={styles.sub}>
          {gwa ? `General Weighted Average` : 'No grades posted yet'}
        </Text>
        {termLabel ? <Text style={styles.termLabel}>{termLabel}</Text> : null}
      </View>

      <View style={styles.right}>
        <View style={styles.iconCircle}>
          <Ionicons name="bar-chart" size={22} color="#2A7AB6" />
        </View>
        <View style={styles.arrowBtn}>
          <Ionicons name="arrow-forward" size={14} color="#8BA4BC" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  left: { gap: 4 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8BA4BC',
    letterSpacing: 1.5,
  },
  gwa: {
    fontSize: 44,
    fontWeight: '800',
    color: '#1a3c5e',
    letterSpacing: -1,
    marginTop: 2,
  },
  gwaDash: {
    color: '#C8DFF0',
  },
  sub: {
    fontSize: 12,
    color: '#8BA4BC',
    marginTop: 2,
  },
  termLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a3c5e',
    marginTop: 2,
  },
  right: {
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
