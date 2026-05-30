// lib/scheduling/conflictChecker.js
// ============================================================
// CONFLICT CHECKER
// PSU Sto. Tomas Campus
// Detects: teacher, room, section, venue, saturday conflicts
// ============================================================

import { isTimeOverlap, isSaturdayAllowed } from './timeSlotUtils.js';

// ============================================================
// CONFLICT TYPES (mirrors Supabase enum)
// ============================================================

export const CONFLICT_TYPES = {
  TEACHER_CONFLICT     : 'teacher_conflict',
  ROOM_CONFLICT        : 'room_conflict',
  SECTION_CONFLICT     : 'section_conflict',
  VENUE_MISMATCH       : 'venue_mismatch',
  INVALID_ASSIGNMENT   : 'invalid_assignment',
  SATURDAY_RESTRICTION : 'saturday_restriction',
};

// ============================================================
// SINGLE ENTRY CONFLICT CHECKS
// ============================================================

/**
 * Check if a teacher is already booked at the given day + time
 *
 * @param {string} teacherId
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array}  existingEntries - all current schedule_entries
 * @param {string} excludeEntryId - exclude this entry (for edits)
 * @returns {Object|null} conflict object or null
 */
export function checkTeacherConflict(
  teacherId,
  day,
  startTime,
  endTime,
  existingEntries,
  excludeEntryId = null
) {
  const conflict = existingEntries.find((entry) => {
    if (excludeEntryId && entry.id === excludeEntryId) return false;
    if (entry.teacher_id !== teacherId)                 return false;
    if (entry.day !== day)                              return false;

    return isTimeOverlap(
      startTime, endTime,
      entry.start_time, entry.end_time
    );
  });

  if (!conflict) return null;

  return {
    type        : CONFLICT_TYPES.TEACHER_CONFLICT,
    entryId     : conflict.id,
    description : `Teacher is already scheduled on ${day} ` +
                  `from ${conflict.start_time} to ${conflict.end_time}.`,
  };
}

/**
 * Check if a venue is already booked at the given day + time
 *
 * @param {string} venueId
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array}  existingEntries
 * @param {string} excludeEntryId
 * @returns {Object|null} conflict object or null
 */
export function checkRoomConflict(
  venueId,
  day,
  startTime,
  endTime,
  existingEntries,
  excludeEntryId = null
) {
  const conflict = existingEntries.find((entry) => {
    if (excludeEntryId && entry.id === excludeEntryId) return false;
    if (entry.venue_id !== venueId)                    return false;
    if (entry.day !== day)                             return false;

    return isTimeOverlap(
      startTime, endTime,
      entry.start_time, entry.end_time
    );
  });

  if (!conflict) return null;

  return {
    type        : CONFLICT_TYPES.ROOM_CONFLICT,
    entryId     : conflict.id,
    description : `Venue is already occupied on ${day} ` +
                  `from ${conflict.start_time} to ${conflict.end_time}.`,
  };
}

/**
 * Check if a section already has a class at the given day + time
 *
 * @param {string} sectionId
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array}  existingEntries
 * @param {string} excludeEntryId
 * @returns {Object|null} conflict object or null
 */
export function checkSectionConflict(
  sectionId,
  day,
  startTime,
  endTime,
  existingEntries,
  excludeEntryId = null
) {
  const conflict = existingEntries.find((entry) => {
    if (excludeEntryId && entry.id === excludeEntryId) return false;
    if (entry.section_id !== sectionId)                return false;
    if (entry.day !== day)                             return false;

    return isTimeOverlap(
      startTime, endTime,
      entry.start_time, entry.end_time
    );
  });

  if (!conflict) return null;

  return {
    type        : CONFLICT_TYPES.SECTION_CONFLICT,
    entryId     : conflict.id,
    description : `Section already has a class on ${day} ` +
                  `from ${conflict.start_time} to ${conflict.end_time}.`,
  };
}

/**
 * Check Saturday restriction for Year 1 sections
 *
 * @param {string} day
 * @param {string|number} yearLevel
 * @returns {Object|null} conflict object or null
 */
export function checkSaturdayRestriction(day, yearLevel) {
  if (day !== 'Saturday') return null;
  if (isSaturdayAllowed(yearLevel)) return null;

  return {
    type        : CONFLICT_TYPES.SATURDAY_RESTRICTION,
    entryId     : null,
    description : `Year 1 sections cannot have regular classes on Saturday. ` +
                  `Saturday is reserved for NSTP.`,
  };
}

