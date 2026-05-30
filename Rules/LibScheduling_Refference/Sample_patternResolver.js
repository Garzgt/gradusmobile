// lib/scheduling/patternResolver.js
// ============================================================
// PATTERN RESOLVER
// PSU Sto. Tomas Campus
// Handles: resolving delivery patterns into schedulable sessions
// Patterns:
//   - flexible         (lecture_only: 3h single OR 1.5h x2)
//   - split_lecture_only (lecture_only: 1.5h x2, same teacher)
//   - single_day       (PE: 2h once, NSTP: skip)
//   - split_lec_lab    (BSIT: 2h lec + 3h lab, different days)
//   - combined_lec_lab (BSHM: 5h block, single day)
//   - ojt/practicum    (3h x 2 or 3 days)
// ============================================================

import {
  findFreeSlots,
  findFirstFreeSlot,
  findMultiDaySlots,
  findFlexibleSlots,
  getEndTime,
  getAllowedDays,
  timeToMinutes,
  DAYS_OF_WEEK,
  DAYS_MON_FRI,
} from './timeSlotUtils.js';

import {
  shouldSkipSubject,
  isSaturdayAllowedForSection,
  getAllowedDaysForSection,
  getValidDaysForAssignment,
} from './restrictions.js';

import {
  findAvailableVenue,
  isVenueFree,
} from './venueMapper.js';

import {
  getTeacherOccupiedSlots,
  selectBestTeacher,
  checkTeacherEligibility,
  rankTeachersByLoad,
  getTeacherDayTargetSnapshot,
} from './loadBalancer.js';

const DEFAULT_MAX_SUBJECTS_PER_DAY = 5;

// ============================================================
// SESSION BLUEPRINT
// ============================================================

/**
 * A session blueprint is what the engine uses to create
 * a schedule_entry record
 *
 * Shape:
 * {
 *   subject_id   : string,
 *   section_id   : string,
 *   teacher_id   : string,
 *   venue_id     : string,
 *   day          : string,
 *   start_time   : string,
 *   end_time     : string,
 *   session_part : string, (lecture|lab|combined|ojt|practicum|etc.)
 *   status       : 'generated'
 * }
 */

// ============================================================
// MAIN PATTERN RESOLVER
// ============================================================

/**
 * Resolve a subject into one or more session blueprints
 * based on its delivery pattern
 *
 * @param {Object} subject        - subject record
 * @param {Object} section        - section record
 * @param {string} termId         - current term id
 * @param {string} programCode    - e.g. 'BSIT'
 * @param {Array}  teachers       - all teacher records
 * @param {Array}  assignments    - teacher_subject_assignments
 * @param {Array}  availability   - teacher_availability
 * @param {Array}  venues         - all venue records
 * @param {Array}  existingEntries- current schedule entries
 * @param {Object} options        - resolver constraints/options
 * @returns {Object} - {
 *     blueprints : [...session blueprints],
 *     unassigned : boolean,
 *     reason     : string | null
 *   }
 */
export function resolvePattern(
  subject,
  section,
  termId,
  programCode,
  teachers,
  assignments,
  availability,
  venues,
  existingEntries,
  options = {}
) {
  // Skip NSTP entirely
  if (shouldSkipSubject(subject)) {
    return {
      blueprints : [],
      unassigned : false,
      reason     : 'NSTP subject skipped (not scheduled).',
    };
  }

  const { delivery_pattern, subject_type } = subject;
  const normalizedPattern = normalizeDeliveryPattern(subject_type, delivery_pattern);

  // Route to correct resolver based on pattern
  switch (normalizedPattern) {

    case 'flexible':
      return resolveFlexible(
        subject, section, termId, programCode,
        teachers, assignments, availability,
        venues, existingEntries, options
      );

    case 'split_lecture_only':
      return resolveSplitLectureOnly(
        subject, section, termId, programCode,
        teachers, assignments, availability,
        venues, existingEntries, options
      );

    case 'single_day':
      return resolveSingleDay(
        subject, section, termId, programCode,
        teachers, assignments, availability,
        venues, existingEntries, options
      );

    case 'split_lec_lab':
      return resolveSplitLecLab(
        subject, section, termId, programCode,
        teachers, assignments, availability,
        venues, existingEntries, options
      );

    case 'combined_lec_lab':
      return resolveCombinedLecLab(
        subject, section, termId, programCode,
        teachers, assignments, availability,
        venues, existingEntries, options
      );

    default:
      return resolveFlexible(
        subject, section, termId, programCode,
        teachers, assignments, availability,
        venues, existingEntries, options
      );
  }
}

function normalizeDeliveryPattern(subjectType, deliveryPattern) {
  if (subjectType === 'lecture_only') {
    if (deliveryPattern === 'single_day') return 'single_day';
    if (deliveryPattern === 'split_lecture_only') return 'split_lecture_only';
    return 'flexible';
  }

  if (subjectType === 'lecture_lab') {
    if (deliveryPattern === 'combined_lec_lab') return 'combined_lec_lab';
    return 'split_lec_lab';
  }

  return 'single_day';
}

// ============================================================
// FLEXIBLE RESOLVER (lecture_only 3 units)
// ============================================================

/**
 * Resolve flexible pattern
 * Option A: 3 hours in 1 day
 * Option B: 1.5 hours x 2 different days (fallback)
 *
 * @returns {Object} - { blueprints, unassigned, reason }
 */
export function resolveFlexible(
  subject,
  section,
  termId,
  programCode,
  teachers,
  assignments,
  availability,
  venues,
  existingEntries,
  options = {}
) {
  const maxClassDaysPerWeek = getMaxClassDaysPerWeek(options);
  const maxSubjectsPerDay = getMaxSubjectsPerDay(options);
  const allowedDays = filterDaysBySectionDayCap(
    section.id,
    prioritizeDaysByLoad(
      getAllowedDaysForSection(section),
      existingEntries
    ),
    existingEntries,
    maxClassDaysPerWeek,
    maxSubjectsPerDay,
    subject.id
  );
  const targetedAllowedDays = prioritizeDaysBySectionDayTarget(
    section.id,
    allowedDays,
    existingEntries,
    maxClassDaysPerWeek,
    options
  );
  const spacingPreferredDays = prioritizeDaysBySubjectSpacing(
    section.id,
    subject.id,
    targetedAllowedDays,
    existingEntries,
    options
  );

  if (targetedAllowedDays.length === 0) {
    return {
      blueprints: [],
      unassigned: true,
      reason: appendSectionDayPolicyHints(
        `No eligible class day available for ${subject.subject_code}.`,
        maxClassDaysPerWeek,
        maxSubjectsPerDay
      ),
    };
  }

  // ── Option A: Try 3-hour single block ──────────────────────
  for (const day of spacingPreferredDays) {
    const freeSlots = findFreeSlots(3, getSectionOccupied(section.id, day, existingEntries));
    const candidateSlots = prioritizeSlotsBySectionGap(
      section.id,
      day,
      freeSlots,
      existingEntries,
      options
    );

    for (const slot of candidateSlots) {
      const teacher = selectBestTeacher(
        subject, day, slot.start, slot.end,
        termId, teachers, assignments,
        availability, existingEntries,
        buildTeacherSelectionOptions(section.id, options)
      );

      if (!teacher) continue;

      const venue = findAvailableVenue(
        subject, 'lecture', programCode,
        day, slot.start, slot.end,
        venues, existingEntries
      );

      if (!venue) continue;

      return {
        blueprints: [
          makeBlueprint(
            subject, section, teacher, venue,
            day, slot.start, slot.end, 'lecture'
          ),
        ],
        unassigned: false,
        reason    : null,
      };
    }
  }

  // ── Option B: Try 1.5 hours x 2 days ──────────────────────
  const halfDayResults = resolveFlexibleSplit(
    subject, section, termId, programCode,
    teachers, assignments, availability,
    venues, existingEntries, targetedAllowedDays,
    { ...options, maxClassDaysPerWeek, maxSubjectsPerDay }
  );

  if (halfDayResults) return halfDayResults;

  // ── Failed ────────────────────────────────────────────────
  return {
    blueprints: [],
    unassigned: true,
    reason    : appendShortSessionPackingHint(
      appendSectionDayPolicyHints(
        `No available slot found for ${subject.subject_code} ` +
        `(flexible 3-unit). No 3h block or 1.5h x2 available.`,
        maxClassDaysPerWeek,
        maxSubjectsPerDay
      ),
      options
    ),
  };
}

