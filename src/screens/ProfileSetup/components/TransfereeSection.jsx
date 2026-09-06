import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './TransfereeSection.styles';

const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function TransfereeSection({ isTransferee, onToggleTransferee, yearLevel, onChangeYearLevel }) {
  return (
    <View>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => onToggleTransferee(!isTransferee)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, isTransferee && styles.checkboxChecked]}>
          {isTransferee && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>
        <View style={styles.checkboxTextWrap}>
          <Text style={styles.checkboxLabel}>I'm a transferee or shifter</Text>
          <Text style={styles.checkboxHint}>
            Check this if you started college elsewhere, or moved to this program from a
            different one — your year level won't be guessed from your student number.
          </Text>
        </View>
      </TouchableOpacity>

      {isTransferee && (
        <View style={styles.yearWrap}>
          <Text style={styles.label}>What year level are you starting as this term?</Text>
          <View style={styles.grid}>
            {YEAR_LABELS.map((label, i) => {
              const level = i + 1;
              const selected = yearLevel === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[styles.card, selected && styles.cardSelected]}
                  onPress={() => onChangeYearLevel(level)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                  {selected
                    ? <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    : <Ionicons name="ellipse-outline" size={20} color="#C8DFF0" />
                  }
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
