import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import DashboardHeader from './components/DashboardHeader';
import ActiveTermCard from './components/ActiveTermCard';
import GradeSnapshotCard from './components/GradeSnapshotCard';
import EnrollmentStatusCard from './components/EnrollmentStatusCard';

export default function HomeDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [studentLoaded, setStudentLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadStudent = async () => {
    const { data } = await supabase
      .from('students')
      .select('*, programs(code, name)')
      .eq('user_id', user.id)
      .maybeSingle();
    setStudent(data);
    setStudentLoaded(true);
  };

  useEffect(() => { loadStudent(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudent();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <DashboardHeader student={student} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2A7AB6" />
        }
      >
        <ActiveTermCard />
        <GradeSnapshotCard studentId={student?.id} />
        <View style={styles.enrollWrap}>
          <EnrollmentStatusCard studentId={student?.id} ready={studentLoaded} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a3c5e' },
  scroll: { flex: 1, backgroundColor: '#F2F6FA' },
  content: { paddingHorizontal: 10, paddingTop: 14, paddingBottom: 140, gap: 12, flexGrow: 1 },
  enrollWrap: { flex: 1 },
});