/**
 * Try to resolve flexible as 1.5h x 2 different days
 */
function resolveFlexibleSplit(
  subject, section, termId, programCode,
  teachers, assignments, availability,
  venues, existingEntries, allowedDays,
  options = {}
) {
  const maxClassDaysPerWeek = getMaxClassDaysPerWeek(options);
  const maxSubjectsPerDay = getMaxSubjectsPerDay(options);
  const found = [];
  const workingEntries = [...existingEntries];
  const attemptedDays = new Set();

  const tryPlaceOnDay = (day) => {
    if (
      !isDayAllowedBySectionDayCap(
        section.id,
        day,
        workingEntries,
        maxClassDaysPerWeek,
        maxSubjectsPerDay,
        subject.id
      )
    ) {
      return false;
    }

    const occupied = getSectionOccupied(section.id, day, workingEntries);
    const slots    = findFreeSlots(1.5, occupied);
    const candidateSlots = prioritizeSlotsBySectionGap(
      section.id,
      day,
      slots,
      workingEntries,
      options
    );

    for (const slot of candidateSlots) {
      const teacher = selectBestTeacher(
        subject, day, slot.start, slot.end,
        termId, teachers, assignments,
        availability, workingEntries,
        buildTeacherSelectionOptions(section.id, options)
      );

      if (!teacher) continue;

      const venue = findAvailableVenue(
        subject, 'lecture', programCode,
        day, slot.start, slot.end,
        venues, workingEntries
      );

      if (!venue) continue;

      const blueprint = makeBlueprint(
        subject, section, teacher, venue,
        day, slot.start, slot.end, 'lecture'
      );

      found.push(blueprint);
      workingEntries.push(toProjectedEntry(blueprint));
      return true;
    }

    return false;
  };

  while (found.length < 2) {
    const remainingDays = allowedDays.filter((day) => !attemptedDays.has(day));
    if (remainingDays.length === 0) break;

    const targetedAllowedDays = prioritizeDaysBySectionDayTarget(
      section.id,
      remainingDays,
      workingEntries,
      maxClassDaysPerWeek,
      options
    );
    const spacingPreferredDays = prioritizeDaysBySubjectSpacing(
      section.id,
      subject.id,
      targetedAllowedDays,
      workingEntries,
      options
    );
    const candidateDays = prioritizeDaysForSessionDuration(
      section.id,
      spacingPreferredDays,
      workingEntries,
      1.5,
      options
    );

    let placedInPass = false;

    for (const day of candidateDays) {
      attemptedDays.add(day);

      if (tryPlaceOnDay(day)) {
        placedInPass = true;
        break;
      }
    }

    if (!placedInPass) {
      break;
    }
  }

  if (found.length === 2) {
    return { blueprints: found, unassigned: false, reason: null };
  }

  return null;
}

// ============================================================
// SINGLE DAY RESOLVER (PE, OJT, Practicum, Field Study)
// ============================================================

/**
 * Resolve single_day pattern
 * Handles: PE (2h x1), OJT (3h x2), Practicum (3h x3),
 *          Internship (3h x2), Field Study (3h x2)
 *
 * @returns {Object} - { blueprints, unassigned, reason }
 */
export function resolveSingleDay(
  subject,
  section,
  termId,
  programCode,
  teachers,
  assignments,
  availability,
  venues,
  existingEntries,
  options = {}
) {
  const { subject_type, credit_units } = subject;
  const maxClassDaysPerWeek = getMaxClassDaysPerWeek(options);
  const maxSubjectsPerDay = getMaxSubjectsPerDay(options);

  if (subject_type === 'ojt') {
    return resolveOjtSingleDay(
      subject,
      section,
      termId,
      programCode,
      teachers,
      assignments,
      availability,
      venues,
      existingEntries,
      { ...options, maxClassDaysPerWeek, maxSubjectsPerDay }
    );
  }

  // Determine sessions needed and hours per session
  const { sessionsNeeded, hoursPerSession, sessionPart } =
    getSessionConfig(subject_type, credit_units);

  const allowedDays = filterDaysBySectionDayCap(
    section.id,
    prioritizeDaysByLoad(
      getAllowedDaysForSection(section),
      existingEntries
    ),
    existingEntries,
    maxClassDaysPerWeek,
    maxSubjectsPerDay,
    subject.id
  );
  const targetedAllowedDays = prioritizeDaysBySectionDayTarget(
    section.id,
    allowedDays,
    existingEntries,
    maxClassDaysPerWeek,
    options
  );
  const blueprints  = [];
  const workingEntries = [...existingEntries];
  const attemptedDays = new Set();

  const tryPlaceOnDay = (day) => {
    if (
      !isDayAllowedBySectionDayCap(
        section.id,
        day,
        workingEntries,
        maxClassDaysPerWeek,
        maxSubjectsPerDay,
        subject.id
      )
    ) {
      return false;
    }

    const occupied = getSectionOccupied(section.id, day, workingEntries);
    const slots    = findFreeSlots(hoursPerSession, occupied);
    const candidateSlots = prioritizeSlotsBySectionGap(
      section.id,
      day,
      slots,
      workingEntries,
      options
    );

    for (const slot of candidateSlots) {
      const teacher = selectBestTeacher(
        subject, day, slot.start, slot.end,
        termId, teachers, assignments,
        availability, workingEntries,
        buildTeacherSelectionOptions(section.id, options)
      );

      if (!teacher) continue;

      const venue = findAvailableVenue(
        subject, sessionPart, programCode,
        day, slot.start, slot.end,
        venues, workingEntries
      );

      if (!venue) continue;

      const blueprint = makeBlueprint(
        subject, section, teacher, venue,
        day, slot.start, slot.end, sessionPart
      );

      blueprints.push(blueprint);
      workingEntries.push(toProjectedEntry(blueprint));
      return true;
    }

    return false;
  };

  while (blueprints.length < sessionsNeeded) {
    const remainingDays = targetedAllowedDays.filter(
      (day) => !attemptedDays.has(day)
    );

    if (remainingDays.length === 0) break;

    const dayTargetOrderedDays = prioritizeDaysBySectionDayTarget(
      section.id,
      remainingDays,
      workingEntries,
      maxClassDaysPerWeek,
      options
    );
    const spacingPreferredDays = prioritizeDaysBySubjectSpacing(
      section.id,
      subject.id,
      dayTargetOrderedDays,
      workingEntries,
      options
    );
    const candidateDays = prioritizeDaysForSessionDuration(
      section.id,
      spacingPreferredDays,
      workingEntries,
      hoursPerSession,
      options
    );

    let placedInPass = false;

    for (const day of candidateDays) {
      attemptedDays.add(day);

      if (tryPlaceOnDay(day)) {
        placedInPass = true;
        break;
      }
    }

    if (!placedInPass) {
      break;
    }
  }

  if (blueprints.length === sessionsNeeded) {
    return { blueprints, unassigned: false, reason: null };
  }

  return {
    blueprints: blueprints.length > 0 ? blueprints : [],
    unassigned: true,
    reason    : appendSectionDayPolicyHints(
      `Could only schedule ${blueprints.length} of ` +
                `${sessionsNeeded} sessions for ${subject.subject_code}.`,
      maxClassDaysPerWeek,
      maxSubjectsPerDay
    ),
  };
}

/**
 * Resolve OJT in single_day mode.
 *
 * Requires one continuous 6-hour block in a single day.
 */