/**
 * Check venue type/subtype mismatch
 * Makes sure the venue matches what the subject requires
 *
 * @param {Object} venue      - { venue_type, venue_subtype }
 * @param {Object} subject    - { required_venue_type, required_venue_subtype }
 * @param {string} sessionPart - 'lecture' | 'lab' | 'combined' | etc.
 * @param {string|null} programCode - section program code
 * @returns {Object|null} conflict object or null
 */
export function checkVenueMismatch(
  venue,
  subject,
  sessionPart = null,
  programCode = null
) {
  if (!subject.required_venue_type) return null;

  if (subject.subject_type === 'lecture_lab' && sessionPart === 'lecture') {
    return null;
  }

  // BSHM combined lec/lab fallback: allow Lecture rooms when
  // Function Hall (or default combined venue) is unavailable.
  // Kitchen-assigned combined subjects should remain Kitchen-only.
  const requiredSubtype = String(subject.required_venue_subtype || '').trim().toLowerCase();

  if (
    subject.subject_type === 'lecture_lab' &&
    sessionPart === 'combined' &&
    programCode === 'BSHM' &&
    requiredSubtype !== 'kitchen' &&
    venue.venue_type === 'Lecture'
  ) {
    return null;
  }

  if (venue.venue_type !== subject.required_venue_type) {
    return {
      type        : CONFLICT_TYPES.VENUE_MISMATCH,
      entryId     : null,
      description : `Venue type mismatch. Subject requires ` +
                    `"${subject.required_venue_type}" but ` +
                    `venue is "${venue.venue_type}".`,
    };
  }

  if (
    subject.required_venue_subtype &&
    venue.venue_subtype !== subject.required_venue_subtype
  ) {
    // PE subjects allow CONFERENCE HALL (Shared Activity) as a valid fallback.
    if (
      subject.required_venue_type === 'Open Area' &&
      subject.required_venue_subtype === 'PE' &&
      venue.venue_subtype === 'Shared Activity'
    ) {
      return null;
    }

    return {
      type        : CONFLICT_TYPES.VENUE_MISMATCH,
      entryId     : null,
      description : `Venue subtype mismatch. Subject requires ` +
                    `"${subject.required_venue_subtype}" but ` +
                    `venue is "${venue.venue_subtype}".`,
    };
  }

  return null;
}

/**
 * Check venue program restriction
 * Some venues are restricted to specific programs only
 *
 * @param {string} venueName   - venue name (e.g., "OLD CANTEEN")
 * @param {string} programCode - e.g., "BSIT"
 * @returns {Object|null} conflict object or null
 */
export function checkVenueProgramRestriction(venueName, programCode) {
  const restrictions = getVenueProgramRestrictions();
  const normalizedVenueName = String(venueName || '').trim().toUpperCase();
  const normalizedProgramCode = String(programCode || '').trim().toUpperCase();
  const rule = restrictions[normalizedVenueName];

  if (!rule) return null;

  const blocked = Array.isArray(rule.blocked)
    ? rule.blocked.map((code) => String(code || '').trim().toUpperCase())
    : [];
  const allowed = Array.isArray(rule.allowed)
    ? rule.allowed.map((code) => String(code || '').trim().toUpperCase())
    : [];

  // Check blocked programs
  if (blocked.includes(normalizedProgramCode)) {
    return {
      type        : CONFLICT_TYPES.INVALID_ASSIGNMENT,
      entryId     : null,
      description : `Venue "${venueName}" is not allowed for ` +
                    `${programCode} sections.`,
    };
  }

  // Check allowed programs (whitelist)
  if (allowed.length > 0 && !allowed.includes(normalizedProgramCode)) {
    return {
      type        : CONFLICT_TYPES.INVALID_ASSIGNMENT,
      entryId     : null,
      description : `Venue "${venueName}" is restricted. ` +
                    `${programCode} sections cannot use this venue.`,
    };
  }

  return null;
}

// ============================================================
// VENUE PROGRAM RESTRICTION MAP
// ============================================================

/**
 * Returns the venue program restriction rules
 * blocked = these programs CANNOT use this venue
 * allowed = ONLY these programs can use this venue
 */
