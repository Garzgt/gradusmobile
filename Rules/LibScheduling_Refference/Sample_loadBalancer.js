// lib/scheduling/loadBalancer.js
// ============================================================
// LOAD BALANCER
// PSU Sto. Tomas Campus
// Handles: teacher load distribution, ranking, selection
// Rules:
//   - Prefer teacher with lighter load first
//   - Respect max_teaching_days and max_load_units
//   - Teacher must be qualified for subject in current term
//   - Teacher must be available on proposed day
//   - Teachers can teach ANY program (not locked to departments)
// ============================================================

import {
  isTeacherQualifiedForSubject,
  isTeacherAvailableOnDay,
  isWithinTeacherAvailability,
  isTeacherWithinMaxDays,
  isTeacherWithinMaxLoad,
  getTeacherAvailableDays,
  getValidDaysForAssignment,
  getQualifiedTeachers,
} from './restrictions.js';

import {
  timeToMinutes,
  isTimeOverlap,
} from './timeSlotUtils.js';

// ============================================================
// TEACHER LOAD CALCULATION
// ============================================================

/**
 * Calculate total scheduled hours for a teacher
 * Based on existing schedule entries
 *
 * @param {string} teacherId
 * @param {Array}  existingEntries - schedule_entries with time info
 * @returns {number} - total hours scheduled
 */
export function getTeacherScheduledHours(teacherId, existingEntries) {
  return existingEntries
    .filter((e) => e.teacher_id === teacherId)
    .reduce((total, entry) => {
      const start    = timeToMinutes(entry.start_time);
      const end      = timeToMinutes(entry.end_time);
      const duration = (end - start) / 60;
      return total + duration;
    }, 0);
}

/**
 * Calculate total scheduled units for a teacher
 * Based on existing entries with subject info joined
 *
 * @param {string} teacherId
 * @param {Array}  existingEntries
 * @returns {number} - total credit units scheduled
 */
export function getTeacherScheduledUnits(teacherId, existingEntries) {
  // Get unique subject_ids already counted to avoid double counting
  // split_lec_lab creates 2 entries for same subject
  const counted = new Set();
  let total = 0;

  existingEntries
    .filter((e) => e.teacher_id === teacherId)
    .forEach((entry) => {
      const key = `${entry.section_id}_${entry.subject_id}`;
      if (!counted.has(key)) {
        counted.add(key);
        total += Number(entry.subject?.credit_units || 0);
      }
    });

  return total;
}

/**
 * Get number of unique days a teacher is scheduled
 *
 * @param {string} teacherId
 * @param {Array}  existingEntries
 * @returns {number}
 */
export function getTeacherDayCount(teacherId, existingEntries) {
  const days = existingEntries
    .filter((e) => e.teacher_id === teacherId)
    .map((e) => e.day);
  return new Set(days).size;
}

/**
 * Get unique days a teacher is already scheduled
 *
 * @param {string} teacherId
 * @param {Array}  existingEntries
 * @returns {Array} - array of day strings
 */
export function getTeacherScheduledDaysList(teacherId, existingEntries) {
  const days = existingEntries
    .filter((e) => e.teacher_id === teacherId)
    .map((e) => e.day);
  return [...new Set(days)];
}

function isExactTeacherDaysPolicyEnabled(options = {}) {
  const flag = options?.enforceExactTeacherDaysPerWeek;

  if (flag === undefined || flag === null) {
    return false;
  }

  return Boolean(flag);
}

function getTeacherEffectiveDayTarget(teacher, availability, options = {}) {
  if (!teacher) return null;
  if (!isExactTeacherDaysPolicyEnabled(options)) return null;

  const rawTarget = Number(teacher.max_teaching_days);
  if (!Number.isFinite(rawTarget) || rawTarget <= 0) return null;

  const cappedTarget = Math.max(1, Math.min(6, Math.floor(rawTarget)));
  const availableDayCount = new Set(
    getTeacherAvailableDays(teacher.id, availability)
  ).size;

  if (!Number.isFinite(availableDayCount) || availableDayCount <= 0) {
    return cappedTarget;
  }

  return Math.max(1, Math.min(cappedTarget, availableDayCount));
}

