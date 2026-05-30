// lib/scheduling/restrictions.js
// ============================================================
// SCHEDULING RESTRICTIONS
// PSU Sto. Tomas Campus
// Handles: NSTP, Saturday, PE venue, OJT/Practicum,
//          teacher load, availability, venue program rules
// ============================================================

import {
  DAYS_OF_WEEK,
  DAYS_MON_FRI,
  getAllowedDays,
  isSaturdayAllowed,
  timeToMinutes,
} from './timeSlotUtils.js';

// ============================================================
// NSTP RESTRICTIONS
// ============================================================

/**
 * Check if a subject should be skipped during generation
 * NSTP is never placed in the schedule table
 *
 * @param {Object} subject - { subject_type }
 * @returns {boolean} - true = skip this subject
 */
export function shouldSkipSubject(subject) {
  return subject.subject_type === 'nstp';
}

/**
 * Get list of subject types that are skipped during generation
 */
export function getSkippedSubjectTypes() {
  return ['nstp'];
}

// ============================================================
// SATURDAY RESTRICTIONS
// ============================================================

/**
 * Check if a section can have classes on Saturday
 * Year 1 = blocked (NSTP day for ALL departments)
 * Year 2-4 = allowed
 *
 * @param {Object} section - { year_level, saturday_blocked }
 * @returns {boolean} - true = Saturday allowed
 */
export function isSaturdayAllowedForSection(section) {
  if (section.saturday_blocked) return false;
  return isSaturdayAllowed(section.year_level);
}

/**
 * Get allowed days for a section
 * Year 1: Monday to Friday only
 * Year 2-4: Monday to Saturday
 *
 * @param {Object} section - { year_level, saturday_blocked }
 * @returns {Array} - array of allowed day strings
 */
export function getAllowedDaysForSection(section) {
  if (!isSaturdayAllowedForSection(section)) {
    return DAYS_MON_FRI;
  }
  return DAYS_OF_WEEK;
}

/**
 * Filter out Saturday from a list of days
 * Used for Year 1 sections
 *
 * @param {Array} days - array of day strings
 * @returns {Array} - days without Saturday
 */
export function removeSaturday(days) {
  return days.filter((day) => day !== 'Saturday');
}

// ============================================================
// TEACHER RESTRICTIONS
// ============================================================

/**
 * Check if a teacher is available on a given day
 * Based on teacher_availability records
 *
 * @param {string} teacherId
 * @param {string} day
 * @param {Array}  availability - teacher_availability records
 *   [{ teacher_id, day, start_time, end_time }]
 * @returns {boolean}
 */
export function isTeacherAvailableOnDay(teacherId, day, availability) {
  return availability.some(
    (a) => a.teacher_id === teacherId && a.day === day
  );
}

/**
 * Get teacher availability window for a specific day
 * Returns { start_time, end_time } or null if not available
 *
 * @param {string} teacherId
 * @param {string} day
 * @param {Array}  availability
 * @returns {Object|null}
 */
export function getTeacherAvailabilityWindow(teacherId, day, availability) {
  const record = availability.find(
    (a) => a.teacher_id === teacherId && a.day === day
  );
  return record
    ? { start_time: record.start_time, end_time: record.end_time }
    : null;
}

/**
 * Check if a proposed time slot falls within
 * the teacher's availability window for that day
 *
 * @param {string} teacherId
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array}  availability
 * @returns {boolean}
 */
export function isWithinTeacherAvailability(
  teacherId,
  day,
  startTime,
  endTime,
  availability
) {
  const window = getTeacherAvailabilityWindow(teacherId, day, availability);
  if (!window) return false;

  const slotStart  = timeToMinutes(startTime);
  const slotEnd    = timeToMinutes(endTime);
  const availStart = timeToMinutes(window.start_time);
  const availEnd   = timeToMinutes(window.end_time);

  return slotStart >= availStart && slotEnd <= availEnd;
}

/**
 * Get all days a teacher is available
 *
 * @param {string} teacherId
 * @param {Array}  availability
 * @returns {Array} - array of day strings
 */
export function getTeacherAvailableDays(teacherId, availability) {
  return availability
    .filter((a) => a.teacher_id === teacherId)
    .map((a) => a.day);
}

