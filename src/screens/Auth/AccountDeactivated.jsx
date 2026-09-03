import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import styles from './AccountDeactivated.styles';

export default function AccountDeactivated() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.iconWrapper}>
        <Ionicons name="person-remove" size={36} color="#2A7AB6" />
      </View>
      <Text style={styles.title}>Account Deactivated</Text>
      <Text style={styles.message}>
        Your student account has been deactivated. Please contact the registrar's office
        to have your account reactivated before signing in again.
      </Text>
      <TouchableOpacity style={styles.button} onPress={signOut} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Back to Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