export function getTeacherDayTargetSnapshot(
  teacher,
  day,
  availability,
  existingEntries,
  options = {}
) {
  const targetDays = getTeacherEffectiveDayTarget(teacher, availability, options);

  if (!targetDays) {
    return {
      enabled: false,
      progressionRank: 0,
      remainingTargetDays: 0,
    };
  }

  const scheduledDays = new Set(
    getTeacherScheduledDaysList(teacher.id, existingEntries)
  );
  const currentDayCount = scheduledDays.size;
  const remainingTargetDays = Math.max(0, targetDays - currentDayCount);
  const wouldOpenNewDay = !scheduledDays.has(day);

  const progressionRank = remainingTargetDays > 0
    ? (wouldOpenNewDay ? 0 : 1)
    : (wouldOpenNewDay ? 1 : 0);

  return {
    enabled: true,
    progressionRank,
    remainingTargetDays,
  };
}

/**
 * Get occupied time slots for a teacher on a given day
 *
 * @param {string} teacherId
 * @param {string} day
 * @param {Array}  existingEntries
 * @returns {Array} - [{ start_time, end_time }]
 */
export function getTeacherOccupiedSlots(teacherId, day, existingEntries) {
  return existingEntries
    .filter((e) => e.teacher_id === teacherId && e.day === day)
    .map((e) => ({ start_time: e.start_time, end_time: e.end_time }));
}

// ============================================================
// TEACHER LOAD SNAPSHOT
// ============================================================

/**
 * Build a full load snapshot for a teacher
 * Used for ranking and selection
 *
 * @param {Object} teacher        - teacher record
 * @param {Array}  existingEntries
 * @returns {Object} - teacher load snapshot
 */
export function buildTeacherLoadSnapshot(teacher, existingEntries) {
  const scheduledUnits = getTeacherScheduledUnits(
    teacher.id,
    existingEntries
  );
  const scheduledHours = getTeacherScheduledHours(
    teacher.id,
    existingEntries
  );
  const scheduledDays  = getTeacherDayCount(teacher.id, existingEntries);
  const remainingUnits = teacher.max_load_units - scheduledUnits;
  const remainingDays  = teacher.max_teaching_days - scheduledDays;

  return {
    teacher_id       : teacher.id,
    name             : teacher.name,
    employment_type  : teacher.employment_type,
    max_load_units   : teacher.max_load_units,
    max_teaching_days: teacher.max_teaching_days,
    scheduled_units  : scheduledUnits,
    scheduled_hours  : scheduledHours,
    scheduled_days   : scheduledDays,
    remaining_units  : remainingUnits,
    remaining_days   : remainingDays,
    load_percentage  : (scheduledUnits / teacher.max_load_units) * 100,
  };
}

/**
 * Build load snapshots for all teachers
 *
 * @param {Array} teachers        - all teacher records
 * @param {Array} existingEntries
 * @returns {Array} - array of load snapshots
 */
export function buildAllTeacherSnapshots(teachers, existingEntries) {
  return teachers.map((teacher) =>
    buildTeacherLoadSnapshot(teacher, existingEntries)
  );
}

// ============================================================
// TEACHER RANKING
// ============================================================

/**
 * Rank teachers by load (lightest load first)
 * Secondary sort: fewer scheduled days first
 *
 * @param {Array} teachers        - teacher records
 * @param {Array} existingEntries
 * @returns {Array} - sorted teacher records (lightest first)
 */
export function rankTeachersByLoad(teachers, existingEntries) {
  return [...teachers].sort((a, b) => {
    const snapshotA = buildTeacherLoadSnapshot(a, existingEntries);
    const snapshotB = buildTeacherLoadSnapshot(b, existingEntries);

    // Primary: lightest load percentage first
    if (snapshotA.load_percentage !== snapshotB.load_percentage) {
      return snapshotA.load_percentage - snapshotB.load_percentage;
    }

    // Secondary: fewer scheduled days first
    return snapshotA.scheduled_days - snapshotB.scheduled_days;
  });
}

