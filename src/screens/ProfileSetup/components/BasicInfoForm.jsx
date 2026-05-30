import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import styles from './BasicInfoForm.styles';

function Field({ label, optional, value, onChangeText, placeholder, keyboardType }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
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

export default function BasicInfoForm({ values, onChange }) {
  return (
    <View style={styles.container}>
      <Field
        label="First Name"
        value={values.firstName}
        onChangeText={(v) => onChange('firstName', v)}
        placeholder="Juan"
      />
      <Field
        label="Middle Name"
        optional
        value={values.middleName}
        onChangeText={(v) => onChange('middleName', v)}
        placeholder="Santos"
      />
      <Field
        label="Last Name"
        value={values.lastName}
        onChangeText={(v) => onChange('lastName', v)}
        placeholder="Dela Cruz"
      />
      <Field
        label="Contact Number"
        optional
        value={values.contactNumber}
        onChangeText={(v) => onChange('contactNumber', v)}
        placeholder="09XXXXXXXXX"
        keyboardType="phone-pad"
      />
    </View>
  );
}
