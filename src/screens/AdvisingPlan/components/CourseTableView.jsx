import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_COLOR = { bg: '#3B82F6', text: '#111111', border: '#3B82F6' };
const BORDER = '#2f2f2f';
const INNER_BORDER = '#c0c0c0';

export default function CourseTableView({ assigned, subjectColors }) {
  // One row per unique subject — assigned may have multiple entries (one per meeting day)
  const uniqueSubjects = useMemo(() => {
    const seen = new Set();
    return assigned.filter((e) => {
      const key = e._subjectCode || e.subjects?.subject_code;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [assigned]);

  const totalUnits = uniqueSubjects.reduce(
    (sum, e) => sum + (Number(e.subjects?.credit_units) || 0),
    0,
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.codeCol]}>Course Code</Text>
        <Text style={[styles.headerCell, styles.titleCol]}>Course Title</Text>
        <Text style={[styles.headerCell, styles.unitsCol]}>Lec/(Lab)</Text>
      </View>

      {uniqueSubjects.length === 0 ? (
        <View style={styles.emptyRow}>
          <Ionicons name="calendar-outline" size={15} color="#9aabbc" />
          <Text style={styles.emptyText}>No courses to display</Text>
        </View>
      ) : (
        uniqueSubjects.map((entry, i) => {
          const subject = entry.subjects || {};
          const colorKey = entry._subjectCode || subject.subject_code;
          const c = subjectColors?.[colorKey] || DEFAULT_COLOR;
          const code = subject.subject_code || entry._subjectCode || '—';
          const title = subject.title || '—';
          const lec = subject.lec_units;
          const lab = subject.lab_units;
          const credit = subject.credit_units;
          const units =
            lec != null && lab != null && Number(lab) > 0
              ? `${lec}(${lab})`
              : credit ?? '—';

          return (
            <View
              key={entry.id || i}
              style={[styles.dataRow, i % 2 === 1 && styles.dataRowAlt]}
            >
              <View style={[styles.codeCol, styles.codeCell, { backgroundColor: c.bg }]}>
                <Text style={[styles.codeText, { color: c.text }]} numberOfLines={1}>
                  {code}
                </Text>
              </View>
              <Text style={[styles.titleCol, styles.titleCell]} numberOfLines={2}>
                {title}
              </Text>
              <Text style={[styles.unitsCol, styles.unitsCell]}>{units}</Text>
            </View>
          );
        })
      )}

      {/* Footer */}
      {uniqueSubjects.length > 0 && (
        <View style={styles.footerRow}>
          <View style={[styles.codeCol, styles.footerBlank]} />
          <Text style={[styles.titleCol, styles.footerLabel]}>Total Credit Units</Text>
          <Text style={[styles.unitsCol, styles.footerUnits]}>{totalUnits}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 0,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#b9b9b9',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  dataRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: INNER_BORDER,
  },
  dataRowAlt: {
    backgroundColor: '#f4f4f4',
  },
  footerRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  codeCol: { width: '28%' },
  titleCol: { flex: 1 },
  unitsCol: { width: '18%' },
  codeCell: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  titleCell: {
    fontSize: 10,
    color: '#111',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  unitsCell: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111',
    paddingVertical: 6,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  footerBlank: {
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  footerUnits: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1c3356',
    paddingVertical: 5,
    textAlign: 'center',
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 11,
    color: '#9aabbc',
  },
});
