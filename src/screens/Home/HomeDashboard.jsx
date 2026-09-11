import React, { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import FadeInSection from '../../components/animated/FadeInSection';
import DashboardHeader from './components/DashboardHeader';
import ActiveTermCard from './components/ActiveTermCard';
import GradeSnapshotCard from './components/GradeSnapshotCard';
import EnrollmentStatusCard from './components/EnrollmentStatusCard';

export default function HomeDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [studentLoaded, setStudentLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

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
    setRefreshKey((k) => k + 1);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FadeInSection index={0}>
        <DashboardHeader student={student} scrollY={scrollY} />
      </FadeInSection>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2A7AB6" />
        }
      >
        <FadeInSection index={1}>
          <ActiveTermCard refreshKey={refreshKey} />
        </FadeInSection>
        <FadeInSection index={2}>
          <GradeSnapshotCard studentId={student?.id} refreshKey={refreshKey} />
        </FadeInSection>
        <FadeInSection index={3} style={styles.enrollWrap}>
          <EnrollmentStatusCard studentId={student?.id} ready={studentLoaded} refreshKey={refreshKey} />
        </FadeInSection>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a3c5e' },
  scroll: { flex: 1, backgroundColor: '#F2F6FA' },
  content: { paddingHorizontal: 10, paddingTop: 14, paddingBottom: 140, gap: 12, flexGrow: 1 },
  enrollWrap: { flex: 1 },
});
