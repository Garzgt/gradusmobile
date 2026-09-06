import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { saveStudentProfile } from './services/profileSetupService';
import BasicInfoForm from './components/BasicInfoForm';
import ProgramPicker from './components/ProgramPicker';
import TransfereeSection from './components/TransfereeSection';
import styles from './ProfileSetup.styles';

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: '',
  });
  const [programId, setProgramId] = useState('');
  const [isTransferee, setIsTransferee] = useState(false);
  const [transfereeYearLevel, setTransfereeYearLevel] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleToggleTransferee = (checked) => {
    setIsTransferee(checked);
    if (!checked) setTransfereeYearLevel(null);
    setError('');
  };

  const isValid = form.firstName.trim() && form.lastName.trim() && programId
    && (!isTransferee || transfereeYearLevel);

  const handleSubmit = async () => {
    if (!isValid) {
      setError(
        isTransferee && !transfereeYearLevel
          ? 'Select your current year level.'
          : 'Fill in all required fields and select a program.'
      );
      return;
    }
    setSaving(true);
    setError('');
    const { error: saveError } = await saveStudentProfile({
      userId: user.id,
      email: user.email,
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      programId,
      contactNumber: form.contactNumber.trim(),
      isTransferee,
      yearLevel: isTransferee ? transfereeYearLevel : null,
    });
    if (saveError) {
      setError(saveError.message || 'Something went wrong. Please try again.');
      setSaving(false);
      return;
    }
    await refreshProfile();
    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <BasicInfoForm values={form} onChange={handleChange} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Academic Program</Text>
            <ProgramPicker value={programId} onChange={setProgramId} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Student Status</Text>
            <TransfereeSection
              isTransferee={isTransferee}
              onToggleTransferee={handleToggleTransferee}
              yearLevel={transfereeYearLevel}
              onChangeYearLevel={setTransfereeYearLevel}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.button, (!isValid || saving) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
