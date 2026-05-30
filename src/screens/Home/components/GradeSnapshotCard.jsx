import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../config/supabase';
import routes from '../../../config/routes';
import SkeletonBox from '../../../components/SkeletonLoader';

export default function GradeSnapshotCard({ studentId }) {
  const navigation = useNavigation();
  const [gwa, setGwa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    supabase
      .from('grades')
      .select('final_grade')
      .eq('student_id', studentId)
      .eq('status', 'posted')
      .then(({ data }) => {
        if (data?.length) {
          const avg = data.reduce((s, r) => s + Number(r.final_grade), 0) / data.length;
          setGwa(avg.toFixed(2));
        }
        setLoading(false);
      });
  }, [studentId]);

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
          <Text style={styles.gwa}>{gwa ?? '—'}</Text>
        )}
        <Text style={styles.sub}>
          {gwa ? 'Based on posted grades' : 'No grades posted yet'}
        </Text>
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
  sub: {
    fontSize: 12,
    color: '#8BA4BC',
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
