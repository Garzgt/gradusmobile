import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, Pressable, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../config/supabase';
import styles from './EditProfileModal.styles';

function Field({ label, optional, value, onChangeText, placeholder, keyboardType }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}{optional && <Text style={styles.optional}> (optional)</Text>}
      </Text>
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8BA4BC"
        keyboardType={keyboardType || 'default'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize={keyboardType === 'phone-pad' ? 'none' : 'words'}
      />
    </View>
  );
}

export default function EditProfileModal({ visible, student, onClose, onSaved }) {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && student) {
      setFirstName(student.first_name ?? '');
      setMiddleName(student.middle_name ?? '');
      setLastName(student.last_name ?? '');
      setContactNumber(student.contact_number ?? '');
      setError('');
    }
  }, [visible, student]);

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSave = async () => {
    if (!isValid) {
      setError('First and last name are required.');
      return;
    }
    setSaving(true);
    setError('');

    const updates = {
      first_name: firstName.trim(),
      middle_name: middleName.trim() || null,
      last_name: lastName.trim(),
      contact_number: contactNumber.trim() || null,
    };

    const { error: updateError } = await supabase
      .from('students')
      .update(updates)
      .eq('id', student.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message || 'Something went wrong. Please try again.');
      return;
    }
    onSaved(updates);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={saving ? undefined : onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose} disabled={saving} hitSlop={8}>
              <Ionicons name="close" size={22} color="#8BA4BC" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.form}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Field
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Juan"
            />
            <Field
              label="Middle Name"
              optional
              value={middleName}
              onChangeText={setMiddleName}
              placeholder="Santos"
            />
            <Field
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Dela Cruz"
            />
            <Field
              label="Contact Number"
              optional
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="09XXXXXXXXX"
              keyboardType="phone-pad"
            />
          </ScrollView>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