function resolveOjtSingleDay(
  subject,
  section,
  termId,
  programCode,
  teachers,
  assignments,
  availability,
  venues,
  existingEntries,
  options = {}
) {
  const maxClassDaysPerWeek = getMaxClassDaysPerWeek(options);
  const maxSubjectsPerDay = getMaxSubjectsPerDay(options);
  const allowedDays = filterDaysBySectionDayCap(
    section.id,
    prioritizeDaysByLoad(
      getAllowedDaysForSection(section),
      existingEntries
    ),
    existingEntries,
    maxClassDaysPerWeek,
    maxSubjectsPerDay,
    subject.id
  );
  const targetedAllowedDays = prioritizeDaysBySectionDayTarget(
    section.id,
    allowedDays,
    existingEntries,
    maxClassDaysPerWeek,
    options
  );
  const spacingPreferredDays = prioritizeDaysBySubjectSpacing(
    section.id,
    subject.id,
    targetedAllowedDays,
    existingEntries,
    options
  );

  for (const day of spacingPreferredDays) {
    if (
      !isDayAllowedBySectionDayCap(
        section.id,
        day,
        existingEntries,
        maxClassDaysPerWeek,
        maxSubjectsPerDay,
        subject.id
      )
    ) {
      continue;
    }

    const occupied = getSectionOccupied(section.id, day, existingEntries);

    // One continuous 6-hour block.
    const sixHourSlots = findFreeSlots(6, occupied);
    const candidateSlots = prioritizeSlotsBySectionGap(
      section.id,
      day,
      sixHourSlots,
      existingEntries,
      options
    );

    for (const slot of candidateSlots) {
      const teacher = selectBestTeacher(
        subject,
        day,
        slot.start,
        slot.end,
        termId,
        teachers,
        assignments,
        availability,
        existingEntries,
        buildTeacherSelectionOptions(section.id, options)
      );

      if (!teacher) continue;

      const venue = findAvailableVenue(
        subject,
        'ojt',
        programCode,
        day,
        slot.start,
        slot.end,
        venues,
        existingEntries
      );

      if (!venue) continue;

      return {
        blueprints: [
          makeBlueprint(
            subject,
            section,
            teacher,
            venue,
            day,
            slot.start,
            slot.end,
            'ojt'
          ),
        ],
        unassigned: false,
        reason: null,
      };
    }
  }

  return {
    blueprints: [],
    unassigned: true,
    reason: appendSectionDayPolicyHints(
      `No valid single-day OJT placement found for ${subject.subject_code}.`,
      maxClassDaysPerWeek,
      maxSubjectsPerDay
    ),
  };
}

// ============================================================
// SPLIT LEC LAB RESOLVER (BSIT + BSHM HPRESEARCH)
// ============================================================

/**
 * Resolve split_lec_lab pattern
 * Lecture: 2 hours on one day (Lecture/General room)
 * Lab:     3 hours on a different day (Lab room)
 * Same teacher for both
 *
 * @returns {Object} - { blueprints, unassigned, reason }
 */
export function resolveSplitLecLab(
  subject,
  section,
  termId,
  programCode,
  teachers,
  assignments,
  availability,
  venues,
  existingEntries,
  options = {}
) {
  const maxClassDaysPerWeek = getMaxClassDaysPerWeek(options);
  const maxSubjectsPerDay = getMaxSubjectsPerDay(options);
  const baseDays = filterDaysBySectionDayCap(
    section.id,
    prioritizeDaysByLoad(
      getAllowedDaysForSection(section),
      existingEntries
    ),
    existingEntries,
    maxClassDaysPerWeek,
    maxSubjectsPerDay,
    subject.id
  );
  const targetedBaseDays = prioritizeDaysBySectionDayTarget(
    section.id,
    baseDays,
    existingEntries,
    maxClassDaysPerWeek,
    options
  );
  const spacedBaseDays = prioritizeDaysBySubjectSpacing(
    section.id,
    subject.id,
    targetedBaseDays,
    existingEntries,
    options
  );

  if (spacedBaseDays.length === 0) {
    return {
      blueprints: [],
      unassigned: true,
      reason: appendSectionDayPolicyHints(
        `No eligible class day available for ${subject.subject_code} (split_lec_lab).`,
        maxClassDaysPerWeek,
        maxSubjectsPerDay
      ),
    };
  }

  const diagnostics = {
    noPrimarySlots: 0,
    noEligibleTeachers: 0,
    noPrimaryVenue: 0,
    noValidSecondaryDays: 0,
    noSecondarySlots: 0,
    noSecondaryEligibility: 0,
    secondaryEligibilityReasons: {},
    noSecondaryVenue: 0,
  };

  const dayOrders = [spacedBaseDays];
  const reversedDays = [...spacedBaseDays].reverse();
  if (reversedDays.join('|') !== spacedBaseDays.join('|')) {
    dayOrders.push(reversedDays);
  }

  for (const allowedDays of dayOrders) {
    const lectureFirst = trySplitLecLabOrder(
      'lecture_first',
      subject,
      section,
      termId,
      programCode,
      teachers,
      assignments,
      availability,
      venues,
      existingEntries,
      allowedDays,
      diagnostics,
      { ...options, maxClassDaysPerWeek }
    );

    if (lectureFirst) return lectureFirst;

    const labFirst = trySplitLecLabOrder(
      'lab_first',
      subject,
      section,
      termId,
      programCode,
      teachers,
      assignments,
      availability,
      venues,
      existingEntries,
      allowedDays,
      diagnostics,
      { ...options, maxClassDaysPerWeek }
    );

    if (labFirst) return labFirst;

    const coTeachFallback = trySplitLecLabCoTeach(
      subject,
      section,
      termId,
      programCode,
      teachers,
      assignments,
      availability,
      venues,
      existingEntries,
      allowedDays,
      diagnostics,
      { ...options, maxClassDaysPerWeek }
    );

    if (coTeachFallback) return coTeachFallback;
  }

  return {
    blueprints: [],
    unassigned: true,
    reason    : appendSectionDayPolicyHints(
      buildSplitFailureReason(subject.subject_code, diagnostics),
      maxClassDaysPerWeek,
      maxSubjectsPerDay
    ),
  };
}

