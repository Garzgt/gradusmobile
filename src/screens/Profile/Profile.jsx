import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user, profile, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.name}>
          {profile?.full_name ?? user?.email}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  name: { fontSize: 20, fontWeight: '700', color: '#1a3c5e' },
  email: { fontSize: 14, color: '#5A7A99', marginBottom: 32 },
  signOutBtn: {
    backgroundColor: '#2A7AB6', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  signOutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
