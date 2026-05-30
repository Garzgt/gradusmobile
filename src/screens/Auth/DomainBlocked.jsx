import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import styles from './DomainBlocked.styles';

export default function DomainBlocked() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.iconWrapper}>
        <Ionicons name="lock-closed" size={36} color="#2A7AB6" />
      </View>
      <Text style={styles.title}>Access Restricted</Text>
      <Text style={styles.message}>
        Only PSU institutional email accounts are allowed to access GRADUS.
      </Text>
      <Text style={styles.domain}>@pampangastateu.edu.ph</Text>
      <TouchableOpacity style={styles.button} onPress={signOut} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Use a different account</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