function trySplitLecLabOrder(
  mode,
  subject,
  section,
  termId,
  programCode,
  teachers,
  assignments,
  availability,
  venues,
  existingEntries,
  allowedDays,
  diagnostics,
  options = {}
) {
  const maxClassDaysPerWeek = getMaxClassDaysPerWeek(options);
  const maxSubjectsPerDay = getMaxSubjectsPerDay(options);

  for (const primaryDay of allowedDays) {
    if (
      !isDayAllowedBySectionDayCap(
        section.id,
        primaryDay,
        existingEntries,
        maxClassDaysPerWeek,
        maxSubjectsPerDay,
        subject.id
      )
    ) {
      continue;
    }

    const primaryHours = mode === 'lecture_first' ? 2 : 3;
    const primaryPart = mode === 'lecture_first' ? 'lecture' : 'lab';
    const secondaryHours = mode === 'lecture_first' ? 3 : 2;
    const secondaryPart = mode === 'lecture_first' ? 'lab' : 'lecture';

    const primaryOccupied = getSectionOccupied(section.id, primaryDay, existingEntries);
    const primarySlots = findFreeSlots(primaryHours, primaryOccupied);
    const primaryCandidateSlots = prioritizeSlotsBySectionGap(
      section.id,
      primaryDay,
      primarySlots,
      existingEntries,
      options
    );

    if (primaryCandidateSlots.length === 0) {
      diagnostics.noPrimarySlots += 1;
      continue;
    }

    for (const primarySlot of primaryCandidateSlots) {
      const eligibleTeachers = getEligibleTeachersForSlot(
        subject,
        primaryDay,
        primarySlot.start,
        primarySlot.end,
        termId,
        teachers,
        assignments,
        availability,
        existingEntries,
        section.id,
        options
      );

      if (eligibleTeachers.length === 0) {
        diagnostics.noEligibleTeachers += 1;
        continue;
      }

      for (const teacher of eligibleTeachers) {
        const primaryVenue = findAvailableVenue(
          subject,
          primaryPart,
          programCode,
          primaryDay,
          primarySlot.start,
          primarySlot.end,
          venues,
          existingEntries
        );

        if (!primaryVenue) {
          diagnostics.noPrimaryVenue += 1;
          continue;
        }

        const primaryBlueprint = makeBlueprint(
          subject,
          section,
          teacher,
          primaryVenue,
          primaryDay,
          primarySlot.start,
          primarySlot.end,
          primaryPart
        );
        const projectedEntries = extendEntriesWithBlueprints(
          existingEntries,
          [primaryBlueprint]
        );

        const secondaryDays = prioritizeDaysByLoad(
          allowedDays.filter((d) => d !== primaryDay),
          projectedEntries
        );
        const secondaryDaysWithinCap = filterDaysBySectionDayCap(
          section.id,
          secondaryDays,
          projectedEntries,
          maxClassDaysPerWeek,
          maxSubjectsPerDay,
          subject.id
        );
        const targetedSecondaryDays = prioritizeDaysBySectionDayTarget(
          section.id,
          secondaryDaysWithinCap,
          projectedEntries,
          maxClassDaysPerWeek,
          options
        );
        const spacedSecondaryDays = prioritizeDaysBySubjectSpacing(
          section.id,
          subject.id,
          targetedSecondaryDays,
          projectedEntries,
          options
        );
        const validTeacherDays = new Set(
          getTeacherValidDaysForSection(teacher, section, availability)
        );
        let hasAnyValidSecondaryDay = false;

        for (const secondaryDay of spacedSecondaryDays) {
          if (!validTeacherDays.has(secondaryDay)) continue;
          hasAnyValidSecondaryDay = true;

          const secondaryOccupied = getSectionOccupied(section.id, secondaryDay, projectedEntries);
          const secondarySlots = findFreeSlots(secondaryHours, secondaryOccupied);
          const secondaryCandidateSlots = prioritizeSlotsBySectionGap(
            section.id,
            secondaryDay,
            secondarySlots,
            projectedEntries,
            options
          );

          if (secondaryCandidateSlots.length === 0) {
            diagnostics.noSecondarySlots += 1;
            continue;
          }

          for (const secondarySlot of secondaryCandidateSlots) {
            const secondaryEligibility = checkTeacherEligibility(
              teacher,
              subject,
              secondaryDay,
              secondarySlot.start,
              secondarySlot.end,
              termId,
              assignments,
              availability,
              projectedEntries,
              buildTeacherSelectionOptions(section.id, options)
            );

            if (!secondaryEligibility.eligible) {
              diagnostics.noSecondaryEligibility += 1;
              trackSecondaryEligibilityReason(
                diagnostics,
                secondaryEligibility.reason
              );
              continue;
            }

            const secondaryVenue = findAvailableVenue(
              subject,
              secondaryPart,
              programCode,
              secondaryDay,
              secondarySlot.start,
              secondarySlot.end,
              venues,
              projectedEntries
            );

            if (!secondaryVenue) {
              diagnostics.noSecondaryVenue += 1;
              continue;
            }

            if (mode === 'lecture_first') {
              const secondaryBlueprint = makeBlueprint(
                subject,
                section,
                teacher,
                secondaryVenue,
                secondaryDay,
                secondarySlot.start,
                secondarySlot.end,
                'lab'
              );

              return {
                blueprints: [
                  primaryBlueprint,
                  secondaryBlueprint,
                ],
                unassigned: false,
                reason: null,
              };
            }

            const secondaryBlueprint = makeBlueprint(
              subject,
              section,
              teacher,
              secondaryVenue,
              secondaryDay,
              secondarySlot.start,
              secondarySlot.end,
              'lecture'
            );

            return {
              blueprints: [
                secondaryBlueprint,
                primaryBlueprint,
              ],
              unassigned: false,
              reason: null,
            };
          }
        }

        if (!hasAnyValidSecondaryDay) {
          diagnostics.noValidSecondaryDays += 1;
        }
      }
    }
  }

  return null;
}

// ============================================================
// COMBINED LEC LAB RESOLVER (BSHM 5-hour block)
// ============================================================

/**
 * Resolve combined_lec_lab pattern
 * 5-hour continuous block on a single day
 * BSHM subjects: KITCHEN or FUNCTION HALL
 *
 * @returns {Object} - { blueprints, unassigned, reason }
 */
export function resolveCombinedLecLab(
  subject,
  section,
  termId,
  programCode,
  teachers,
  assignments,
  availability,
  venues,
  existingEntries,
  options = {}
) {
  const maxClassDaysPerWeek = getMaxClassDaysPerWeek(options);
  const maxSubjectsPerDay = getMaxSubjectsPerDay(options);
  const allowedDays = filterDaysBySectionDayCap(
    section.id,
    prioritizeDaysByLoad(
      getAllowedDaysForSection(section),
      existingEntries
    ),
    existingEntries,
    maxClassDaysPerWeek,
    maxSubjectsPerDay,
    subject.id
  );
  const targetedAllowedDays = prioritizeDaysBySectionDayTarget(
    section.id,
    allowedDays,
    existingEntries,
    maxClassDaysPerWeek,
    options
  );
  const spacingPreferredDays = prioritizeDaysBySubjectSpacing(
    section.id,
    subject.id,
    targetedAllowedDays,
    existingEntries,
    options
  );

  for (const day of spacingPreferredDays) {
    if (
      !isDayAllowedBySectionDayCap(
        section.id,
        day,
        existingEntries,
        maxClassDaysPerWeek,
        maxSubjectsPerDay,
        subject.id
      )
    ) {
      continue;
    }

    const occupied = getSectionOccupied(section.id, day, existingEntries);
    const slots    = findFreeSlots(5, occupied);
    const candidateSlots = prioritizeSlotsBySectionGap(
      section.id,
      day,
      slots,
      existingEntries,
      options
    );

    for (const slot of candidateSlots) {
      const teacher = selectBestTeacher(
        subject, day, slot.start, slot.end,
        termId, teachers, assignments,
        availability, existingEntries,
        buildTeacherSelectionOptions(section.id, options)
      );

      if (!teacher) continue;

      const venue = findAvailableVenue(
        subject, 'combined', programCode,
        day, slot.start, slot.end,
        venues, existingEntries
      );

      if (!venue) continue;

      return {
        blueprints: [
          makeBlueprint(
            subject, section, teacher, venue,
            day, slot.start, slot.end, 'combined'
          ),
        ],
        unassigned: false,
        reason    : null,
      };
    }
  }

  return {
    blueprints: [],
    unassigned: true,
    reason    : appendSectionDayPolicyHints(
      `No 5-hour block available for ${subject.subject_code} ` +
      `(combined_lec_lab).`,
      maxClassDaysPerWeek,
      maxSubjectsPerDay
    ),
  };
}

// ============================================================
// SESSION CONFIG HELPER
// ============================================================

/**
 * Get session configuration based on subject type and units
 *
 * @param {string} subjectType
 * @param {number} creditUnits
 * @returns {Object} - { sessionsNeeded, hoursPerSession, sessionPart }
 */
export function getSessionConfig(subjectType, creditUnits) {
  switch (subjectType) {
    case 'pe':
      return {
        sessionsNeeded : 1,
        hoursPerSession: 2,
        sessionPart    : 'lecture',
      };

    case 'ojt':
      return {
        sessionsNeeded : 2,  // 6 units → 2 sessions
        hoursPerSession: 3,
        sessionPart    : 'ojt',
      };

    case 'practicum':
      if (Number(creditUnits) === 6) {
        return {
          sessionsNeeded : 1,
          hoursPerSession: 6,
          sessionPart    : 'practicum',
        };
      }
      return {
        // HPRAC = 9 units → 3 sessions
        // Other practicum defaults to 2 sessions
        sessionsNeeded : Number(creditUnits) >= 9 ? 3 : 2,
        hoursPerSession: 3,
        sessionPart    : 'practicum',
      };

    case 'internship':
      return {
        sessionsNeeded : 2,  // 6 units → 2 sessions
        hoursPerSession: 3,
        sessionPart    : 'internship',
      };

    case 'field_study':
      return {
        sessionsNeeded : 2,  // 6 units → 2 sessions
        hoursPerSession: 3,
        sessionPart    : 'field_study',
      };

    default:
      return {
        sessionsNeeded : 1,
        hoursPerSession: 3,
        sessionPart    : 'lecture',
      };
  }
}