/**
 * Get days that are valid for both teacher and section
 * Intersection of teacher available days and section allowed days
 *
 * @param {string} teacherId
 * @param {Object} section    - { year_level, saturday_blocked }
 * @param {Array}  availability
 * @returns {Array} - valid days for scheduling
 */
export function getValidDaysForAssignment(teacherId, section, availability) {
  const teacherDays  = getTeacherAvailableDays(teacherId, availability);
  const sectionDays  = getAllowedDaysForSection(section);

  return sectionDays.filter((day) => teacherDays.includes(day));
}

// ============================================================
// TEACHER LOAD RESTRICTIONS
// ============================================================

/**
 * Check if a teacher has reached their max teaching days
 *
 * @param {string} teacherId
 * @param {number} maxTeachingDays
 * @param {Array}  existingEntries - current schedule_entries
 * @returns {boolean} - true = teacher can still be assigned
 */
export function isTeacherWithinMaxDays(
  teacherId,
  maxTeachingDays,
  existingEntries
) {
  const teacherEntries = existingEntries.filter(
    (e) => e.teacher_id === teacherId
  );

  const uniqueDays = new Set(teacherEntries.map((e) => e.day));
  return uniqueDays.size < maxTeachingDays;
}

/**
 * Get number of days a teacher is currently scheduled
 *
 * @param {string} teacherId
 * @param {Array}  existingEntries
 * @returns {number}
 */
export function getTeacherScheduledDays(teacherId, existingEntries) {
  const teacherEntries = existingEntries.filter(
    (e) => e.teacher_id === teacherId
  );
  const uniqueDays = new Set(teacherEntries.map((e) => e.day));
  return uniqueDays.size;
}

/**
 * Calculate teacher's current load in units
 *
 * @param {string} teacherId
 * @param {Array}  existingEntries - entries with subject info joined
 * @returns {number} - total units currently assigned
 */
export function getTeacherCurrentLoad(teacherId, existingEntries) {
  const teacherEntries = existingEntries.filter(
    (e) => e.teacher_id === teacherId
  );

  return teacherEntries.reduce((total, entry) => {
    const units = entry.subject?.credit_units || 0;
    return total + Number(units);
  }, 0);
}

/**
 * Check if adding units to a teacher would exceed their max load
 *
 * @param {string} teacherId
 * @param {number} maxLoadUnits
 * @param {number} unitsToAdd
 * @param {Array}  existingEntries
 * @returns {boolean} - true = teacher can still take more load
 */
export function isTeacherWithinMaxLoad(
  teacherId,
  maxLoadUnits,
  unitsToAdd,
  existingEntries
) {
  const currentLoad = getTeacherCurrentLoad(teacherId, existingEntries);
  return currentLoad + unitsToAdd <= maxLoadUnits;
}

/**
 * Check if a teacher is fully qualified to teach a subject
 * Teacher must be in teacher_subject_assignments for this term
 *
 * @param {string} teacherId
 * @param {string} subjectId
 * @param {string} termId
 * @param {Array}  assignments - teacher_subject_assignments records
 * @returns {boolean}
 */
export function isTeacherQualifiedForSubject(
  teacherId,
  subjectId,
  termId,
  assignments
) {
  return assignments.some(
    (a) =>
      a.teacher_id === teacherId &&
      a.subject_id === subjectId &&
      a.term_id   === termId
  );
}

/**
 * Get all teachers qualified for a subject in a term
 *
 * @param {string} subjectId
 * @param {string} termId
 * @param {Array}  assignments
 * @returns {Array} - array of teacher_ids
 */
export function getQualifiedTeachers(subjectId, termId, assignments) {
  return assignments
    .filter(
      (a) => a.subject_id === subjectId && a.term_id === termId
    )
    .map((a) => a.teacher_id);
}

// ============================================================
// VENUE RESTRICTIONS
// ============================================================

/**
 * Venue program restriction map
 * blocked = programs that CANNOT use this venue
 * allowed = ONLY these programs can use this venue (whitelist)
 */
export const VENUE_PROGRAM_RESTRICTIONS = {
  'OLD CANTEEN'   : { blocked: ['BSIT'] },
  'CL 1'          : { allowed: ['BSIT'] },
  'CL 2'          : { allowed: ['BSIT'] },
  'LIBRARY'       : { allowed: ['BSIT'] },
  'KITCHEN'       : { allowed: ['BSHM'] },
  'FUNCTION HALL' : { allowed: ['BSHM'] },
};

