// lib/scheduling/venueMapper.js
// ============================================================
// VENUE MAPPER
// PSU Sto. Tomas Campus
// Handles: venue matching, filtering, fallback logic
// Maps subject types to correct venue types/subtypes
// ============================================================

import { isTimeOverlap } from './timeSlotUtils.js';
import {
  VENUE_PROGRAM_RESTRICTIONS,
  isVenueAllowedForProgram,
  getPEVenues,
  getOffCampusVenue,
  getComputerLabs,
  getBSHMLabVenues,
} from './restrictions.js';

// ============================================================
// VENUE TYPE CONSTANTS
// ============================================================

export const VENUE_TYPES = {
  LECTURE   : 'Lecture',
  LAB       : 'Lab',
  OPEN_AREA : 'Open Area',
  OFF_CAMPUS: 'Off Campus',
};

export const VENUE_SUBTYPES = {
  GENERAL          : 'General',
  COMPUTER_LAB     : 'Computer Lab',
  KITCHEN          : 'Kitchen',
  FUNCTION_HALL    : 'Function Hall',
  PE               : 'PE',
  SHARED_ACTIVITY  : 'Shared Activity',
  EXTERNAL         : 'External',
};

// ============================================================
// SUBJECT TYPE → VENUE REQUIREMENTS MAP
// ============================================================

/**
 * Get venue requirements for a subject based on
 * subject_type, session_part, and program
 *
 * Returns { venue_type, venue_subtype } or null
 *
 * @param {Object} subject - { subject_type, delivery_pattern,
 *                             required_venue_type,
 *                             required_venue_subtype,
 *                             subject_code }
 * @param {string} sessionPart - 'lecture' | 'lab' | 'combined'
 *                               | 'ojt' | 'practicum' etc.
 * @param {string} programCode - 'BSIT' | 'BSBA' | 'BEED' | 'BSHM'
 * @returns {Object} - { venue_type, venue_subtype }
 */
export function getVenueRequirements(subject, sessionPart, programCode) {
  const { subject_type } = subject;

  // Use subject's own required venue if explicitly set
  // (skip lecture_lab lecture sessions to keep lecture in lecture rooms)
  if (
    subject.required_venue_type &&
    sessionPart === 'lecture' &&
    subject.subject_type !== 'lecture_lab'
  ) {
    return {
      venue_type    : subject.required_venue_type,
      venue_subtype : subject.required_venue_subtype || null,
    };
  }

  switch (subject_type) {

    // ----------------------------------------------------------
    // LECTURE ONLY
    // ----------------------------------------------------------
    case 'lecture_only':
      return {
        venue_type    : VENUE_TYPES.LECTURE,
        venue_subtype : VENUE_SUBTYPES.GENERAL,
      };

    // ----------------------------------------------------------
    // LECTURE LAB
    // ----------------------------------------------------------
    case 'lecture_lab':
      if (sessionPart === 'lecture') {
        return {
          venue_type    : VENUE_TYPES.LECTURE,
          venue_subtype : VENUE_SUBTYPES.GENERAL,
        };
      }

      if (sessionPart === 'lab' || sessionPart === 'combined') {
        return getLecLabVenueByProgram(programCode);
      }

      return {
        venue_type    : VENUE_TYPES.LECTURE,
        venue_subtype : VENUE_SUBTYPES.GENERAL,
      };

    // ----------------------------------------------------------
    // PE / PATHFit
    // ----------------------------------------------------------
    case 'pe':
      return {
        venue_type    : VENUE_TYPES.OPEN_AREA,
        venue_subtype : VENUE_SUBTYPES.PE,
      };

    // ----------------------------------------------------------
    // OJT / PRACTICUM / INTERNSHIP / FIELD STUDY
    // ----------------------------------------------------------
    case 'ojt':
    case 'practicum':
    case 'internship':
    case 'field_study':
      return {
        venue_type    : VENUE_TYPES.OFF_CAMPUS,
        venue_subtype : VENUE_SUBTYPES.EXTERNAL,
      };

    // ----------------------------------------------------------
    // NSTP (should never reach here - skipped before mapping)
    // ----------------------------------------------------------
    case 'nstp':
      return null;

    default:
      return {
        venue_type    : VENUE_TYPES.LECTURE,
        venue_subtype : VENUE_SUBTYPES.GENERAL,
      };
  }
}

/**
 * Get lab venue requirements by program
 * BSIT → Computer Lab
 * BSHM → Kitchen or Function Hall
 * Others → General (fallback)
 *
 * @param {string} programCode
 * @returns {Object} - { venue_type, venue_subtype }
 */