/**
 * Rank teachers by remaining units (most remaining first)
 *
 * @param {Array} teachers
 * @param {Array} existingEntries
 * @returns {Array} - sorted teacher records
 */
export function rankTeachersByRemainingUnits(teachers, existingEntries) {
  return [...teachers].sort((a, b) => {
    const snapshotA = buildTeacherLoadSnapshot(a, existingEntries);
    const snapshotB = buildTeacherLoadSnapshot(b, existingEntries);
    return snapshotB.remaining_units - snapshotA.remaining_units;
  });
}

// ============================================================
// TEACHER ELIGIBILITY CHECK
// ============================================================

/**
 * Check if a teacher is eligible for a specific assignment
 * Runs all load + availability + qualification checks
 *
 * @param {Object} teacher      - teacher record
 * @param {Object} subject      - subject record
 * @param {string} day          - proposed day
 * @param {string} startTime    - proposed start time
 * @param {string} endTime      - proposed end time
 * @param {string} termId       - current term id
 * @param {Array}  assignments  - teacher_subject_assignments
 * @param {Array}  availability - teacher_availability
 * @param {Array}  existingEntries
 * @returns {Object} - { eligible: boolean, reason: string }
 */
export function checkTeacherEligibility(
  teacher,
  subject,
  day,
  startTime,
  endTime,
  termId,
  assignments,
  availability,
  existingEntries,
  options = {}
) {
  const sectionId = options.sectionId || null;
  const rawUnitsToAdd = options.unitsToAddOverride ?? subject.credit_units;
  const normalizedUnitsToAdd = Number.isFinite(Number(rawUnitsToAdd))
    ? Number(rawUnitsToAdd)
    : 0;

  // Multi-session subjects should count load once per section-subject pair.
  const alreadyCountedInSection =
    sectionId
      ? existingEntries.some(
          (entry) =>
            entry.teacher_id === teacher.id &&
            entry.subject_id === subject.id &&
            entry.section_id === sectionId
        )
      : false;

  const effectiveUnitsToAdd = alreadyCountedInSection
    ? 0
    : Math.max(0, normalizedUnitsToAdd);

  // 1. Must be qualified for subject in this term
  if (
    !isTeacherQualifiedForSubject(
      teacher.id,
      subject.id,
      termId,
      assignments
    )
  ) {
    return {
      eligible: false,
      reason  : `Not assigned to teach ${subject.subject_code} this term.`,
    };
  }

  // 2. Must be available on the day
  if (!isTeacherAvailableOnDay(teacher.id, day, availability)) {
    return {
      eligible: false,
      reason  : `Not available on ${day}.`,
    };
  }

  // 3. Must be within availability window
  if (
    !isWithinTeacherAvailability(
      teacher.id,
      day,
      startTime,
      endTime,
      availability
    )
  ) {
    return {
      eligible: false,
      reason  : `Proposed time outside availability window on ${day}.`,
    };
  }

  // 4. Must not overlap with teacher's existing classes
  const occupiedSlots = getTeacherOccupiedSlots(
    teacher.id,
    day,
    existingEntries
  );
  const hasOverlap = occupiedSlots.some((slot) =>
    isTimeOverlap(startTime, endTime, slot.start_time, slot.end_time)
  );

  if (hasOverlap) {
    return {
      eligible: false,
      reason  : `Already scheduled on ${day} at overlapping time.`,
    };
  }

  // 5. Must not exceed max teaching days
  if (
    !isTeacherWithinMaxDays(
      teacher.id,
      teacher.max_teaching_days,
      existingEntries
    )
  ) {
    // Check if teacher is already scheduled on this day
    // If yes, it's OK (same day doesn't add to day count)
    const scheduledDays = getTeacherScheduledDaysList(
      teacher.id,
      existingEntries
    );
    const alreadyOnThisDay = scheduledDays.includes(day);

    if (!alreadyOnThisDay) {
      return {
        eligible: false,
        reason  : `Reached max teaching days (${teacher.max_teaching_days}).`,
      };
    }
  }

  // 6. Must not exceed max load units
  if (
    !isTeacherWithinMaxLoad(
      teacher.id,
      teacher.max_load_units,
      effectiveUnitsToAdd,
      existingEntries
    )
  ) {
    return {
      eligible: false,
      reason  : `Reached max load units (${teacher.max_load_units}).`,
    };
  }

  return { eligible: true, reason: null };
}

