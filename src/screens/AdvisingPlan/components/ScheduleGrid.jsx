import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

const DAYS = [
  { key: 1, label: 'MON' },
  { key: 2, label: 'TUE' },
  { key: 3, label: 'WED' },
  { key: 4, label: 'THU' },
  { key: 5, label: 'FRI' },
  { key: 6, label: 'SAT' },
];

const CONTENT_PADDING = 32;
const TIME_COL_W = 60;
const HEADER_H = 28;
const ROW_H = 18;
const GRID_START = 7 * 60;        // 7:00
const GRID_END   = 17 * 60 + 30;  // 17:30 (5:30 PM)
const DEFAULT_COLOR = { bg: '#3B82F6', text: '#111111', border: '#3B82F6' };

const TIME_SLOTS = [];
for (let t = GRID_START; t < GRID_END; t += 30) TIME_SLOTS.push(t);

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
}

function fmt(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')}`;
}

function slotRange(start) {
  return `${fmt(start)} -${fmt(start + 30)}`;
}

export default function ScheduleGrid({ entries, subjectColors }) {
  const { width } = useWindowDimensions();
  const dayColW = Math.floor((width - CONTENT_PADDING - TIME_COL_W) / DAYS.length);

  const entriesByDay = useMemo(() => {
    const map = {};
    DAYS.forEach((d) => { map[d.key] = []; });
    (entries || []).forEach((e) => {
      const d = Number(e.day_of_week);
      if (map[d]) map[d].push(e);
    });
    return map;
  }, [entries]);

  const gridHeight = TIME_SLOTS.length * ROW_H;
  const totalWidth = TIME_COL_W + DAYS.length * dayColW;

  return (
    <View style={[styles.outer, { width: totalWidth }]}>
      {/* Header row */}
      <View style={[styles.headerRow, { height: HEADER_H }]}>
        <View style={[styles.timeCorner, { width: TIME_COL_W, height: HEADER_H }]}>
          <Text style={styles.cornerText}>Time</Text>
        </View>
        {DAYS.map((day) => (
          <View key={day.key} style={[styles.dayHeader, { width: dayColW, height: HEADER_H }]}>
            <Text style={styles.dayHeaderText}>{day.label}</Text>
          </View>
        ))}
      </View>

      {/* Grid body */}
      <View style={{ flexDirection: 'row', height: gridHeight }}>

        {/* Time range column */}
        <View style={{ width: TIME_COL_W }}>
          {TIME_SLOTS.map((slot) => (
            <View key={slot} style={[styles.timeCell, { height: ROW_H }]}>
              <Text style={styles.timeLabel}>{slotRange(slot)}</Text>
            </View>
          ))}
        </View>

        {/* Day columns */}
        {DAYS.map((day) => (
          <View
            key={day.key}
            style={[styles.dayCol, { width: dayColW, height: gridHeight }]}
          >
            {/* Background row lines */}
            {TIME_SLOTS.map((slot) => (
              <View
                key={slot}
                style={[styles.gridCell, { height: ROW_H }, slot % 60 === 0 && styles.gridCellHour]}
              />
            ))}

            {/* Subject blocks */}
            {entriesByDay[day.key].map((entry, i) => {
              const startMin = timeToMinutes(entry.start_time);
              const endMin   = timeToMinutes(entry.end_time);
              const top    = ((startMin - GRID_START) / 30) * ROW_H;
              const height = Math.max(((endMin - startMin) / 30) * ROW_H - 1, 18);
              const colorKey = entry._subjectCode || entry.subjects?.subject_code;
              const c = subjectColors?.[colorKey] || DEFAULT_COLOR;
              const code     = entry.subjects?.subject_code || entry._subjectCode || '—';
              const lastName = entry.teachers?.last_name || entry.teachers?.first_name || '';
              const section  = entry.sections?.section_code || '';

              return (
                <View
                  key={entry.id || i}
                  style={[styles.block, { top, height, backgroundColor: c.bg, borderColor: c.border }]}
                >
                  <Text style={[styles.blockCode, { color: c.text }]} numberOfLines={1}>{code}</Text>
                  {lastName ? (
                    <Text style={[styles.blockTeacher, { color: c.text }]} numberOfLines={1}>{lastName}</Text>
                  ) : null}
                  {section ? (
                    <Text style={[styles.blockSection, { color: c.text }]} numberOfLines={1}>{section}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const BORDER       = '#4f4f4f';
const INNER_BORDER = '#d4d4d4';
const HOUR_BORDER  = '#BFBFBF';

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#C6C6C6',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  timeCorner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BFBFBF',
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  cornerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#333',
  },
  dayHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  dayHeaderText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1c3356',
    letterSpacing: 0.3,
  },
  timeCell: {
    backgroundColor: '#EFEFEF',
    borderBottomWidth: 1,
    borderBottomColor: INNER_BORDER,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 7,
    fontWeight: '500',
    color: '#444',
    textAlign: 'center',
  },
  dayCol: {
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: BORDER,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  gridCell: {
    borderBottomWidth: 1,
    borderBottomColor: INNER_BORDER,
  },
  gridCellHour: {
    borderBottomColor: HOUR_BORDER,
  },
  block: {
    position: 'absolute',
    left: 1,
    right: 1,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 2,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  blockCode: {
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 11,
  },
  blockTeacher: {
    fontSize: 7,
    lineHeight: 10,
  },
  blockSection: {
    fontSize: 6,
    lineHeight: 9,
    opacity: 0.8,
  },
});
