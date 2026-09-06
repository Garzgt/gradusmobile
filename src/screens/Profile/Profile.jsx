import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../config/supabase';
import SkeletonBox from '../../components/SkeletonLoader';
import routes from '../../config/routes';
import EditProfileModal from './components/EditProfileModal';

const YEAR_LABEL = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };
const SEX_LABEL  = { M: 'Male', F: 'Female' };

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, last }) {
  return (
    <>
      <View style={styles.infoRow}>
        <View style={styles.infoRowLeft}>
          <Ionicons name={icon} size={14} color="#8BA4BC" />
          <Text style={styles.infoLabel}>{label}</Text>
        </View>
        <Text style={styles.infoValue} numberOfLines={2}>{value ?? '—'}</Text>
      </View>
      {!last && <View style={styles.infoDivider} />}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Profile() {
  const navigation = useNavigation();
  const { user, profile, signOut } = useAuth();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);

  const loadStudent = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('students')
      .select('*, programs(code, name)')
      .eq('user_id', user.id)
      .maybeSingle();
    setStudent(data ?? null);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { loadStudent(); }, [loadStudent]));

  const fullName = student
    ? [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ')
    : (profile?.full_name ?? '');

  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  const handleProfileSaved = (updates) => {
    setStudent((prev) => (prev ? { ...prev, ...updates } : prev));
    setEditVisible(false);
    toast.show({ type: 'success', title: 'Profile updated', message: 'Your changes have been saved.' });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.decOrb} />
        <Text style={styles.headerLabel}>PROFILE</Text>
        <Text style={styles.headerTitle} numberOfLines={1}>{fullName || 'My Profile'}</Text>
        <Text style={styles.headerSub}>{student?.student_number ?? user?.email ?? ''}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            {loading ? (
              <SkeletonBox width={88} height={88} borderRadius={44} />
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{initials || '?'}</Text>
            )}
          </View>
          {loading ? (
            <View style={{ gap: 6, alignItems: 'center' }}>
              <SkeletonBox width={160} height={18} borderRadius={8} />
              <SkeletonBox width={100} height={13} borderRadius={6} />
            </View>
          ) : (
            <>
              <Text style={styles.avatarName}>{fullName || '—'}</Text>
              {student?.student_number ? (
                <Text style={styles.avatarStudentNo}>{student.student_number}</Text>
              ) : null}
              {profile?.app_role ? (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{profile.app_role.toUpperCase()}</Text>
                </View>
              ) : null}
            </>
          )}
        </View>

        {/* Personal Information */}
        <View style={[styles.sectionLabel, styles.sectionLabelRow]}>
          <Text style={styles.sectionLabelText}>Personal Information</Text>
          {!loading && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditVisible(true)}
              activeOpacity={0.8}
              hitSlop={8}
            >
              <Ionicons name="pencil" size={12} color="#2A7AB6" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          {loading ? (
            <View style={{ gap: 14, paddingVertical: 10 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <SkeletonBox key={i} width="100%" height={16} borderRadius={6} />
              ))}
            </View>
          ) : (
            <>
              <InfoRow icon="person-outline"      label="Full Name"   value={fullName} />
              <InfoRow icon="card-outline"        label="Student No." value={student?.student_number} />
              <InfoRow icon="mail-outline"        label="Email"       value={student?.email ?? user?.email} />
              <InfoRow icon="call-outline"        label="Contact"     value={student?.contact_number} />
              <InfoRow icon="male-female-outline" label="Sex"         value={SEX_LABEL[student?.sex] ?? null} last />
            </>
          )}
        </View>

        {/* Academic Information */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>Academic Information</Text>
        </View>

        <View style={styles.infoCard}>
          {loading ? (
            <View style={{ gap: 14, paddingVertical: 10 }}>
              {[1, 2].map(i => (
                <SkeletonBox key={i} width="100%" height={16} borderRadius={6} />
              ))}
            </View>
          ) : (
            <>
              <InfoRow
                icon="school-outline"
                label="Program"
                value={
                  student?.programs
                    ? `${student.programs.code} — ${student.programs.name}`
                    : null
                }
              />
              <InfoRow
                icon="layers-outline"
                label="Year Level"
                value={YEAR_LABEL[student?.current_year_level] ?? null}
                last
              />
            </>
          )}
        </View>

        {/* Recognition */}
        <TouchableOpacity
          style={styles.recognitionBtn}
          onPress={() => navigation.navigate(routes.MY_RECOGNITION)}
          activeOpacity={0.8}
        >
          <View style={styles.recognitionLeft}>
            <View style={styles.recognitionIcon}>
              <Ionicons name="trophy-outline" size={16} color="#D97706" />
            </View>
            <Text style={styles.recognitionText}>My Recognition</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#8BA4BC" />
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditProfileModal
        visible={editVisible}
        student={student}
        onClose={() => setEditVisible(false)}
        onSaved={handleProfileSaved}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#1a3c5e' },
  scroll: { flex: 1, backgroundColor: '#F2F6FA' },
  content: { paddingHorizontal: 10, paddingTop: 14, gap: 10 },

  header: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
    overflow: 'hidden',
  },
  decOrb: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(42,122,182,0.15)', top: -60, right: -30,
  },
  headerLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2, marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2,
  },

  avatarCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingVertical: 24, alignItems: 'center', gap: 6,
    elevation: 2,
    shadowColor: '#1a3c5e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#1a3c5e',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#EBF4FC',
  },
  avatarImage: {
    width: '100%', height: '100%',
  },
  avatarInitials: {
    fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5,
  },
  avatarName: {
    fontSize: 17, fontWeight: '800', color: '#1A2A3A', letterSpacing: -0.3,
  },
  avatarStudentNo: {
    fontSize: 12, color: '#8BA4BC', fontWeight: '500',
  },
  roleBadge: {
    marginTop: 4, backgroundColor: '#EBF4FC', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 10, fontWeight: '700', color: '#2A7AB6', letterSpacing: 1.2,
  },

  sectionLabel: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingVertical: 9, alignItems: 'center',
    elevation: 2,
    shadowColor: '#1A2A3A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  sectionLabelText: {
    fontSize: 11, fontWeight: '700', color: '#8BA4BC',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  sectionLabelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  editBtn: {
    position: 'absolute', right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: '#EBF4FC', borderRadius: 8,
  },
  editBtnText: {
    fontSize: 11, fontWeight: '700', color: '#2A7AB6',
  },

  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#1a3c5e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  infoRowLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  infoLabel: {
    fontSize: 13, color: '#5A7A9A', fontWeight: '500',
  },
  infoValue: {
    fontSize: 13, fontWeight: '700', color: '#1A2A3A',
    maxWidth: '55%', textAlign: 'right',
  },
  infoDivider: {
    height: 1, backgroundColor: '#F0F6FC',
  },

  recognitionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  recognitionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recognitionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recognitionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2A3A',
  },
  signOutBtn: {
    backgroundColor: '#2A7AB6', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, marginTop: 4,
    elevation: 2,
    shadowColor: '#2A7AB6', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 8,
  },
  signOutText: {
    fontSize: 15, fontWeight: '700', color: '#FFFFFF',
  },
});