// ============================================================
// TEACHER SELECTION (MAIN)
// ============================================================

/**
 * Select the best available teacher for a subject
 * on a specific day and time slot
 *
 * Strategy:
 *   1. Get all qualified teachers for subject in term
 *   2. Filter by eligibility (availability, load, days)
 *   3. Rank by lightest load first
 *   4. Return the best candidate
 *
 * @param {Object} subject        - subject record
 * @param {string} day            - proposed day
 * @param {string} startTime      - proposed start time
 * @param {string} endTime        - proposed end time
 * @param {string} termId         - current term id
 * @param {Array}  teachers       - all teacher records
 * @param {Array}  assignments    - teacher_subject_assignments
 * @param {Array}  availability   - teacher_availability
 * @param {Array}  existingEntries
 * @returns {Object|null} - best teacher record or null
 */
export function selectBestTeacher(
  subject,
  day,
  startTime,
  endTime,
  termId,
  teachers,
  assignments,
  availability,
  existingEntries,
  eligibilityOptions = {}
) {
  // Step 1: Get qualified teacher ids
  const qualifiedIds = getQualifiedTeachers(
    subject.id,
    termId,
    assignments
  );

  if (qualifiedIds.length === 0) return null;

  // Step 2: Get qualified teacher records
  const qualifiedTeachers = teachers.filter((t) =>
    qualifiedIds.includes(t.id) && t.status === 'active'
  );

  if (qualifiedTeachers.length === 0) return null;

  // Step 3: Filter by eligibility
  const eligible = qualifiedTeachers.filter((teacher) => {
    const check = checkTeacherEligibility(
      teacher,
      subject,
      day,
      startTime,
      endTime,
      termId,
      assignments,
      availability,
      existingEntries,
      eligibilityOptions
    );
    return check.eligible;
  });

  if (eligible.length === 0) return null;

  // Step 4: Rank adaptively (single-day patterns prioritize part-time)
  const ranked = rankEligibleTeachersForSubject(
    eligible,
    subject,
    day,
    availability,
    existingEntries,
    eligibilityOptions
  );
  return ranked[0] || null;
}

function rankEligibleTeachersForSubject(
  eligibleTeachers,
  subject,
  day,
  availability,
  existingEntries,
  rankingOptions = {}
) {
  const prioritizePartTime = shouldPrioritizePartTime(subject);

  return [...eligibleTeachers].sort((a, b) => {
    if (prioritizePartTime) {
      const aPartTime = a.employment_type === 'part_time' ? 0 : 1;
      const bPartTime = b.employment_type === 'part_time' ? 0 : 1;

      if (aPartTime !== bPartTime) {
        return aPartTime - bPartTime;
      }
    }

    if (isExactTeacherDaysPolicyEnabled(rankingOptions)) {
      const aDayTarget = getTeacherDayTargetSnapshot(
        a,
        day,
        availability,
        existingEntries,
        rankingOptions
      );
      const bDayTarget = getTeacherDayTargetSnapshot(
        b,
        day,
        availability,
        existingEntries,
        rankingOptions
      );

      if (aDayTarget.progressionRank !== bDayTarget.progressionRank) {
        return aDayTarget.progressionRank - bDayTarget.progressionRank;
      }

      if (aDayTarget.remainingTargetDays !== bDayTarget.remainingTargetDays) {
        return bDayTarget.remainingTargetDays - aDayTarget.remainingTargetDays;
      }
    }

    // Teachers with fewer available days are harder to place,
    // so prioritize them earlier for constrained patterns.
    const aAvailableDays = getTeacherAvailableDays(a.id, availability).length;
    const bAvailableDays = getTeacherAvailableDays(b.id, availability).length;
    if (aAvailableDays !== bAvailableDays) {
      return aAvailableDays - bAvailableDays;
    }

    const snapshotA = buildTeacherLoadSnapshot(a, existingEntries);
    const snapshotB = buildTeacherLoadSnapshot(b, existingEntries);

    if (snapshotA.load_percentage !== snapshotB.load_percentage) {
      return snapshotA.load_percentage - snapshotB.load_percentage;
    }

    return snapshotA.scheduled_days - snapshotB.scheduled_days;
  });
}