// ============================================================
// BLUEPRINT FACTORY
// ============================================================

/**
 * Create a session blueprint object
 * Ready to be inserted into schedule_entries
 *
 * @param {Object} subject
 * @param {Object} section
 * @param {Object} teacher
 * @param {Object} venue
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {string} sessionPart
 * @returns {Object} - session blueprint
 */
export function makeBlueprint(
  subject,
  section,
  teacher,
  venue,
  day,
  startTime,
  endTime,
  sessionPart
) {
  return {
    subject_id   : subject.id,
    section_id   : section.id,
    teacher_id   : teacher.id,
    venue_id     : venue.id,
    day,
    start_time   : startTime,
    end_time     : endTime,
    session_part : sessionPart,
    status       : 'generated',
    // enriched data for conflict checking (not saved to DB)
    _subject     : subject,
    _section     : section,
    _teacher     : teacher,
    _venue       : venue,
  };
}

function toProjectedEntry(blueprint) {
  return {
    ...blueprint,
    subject     : blueprint._subject || null,
    section     : blueprint._section || null,
    teacher     : blueprint._teacher || null,
    venue       : blueprint._venue || null,
    year_level  : blueprint._section?.year_level || null,
    program_code: blueprint._section?.programs?.code || null,
  };
}

function extendEntriesWithBlueprints(existingEntries, blueprints = []) {
  if (!blueprints || blueprints.length === 0) {
    return existingEntries;
  }

  return [
    ...existingEntries,
    ...blueprints.map((blueprint) => toProjectedEntry(blueprint)),
  ];
}

// ============================================================
// HELPERS
// ============================================================

function getMaxClassDaysPerWeek(optionsOrValue = null) {
  const rawValue =
    optionsOrValue && typeof optionsOrValue === 'object'
      ? optionsOrValue.maxClassDaysPerWeek
      : optionsOrValue;

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.floor(parsed);
}

function getMaxSubjectsPerDay(optionsOrValue = null) {
  const rawValue =
    optionsOrValue && typeof optionsOrValue === 'object'
      ? optionsOrValue.maxSubjectsPerDay
      : optionsOrValue;

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return DEFAULT_MAX_SUBJECTS_PER_DAY;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_SUBJECTS_PER_DAY;
  }

  return Math.floor(parsed);
}

function getSectionScheduledDays(sectionId, existingEntries = []) {
  const days = new Set();

  for (const entry of existingEntries || []) {
    if (entry.section_id !== sectionId) continue;
    if (!entry.day) continue;
    days.add(entry.day);
  }

  return days;
}

function getSectionScheduledSubjectsOnDay(
  sectionId,
  day,
  existingEntries = []
) {
  const subjects = new Set();

  for (const entry of existingEntries || []) {
    if (entry.section_id !== sectionId) continue;
    if (entry.day !== day) continue;

    const subjectId = entry.subject_id || entry.subject?.id || null;
    if (!subjectId) continue;

    subjects.add(subjectId);
  }

  return subjects;
}

function getSectionScheduledSubjectDays(
  sectionId,
  subjectId,
  existingEntries = []
) {
  const days = new Set();

  if (!subjectId) return days;

  for (const entry of existingEntries || []) {
    if (entry.section_id !== sectionId) continue;

    const entrySubjectId = entry.subject_id || entry.subject?.id || null;
    if (entrySubjectId !== subjectId) continue;
    if (!entry.day) continue;

    days.add(entry.day);
  }

  return days;
}

function getDayIndex(day) {
  return DAYS_OF_WEEK.indexOf(day);
}

function getDayDistance(dayA, dayB) {
  const indexA = getDayIndex(dayA);
  const indexB = getDayIndex(dayB);

  if (indexA < 0 || indexB < 0) return null;
  return Math.abs(indexA - indexB);
}

function isDayAllowedBySectionDayCap(
  sectionId,
  day,
  existingEntries,
  maxClassDaysPerWeek,
  maxSubjectsPerDay = null,
  subjectId = null
) {
  const subjectCap = getMaxSubjectsPerDay(maxSubjectsPerDay);

  if (subjectCap > 0) {
    const scheduledSubjects = getSectionScheduledSubjectsOnDay(
      sectionId,
      day,
      existingEntries
    );

    if (!(subjectId && scheduledSubjects.has(subjectId))) {
      if (scheduledSubjects.size >= subjectCap) {
        return false;
      }
    }
  }

  const maxDays = getMaxClassDaysPerWeek(maxClassDaysPerWeek);
  if (!maxDays) return true;

  const scheduledDays = getSectionScheduledDays(sectionId, existingEntries);

  if (scheduledDays.has(day)) {
    return true;
  }

  return scheduledDays.size < maxDays;
}

function filterDaysBySectionDayCap(
  sectionId,
  days,
  existingEntries,
  maxClassDaysPerWeek,
  maxSubjectsPerDay = null,
  subjectId = null
) {
  if (!Array.isArray(days) || days.length === 0) return [];

  return days.filter((day) =>
    isDayAllowedBySectionDayCap(
      sectionId,
      day,
      existingEntries,
      maxClassDaysPerWeek,
      maxSubjectsPerDay,
      subjectId
    )
  );
}

function appendSectionDayCapHint(reason, maxClassDaysPerWeek) {
  const maxDays = getMaxClassDaysPerWeek(maxClassDaysPerWeek);
  if (!maxDays) return reason;

  const baseReason = String(reason || '').trim();
  const hint = `Section day-cap active: exactly ${maxDays} day(s)/week.`;

  if (!baseReason) return hint;
  if (baseReason.includes('Section day-cap active:')) return baseReason;

  return `${baseReason} ${hint}`;
}

function appendSectionDailySubjectCapHint(reason, maxSubjectsPerDay) {
  const maxSubjects = getMaxSubjectsPerDay(maxSubjectsPerDay);
  if (!maxSubjects) return reason;

  const baseReason = String(reason || '').trim();
  const hint = `Section daily subject cap active: max ${maxSubjects} subject(s)/day.`;

  if (!baseReason) return hint;
  if (baseReason.includes('Section daily subject cap active:')) return baseReason;

  return `${baseReason} ${hint}`;
}

function appendSectionDayPolicyHints(
  reason,
  maxClassDaysPerWeek,
  maxSubjectsPerDay
) {
  return appendSectionDailySubjectCapHint(
    appendSectionDayCapHint(reason, maxClassDaysPerWeek),
    maxSubjectsPerDay
  );
}

function isExactClassDaysPolicyEnabled(options = {}) {
  const flag = options?.enforceExactClassDaysPerWeek;

  if (flag === undefined || flag === null) {
    return true;
  }

  return Boolean(flag);
}

function isExactTeacherDaysPolicyEnabled(options = {}) {
  const flag = options?.enforceExactTeacherDaysPerWeek;

  if (flag === undefined || flag === null) {
    return false;
  }

  return Boolean(flag);
}

function shouldPreferNonConsecutiveSubjectDays(options = {}) {
  const flag = options?.preferNonConsecutiveSubjectDays;

  if (flag === undefined || flag === null) {
    return true;
  }

  return Boolean(flag);
}

function buildTeacherSelectionOptions(sectionId, options = {}, overrides = {}) {
  return {
    sectionId,
    enforceExactTeacherDaysPerWeek: Boolean(
      options?.enforceExactTeacherDaysPerWeek
    ),
    ...overrides,
  };
}

