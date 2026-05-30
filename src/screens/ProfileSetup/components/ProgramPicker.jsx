import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchPrograms } from '../services/profileSetupService';
import styles from './ProgramPicker.styles';

export default function ProgramPicker({ value, onChange }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms().then(({ data }) => {
      setPrograms(data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View>
        <Text style={styles.label}>Program</Text>
        <ActivityIndicator size="small" color="#2A7AB6" style={styles.loading} />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.label}>Program</Text>
      <View style={styles.grid}>
        {programs.map((program) => {
          const selected = value === program.id;
          return (
            <TouchableOpacity
              key={program.id}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => onChange(program.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {program.code}
                </Text>
                <Text style={[styles.chipSubText, selected && styles.chipSubTextSelected]}>
                  {program.name}
                </Text>
              </View>
              {selected
                ? <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                : <Ionicons name="ellipse-outline" size={22} color="#C8DFF0" />
              }
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