export function getLecLabVenueByProgram(programCode) {
  switch (programCode) {
    case 'BSIT':
      return {
        venue_type    : VENUE_TYPES.LAB,
        venue_subtype : VENUE_SUBTYPES.COMPUTER_LAB,
      };

    case 'BSHM':
      return {
        venue_type    : VENUE_TYPES.LAB,
        venue_subtype : null, // Kitchen or Function Hall (resolved later)
      };

    default:
      return {
        venue_type    : VENUE_TYPES.LECTURE,
        venue_subtype : VENUE_SUBTYPES.GENERAL,
      };
  }
}

// ============================================================
// VENUE AVAILABILITY CHECK
// ============================================================

/**
 * Check if a venue is free at a given day + time
 *
 * @param {string} venueId
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array}  existingEntries - all schedule_entries
 * @returns {boolean}
 */
export function isVenueFree(venueId, day, startTime, endTime, existingEntries) {
  return !existingEntries.some(
    (entry) =>
      entry.venue_id === venueId &&
      entry.day      === day &&
      isTimeOverlap(startTime, endTime, entry.start_time, entry.end_time)
  );
}

/**
 * Get all occupied time slots for a venue on a given day
 *
 * @param {string} venueId
 * @param {string} day
 * @param {Array}  existingEntries
 * @returns {Array} - [{ start_time, end_time }]
 */
export function getVenueOccupiedSlots(venueId, day, existingEntries) {
  return existingEntries
    .filter((e) => e.venue_id === venueId && e.day === day)
    .map((e) => ({ start_time: e.start_time, end_time: e.end_time }));
}

// ============================================================
// VENUE FILTERS
// ============================================================

/**
 * Filter venues by type and subtype
 *
 * @param {Array}  venues
 * @param {string} venueType    - required venue type
 * @param {string} venueSubtype - required venue subtype (optional)
 * @returns {Array}
 */
export function filterVenuesByType(venues, venueType, venueSubtype = null) {
  return venues.filter((venue) => {
    if (venue.status !== 'active') return false;
    if (venue.venue_type !== venueType) return false;
    if (venueSubtype && venue.venue_subtype !== venueSubtype) return false;
    return true;
  });
}

/**
 * Filter venues by program restriction + type
 *
 * @param {Array}  venues
 * @param {string} programCode
 * @param {string} venueType
 * @param {string} venueSubtype
 * @returns {Array}
 */
export function filterVenuesForSubject(
  venues,
  programCode,
  venueType,
  venueSubtype = null
) {
  return venues.filter((venue) => {
    if (venue.status !== 'active')                        return false;
    if (venue.venue_type !== venueType)                   return false;
    if (venueSubtype && venue.venue_subtype !== venueSubtype) return false;
    if (!isVenueAllowedForProgram(venue.name, programCode)) return false;
    return true;
  });
}

// ============================================================
// VENUE FINDER (MAIN)
// ============================================================

/**
 * Find an available venue for a subject session
 *
 * @param {Object} subject      - subject record
 * @param {string} sessionPart  - 'lecture' | 'lab' | 'combined' etc.
 * @param {string} programCode  - 'BSIT' | 'BSBA' | 'BEED' | 'BSHM'
 * @param {string} day          - day of week
 * @param {string} startTime    - proposed start time
 * @param {string} endTime      - proposed end time
 * @param {Array}  venues       - all venue records
 * @param {Array}  existingEntries - current schedule entries
 * @returns {Object|null} - venue record or null if none available
 */