function prioritizeDaysBySubjectSpacing(
  sectionId,
  subjectId,
  days,
  existingEntries,
  options = {}
) {
  if (!Array.isArray(days) || days.length === 0) return [];
  if (!subjectId || !shouldPreferNonConsecutiveSubjectDays(options)) {
    return [...days];
  }

  const subjectDays = getSectionScheduledSubjectDays(
    sectionId,
    subjectId,
    existingEntries
  );

  if (subjectDays.size === 0) {
    return [...days];
  }

  return days
    .map((day, index) => {
      const distances = [...subjectDays]
        .map((subjectDay) => getDayDistance(subjectDay, day))
        .filter((distance) => Number.isFinite(distance));

      const minDistance = distances.length > 0
        ? Math.min(...distances)
        : null;

      // Soft preference: keep at least one-day gap when possible.
      let spacingRank = 2;

      if (minDistance !== null) {
        if (minDistance >= 2) spacingRank = 0;
        else if (minDistance === 1) spacingRank = 1;
      }

      return { day, index, spacingRank };
    })
    .sort((a, b) => {
      if (a.spacingRank !== b.spacingRank) {
        return a.spacingRank - b.spacingRank;
      }

      return a.index - b.index;
    })
    .map((entry) => entry.day);
}

function prioritizeDaysBySectionDayTarget(
  sectionId,
  days,
  existingEntries,
  maxClassDaysPerWeek,
  options = {}
) {
  if (!Array.isArray(days) || days.length === 0) return [];

  const targetDays = getMaxClassDaysPerWeek(maxClassDaysPerWeek);
  if (!targetDays || !isExactClassDaysPolicyEnabled(options)) {
    return [...days];
  }

  const scheduledDays = getSectionScheduledDays(sectionId, existingEntries);

  const existing = [];
  const newDays = [];

  for (const day of days) {
    if (scheduledDays.has(day)) {
      existing.push(day);
      continue;
    }

    newDays.push(day);
  }

  if (scheduledDays.size >= targetDays) {
    return [...existing, ...newDays];
  }

  return [...newDays, ...existing];
}

function isShortSessionPackingEnabled(options = {}) {
  const flag = options?.avoidSingleSubjectOnePointFiveHourDay;

  if (flag === undefined || flag === null) {
    return true;
  }

  return Boolean(flag);
}

function getShortSessionPackingMode(options = {}) {
  const mode = String(options?.onePointFivePackingMode || 'balanced').toLowerCase();

  if (mode === 'strong') {
    return 'strong';
  }

  return 'balanced';
}

function getSectionEntryCountOnDay(sectionId, day, existingEntries = []) {
  return (existingEntries || []).filter(
    (entry) => entry.section_id === sectionId && entry.day === day
  ).length;
}

function shouldReduceLongVacantGaps(options = {}) {
  const flag = options?.reduceLongVacantGaps;

  if (flag === undefined || flag === null) {
    return true;
  }

  return Boolean(flag);
}

function getLongVacantGapMode(options = {}) {
  const mode = String(options?.longVacantGapMode || 'balanced').toLowerCase();

  if (mode === 'strong') {
    return 'strong';
  }

  return 'balanced';
}

function getLongVacantThresholdMinutes(options = {}) {
  const parsed = Number(options?.longVacantThresholdMinutes);

  if (!Number.isFinite(parsed) || parsed < 60) {
    return 180;
  }

  return Math.floor(parsed);
}

function scoreProjectedDayVacantGaps(
  sectionId,
  day,
  slot,
  existingEntries = [],
  options = {}
) {
  if (!slot?.start || !slot?.end) return 0;

  const mode = getLongVacantGapMode(options);
  const thresholdMinutes = getLongVacantThresholdMinutes(options);
  const mediumGapMinutes = Math.max(60, thresholdMinutes - 60);

  const largeBase = mode === 'strong' ? 900 : 300;
  const largeSlope = mode === 'strong' ? 6 : 2.2;
  const mediumBase = mode === 'strong' ? 140 : 45;
  const mediumSlope = mode === 'strong' ? 1.6 : 0.8;
  const microSlope = mode === 'strong' ? 0.05 : 0.02;

  const dayEntries = (existingEntries || [])
    .filter(
      (entry) =>
        entry.section_id === sectionId &&
        entry.day === day &&
        entry.start_time &&
        entry.end_time
    )
    .map((entry) => ({
      start_time: entry.start_time,
      end_time: entry.end_time,
    }));

  dayEntries.push({
    start_time: slot.start,
    end_time: slot.end,
  });

  dayEntries.sort(
    (left, right) =>
      timeToMinutes(left.start_time) - timeToMinutes(right.start_time)
  );

  let penalty = 0;

  for (let index = 0; index < dayEntries.length - 1; index += 1) {
    const current = dayEntries[index];
    const next = dayEntries[index + 1];
    const gapMinutes =
      timeToMinutes(next.start_time) - timeToMinutes(current.end_time);

    if (!Number.isFinite(gapMinutes) || gapMinutes <= 0) {
      continue;
    }

    if (gapMinutes >= thresholdMinutes) {
      penalty += largeBase + (gapMinutes - thresholdMinutes) * largeSlope;
      continue;
    }

    if (gapMinutes >= mediumGapMinutes) {
      penalty += mediumBase + (gapMinutes - mediumGapMinutes) * mediumSlope;
      continue;
    }

    penalty += gapMinutes * microSlope;
  }

  return penalty;
}

function prioritizeSlotsBySectionGap(
  sectionId,
  day,
  slots,
  existingEntries,
  options = {}
) {
  if (!Array.isArray(slots) || slots.length <= 1) {
    return [...(slots || [])];
  }

  if (!shouldReduceLongVacantGaps(options)) {
    return [...slots];
  }

  return [...slots]
    .map((slot, index) => ({
      slot,
      index,
      gapPenalty: scoreProjectedDayVacantGaps(
        sectionId,
        day,
        slot,
        existingEntries,
        options
      ),
    }))
    .sort((left, right) => {
      if (left.gapPenalty !== right.gapPenalty) {
        return left.gapPenalty - right.gapPenalty;
      }

      const timeDiff =
        timeToMinutes(left.slot.start) - timeToMinutes(right.slot.start);
      if (timeDiff !== 0) {
        return timeDiff;
      }

      return left.index - right.index;
    })
    .map((entry) => entry.slot);
}

function prioritizeDaysForSessionDuration(
  sectionId,
  days,
  existingEntries,
  durationHours,
  options = {}
) {
  if (!Array.isArray(days) || days.length === 0) return [];

  const numericDuration = Number(durationHours);
  const isOnePointFiveSession = Math.abs(numericDuration - 1.5) < 0.001;
  const targetDays = getMaxClassDaysPerWeek(options?.maxClassDaysPerWeek);
  const scheduledDays = getSectionScheduledDays(sectionId, existingEntries);
  const remainingTargetDays = targetDays
    ? Math.max(targetDays - scheduledDays.size, 0)
    : 0;
  const packingMode = getShortSessionPackingMode(options);

  if (!isShortSessionPackingEnabled(options) || !isOnePointFiveSession) {
    return [...days];
  }

  const daysWithExistingClasses = [];
  const daysWithoutExistingClasses = [];

  for (const day of days) {
    const classCount = getSectionEntryCountOnDay(sectionId, day, existingEntries);

    if (classCount > 0) {
      daysWithExistingClasses.push(day);
      continue;
    }

    daysWithoutExistingClasses.push(day);
  }

  if (packingMode === 'strong') {
    return [...daysWithExistingClasses, ...daysWithoutExistingClasses];
  }

  if (isExactClassDaysPolicyEnabled(options) && remainingTargetDays > 0) {
    return [...daysWithoutExistingClasses, ...daysWithExistingClasses];
  }

  return [...daysWithExistingClasses, ...daysWithoutExistingClasses];
}

function appendShortSessionPackingHint(reason, options = {}) {
  if (!isShortSessionPackingEnabled(options)) {
    return reason;
  }

  const baseReason = String(reason || '').trim();
  const hint =
    '1.5-hour sessions are prioritized on days that already have classes to avoid short single-subject days.';

  if (!baseReason) return hint;
  if (baseReason.includes('short single-subject days')) return baseReason;

  return `${baseReason} ${hint}`;
}

/**
 * Get occupied slots for a section on a given day
 *
 * @param {string} sectionId
 * @param {string} day
 * @param {Array}  existingEntries
 * @returns {Array} - [{ start_time, end_time }]
 */
