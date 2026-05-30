import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './SubjectPoolList.styles';

export default function SubjectPoolList({
  title,
  subtitle,
  subjects,
  selectedKeys,
  onToggle,
  emptyLabel,
}) {
  const list = Array.isArray(subjects) ? subjects : [];
  const selected = selectedKeys instanceof Set ? selectedKeys : new Set();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{list.length}</Text>
        </View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {list.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={18} color="#8BA4BC" />
          <Text style={styles.emptyText}>{emptyLabel || 'No subjects available.'}</Text>
        </View>
      ) : (
        <View style={styles.listWrap}>
          {list.map((subject, index) => {
            const key = subject.key || `${subject.subjectCode}-${index}`;
            const isSelected = selected.has(key);
            return (
              <View key={key}>
                {index > 0 ? <View style={styles.rowDivider} /> : null}
                <TouchableOpacity
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => onToggle && onToggle(key)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : null}
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.codeRow}>
                      <View style={styles.codeTag}>
                        <Text style={styles.codeText}>{subject.subjectCode}</Text>
                      </View>
                      <Text style={styles.unitsText}>{subject.units || 0}u</Text>
                    </View>
                    <Text style={styles.nameText} numberOfLines={2}>
                      {subject.subjectName}
                    </Text>
                    {subject.prerequisites?.length ? (
                      <Text style={styles.metaText} numberOfLines={2}>
                        Prereq: {subject.prerequisites.join(', ')}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
