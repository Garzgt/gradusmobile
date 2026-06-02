import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import styles from './GradePeriodTabs.styles';

export default function GradePeriodTabs({ terms, activeIndex, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {terms.map((label, idx) => {
        const active = idx === activeIndex;
        return (
          <TouchableOpacity
            key={idx}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onSelect(idx)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
