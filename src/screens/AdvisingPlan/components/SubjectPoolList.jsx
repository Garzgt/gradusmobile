import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './SubjectPoolList.styles';

function getTeacherName(teacher) {
  if (!teacher) return 'TBA';
  return `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'TBA';
}

// One entry per unique teacher — stores all entries for that teacher so the
// system can auto-pick the best non-conflicting section/time later.
function groupByTeacher(entries) {
  const map = {};
  entries.forEach((entry) => {
    const id = entry.teacher_id || 'tba';
    if (!map[id]) {
      map[id] = {
        teacherId: id,
        teacherName: getTeacherName(entry.teachers),
        entries: [],
      };
    }
    map[id].entries.push(entry);
  });
  return Object.values(map);
}

function SubjectRow({ subject, subjectKey, isSelected, onToggle, entries, chosenTeacherId, onTeacherSelect }) {
  const teachers = useMemo(() => groupByTeacher(entries), [entries]);

  return (
    <TouchableOpacity
      style={[styles.row, isSelected && styles.rowSelected]}
      onPress={() => onToggle && onToggle(subjectKey)}
      activeOpacity={0.75}
    >
      <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
        {isSelected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
      <View style={styles.rowBody}>
        <View style={styles.codeRow}>
          <View style={styles.codeTag}>
            <Text style={styles.codeText}>{subject.subjectCode}</Text>
          </View>
          <Text style={styles.unitsText}>{subject.units || 0}u</Text>
        </View>
        <Text style={styles.nameText} numberOfLines={2}>{subject.subjectName}</Text>
        {subject.prerequisites?.length ? (
          <Text style={styles.metaText} numberOfLines={2}>
            Prereq: {subject.prerequisites.join(', ')}
          </Text>
        ) : null}

        {isSelected && (
          <View style={styles.teacherPicker}>
            <Text style={styles.teacherPickerLabel}>PICK A TEACHER</Text>
            {teachers.length > 0 ? (
              teachers.map((t) => {
                const isChosen = chosenTeacherId === t.teacherId;
                return (
                  <TouchableOpacity
                    key={t.teacherId}
                    style={[styles.teacherOption, isChosen && styles.teacherOptionChosen]}
                    onPress={() => onTeacherSelect?.(subjectKey, t)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.teacherRadio, isChosen && styles.teacherRadioChosen]}>
                      {isChosen && <View style={styles.teacherRadioDot} />}
                    </View>
                    <View style={styles.teacherOptionBody}>
                      <Text style={styles.teacherName}>{t.teacherName}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.teacherNoSchedule}>
                <Ionicons name="information-circle-outline" size={13} color="#8BA4BC" />
                <Text style={styles.teacherNoScheduleText}>
                  No teacher assigned for this subject.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SubjectPoolList({
  title,
  subtitle,
  subjects,
  selectedKeys,
  onToggle,
  emptyLabel,
  availableEntries,
  teacherSelections,
  onTeacherSelect,
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
            const entries = availableEntries?.[subject.subjectCode] || [];
            const chosenTeacherId = teacherSelections?.[key]?.teacherId;

            return (
              <View key={key}>
                {index > 0 ? <View style={styles.rowDivider} /> : null}
                <SubjectRow
                  subject={subject}
                  subjectKey={key}
                  isSelected={isSelected}
                  onToggle={onToggle}
                  entries={entries}
                  chosenTeacherId={chosenTeacherId}
                  onTeacherSelect={onTeacherSelect}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