function shouldPrioritizePartTime(subject) {
  // Single-day patterns are most affected by 1-day part-time limits.
  if (subject.delivery_pattern === 'single_day') return true;

  // Combined lec+lab is also a one-day placement.
  if (subject.delivery_pattern === 'combined_lec_lab') return true;

  return false;
}

/**
 * Select best teacher across multiple day options
 * Used when engine needs to find teacher + day together
 *
 * @param {Object} subject
 * @param {Array}  candidateDays  - days to try
 * @param {string} startTime
 * @param {string} endTime
 * @param {string} termId
 * @param {Array}  teachers
 * @param {Array}  assignments
 * @param {Array}  availability
 * @param {Array}  existingEntries
 * @returns {Object|null} - { teacher, day } or null
 */
export function selectBestTeacherAndDay(
  subject,
  candidateDays,
  startTime,
  endTime,
  termId,
  teachers,
  assignments,
  availability,
  existingEntries,
  eligibilityOptions = {}
) {
  for (const day of candidateDays) {
    const teacher = selectBestTeacher(
      subject,
      day,
      startTime,
      endTime,
      termId,
      teachers,
      assignments,
      availability,
      existingEntries,
      eligibilityOptions
    );

    if (teacher) {
      return { teacher, day };
    }
  }

  return null;
}

// ============================================================
// LOAD DISTRIBUTION HELPERS
// ============================================================

/**
 * Check if load is balanced across teachers
 * Returns true if max load difference is within threshold
 *
 * @param {Array}  teachers
 * @param {Array}  existingEntries
 * @param {number} threshold - max allowed load % difference (default 20%)
 * @returns {boolean}
 */
export function isLoadBalanced(teachers, existingEntries, threshold = 20) {
  if (teachers.length <= 1) return true;

  const snapshots    = buildAllTeacherSnapshots(teachers, existingEntries);
  const percentages  = snapshots.map((s) => s.load_percentage);
  const maxLoad      = Math.max(...percentages);
  const minLoad      = Math.min(...percentages);

  return maxLoad - minLoad <= threshold;
}

/**
 * Get teachers that are overloaded
 * (scheduled units > max_load_units)
 *
 * @param {Array} teachers
 * @param {Array} existingEntries
 * @returns {Array} - overloaded teacher snapshots
 */
export function getOverloadedTeachers(teachers, existingEntries) {
  return buildAllTeacherSnapshots(teachers, existingEntries).filter(
    (s) => s.scheduled_units > s.max_load_units
  );
}

/**
 * Get teachers with no assignments yet
 *
 * @param {Array} teachers
 * @param {Array} existingEntries
 * @returns {Array} - teacher records with 0 scheduled units
 */
export function getUnassignedTeachers(teachers, existingEntries) {
  return teachers.filter((t) => {
    const units = getTeacherScheduledUnits(t.id, existingEntries);
    return units === 0;
  });
}

/**
 * Get load summary for all teachers
 * Used for generation summary and reports
 *
 * @param {Array} teachers
 * @param {Array} existingEntries
 * @returns {Array} - sorted by load percentage descending
 */
export function getLoadSummary(teachers, existingEntries) {
  return buildAllTeacherSnapshots(teachers, existingEntries)
    .sort((a, b) => b.load_percentage - a.load_percentage)
    .map((s) => ({
      name            : s.name,
      employment_type : s.employment_type,
      scheduled_units : s.scheduled_units,
      max_load_units  : s.max_load_units,
      scheduled_days  : s.scheduled_days,
      max_teaching_days: s.max_teaching_days,
      load_percentage : Math.round(s.load_percentage),
      remaining_units : s.remaining_units,
    }));
}