import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './SubjectPoolList.styles';

function getTeacherName(teacher) {
  if (!teacher) return 'TBA';
  return `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'TBA';
}

function ordinal(n) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function backLabel(subject) {
  const yr = subject.yearLevel ? `${ordinal(subject.yearLevel)} Yr` : null;
  const sem = subject.semester ? `Sem ${subject.semester}` : null;
  if (yr && sem) return `${yr} · ${sem}`;
  return yr || sem || 'Back';
}

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
          <View style={styles.codeRowRight}>
            {(subject.yearLevel || subject.semester) && (
              <View style={styles.backBadge}>
                <Text style={styles.backBadgeText}>{backLabel(subject)}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.nameText} numberOfLines={2}>{subject.subjectName}</Text>

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
                    <Text style={styles.teacherName}>{t.teacherName}</Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.teacherNoSchedule}>
                <Ionicons name="information-circle-outline" size={13} color="#8BA4BC" />
                <Text style={styles.teacherNoScheduleText}>No teacher assigned yet.</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SubjectPoolList({
  subjects,
  selectedKeys,
  onToggle,
  availableEntries,
  teacherSelections,
  onTeacherSelect,
}) {
  const list = Array.isArray(subjects) ? subjects : [];
  const selected = selectedKeys instanceof Set ? selectedKeys : new Set();

  if (list.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="book-outline" size={20} color="#C8DFF0" />
        <Text style={styles.emptyText}>No eligible subjects for this term.</Text>
      </View>
    );
  }

  return (
    <View>
      {list.map((subject, index) => {
        const key = subject.key || `${subject.subjectCode}-${index}`;
        const isSelected = selected.has(key);
        const entries = availableEntries?.[subject.subjectCode] || [];
        const chosenTeacherId = teacherSelections?.[key]?.teacherId;

        const prevSubject = index > 0 ? list[index - 1] : null;
        const isSectionBreak = prevSubject?.isBack === true && !subject.isBack;

        return (
          <View key={key}>
            {isSectionBreak ? (
              <View style={styles.sectionBreak}>
                <View style={styles.sectionBreakLine} />
                <Text style={styles.sectionBreakLabel}>CURRENT YEAR</Text>
                <View style={styles.sectionBreakLine} />
              </View>
            ) : index > 0 ? (
              <View style={styles.rowDivider} />
            ) : null}
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
  );
}