export function findAvailableVenue(
  subject,
  sessionPart,
  programCode,
  day,
  startTime,
  endTime,
  venues,
  existingEntries
) {
  const { subject_type, delivery_pattern } = subject;

  // ----------------------------------------------------------
  // PE: PE AREA first, CONFERENCE HALL fallback
  // ----------------------------------------------------------
  if (subject_type === 'pe' && delivery_pattern === 'single_day') {
    return findPEVenue(day, startTime, endTime, venues, existingEntries);
  }

  // ----------------------------------------------------------
  // OJT / Practicum / Internship / Field Study: OFF CAMPUS
  // ----------------------------------------------------------
  if (
    subject_type === 'ojt'       ||
    subject_type === 'practicum' ||
    subject_type === 'internship'||
    subject_type === 'field_study'
  ) {
    return findOffCampusVenue(
      day,
      startTime,
      endTime,
      venues,
      existingEntries
    );
  }

  // ----------------------------------------------------------
  // BSHM Combined Lec/Lab:
  // - If subject requires Kitchen, keep Kitchen-only.
  // - If subject requires Function Hall (or subtype is not set),
  //   allow lecture-room fallback when Function Hall is busy.
  // ----------------------------------------------------------
  if (
    subject_type === 'lecture_lab' &&
    programCode  === 'BSHM'        &&
    sessionPart  === 'combined'
  ) {
    const requiredSubtypeRaw = String(subject.required_venue_subtype || '').trim();
    const requiredSubtype = requiredSubtypeRaw.toLowerCase();
    const kitchenSubtype = VENUE_SUBTYPES.KITCHEN.toLowerCase();
    const functionHallSubtype = VENUE_SUBTYPES.FUNCTION_HALL.toLowerCase();

    // Respect kitchen-only assignment as-is.
    if (requiredSubtype === kitchenSubtype) {
      return findGeneralVenue(
        programCode,
        VENUE_TYPES.LAB,
        VENUE_SUBTYPES.KITCHEN,
        day,
        startTime,
        endTime,
        venues,
        existingEntries
      );
    }

    const preferredLabSubtype = requiredSubtypeRaw || VENUE_SUBTYPES.FUNCTION_HALL;

    const preferredLabVenue = findGeneralVenue(
      programCode,
      VENUE_TYPES.LAB,
      preferredLabSubtype,
      day,
      startTime,
      endTime,
      venues,
      existingEntries
    );

    if (preferredLabVenue) return preferredLabVenue;

    const canFallbackToLecture =
      !requiredSubtypeRaw || requiredSubtype === functionHallSubtype;

    if (canFallbackToLecture) {
      const lectureFallback = findGeneralVenue(
        programCode,
        VENUE_TYPES.LECTURE,
        VENUE_SUBTYPES.GENERAL,
        day,
        startTime,
        endTime,
        venues,
        existingEntries
      );

      if (lectureFallback) return lectureFallback;
    }

    return null;
  }

  // ----------------------------------------------------------
  // BSHM Lab session: KITCHEN or FUNCTION HALL
  // ----------------------------------------------------------
  if (
    subject_type === 'lecture_lab' &&
    programCode  === 'BSHM'        &&
    sessionPart  === 'lab'
  ) {
    return findBSHMLabVenue(
      subject,
      day,
      startTime,
      endTime,
      venues,
      existingEntries
    );
  }

  // ----------------------------------------------------------
  // BSIT Lab: CL 1 or CL 2
  // ----------------------------------------------------------
  if (
    subject_type === 'lecture_lab' &&
    programCode  === 'BSIT'        &&
    sessionPart  === 'lab'
  ) {
    return findComputerLabVenue(
      day,
      startTime,
      endTime,
      venues,
      existingEntries
    );
  }

  // ----------------------------------------------------------
  // General Lecture Room
  // ----------------------------------------------------------
  const requirements = getVenueRequirements(subject, sessionPart, programCode);
  if (!requirements) return null;

  const primaryVenue = findGeneralVenue(
    programCode,
    requirements.venue_type,
    requirements.venue_subtype,
    day,
    startTime,
    endTime,
    venues,
    existingEntries
  );

  if (primaryVenue) return primaryVenue;

  // BSIT split lec/lab fallback: if no lecture room is free,
  // allow Computer Lab as lecture venue.
  if (
    programCode === 'BSIT' &&
    subject_type === 'lecture_lab' &&
    delivery_pattern === 'split_lec_lab' &&
    sessionPart === 'lecture' &&
    requirements.venue_type === VENUE_TYPES.LECTURE
  ) {
    const computerLabFallback = findComputerLabVenue(
      day,
      startTime,
      endTime,
      venues,
      existingEntries
    );

    if (computerLabFallback) return computerLabFallback;
  }

  // BSHM lecture fallback: allow Function Hall if lecture rooms are full.
  if (
    programCode === 'BSHM' &&
    sessionPart === 'lecture' &&
    requirements.venue_type === VENUE_TYPES.LECTURE
  ) {
    return findGeneralVenue(
      programCode,
      VENUE_TYPES.LAB,
      VENUE_SUBTYPES.FUNCTION_HALL,
      day,
      startTime,
      endTime,
      venues,
      existingEntries
    );
  }

  return null;
}

// ============================================================
// SPECIFIC VENUE FINDERS
// ============================================================

/**
 * Find PE venue:
 * Try PE AREA first, then CONFERENCE HALL
 *
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array}  venues
 * @param {Array}  existingEntries
 * @returns {Object|null}
 */
export function findPEVenue(day, startTime, endTime, venues, existingEntries) {
  const peVenues = getPEVenues(venues);

  for (const venue of peVenues) {
    if (isVenueFree(venue.id, day, startTime, endTime, existingEntries)) {
      return venue;
    }
  }

  return null; // both PE AREA and CONFERENCE HALL are occupied
}

/**
 * Find OFF CAMPUS venue
 * OFF CAMPUS can accommodate multiple entries
 * (it's a virtual venue for display purposes)
 *
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array}  venues
 * @param {Array}  existingEntries
 * @returns {Object|null}
 */