export function getVenueProgramRestrictions() {
  return {
    'OLD CANTEEN'   : { blocked: ['BSIT'] },
    'CL 1'          : { allowed: ['BSIT'] },
    'CL 2'          : { allowed: ['BSIT'] },
    'LIBRARY'       : { allowed: ['BSIT'] },
    'KITCHEN'       : { allowed: ['BSHM'] },
    'FUNCTION HALL' : { allowed: ['BSHM'] },
  };
}

// ============================================================
// FULL CONFLICT CHECK (run all checks at once)
// ============================================================

/**
 * Run all conflict checks for a proposed schedule entry
 *
 * @param {Object} proposed - the entry being scheduled:
 *   {
 *     teacher_id, venue_id, section_id,
 *     day, start_time, end_time,
 *     year_level, program_code,
 *     venue: { venue_type, venue_subtype, name },
 *     subject: { required_venue_type, required_venue_subtype }
 *   }
 * @param {Array}  existingEntries - all current schedule_entries
 * @param {string} excludeEntryId - exclude this entry (for edits)
 * @returns {Array} - array of conflict objects (empty = no conflicts)
 */
export function checkAllConflicts(
  proposed,
  existingEntries,
  excludeEntryId = null
) {
  const conflicts = [];

  // 1. Saturday restriction
  const satConflict = checkSaturdayRestriction(
    proposed.day,
    proposed.year_level
  );
  if (satConflict) conflicts.push(satConflict);

  // 2. Teacher conflict
  const teacherConflict = checkTeacherConflict(
    proposed.teacher_id,
    proposed.day,
    proposed.start_time,
    proposed.end_time,
    existingEntries,
    excludeEntryId
  );
  if (teacherConflict) conflicts.push(teacherConflict);

  // 3. Room conflict
  // OFF CAMPUS is a virtual venue and can host simultaneous entries.
  if (proposed.venue?.name !== 'OFF CAMPUS') {
    const roomConflict = checkRoomConflict(
      proposed.venue_id,
      proposed.day,
      proposed.start_time,
      proposed.end_time,
      existingEntries,
      excludeEntryId
    );
    if (roomConflict) conflicts.push(roomConflict);
  }

  // 4. Section conflict
  const sectionConflict = checkSectionConflict(
    proposed.section_id,
    proposed.day,
    proposed.start_time,
    proposed.end_time,
    existingEntries,
    excludeEntryId
  );
  if (sectionConflict) conflicts.push(sectionConflict);

  // 5. Venue type mismatch
  if (proposed.venue && proposed.subject) {
    const venueMismatch = checkVenueMismatch(
      proposed.venue,
      proposed.subject,
      proposed.session_part,
      proposed.program_code
    );
    if (venueMismatch) conflicts.push(venueMismatch);
  }

  // 6. Venue program restriction
  if (proposed.venue && proposed.program_code) {
    const venueRestriction = checkVenueProgramRestriction(
      proposed.venue.name,
      proposed.program_code
    );
    if (venueRestriction) conflicts.push(venueRestriction);
  }

  return conflicts;
}

// ============================================================
// BULK CONFLICT CHECK
// ============================================================

/**
 * Check conflicts for a batch of proposed entries
 * Used during schedule generation
 *
 * @param {Array} proposedEntries - array of proposed entries
 * @param {Array} existingEntries - already confirmed entries
 * @returns {Object} - { valid: [...], conflicts: [...] }
 */
export function checkBulkConflicts(proposedEntries, existingEntries) {
  const valid     = [];
  const conflicts = [];
  const confirmed = [...existingEntries];

  for (const proposed of proposedEntries) {
    const found = checkAllConflicts(proposed, confirmed);

    if (found.length === 0) {
      valid.push(proposed);
      confirmed.push(proposed); // add to confirmed so next entries check against it
    } else {
      conflicts.push({
        entry     : proposed,
        conflicts : found,
      });
    }
  }

  return { valid, conflicts };
}

// ============================================================
// CONFLICT SUMMARY HELPER
// ============================================================

/**
 * Summarize conflicts for logging
 * @param {Array} conflicts - array of conflict objects
 * @returns {string} - human readable summary
 */
export function summarizeConflicts(conflicts) {
  if (conflicts.length === 0) return 'No conflicts detected.';

  return conflicts
    .map((c, i) => `${i + 1}. [${c.type}] ${c.description}`)
    .join('\n');
}

/**
 * Check if an entry has any conflicts
 * @param {Array} conflicts
 * @returns {boolean}
 */
export function hasConflicts(conflicts) {
  return conflicts.length > 0;
}