export function getSectionOccupied(sectionId, day, existingEntries) {
  return existingEntries
    .filter((e) => e.section_id === sectionId && e.day === day)
    .map((e) => ({ start_time: e.start_time, end_time: e.end_time }));
}

/**
 * Simple time overlap check helper
 * (local use within this file)
 */
function timeOverlapCheck(startA, endA, startB, endB) {
  const toMins = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  return toMins(startA) < toMins(endB) && toMins(endA) > toMins(startB);
}

/**
 * Strip internal enriched fields before saving to DB
 * Remove _subject, _section, _teacher, _venue
 *
 * @param {Object} blueprint
 * @returns {Object} - clean blueprint for DB insert
 */
export function cleanBlueprint(blueprint) {
  const {
    _subject,
    _section,
    _teacher,
    _venue,
    ...clean
  } = blueprint;
  return clean;
}

/**
 * Strip enriched fields from array of blueprints
 *
 * @param {Array} blueprints
 * @returns {Array}
 */
export function cleanBlueprints(blueprints) {
  return blueprints.map(cleanBlueprint);
}

/**
 * Prioritize days with lower current schedule load to avoid
 * over-packing early weekdays (e.g., Monday).
 */
function prioritizeDaysByLoad(days, existingEntries) {
  return [...days].sort((a, b) => {
    const loadA = existingEntries.filter((e) => e.day === a).length;
    const loadB = existingEntries.filter((e) => e.day === b).length;
    return loadA - loadB;
  });
}

/**
 * Return all teachers eligible for a specific slot, sorted
 * from lightest load to heaviest.
 */
function getEligibleTeachersForSlot(
  subject,
  day,
  startTime,
  endTime,
  termId,
  teachers,
  assignments,
  availability,
  existingEntries,
  sectionId = null,
  options = {}
) {
  const activeTeachers = teachers.filter((t) => t.status === 'active');
  const ranked = rankTeachersByLoad(activeTeachers, existingEntries);

  const eligibleTeachers = ranked.filter((teacher) => {
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
      buildTeacherSelectionOptions(sectionId, options)
    );

    return check.eligible;
  });

  if (!isExactTeacherDaysPolicyEnabled(options)) {
    return eligibleTeachers;
  }

  return [...eligibleTeachers].sort((a, b) => {
    const aTarget = getTeacherDayTargetSnapshot(
      a,
      day,
      availability,
      existingEntries,
      options
    );
    const bTarget = getTeacherDayTargetSnapshot(
      b,
      day,
      availability,
      existingEntries,
      options
    );

    if (aTarget.progressionRank !== bTarget.progressionRank) {
      return aTarget.progressionRank - bTarget.progressionRank;
    }

    if (aTarget.remainingTargetDays !== bTarget.remainingTargetDays) {
      return bTarget.remainingTargetDays - aTarget.remainingTargetDays;
    }

    return 0;
  });
}

function buildSplitFailureReason(subjectCode, diagnostics) {
  const secondaryEligibilityLabel = buildSecondaryEligibilityLabel(
    diagnostics.secondaryEligibilityReasons
  );

  const pairs = [
    ['noEligibleTeachers', diagnostics.noEligibleTeachers, 'no eligible teacher at candidate lecture/lab slots'],
    ['noSecondaryVenue', diagnostics.noSecondaryVenue, 'no available lab/lecture venue on secondary day'],
    ['noSecondarySlots', diagnostics.noSecondarySlots, 'no free secondary-day time slot'],
    ['noPrimaryVenue', diagnostics.noPrimaryVenue, 'no available lecture/lab venue on primary day'],
    ['noValidSecondaryDays', diagnostics.noValidSecondaryDays, 'teacher has no valid secondary day'],
    ['noPrimarySlots', diagnostics.noPrimarySlots, 'no free primary-day time slot'],
    ['noSecondaryEligibility', diagnostics.noSecondaryEligibility, secondaryEligibilityLabel],
  ];

  const top = pairs
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([, value, label]) => {
      const text = String(label || '');

      if (text.includes('teacher fails secondary-slot eligibility:')) {
        return text;
      }

      return `${text} (${value})`;
    });

  const suffix = top.length > 0 ? ` Top blockers: ${top.join('; ')}.` : '';

  return `No valid lec+lab day combination found for ${subjectCode} (split_lec_lab).${suffix}`;
}

function trackSecondaryEligibilityReason(diagnostics, reason) {
  const key = classifySecondaryEligibilityReason(reason);

  if (!diagnostics.secondaryEligibilityReasons) {
    diagnostics.secondaryEligibilityReasons = {};
  }

  diagnostics.secondaryEligibilityReasons[key] =
    (diagnostics.secondaryEligibilityReasons[key] || 0) + 1;
}

function classifySecondaryEligibilityReason(reason) {
  const text = String(reason || '').toLowerCase();

  if (text.includes('outside availability window')) return 'outside_window';
  if (text.includes('not available on')) return 'not_available_day';
  if (text.includes('already scheduled')) return 'time_overlap';
  if (text.includes('max teaching days')) return 'max_days';
  if (text.includes('max load units')) return 'max_load';
  if (text.includes('not assigned to teach')) return 'not_assigned';

  return 'other';
}

function buildSecondaryEligibilityLabel(reasonCounts = {}) {
  const labels = {
    outside_window: 'outside availability window',
    not_available_day: 'not available on secondary day',
    time_overlap: 'teacher time overlap',
    max_days: 'max teaching days reached',
    max_load: 'max load units reached',
    not_assigned: 'teacher not assigned to subject',
    other: 'other teacher eligibility limit',
  };

  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key, count]) => `${labels[key] || labels.other} (${count})`);

  if (topReasons.length === 0) {
    return 'teacher fails secondary-slot eligibility';
  }

  return `teacher fails secondary-slot eligibility: ${topReasons.join(', ')}`;
}

function getTeacherValidDaysForSection(teacher, section, availability) {
  return getValidDaysForAssignment(teacher.id, section, availability);
}

