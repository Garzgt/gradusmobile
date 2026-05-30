// lib/scheduling/timeSlotUtils.js
// ============================================================
// TIME SLOT UTILITIES
// PSU Sto. Tomas Campus
// Schedule: 7:00 AM to 5:30 PM
// Interval: 30 minutes
// No lunch break
// ============================================================

// ============================================================
// CONSTANTS
// ============================================================

export const SCHEDULE_START = '07:00';
export const SCHEDULE_END   = '17:30';
export const INTERVAL_MINS  = 30;

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DAYS_MON_FRI = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

// ============================================================
// TIME CONVERSION UTILITIES
// ============================================================

/**
 * Convert time string "HH:MM" to total minutes from midnight
 * Example: "07:30" → 450
 */
export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert total minutes from midnight to time string "HH:MM"
 * Example: 450 → "07:30"
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format time string to 12-hour display
 * Example: "07:30" → "7:30 AM"
 *          "13:00" → "1:00 PM"
 */
export function formatTime12h(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Get duration in minutes between two time strings
 * Example: "07:00", "09:00" → 120
 */
export function getDurationMinutes(startTime, endTime) {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

/**
 * Get duration in hours between two time strings
 * Example: "07:00", "09:00" → 2
 */
export function getDurationHours(startTime, endTime) {
  return getDurationMinutes(startTime, endTime) / 60;
}

/**
 * Add minutes to a time string
 * Example: "07:00", 90 → "08:30"
 */
export function addMinutesToTime(time, minutes) {
  const total = timeToMinutes(time) + minutes;
  return minutesToTime(total);
}

/**
 * Get end time given start time and duration in hours
 * Example: "07:00", 3 → "10:00"
 */
export function getEndTime(startTime, durationHours) {
  return addMinutesToTime(startTime, durationHours * 60);
}

// ============================================================
// SLOT GENERATION
// ============================================================

/**
 * Generate all 30-minute time slots for the schedule
 * Returns array of { start, end } objects
 * From 07:00 to 17:30 (last slot: 17:00 - 17:30)
 */
export function generateAllTimeSlots() {
  const slots = [];
  const startMins = timeToMinutes(SCHEDULE_START);
  const endMins   = timeToMinutes(SCHEDULE_END);

  for (let m = startMins; m < endMins; m += INTERVAL_MINS) {
    slots.push({
      start: minutesToTime(m),
      end:   minutesToTime(m + INTERVAL_MINS),
    });
  }

  return slots;
}

/**
 * Generate all possible start times for a block of given duration
 * Example: duration 2 hours → all start times where
 *          start + 2h <= 17:30
 */
export function generateValidStartTimes(durationHours) {
  const slots        = [];
  const startMins    = timeToMinutes(SCHEDULE_START);
  const endMins      = timeToMinutes(SCHEDULE_END);
  const durationMins = durationHours * 60;

  for (let m = startMins; m + durationMins <= endMins; m += INTERVAL_MINS) {
    slots.push(minutesToTime(m));
  }

  return slots;
}

/**
 * Generate all possible { start, end } blocks for a given duration
 * Example: duration 3 hours →
 *   { start: "07:00", end: "10:00" },
 *   { start: "07:30", end: "10:30" },
 *   ...
 */
export function generateValidTimeBlocks(durationHours) {
  const startTimes = generateValidStartTimes(durationHours);
  return startTimes.map((start) => ({
    start,
    end: getEndTime(start, durationHours),
  }));
}

// ============================================================
// OVERLAP DETECTION
// ============================================================

/**
 * Check if two time ranges overlap
 * Returns true if they overlap
 *
 * Example:
 *   A: 07:00 - 09:00
 *   B: 08:00 - 10:00
 *   → true (overlap at 08:00-09:00)
 *
 *   A: 07:00 - 09:00
 *   B: 09:00 - 11:00
 *   → false (back to back, no overlap)
 */
export function isTimeOverlap(startA, endA, startB, endB) {
  const startAMins = timeToMinutes(startA);
  const endAMins   = timeToMinutes(endA);
  const startBMins = timeToMinutes(startB);
  const endBMins   = timeToMinutes(endB);

  return startAMins < endBMins && endAMins > startBMins;
}

/**
 * Check if a time slot is free given a list of occupied slots
 * occupiedSlots = [{ start_time, end_time }, ...]
 */
export function isSlotFree(startTime, endTime, occupiedSlots) {
  return !occupiedSlots.some((slot) =>
    isTimeOverlap(startTime, endTime, slot.start_time, slot.end_time)
  );
}

/**
 * Check if a time is within schedule bounds (07:00 to 17:30)
 * Returns true if valid
 */
export function isWithinScheduleBounds(startTime, endTime) {
  const startMins    = timeToMinutes(startTime);
  const endMins      = timeToMinutes(endTime);
  const schedStart   = timeToMinutes(SCHEDULE_START);
  const schedEnd     = timeToMinutes(SCHEDULE_END);

  return startMins >= schedStart && endMins <= schedEnd;
}

// ============================================================
// FREE SLOT FINDER
// ============================================================

/**
 * Find all free time blocks for a given duration on a given day
 *
 * @param {number} durationHours  - how long the block needs to be
 * @param {Array}  occupiedSlots  - [{ start_time, end_time }]
 * @returns {Array} - [{ start, end }] of free blocks
 */
export function findFreeSlots(durationHours, occupiedSlots) {
  const candidates = generateValidTimeBlocks(durationHours);

  return candidates.filter(({ start, end }) =>
    isSlotFree(start, end, occupiedSlots) &&
    isWithinScheduleBounds(start, end)
  );
}

/**
 * Find the first available free slot for a given duration
 * Returns { start, end } or null if none found
 */
export function findFirstFreeSlot(durationHours, occupiedSlots) {
  const freeSlots = findFreeSlots(durationHours, occupiedSlots);
  return freeSlots.length > 0 ? freeSlots[0] : null;
}

// ============================================================
// MULTI-DAY SLOT FINDER
// ============================================================

/**
 * Find free slots across multiple days
 * Used for split patterns (lec on one day, lab on another)
 * or OJT/Practicum (multiple days)
 *
 * @param {number} durationHours    - hours per session
 * @param {number} sessionsNeeded   - how many sessions (days) needed
 * @param {Array}  availableDays    - days teacher/section can use
 * @param {Object} occupiedByDay    - { Monday: [...slots], Tuesday: [...] }
 * @returns {Array} - [{ day, start, end }] or null if not enough days found
 */
export function findMultiDaySlots(
  durationHours,
  sessionsNeeded,
  availableDays,
  occupiedByDay
) {
  const result = [];

  for (const day of availableDays) {
    if (result.length >= sessionsNeeded) break;

    const occupied = occupiedByDay[day] || [];
    const slot     = findFirstFreeSlot(durationHours, occupied);

    if (slot) {
      result.push({ day, start: slot.start, end: slot.end });
    }
  }

  return result.length === sessionsNeeded ? result : null;
}

// ============================================================
// GRID POSITION HELPERS (for schedule display)
// ============================================================

/**
 * Get row index for a given time
 * Row 0 = 07:00, Row 1 = 07:30, Row 2 = 08:00, etc.
 */
export function getRowIndex(time) {
  const startMins = timeToMinutes(SCHEDULE_START);
  const timeMins  = timeToMinutes(time);
  return (timeMins - startMins) / INTERVAL_MINS;
}

/**
 * Get number of rows a block spans given duration in hours
 * Example: 3 hours → 6 rows (each row = 30 mins)
 */
export function getRowSpan(durationHours) {
  return (durationHours * 60) / INTERVAL_MINS;
}

/**
 * Get total number of rows in the schedule grid
 * 07:00 to 17:30 = 630 mins / 30 = 21 rows
 */
export function getTotalRows() {
  const startMins = timeToMinutes(SCHEDULE_START);
  const endMins   = timeToMinutes(SCHEDULE_END);
  return (endMins - startMins) / INTERVAL_MINS;
}

/**
 * Get column index for a given day
 * Monday=0, Tuesday=1, ..., Saturday=5
 */
export function getColumnIndex(day) {
  return DAYS_OF_WEEK.indexOf(day);
}

// ============================================================
// DURATION RESOLVER
// ============================================================

/**
 * Get required duration in hours based on subject type and units
 *
 * Rules:
 *   lecture_only (3 units) → 3 hours (or 1.5h x2 if flexible)
 *   pe (2 credits)         → 2 hours
 *   lecture_lab lec part   → 2 hours
 *   lecture_lab lab part   → 3 hours
 *   lecture_lab combined   → 5 hours
 *   ojt / internship /
 *   field_study (6 units)  → 3 hours per session (2 sessions)
 *   practicum (9 units)    → 3 hours per session (3 sessions)
 */
export function resolveSessionDuration(subjectType, sessionPart, creditUnits) {
  switch (subjectType) {
    case 'lecture_only':
      return 3;

    case 'pe':
      return 2;

    case 'lecture_lab':
      if (sessionPart === 'lecture')  return 2;
      if (sessionPart === 'lab')      return 3;
      if (sessionPart === 'combined') return 5;
      return 3;

    case 'ojt':
    case 'internship':
    case 'field_study':
      return 3; // 3h per session, 2 sessions per week

    case 'practicum':
      if (Number(creditUnits) === 6) return 6;
      return 3; // 3h per session, 3 sessions per week (HPRAC 9 units)

    default:
      return 3;
  }
}

/**
 * Get number of sessions per week based on subject type and units
 *
 * Rules:
 *   lecture_only   → 1 session (3h) OR 2 sessions (1.5h each)
 *   pe             → 1 session (2h)
 *   lecture_lab    → depends on pattern (split=2, combined=1)
 *   ojt (6 units)  → 2 sessions
 *   practicum HPRAC
 *   (9 units)      → 3 sessions
 *   internship
 *   (6 units)      → 2 sessions
 *   field_study
 *   (6 units)      → 2 sessions
 */
export function resolveSessionCount(subjectType, deliveryPattern, creditUnits) {
  switch (subjectType) {
    case 'lecture_only':
      return deliveryPattern === 'flexible' ? 1 : 1;
      // flexible: engine tries 1 day first, splits to 2 if needed

    case 'pe':
      return 1;

    case 'lecture_lab':
      if (deliveryPattern === 'combined_lec_lab') return 1;
      if (deliveryPattern === 'split_lec_lab')    return 2;
      return 1;

    case 'ojt':
      return 2; // 6 units → 2 sessions

    case 'practicum':
      return creditUnits >= 9 ? 3 : 2; // HPRAC=3, others=2

    case 'internship':
      return 2; // 6 units → 2 sessions

    case 'field_study':
      return 2; // 6 units → 2 sessions

    default:
      return 1;
  }
}

// ============================================================
// FLEXIBLE PATTERN HELPERS
// ============================================================

/**
 * For flexible 3-unit lecture subjects:
 * Try to find a 3-hour block first (Option A)
 * If not available, find two 1.5-hour blocks on different days (Option B)
 *
 * @param {Array}  availableDays  - days to search
 * @param {Object} occupiedByDay  - { day: [...slots] }
 * @returns {Array} - [{ day, start, end }] (1 or 2 entries)
 *                    or null if nothing found
 */
export function findFlexibleSlots(availableDays, occupiedByDay) {
  // Option A: 3 hours in 1 day
  for (const day of availableDays) {
    const occupied = occupiedByDay[day] || [];
    const slot     = findFirstFreeSlot(3, occupied);
    if (slot) {
      return [{ day, start: slot.start, end: slot.end }];
    }
  }

  // Option B: 1.5 hours x 2 different days
  const halfSlots = [];
  for (const day of availableDays) {
    if (halfSlots.length >= 2) break;
    const occupied = occupiedByDay[day] || [];
    const slot     = findFirstFreeSlot(1.5, occupied);
    if (slot) {
      halfSlots.push({ day, start: slot.start, end: slot.end });
    }
  }

  return halfSlots.length === 2 ? halfSlots : null;
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate that a time string is in correct HH:MM format
 */
export function isValidTimeFormat(time) {
  return /^\d{2}:\d{2}$/.test(time);
}

/**
 * Validate that start is before end
 */
export function isValidTimeRange(startTime, endTime) {
  return timeToMinutes(startTime) < timeToMinutes(endTime);
}

/**
 * Check if a day is a valid schedule day
 */
export function isValidDay(day) {
  return DAYS_OF_WEEK.includes(day);
}

/**
 * Check if Saturday is allowed for a section
 * Year 1 sections: Saturday blocked (NSTP day)
 * Year 2-4: Saturday allowed
 */
export function isSaturdayAllowed(yearLevel) {
  return String(yearLevel) !== '1';
}

/**
 * Get allowed days for a section based on year level
 */
export function getAllowedDays(yearLevel) {
  if (String(yearLevel) === '1') {
    return DAYS_MON_FRI; // No Saturday for Year 1
  }
  return DAYS_OF_WEEK; // Mon-Sat for Year 2-4
}