export function findOffCampusVenue(
  day,
  startTime,
  endTime,
  venues,
  existingEntries
) {
  // OFF CAMPUS can hold multiple sections at the same time
  // (it's not a physical room with capacity limit)
  const offCampus = getOffCampusVenue(venues);
  return offCampus || null;
}

/**
 * Find BSHM lab venue:
 * KITCHEN or FUNCTION HALL based on subject
 * then check availability
 *
 * @param {Object} subject
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array}  venues
 * @param {Array}  existingEntries
 * @returns {Object|null}
 */
export function findBSHMLabVenue(
  subject,
  day,
  startTime,
  endTime,
  venues,
  existingEntries
) {
  const requiredSubtype = subject.required_venue_subtype || null;

  const candidates = requiredSubtype
    ? venues.filter(
        (venue) =>
          venue.status === 'active' &&
          venue.venue_type === VENUE_TYPES.LAB &&
          venue.venue_subtype === requiredSubtype
      )
    : getBSHMLabVenues(venues);

  const orderedCandidates = [...candidates].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const venue of orderedCandidates) {
    if (isVenueFree(venue.id, day, startTime, endTime, existingEntries)) {
      return venue;
    }
  }

  return null;
}

/**
 * Find Computer Lab venue for BSIT:
 * CL 1 first, then CL 2
 *
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array}  venues
 * @param {Array}  existingEntries
 * @returns {Object|null}
 */
export function findComputerLabVenue(
  day,
  startTime,
  endTime,
  venues,
  existingEntries
) {
  const labs = getComputerLabs(venues);

  // Sort: CL 1 first, then CL 2
  const sorted = labs.sort((a, b) => a.name.localeCompare(b.name));

  for (const lab of sorted) {
    if (isVenueFree(lab.id, day, startTime, endTime, existingEntries)) {
      return lab;
    }
  }

  return null;
}

/**
 * Find a general lecture venue
 * Filters by program restriction + type + availability
 * Returns first available venue
 *
 * @param {string} programCode
 * @param {string} venueType
 * @param {string} venueSubtype
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array}  venues
 * @param {Array}  existingEntries
 * @returns {Object|null}
 */
export function findGeneralVenue(
  programCode,
  venueType,
  venueSubtype,
  day,
  startTime,
  endTime,
  venues,
  existingEntries
) {
  const candidates = filterVenuesForSubject(
    venues,
    programCode,
    venueType,
    venueSubtype
  );

  for (const venue of candidates) {
    if (isVenueFree(venue.id, day, startTime, endTime, existingEntries)) {
      return venue;
    }
  }

  return null;
}

// ============================================================
// VENUE SUMMARY HELPERS
// ============================================================

/**
 * Get venue display label
 * e.g. "CL 1 (Computer Lab)"
 *
 * @param {Object} venue
 * @returns {string}
 */
export function getVenueLabel(venue) {
  if (!venue) return 'No Venue';
  return `${venue.name} (${venue.venue_subtype})`;
}

/**
 * Group venues by type for display
 *
 * @param {Array} venues
 * @returns {Object} - { Lecture: [...], Lab: [...], ... }
 */
export function groupVenuesByType(venues) {
  return venues.reduce((groups, venue) => {
    const type = venue.venue_type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(venue);
    return groups;
  }, {});
}

/**
 * Get all lecture rooms available for a program
 *
 * @param {Array}  venues
 * @param {string} programCode
 * @returns {Array}
 */
export function getLectureRoomsForProgram(venues, programCode) {
  return filterVenuesForSubject(
    venues,
    programCode,
    VENUE_TYPES.LECTURE,
    VENUE_SUBTYPES.GENERAL
  );
}

/**
 * Check if there are enough venues available
 * for a given subject type and program
 *
 * @param {Array}  venues
 * @param {string} programCode
 * @param {string} subjectType
 * @returns {boolean}
 */
export function hasAvailableVenueType(venues, programCode, subjectType) {
  switch (subjectType) {
    case 'lecture_only':
      return getLectureRoomsForProgram(venues, programCode).length > 0;

    case 'pe':
      return getPEVenues(venues).length > 0;

    case 'ojt':
    case 'practicum':
    case 'internship':
    case 'field_study':
      return getOffCampusVenue(venues) !== null;

    case 'lecture_lab':
      if (programCode === 'BSIT') {
        return getComputerLabs(venues).length > 0;
      }
      if (programCode === 'BSHM') {
        return getBSHMLabVenues(venues).length > 0;
      }
      return getLectureRoomsForProgram(venues, programCode).length > 0;

    default:
      return true;
  }
}