/**
 * Check if a venue is allowed for a program
 *
 * @param {string} venueName   - e.g. "OLD CANTEEN"
 * @param {string} programCode - e.g. "BSIT"
 * @returns {boolean} - true = allowed
 */
export function isVenueAllowedForProgram(venueName, programCode) {
  const normalizedVenueName = String(venueName || '').trim().toUpperCase();
  const normalizedProgramCode = String(programCode || '').trim().toUpperCase();
  const rule = VENUE_PROGRAM_RESTRICTIONS[normalizedVenueName];
  if (!rule) return true; // no restriction = allowed for all

  const blocked = Array.isArray(rule.blocked)
    ? rule.blocked.map((code) => String(code || '').trim().toUpperCase())
    : [];
  const allowed = Array.isArray(rule.allowed)
    ? rule.allowed.map((code) => String(code || '').trim().toUpperCase())
    : [];

  if (blocked.includes(normalizedProgramCode)) return false;
  if (allowed.length > 0 && !allowed.includes(normalizedProgramCode)) return false;

  return true;
}

/**
 * Filter venues by program restriction
 *
 * @param {Array}  venues      - all venue records
 * @param {string} programCode - e.g. "BSIT"
 * @returns {Array} - venues allowed for this program
 */
export function filterVenuesByProgram(venues, programCode) {
  return venues.filter((venue) =>
    isVenueAllowedForProgram(venue.name, programCode)
  );
}

// ============================================================
// PE VENUE RESTRICTIONS
// ============================================================

/**
 * Get valid venues for PE subjects
 * Priority: PE AREA (primary) → CONFERENCE HALL (fallback)
 *
 * @param {Array} venues - all venue records
 * @returns {Array} - [peArea, conferenceHall] in priority order
 */
export function getPEVenues(venues) {
  const peArea        = venues.find((v) => v.name === 'PE AREA');
  const conferenceHall = venues.find((v) => v.name === 'CONFERENCE HALL');

  const result = [];
  if (peArea)         result.push(peArea);
  if (conferenceHall) result.push(conferenceHall);

  return result;
}

/**
 * Check if PE AREA is available at a given day + time
 *
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array}  existingEntries
 * @returns {boolean}
 */
export function isPEAreaAvailable(day, startTime, endTime, existingEntries) {
  const peEntries = existingEntries.filter(
    (e) =>
      e.venue?.name === 'PE AREA' &&
      e.day === day
  );

  return !peEntries.some((e) =>
    timeToMinutes(startTime) < timeToMinutes(e.end_time) &&
    timeToMinutes(endTime)   > timeToMinutes(e.start_time)
  );
}

/**
 * Check if CONFERENCE HALL is available at a given day + time
 *
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array}  existingEntries
 * @returns {boolean}
 */
export function isConferenceHallAvailable(
  day,
  startTime,
  endTime,
  existingEntries
) {
  const hallEntries = existingEntries.filter(
    (e) =>
      e.venue?.name === 'CONFERENCE HALL' &&
      e.day === day
  );

  return !hallEntries.some((e) =>
    timeToMinutes(startTime) < timeToMinutes(e.end_time) &&
    timeToMinutes(endTime)   > timeToMinutes(e.start_time)
  );
}

// ============================================================
// OFF CAMPUS RESTRICTIONS
// ============================================================

/**
 * Subject types that must use OFF CAMPUS venue
 */
export const OFF_CAMPUS_SUBJECT_TYPES = [
  'ojt',
  'practicum',
  'internship',
  'field_study',
];

/**
 * Check if a subject must be scheduled off campus
 *
 * @param {Object} subject - { subject_type }
 * @returns {boolean}
 */
export function requiresOffCampus(subject) {
  return OFF_CAMPUS_SUBJECT_TYPES.includes(subject.subject_type);
}

/**
 * Get the OFF CAMPUS venue from venues list
 *
 * @param {Array} venues
 * @returns {Object|null}
 */
export function getOffCampusVenue(venues) {
  return venues.find((v) => v.name === 'OFF CAMPUS') || null;
}

// ============================================================
// COMPUTER LAB RESTRICTIONS
// ============================================================