function trySplitLecLabCoTeach(
  subject,
  section,
  termId,
  programCode,
  teachers,
  assignments,
  availability,
  venues,
  existingEntries,
  allowedDays,
  diagnostics,
  options = {}
) {
  const maxClassDaysPerWeek = getMaxClassDaysPerWeek(options);
  const maxSubjectsPerDay = getMaxSubjectsPerDay(options);

  for (const lecDay of allowedDays) {
    if (
      !isDayAllowedBySectionDayCap(
        section.id,
        lecDay,
        existingEntries,
        maxClassDaysPerWeek,
        maxSubjectsPerDay,
        subject.id
      )
    ) {
      continue;
    }

    const lecOccupied = getSectionOccupied(section.id, lecDay, existingEntries);
    const lecSlots = findFreeSlots(2, lecOccupied);
    const lecCandidateSlots = prioritizeSlotsBySectionGap(
      section.id,
      lecDay,
      lecSlots,
      existingEntries,
      options
    );

    if (lecCandidateSlots.length === 0) continue;

    for (const lecSlot of lecCandidateSlots) {
      const lectureTeachers = getEligibleTeachersForSlot(
        subject,
        lecDay,
        lecSlot.start,
        lecSlot.end,
        termId,
        teachers,
        assignments,
        availability,
        existingEntries,
        section.id,
        options
      );

      if (lectureTeachers.length === 0) continue;

      const lecVenue = findAvailableVenue(
        subject,
        'lecture',
        programCode,
        lecDay,
        lecSlot.start,
        lecSlot.end,
        venues,
        existingEntries
      );

      if (!lecVenue) continue;

      for (const lectureTeacher of lectureTeachers) {
        const lectureBlueprint = makeBlueprint(
          subject,
          section,
          lectureTeacher,
          lecVenue,
          lecDay,
          lecSlot.start,
          lecSlot.end,
          'lecture'
        );
        const projectedEntries = extendEntriesWithBlueprints(
          existingEntries,
          [lectureBlueprint]
        );

        const labDayCandidates = filterDaysBySectionDayCap(
          section.id,
          allowedDays.filter((d) => d !== lecDay),
          projectedEntries,
          maxClassDaysPerWeek,
          maxSubjectsPerDay,
          subject.id
        );
        const targetedLabDayCandidates = prioritizeDaysBySectionDayTarget(
          section.id,
          labDayCandidates,
          projectedEntries,
          maxClassDaysPerWeek,
          options
        );
        const spacedLabDayCandidates = prioritizeDaysBySubjectSpacing(
          section.id,
          subject.id,
          targetedLabDayCandidates,
          projectedEntries,
          options
        );

        for (const labDay of spacedLabDayCandidates) {
          const labOccupied = getSectionOccupied(section.id, labDay, projectedEntries);
          const labSlots = findFreeSlots(3, labOccupied);
          const labCandidateSlots = prioritizeSlotsBySectionGap(
            section.id,
            labDay,
            labSlots,
            projectedEntries,
            options
          );

          if (labCandidateSlots.length === 0) continue;

          for (const labSlot of labCandidateSlots) {
            const labTeachers = getEligibleTeachersForSlot(
              subject,
              labDay,
              labSlot.start,
              labSlot.end,
              termId,
              teachers,
              assignments,
              availability,
              projectedEntries,
              section.id,
              options
            );

            if (labTeachers.length === 0) continue;

            const labVenue = findAvailableVenue(
              subject,
              'lab',
              programCode,
              labDay,
              labSlot.start,
              labSlot.end,
              venues,
              projectedEntries
            );

            if (!labVenue) continue;

            // Prefer different teachers for true co-teaching fallback.
            const labTeacher =
              labTeachers.find((candidate) => candidate.id !== lectureTeacher.id) ||
              labTeachers[0];

            const labBlueprint = makeBlueprint(
              subject,
              section,
              labTeacher,
              labVenue,
              labDay,
              labSlot.start,
              labSlot.end,
              'lab'
            );

            return {
              blueprints: [
                lectureBlueprint,
                labBlueprint,
              ],
              unassigned: false,
              reason: null,
            };
          }
        }
      }
    }
  }

  diagnostics.noEligibleTeachers += 1;
  return null;
}

// ============================================================
// SPLIT LECTURE ONLY RESOLVER (1.5h x 2 days)
// ============================================================

/**
 * Resolve split_lecture_only pattern
 * Creates exactly 2 lecture sessions, 1.5 hours each,
 * on different days with the same teacher.
 * Venue can differ per day based on availability.
 *
 * @returns {Object} - { blueprints, unassigned, reason }
 */
export function resolveSplitLectureOnly(
  subject,
  section,
  termId,
  programCode,
  teachers,
  assignments,
  availability,
  venues,
  existingEntries,
  options = {}
) {
  const maxClassDaysPerWeek = getMaxClassDaysPerWeek(options);
  const maxSubjectsPerDay = getMaxSubjectsPerDay(options);
  const allowedDays = filterDaysBySectionDayCap(
    section.id,
    prioritizeDaysByLoad(
      getAllowedDaysForSection(section),
      existingEntries
    ),
    existingEntries,
    maxClassDaysPerWeek,
    maxSubjectsPerDay,
    subject.id
  );
  const dayTargetOrderedDays = prioritizeDaysBySectionDayTarget(
    section.id,
    allowedDays,
    existingEntries,
    maxClassDaysPerWeek,
    options
  );
  const spacingPreferredFirstDays = prioritizeDaysBySubjectSpacing(
    section.id,
    subject.id,
    dayTargetOrderedDays,
    existingEntries,
    options
  );
  const firstDayCandidates = prioritizeDaysForSessionDuration(
    section.id,
    spacingPreferredFirstDays,
    existingEntries,
    1.5,
    options
  );

  for (const firstDay of firstDayCandidates) {
    if (
      !isDayAllowedBySectionDayCap(
        section.id,
        firstDay,
        existingEntries,
        maxClassDaysPerWeek,
        maxSubjectsPerDay,
        subject.id
      )
    ) {
      continue;
    }

    const firstOccupied = getSectionOccupied(section.id, firstDay, existingEntries);
    const firstSlots = findFreeSlots(1.5, firstOccupied);
    const firstCandidateSlots = prioritizeSlotsBySectionGap(
      section.id,
      firstDay,
      firstSlots,
      existingEntries,
      options
    );

    for (const firstSlot of firstCandidateSlots) {
      const eligibleTeachers = getEligibleTeachersForSlot(
        subject,
        firstDay,
        firstSlot.start,
        firstSlot.end,
        termId,
        teachers,
        assignments,
        availability,
        existingEntries,
        section.id,
        options
      );

      if (eligibleTeachers.length === 0) continue;

      for (const teacher of eligibleTeachers) {
        const firstVenue = findAvailableVenue(
          subject,
          'lecture',
          programCode,
          firstDay,
          firstSlot.start,
          firstSlot.end,
          venues,
          existingEntries
        );

        if (!firstVenue) continue;

        const firstBlueprint = makeBlueprint(
          subject,
          section,
          teacher,
          firstVenue,
          firstDay,
          firstSlot.start,
          firstSlot.end,
          'lecture'
        );
        const projectedEntries = extendEntriesWithBlueprints(
          existingEntries,
          [firstBlueprint]
        );

        const validTeacherDays = new Set(
          getTeacherValidDaysForSection(teacher, section, availability)
        );

        const secondDays = prioritizeDaysByLoad(
          allowedDays.filter((day) => day !== firstDay && validTeacherDays.has(day)),
          projectedEntries
        );
        const secondDaysWithinCap = filterDaysBySectionDayCap(
          section.id,
          secondDays,
          projectedEntries,
          maxClassDaysPerWeek,
          maxSubjectsPerDay,
          subject.id
        );
        const targetedSecondDays = prioritizeDaysBySectionDayTarget(
          section.id,
          secondDaysWithinCap,
          projectedEntries,
          maxClassDaysPerWeek,
          options
        );
        const spacingPreferredSecondDays = prioritizeDaysBySubjectSpacing(
          section.id,
          subject.id,
          targetedSecondDays,
          projectedEntries,
          options
        );
        const secondDayCandidates = prioritizeDaysForSessionDuration(
          section.id,
          spacingPreferredSecondDays,
          projectedEntries,
          1.5,
          options
        );

        for (const secondDay of secondDayCandidates) {
          const secondOccupied = getSectionOccupied(section.id, secondDay, projectedEntries);
          const secondSlots = findFreeSlots(1.5, secondOccupied);
          const secondCandidateSlots = prioritizeSlotsBySectionGap(
            section.id,
            secondDay,
            secondSlots,
            projectedEntries,
            options
          );

          for (const secondSlot of secondCandidateSlots) {
            const secondEligibility = checkTeacherEligibility(
              teacher,
              subject,
              secondDay,
              secondSlot.start,
              secondSlot.end,
              termId,
              assignments,
              availability,
              projectedEntries,
              buildTeacherSelectionOptions(section.id, options)
            );

            if (!secondEligibility.eligible) continue;

            const secondVenue = findAvailableVenue(
              subject,
              'lecture',
              programCode,
              secondDay,
              secondSlot.start,
              secondSlot.end,
              venues,
              projectedEntries
            );

            if (!secondVenue) continue;

            const secondBlueprint = makeBlueprint(
              subject,
              section,
              teacher,
              secondVenue,
              secondDay,
              secondSlot.start,
              secondSlot.end,
              'lecture'
            );

            return {
              blueprints: [
                firstBlueprint,
                secondBlueprint,
              ],
              unassigned: false,
              reason: null,
            };
          }
        }
      }
    }
  }

  return {
    blueprints: [],
    unassigned: true,
    reason: appendShortSessionPackingHint(
      appendSectionDayPolicyHints(
        `No valid 2-day split lecture slot found for ${subject.subject_code} (1.5h x2 with same teacher).`,
        maxClassDaysPerWeek,
        maxSubjectsPerDay
      ),
      options
    ),
  };
}