/**
 * Get available computer labs for BSIT lab sessions
 * Returns CL 1 and CL 2 in order
 *
 * @param {Array} venues
 * @returns {Array}
 */
export function getComputerLabs(venues) {
  return venues.filter(
    (v) => v.venue_subtype === 'Computer Lab' && v.status === 'active'
  );
}

// ============================================================
// BSHM LAB RESTRICTIONS
// ============================================================

/**
 * Get available BSHM lab venues (Kitchen + Function Hall)
 *
 * @param {Array} venues
 * @returns {Array}
 */
export function getBSHMLabVenues(venues) {
  return venues.filter(
    (v) =>
      (v.venue_subtype === 'Kitchen' ||
       v.venue_subtype === 'Function Hall') &&
      v.status === 'active'
  );
}

/**
 * Get KITCHEN venue specifically
 *
 * @param {Array} venues
 * @returns {Object|null}
 */
export function getKitchenVenue(venues) {
  return venues.find((v) => v.name === 'KITCHEN') || null;
}

/**
 * Get FUNCTION HALL venue specifically
 *
 * @param {Array} venues
 * @returns {Object|null}
 */
export function getFunctionHallVenue(venues) {
  return venues.find((v) => v.name === 'FUNCTION HALL') || null;
}


// ============================================================
// GENERAL RESTRICTION VALIDATOR
// ============================================================

/**
 * Run all restriction checks for a proposed assignment
 * Returns array of restriction violations (empty = all good)
 *
 * @param {Object} proposed - {
 *   teacher_id, venue_id, section, subject,
 *   day, start_time, end_time, program_code
 * }
 * @param {Object} context - {
 *   availability, assignments, existingEntries,
 *   teachers, venues, termId
 * }
 * @returns {Array} - array of violation strings
 */
export function validateRestrictions(proposed, context) {
  const violations = [];

  const {
    availability,
    assignments,
    existingEntries,
    teachers,
    termId,
  } = context;

  const teacher = teachers.find((t) => t.id === proposed.teacher_id);

  // 1. Skip NSTP subjects
  if (shouldSkipSubject(proposed.subject)) {
    violations.push('NSTP subjects are not scheduled.');
    return violations;
  }

  // 2. Saturday restriction
  if (
    proposed.day === 'Saturday' &&
    !isSaturdayAllowedForSection(proposed.section)
  ) {
    violations.push(
      'Year 1 sections cannot have classes on Saturday (NSTP day).'
    );
  }

  // 3. Teacher availability on day
  if (
    !isTeacherAvailableOnDay(
      proposed.teacher_id,
      proposed.day,
      availability
    )
  ) {
    violations.push(
      `Teacher is not available on ${proposed.day}.`
    );
  }

  // 4. Teacher within availability window
  if (
    !isWithinTeacherAvailability(
      proposed.teacher_id,
      proposed.day,
      proposed.start_time,
      proposed.end_time,
      availability
    )
  ) {
    violations.push(
      `Proposed time is outside teacher availability window on ${proposed.day}.`
    );
  }

  // 5. Teacher max days
  if (
    teacher &&
    !isTeacherWithinMaxDays(
      proposed.teacher_id,
      teacher.max_teaching_days,
      existingEntries
    )
  ) {
    violations.push(
      `Teacher has reached maximum teaching days (${teacher.max_teaching_days}).`
    );
  }

  // 6. Teacher max load
  if (teacher) {
    const subjectUnits = proposed.subject?.credit_units || 0;
    if (
      !isTeacherWithinMaxLoad(
        proposed.teacher_id,
        teacher.max_load_units,
        subjectUnits,
        existingEntries
      )
    ) {
      violations.push(
        `Teacher has reached maximum load units (${teacher.max_load_units}).`
      );
    }
  }

  // 7. Teacher qualified for subject
  if (
    !isTeacherQualifiedForSubject(
      proposed.teacher_id,
      proposed.subject?.id,
      termId,
      assignments
    )
  ) {
    violations.push(
      'Teacher is not assigned to teach this subject in the current term.'
    );
  }

  // 8. Venue program restriction
  if (proposed.venue) {
    if (
      !isVenueAllowedForProgram(
        proposed.venue.name,
        proposed.program_code
      )
    ) {
      violations.push(
        `Venue "${proposed.venue.name}" is not allowed for ${proposed.program_code}.`
      );
    }
  }

  return violations;
}