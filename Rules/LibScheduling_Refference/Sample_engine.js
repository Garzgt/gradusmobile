// lib/scheduling/engine.js
// ============================================================
// SCHEDULING ENGINE - MAIN ORCHESTRATOR
// PSU Sto. Tomas Campus
// Generates class schedules based on scope and mode
// ============================================================

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { resolvePattern, cleanBlueprints } from './patternResolver.js';
import {
  checkAllConflicts,
  summarizeConflicts,
  CONFLICT_TYPES,
} from './conflictChecker.js';
import { shouldSkipSubject } from './restrictions.js';

// ============================================================
// GENERATION STRATEGIES
// ============================================================

const STRATEGY_PRESETS = {
  year_desc_constraints: {
    label: 'Year 4 -> 1 (Constrained)',
    sectionSort: 'year_desc_constraints',
    subjectOrder: 'normal',
  },
  constraints_only: {
    label: 'Most Constrained First',
    sectionSort: 'constraints_only',
    subjectOrder: 'normal',
  },
  constraints_reverse_subjects: {
    label: 'Most Constrained First (Reverse Subjects)',
    sectionSort: 'constraints_only',
    subjectOrder: 'reverse',
  },
  year_asc_constraints: {
    label: 'Year 1 -> 4 (Constrained)',
    sectionSort: 'year_asc_constraints',
    subjectOrder: 'normal',
  },
  year_asc_reverse_subjects: {
    label: 'Year 1 -> 4 (Reverse Subjects)',
    sectionSort: 'year_asc_constraints',
    subjectOrder: 'reverse',
  },
  year_desc_reverse_subjects: {
    label: 'Year 4 -> 1 (Reverse Subjects)',
    sectionSort: 'year_desc_constraints',
    subjectOrder: 'reverse',
  },
  venue_pressure_constraints: {
    label: 'Venue Pressure First',
    sectionSort: 'venue_pressure_constraints',
    subjectOrder: 'normal',
  },
  day_cap_tightest_first: {
    label: 'Day Cap Tightest First',
    sectionSort: 'day_cap_tightest_first',
    subjectOrder: 'normal',
  },
  session_density_first: {
    label: 'Session Density First (1.5h + Gap Smoothing)',
    sectionSort: 'session_density_first',
    subjectOrder: 'normal',
    onePointFivePackingMode: 'strong',
    longVacantGapMode: 'strong',
  },
  bottleneck_rescue: {
    label: 'Bottleneck Rescue (Long Block + Split)',
    sectionSort: 'bottleneck_rescue',
    subjectOrder: 'normal',
  },
};

const AUTO_BEST_STRATEGIES = [
  'day_cap_tightest_first',
  'session_density_first',
  'bottleneck_rescue',
  'year_desc_reverse_subjects',
  'year_desc_constraints',
  'constraints_only',
  'constraints_reverse_subjects',
  'venue_pressure_constraints',
  'year_asc_constraints',
  'year_asc_reverse_subjects',
];

const AUTO_BEST_MAX_STRATEGIES = 6;

const DEFAULT_SCOPED_REBALANCE_SETTINGS = {
  neighborPoolSize: 10,
  firstTierNeighborCap: 6,
  firstTierMaxSets: 10,
  secondTierMaxSets: 28,
  secondTierCombinationPool: 8,
  maxStrategyRuns: 80,
  inScopeCoreOrderVariants: 8,
  inScopeExtendedOrderVariants: 18,
  maxInScopeStrategyRuns: 120,
};

const FAST_AUTO_RETRY_SCOPED_REBALANCE_SETTINGS = {
  ...DEFAULT_SCOPED_REBALANCE_SETTINGS,
  neighborPoolSize: 8,
  firstTierNeighborCap: 5,
  firstTierMaxSets: 6,
  secondTierMaxSets: 14,
  secondTierCombinationPool: 6,
  maxStrategyRuns: 36,
  inScopeCoreOrderVariants: 5,
  inScopeExtendedOrderVariants: 10,
  maxInScopeStrategyRuns: 56,
};

function getScopedRebalanceSettings(executionProfile = 'standard') {
  if (executionProfile === 'fast_auto_retry') {
    return FAST_AUTO_RETRY_SCOPED_REBALANCE_SETTINGS;
  }

  return DEFAULT_SCOPED_REBALANCE_SETTINGS;
}

export const GENERATION_CANCELLED_CODE = 'GENERATION_CANCELLED';

class GenerationCancelledError extends Error {
  constructor(jobId = null, stage = 'runtime') {
    super('Generation cancelled.');
    this.name = 'GenerationCancelledError';
    this.code = GENERATION_CANCELLED_CODE;
    this.jobId = jobId;
    this.stage = stage;
  }
}

async function assertGenerationNotCancelled(cancellation = null, stage = 'runtime') {
  if (!cancellation?.checkCancelled) return;

  const cancelled = await cancellation.checkCancelled();
  if (!cancelled) return;

  throw new GenerationCancelledError(cancellation.jobId || null, stage);
}

function normalizeVariationIteration(rawValue) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}

function hashStringToUint32(value = '') {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getVariationHash(variation, key) {
  if (!variation?.enabled) return 0;
  return hashStringToUint32(`${variation.seedBase}|${key}`);
}

function getVariationUnitFloat(variation, key) {
  if (!variation?.enabled) return 0;
  return getVariationHash(variation, key) / 0xffffffff;
}

function compareByVariationKey(leftId, rightId, variation, keyPrefix = 'variation') {
  if (!variation?.enabled) return 0;

  const leftScore = getVariationHash(variation, `${keyPrefix}|${leftId}`);
  const rightScore = getVariationHash(variation, `${keyPrefix}|${rightId}`);

  if (leftScore === rightScore) {
    return String(leftId || '').localeCompare(String(rightId || ''));
  }

  return leftScore - rightScore;
}

function applyStrategyOrderVariation(strategies = [], variation = null) {
  if (!variation?.enabled || !strategies || strategies.length <= 1) {
    return [...(strategies || [])];
  }

  return [...strategies].sort((left, right) =>
    compareByVariationKey(left, right, variation, 'strategy_order')
  );
}

function applySectionOrderVariation(
  orderedSections = [],
  variation = null,
  sectionSort = 'year_desc_constraints'
) {
  if (!variation?.enabled || orderedSections.length <= 2) {
    return [...orderedSections];
  }

  const baseIndexById = new Map(
    orderedSections.map((section, index) => [section.id, index])
  );
  const lane = `section_order|${sectionSort}`;

  return [...orderedSections].sort((left, right) => {
    const leftBaseIndex = baseIndexById.get(left.id) ?? 0;
    const rightBaseIndex = baseIndexById.get(right.id) ?? 0;

    const leftJitter =
      (getVariationUnitFloat(variation, `${lane}|${left.id}`) - 0.5) * 0.9;
    const rightJitter =
      (getVariationUnitFloat(variation, `${lane}|${right.id}`) - 0.5) * 0.9;

    const leftScore = leftBaseIndex + leftJitter;
    const rightScore = rightBaseIndex + rightJitter;

    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }

    return String(left.section_name || '').localeCompare(String(right.section_name || ''));
  });
}

function getGenerationVariationContext({
  termId,
  scope,
  regenerationMode,
  strategy,
  variationIteration,
}) {
  const iteration = normalizeVariationIteration(variationIteration);
  const enabled =
    iteration > 0 &&
    scope === 'whole_term' &&
    regenerationMode === 'full_regeneration';

  const strategyKey = resolveStrategyKey(strategy);
  const seedBase = enabled
    ? `${termId}|${scope}|${regenerationMode}|${strategyKey}|${iteration}`
    : `${termId}|stable`;

  return {
    enabled,
    iteration,
    seedBase,
    mode: enabled ? 'whole_term_reroll' : 'stable',
  };
}

function normalizeSectionDayCapRules(rawRules = []) {
  if (!Array.isArray(rawRules) || rawRules.length === 0) return [];

  const deduped = new Map();

  rawRules.forEach((rule) => {
    const programId = String(rule?.program_id || rule?.programId || '').trim();
    const programCode = String(rule?.program_code || rule?.programCode || '').trim();
    const yearLevelValue = Number(rule?.year_level ?? rule?.yearLevel);
    const maxDaysValue = Number(rule?.max_days_per_week ?? rule?.maxDaysPerWeek);

    if (!programId) return;
    if (!Number.isFinite(yearLevelValue) || yearLevelValue <= 0) return;
    if (!Number.isFinite(maxDaysValue) || maxDaysValue <= 0) return;

    const yearLevel = Math.floor(yearLevelValue);
    const maxDaysPerWeek = Math.floor(maxDaysValue);

    const key = `${programId}|${yearLevel}`;

    deduped.set(key, {
      program_id: programId,
      program_code: programCode || null,
      year_level: String(yearLevel),
      max_days_per_week: maxDaysPerWeek,
    });
  });

  return [...deduped.values()];
}

function buildSectionDayCapBySectionId(sections = [], normalizedRules = []) {
  const map = new Map();

  if (!Array.isArray(sections) || sections.length === 0) {
    return map;
  }

  const byProgramYear = new Map(
    (normalizedRules || []).map((rule) => [
      `${rule.program_id}|${String(rule.year_level)}`,
      Number(rule.max_days_per_week),
    ])
  );

  sections.forEach((section) => {
    const key = `${section.program_id}|${String(section.year_level)}`;
    const cap = byProgramYear.get(key);

    if (Number.isFinite(cap) && cap > 0) {
      map.set(section.id, Math.floor(cap));
    }
  });

  return map;
}

function getSectionDayCapForSection(section, sectionDayCapBySectionId = null) {
  if (!sectionDayCapBySectionId || !section?.id) return null;

  const rawCap = sectionDayCapBySectionId.get(section.id);
  const parsed = Number(rawCap);

  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.floor(parsed);
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================

/**
 * Generate schedule based on scope and mode
 *
 * @param {Object} params - {
 *   termId            : string (required),
 *   scope             : 'single_section' | 'multiple_sections' |
 *                       'year_level' | 'program' | 'whole_term',
 *   scopeTarget       : object (depends on scope),
 *   regenerationMode  : 'generate_unscheduled' | 'replace_section' |
 *                       'full_regeneration',
 *   strategy          : 'auto_best' | 'year_desc_constraints' |
 *                       'constraints_only' | 'constraints_reverse_subjects' |
 *                       'year_asc_constraints' | 'year_asc_reverse_subjects' |
 *                       'year_desc_reverse_subjects' |
 *                       'venue_pressure_constraints' |
 *                       'day_cap_tightest_first' |
 *                       'bottleneck_rescue',
 *   sectionDayCapRules: Array<{
 *                         program_id: string,
 *                         program_code?: string,
 *                         year_level: number|string,
 *                         max_days_per_week: number|string
 *                       }>
 * }
 * @returns {Object} - {
 *   success                 : boolean,
 *   total_entries_generated : number,
 *   total_conflicts_detected: number,
 *   total_unassigned        : number,
 *   generation_notes        : string,
 *   log_id                  : string (generation log UUID)
 * }
 */
export async function generateSchedule(params) {
  const {
    termId,
    scope             = 'program',
    scopeTarget       = {},
    regenerationMode  = 'generate_unscheduled',
    strategy          = 'auto_best',
    executionProfile  = 'standard',
    variationIteration = 0,
    sectionDayCapRules = [],
    cancellation      = null,
  } = params;

  try {
    // ────────────────────────────────────────────────────────
    // 1. VALIDATE INPUT
    // ────────────────────────────────────────────────────────
    if (!termId) {
      throw new Error('termId is required.');
    }

    if (regenerationMode === 'full_regeneration' && scope !== 'whole_term') {
      throw new Error(
        'full_regeneration requires whole_term scope. ' +
        'Use replace_section for scoped generation.'
      );
    }

    await assertGenerationNotCancelled(cancellation, 'post_validation');

    // ────────────────────────────────────────────────────────
    // 2. FETCH ALL REQUIRED DATA
    // ────────────────────────────────────────────────────────
    const context = await loadGenerationContext(termId, scope, scopeTarget);
    context.regenerationMode = regenerationMode;
    context.variation = getGenerationVariationContext({
      termId,
      scope,
      regenerationMode,
      strategy,
      variationIteration,
    });
    context.sectionConstraintScores = buildSectionConstraintScores(context);
    context.sectionVenuePressureScores = buildSectionVenuePressureScores(context);
    context.sectionSessionDensityScores = buildSectionSessionDensityScores(context);
    context.sectionDayCapRules = normalizeSectionDayCapRules(sectionDayCapRules);
    context.sectionDayCapBySectionId = buildSectionDayCapBySectionId(
      context.sections,
      context.sectionDayCapRules
    );

    await assertGenerationNotCancelled(cancellation, 'post_context_load');

    if (!context.sections || context.sections.length === 0) {
      throw new Error('No sections found for the given scope.');
    }

    const targetSections = [...context.sections];
    const targetSectionIds = new Set(targetSections.map((section) => section.id));
    const sectionsToClearAtCommit = new Set();
    const scopedRebalanceSettings = getScopedRebalanceSettings(executionProfile);
    let scopedRebalanceInfo = null;

    // ────────────────────────────────────────────────────────
    // 3. HANDLE REGENERATION MODE
    // ────────────────────────────────────────────────────────
    if (regenerationMode === 'full_regeneration') {
      context.existingEntries = [];
    } else if (regenerationMode === 'replace_section') {
      const scopeSectionIds = context.sections.map((section) => section.id);

      scopeSectionIds.forEach((sectionId) => sectionsToClearAtCommit.add(sectionId));

      // Keep DB untouched until final commit; simulate cleared scope in-memory.
      context.existingEntries = context.existingEntries.filter(
        (entry) => !targetSectionIds.has(entry.section_id)
      );
    }
    // 'generate_unscheduled': do nothing, keep existing entries

    await assertGenerationNotCancelled(cancellation, 'post_mode_prepare');

    // ────────────────────────────────────────────────────────
    // 4. GENERATE SCHEDULE FOR EACH SECTION (WITH STRATEGY)
    // ────────────────────────────────────────────────────────
    const strategyKey = resolveStrategyKey(strategy);
    const baseStrategiesToRun =
      strategyKey === 'auto_best'
        ? getAutoBestStrategyOrder(context, AUTO_BEST_STRATEGIES)
        : [strategyKey];
    const strategiesToRun = applyStrategyOrderVariation(
      baseStrategiesToRun,
      context.variation
    );

    let results = null;
    let strategyUsed = strategiesToRun[0] || 'year_desc_constraints';
    const strategySummaries = [];

    for (const strategyName of strategiesToRun) {
      await assertGenerationNotCancelled(cancellation, `strategy_${strategyName}_start`);

      const strategyResults = await runStrategy(
        context,
        strategyName,
        regenerationMode,
        cancellation
      );

      strategySummaries.push({
        strategy: strategyName,
        ...summarizeResults(strategyResults),
      });

      if (!results) {
        results = strategyResults;
        strategyUsed = strategyName;
        continue;
      }

      const chosen = chooseBetterResult(results, strategyResults);
      if (chosen !== results) {
        results = chosen;
        strategyUsed = strategyName;
      }

      if (strategyKey === 'auto_best') {
        const currentBestSummary = summarizeResults(results);

        if (
          currentBestSummary.conflictsCount === 0 &&
          currentBestSummary.unassignedCount === 0
        ) {
          console.log(
            '[generateSchedule] Auto Best early stop: conflict-free and fully assigned result found.'
          );
          break;
        }
      }
    }

    if (
      shouldAttemptScopedNeighborRebalance(
        scope,
        regenerationMode,
        results,
        targetSectionIds
      )
    ) {
      const scopedRebalance = await attemptScopedNeighborRebalance({
        termId,
        context,
        currentResults: results,
        targetSections,
        targetSectionIds,
        strategyUsed,
        regenerationMode,
        rebalanceSettings: scopedRebalanceSettings,
        cancellation,
      });

      if (scopedRebalance.attempted) {
        scopedRebalanceInfo = scopedRebalance.info;
      }

      if (scopedRebalance.applied) {
        scopedRebalance.neighborSectionIds.forEach((sectionId) => {
          sectionsToClearAtCommit.add(sectionId);
        });

        results = scopedRebalance.results;
      }
    }

    if (
      shouldAttemptScopedInScopeRebalance(
        scope,
        regenerationMode,
        results,
        targetSectionIds
      )
    ) {
      const scopedInScopeRebalance = await attemptScopedInScopeRebalance({
        context,
        currentResults: results,
        targetSectionIds,
        strategyUsed,
        regenerationMode,
        rebalanceSettings: scopedRebalanceSettings,
        cancellation,
      });

      if (scopedInScopeRebalance.attempted) {
        scopedRebalanceInfo = scopedInScopeRebalance.info;
      }

      if (scopedInScopeRebalance.applied) {
        results = scopedInScopeRebalance.results;
      }
    }

    // ────────────────────────────────────────────────────────
    // 5. COLLECT ALL BLUEPRINTS AND CONFLICTS
    // ────────────────────────────────────────────────────────
    const allBlueprints     = results.flatMap((r) => r.blueprints);
    const allConflictGroups = results.flatMap((r) => r.conflicts);
    const allDetectedConflicts = extractDetectedConflicts(allConflictGroups);
    const allUnassigned = results.flatMap((r) => r.unassigned);

    await assertGenerationNotCancelled(cancellation, 'before_commit');

    if (regenerationMode === 'full_regeneration') {
      await clearExistingSchedule(termId);
    } else if (regenerationMode === 'replace_section' && sectionsToClearAtCommit.size > 0) {
      await clearSectionsSchedule(termId, [...sectionsToClearAtCommit]);
    }

    // ────────────────────────────────────────────────────────
    // 6. SAVE BLUEPRINTS TO DATABASE
    // ────────────────────────────────────────────────────────
    const savedCount = await saveBlueprints(allBlueprints, termId);

    // ────────────────────────────────────────────────────────
    // 7. LOG CONFLICTS TO DATABASE
    // ────────────────────────────────────────────────────────
    if (allConflictGroups.length > 0) {
      await logConflicts(allConflictGroups, termId);
    }

    // ────────────────────────────────────────────────────────
    // 8. CREATE GENERATION LOG
    // ────────────────────────────────────────────────────────
    const summary = buildGenerationSummary(
      scope,
      scopeTarget,
      regenerationMode,
      savedCount,
      allDetectedConflicts.length,
      allUnassigned.length,
      results,
      strategyUsed,
      strategySummaries,
      scopedRebalanceInfo,
      context.variation,
      context.sectionDayCapRules
    );

    const logId = await createGenerationLog(summary, termId);

    // ────────────────────────────────────────────────────────
    // 9. RETURN SUMMARY
    // ────────────────────────────────────────────────────────
    return {
      success                 : true,
      total_entries_generated : savedCount,
      total_conflicts_detected: allDetectedConflicts.length,
      total_unassigned        : allUnassigned.length,
      generation_notes        : summary.generation_notes,
      strategy_used            : summary.strategy_used,
      execution_profile_used   : executionProfile,
      variation_iteration_used : context.variation?.iteration || 0,
      variation_mode_used      : context.variation?.mode || 'stable',
      section_day_caps_applied_count: context.sectionDayCapRules?.length || 0,
      scoped_rebalance_attempted: Boolean(scopedRebalanceInfo?.attempted),
      scoped_rebalance_applied: Boolean(scopedRebalanceInfo?.applied),
      scoped_rebalance_neighbors:
        scopedRebalanceInfo?.neighbor_section_names || [],
      log_id                  : logId,
    };

  } catch (error) {
    console.error('[generateSchedule] Error:', error);
    throw error;
  }
}

// ============================================================
// LOAD GENERATION CONTEXT
// ============================================================

/**
 * Load all required data for generation
 *
 * @param {string} termId
 * @param {string} scope
 * @param {Object} scopeTarget
 * @returns {Object} - context object with all data
 */
async function loadGenerationContext(termId, scope, scopeTarget) {
  // ── Fetch Term First ───────────────────────────────────────
  const term = await fetchTerm(termId);

  if (!term) {
    throw new Error('Term not found.');
  }

  // ── Fetch Sections Based on Scope ──────────────────────────
  const sections = await fetchSectionsForScope(termId, scope, scopeTarget);

  if (!sections || sections.length === 0) {
    throw new Error('No sections found for the given scope.');
  }

  const sectionIds = sections.map((s) => s.id);

  // ── Fetch All Required Data ────────────────────────────────
  const [
    subjects,
    teachers,
    assignments,
    availability,
    venues,
    existingEntries,
  ] = await Promise.all([
    fetchSubjectsForSections(sections),
    fetchTeachers(),
    fetchAssignments(termId),
    fetchAvailability(),
    fetchVenues(),
    loadExistingEntries(termId, sectionIds),
  ]);

  return {
    termId,
    term,           // ← ADDED: Now includes term object
    scope,
    scopeTarget,
    sections,
    subjects,
    teachers,
    assignments,
    availability,
    venues,
    existingEntries,
  };
}

// ============================================================
// FETCH SECTIONS FOR SCOPE
// ============================================================

/**
 * Fetch sections based on scope and scopeTarget
 *
 * @param {string} termId
 * @param {string} scope
 * @param {Object} scopeTarget
 * @returns {Array} - array of section records
 */
async function fetchSectionsForScope(termId, scope, scopeTarget) {
  let query = supabaseAdmin
    .from('sections')
    .select(`
      *,
      programs:program_id (code, name),
      curriculum_versions:curriculum_version_id (id, curriculum_name)
    `)
    .eq('term_id', termId)
    .eq('status', 'active');

  switch (scope) {
    case 'single_section':
      if (!scopeTarget.section_id) {
        throw new Error('section_id required for single_section scope.');
      }
      query = query.eq('id', scopeTarget.section_id);
      break;

    case 'multiple_sections':
      if (!scopeTarget.section_ids || scopeTarget.section_ids.length === 0) {
        throw new Error('section_ids array required for multiple_sections scope.');
      }
      query = query.in('id', scopeTarget.section_ids);
      break;

    case 'year_level':
      if (!scopeTarget.year_level || !scopeTarget.program_id) {
        throw new Error('year_level and program_id required for year_level scope.');
      }
      query = query
        .eq('year_level', scopeTarget.year_level)
        .eq('program_id', scopeTarget.program_id);
      break;

    case 'program':
      if (!scopeTarget.program_id) {
        throw new Error('program_id required for program scope.');
      }
      query = query.eq('program_id', scopeTarget.program_id);
      break;

    case 'whole_term':
      // No filter, fetch all sections in term
      break;

    default:
      throw new Error(`Unknown scope: ${scope}`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// ============================================================
// FETCH SUBJECTS FOR SECTIONS
// ============================================================

/**
 * Fetch subjects for all sections in scope
 * Groups subjects by curriculum_version_id
 *
 * @param {Array} sections
 * @returns {Object} - { curriculum_version_id: [...subjects] }
 */
async function fetchSubjectsForSections(sections) {
  const curriculumVersionIds = [
    ...new Set(sections.map((s) => s.curriculum_version_id)),
  ];

  if (curriculumVersionIds.length === 0) return {};

  const { data, error } = await supabaseAdmin
    .from('subjects')
    .select('*')
    .in('curriculum_version_id', curriculumVersionIds);

  if (error) throw error;

  // Group by curriculum_version_id
  const grouped = {};
  (data || []).forEach((subject) => {
    const cvId = subject.curriculum_version_id;
    if (!grouped[cvId]) grouped[cvId] = [];
    grouped[cvId].push(subject);
  });

  return grouped;
}

// ============================================================
// FETCH TEACHERS
// ============================================================

async function fetchTeachers() {
  const { data, error } = await supabaseAdmin
    .from('teachers')
    .select('*')
    .eq('status', 'active');

  if (error) throw error;
  return data || [];
}

// ============================================================
// FETCH ASSIGNMENTS
// ============================================================

async function fetchAssignments(termId) {
  const { data, error } = await supabaseAdmin
    .from('teacher_subject_assignments')
    .select('*')
    .eq('term_id', termId);

  if (error) throw error;
  return data || [];
}

// ============================================================
// FETCH AVAILABILITY
// ============================================================

async function fetchAvailability() {
  const { data, error } = await supabaseAdmin
    .from('teacher_availability')
    .select('*');

  if (error) throw error;
  return data || [];
}

// ============================================================
// FETCH VENUES
// ============================================================

async function fetchVenues() {
  const { data, error } = await supabaseAdmin
    .from('venues')
    .select('*')
    .eq('status', 'active');

  if (error) throw error;
  return data || [];
}

// ============================================================
// LOAD EXISTING ENTRIES
// ============================================================

/**
 * Load existing schedule entries for conflict checking
 * Campus-wide within the term
 *
 * @param {string} termId
 * @param {Array}  sectionIds - optional filter
 * @returns {Array} - schedule_entries with joined data
 */
async function loadExistingEntries(termId, sectionIds = null) {
  let query = supabaseAdmin
    .from('schedule_entries')
    .select(`
      *,
      subjects:subject_id (id, subject_code, credit_units, subject_type),
      sections:section_id (id, section_name, year_level, program_id),
      teachers:teacher_id (id, name),
      venues:venue_id (id, name, venue_type, venue_subtype)
    `)
    .eq('term_id', termId);

  // Optional: exclude sections we're regenerating
  // For now, load all to check campus-wide conflicts

  const { data, error } = await query;

  if (error) throw error;

  // Flatten joined data for easier access
  return (data || []).map((entry) => ({
    ...entry,
    subject     : entry.subjects,
    section     : entry.sections,
    teacher     : entry.teachers,
    venue       : entry.venues,
    program_code: entry.sections?.programs?.code || null,
    year_level  : entry.sections?.year_level || null,
  }));
}

// ============================================================
// CLEAR EXISTING SCHEDULE
// ============================================================

/**
 * Clear all schedule entries for a term (full regeneration)
 *
 * @param {string} termId
 */
async function clearExistingSchedule(termId) {
  const { error } = await supabaseAdmin
    .from('schedule_entries')
    .delete()
    .eq('term_id', termId);

  if (error) throw error;

  console.log(`[engine] Cleared all schedule entries for term ${termId}.`);
}

/**
 * Clear schedule entries for specific sections only
 *
 * @param {string} termId
 * @param {Array}  sectionIds
 */
async function clearSectionsSchedule(termId, sectionIds) {
  if (!sectionIds || sectionIds.length === 0) return;

  const { error } = await supabaseAdmin
    .from('schedule_entries')
    .delete()
    .eq('term_id', termId)
    .in('section_id', sectionIds);

  if (error) throw error;

  console.log(
    `[engine] Cleared schedule for ${sectionIds.length} sections.`
  );
}

// ============================================================
// GENERATE FOR SECTION
// ============================================================

/**
 * Generate schedule for a single section
 *
 * @param {Object} section
 * @param {Object} context
 * @returns {Object} - {
 *   section_id  : string,
 *   blueprints  : [...],
 *   conflicts   : [...],
 *   unassigned  : [...]
 * }
 */
async function generateForSection(section, context, cancellation = null) {
  const {
    subjects,
    teachers,
    assignments,
    termId,
    term,
    regenerationMode,
    existingEntries,
  } = context;

  // Get subjects for this section's curriculum and year/semester
  const curriculumSubjects = subjects[section.curriculum_version_id] || [];

  const sectionSubjects = curriculumSubjects.filter(
    (subj) =>
      String(subj.year_level) === String(section.year_level)
  );

  // Filter by semester (term already loaded in context)
  const filteredSubjects = sectionSubjects.filter(
    (subj) => subj.semester === term.semester
  );

  const activeTeachersById = new Map(
    (teachers || [])
      .filter((teacher) => teacher.status === 'active')
      .map((teacher) => [teacher.id, teacher])
  );

  const teacherIdsBySubject = (assignments || []).reduce((acc, assignment) => {
    if (!acc[assignment.subject_id]) acc[assignment.subject_id] = [];
    acc[assignment.subject_id].push(assignment.teacher_id);
    return acc;
  }, {});

  const getSubjectTeacherProfile = (subjectId) => {
    const teacherIds = teacherIdsBySubject[subjectId] || [];
    let partTimeCount = 0;
    let fullTimeCount = 0;

    for (const teacherId of teacherIds) {
      const teacher = activeTeachersById.get(teacherId);
      if (!teacher) continue;
      if (teacher.employment_type === 'part_time') partTimeCount += 1;
      if (teacher.employment_type === 'full_time') fullTimeCount += 1;
    }

    return {
      partTimeCount,
      fullTimeCount,
      totalQualified: partTimeCount + fullTimeCount,
    };
  };

  const getPartTimePriorityGroup = (subject) => {
    const profile = getSubjectTeacherProfile(subject.id);

    // Highest priority: subjects that rely only on part-time teachers.
    if (profile.partTimeCount > 0 && profile.fullTimeCount === 0) return 0;

    // Next: subjects that can be taught by both, but still include part-time.
    if (profile.partTimeCount > 0 && profile.fullTimeCount > 0) return 1;

    // Then: full-time-only subjects.
    if (profile.partTimeCount === 0 && profile.fullTimeCount > 0) return 2;

    // Last: no active qualified teacher currently assigned.
    return 3;
  };

  const getPrimaryContinuousBlockHours = (subject) => {
    const pattern = String(subject.delivery_pattern || '').toLowerCase();
    const subjectType = String(subject.subject_type || '').toLowerCase();
    const creditUnits = Number(subject.credit_units || 0);

    if (pattern === 'combined_lec_lab') return 5;
    if (pattern === 'split_lec_lab') return 3;
    if (pattern === 'split_lecture_only') return 1.5;
    if (pattern === 'flexible') return 3;

    if (subjectType === 'ojt') return 6;
    if (subjectType === 'practicum') {
      return creditUnits >= 6 ? 6 : 3;
    }
    if (subjectType === 'internship' || subjectType === 'field_study') return 3;
    if (subjectType === 'pe') return 2;

    return 3;
  };

  // Schedule part-time-dependent and hard patterns first to reduce dead-ends later.
  let prioritizedSubjects = [...filteredSubjects].sort((a, b) => {
    const patternRank = (subject) => {
      // Keep unsplittable 5-hour combined blocks earliest to avoid losing contiguous windows.
      if (subject.delivery_pattern === 'combined_lec_lab') return 0;
      if (subject.delivery_pattern === 'split_lec_lab') return 1;
      if (subject.delivery_pattern === 'flexible') return 2;
      if (subject.delivery_pattern === 'single_day') return 3;
      if (subject.delivery_pattern === 'split_lecture_only') return 4;
      return 5;
    };

    const partTimeGroupDiff =
      getPartTimePriorityGroup(a) - getPartTimePriorityGroup(b);
    if (partTimeGroupDiff !== 0) return partTimeGroupDiff;

    const patternDiff = patternRank(a) - patternRank(b);
    if (patternDiff !== 0) return patternDiff;

    const longBlockDiff =
      getPrimaryContinuousBlockHours(b) - getPrimaryContinuousBlockHours(a);
    if (longBlockDiff !== 0) return longBlockDiff;

    const qualifiedDiff =
      getSubjectTeacherProfile(a.id).totalQualified -
      getSubjectTeacherProfile(b.id).totalQualified;
    if (qualifiedDiff !== 0) return qualifiedDiff;

    const variationDiff = compareByVariationKey(
      a.id,
      b.id,
      context.variation,
      `subject_order_tie|${section.id}`
    );
    if (variationDiff !== 0) return variationDiff;

    return String(a.subject_code || '').localeCompare(String(b.subject_code || ''));
  });

  if (context.subjectOrder === 'reverse') {
    prioritizedSubjects = [...prioritizedSubjects].reverse();
  }

  const blueprints  = [];
  const conflicts   = [];
  const unassigned  = [];

  // Keep a running entry list so each next subject avoids conflicts
  // with entries generated earlier in this same section run.
  const sectionWorkingEntries = [...existingEntries];

  for (const subject of prioritizedSubjects) {
    await assertGenerationNotCancelled(
      cancellation,
      `section_${section.id}_subject_${subject.id}`
    );

    // Skip NSTP
    if (shouldSkipSubject(subject)) {
      continue;
    }

    // In generate_unscheduled mode, skip subjects already scheduled
    // for this section in this term.
    if (regenerationMode === 'generate_unscheduled') {
      const alreadyScheduled = existingEntries.some(
        (entry) =>
          entry.section_id === section.id &&
          entry.subject_id === subject.id
      );

      if (alreadyScheduled) {
        console.log(
          `[engine] Skipping already scheduled subject: ` +
          `${section.section_name} - ${subject.subject_code}`
        );
        continue;
      }
    }

    const sectionContext = {
      ...context,
      existingEntries: sectionWorkingEntries,
    };

    const result = await generateForSubject(
      subject,
      section,
      sectionContext,
      cancellation
    );

    blueprints.push(...result.blueprints);
    sectionWorkingEntries.push(...result.blueprints);

    if (result.conflicts.length > 0) {
      conflicts.push({
        subject_id   : subject.id,
        subject_code : subject.subject_code,
        section_id   : section.id,
        section_name : section.section_name,
        conflicts    : result.conflicts,
      });
    }

    if (result.unassigned) {
      unassigned.push({
        subject_id   : subject.id,
        subject_code : subject.subject_code,
        section_id   : section.id,
        section_name : section.section_name,
        reason       : result.reason,
      });
    }
  }

  return {
    section_id   : section.id,
    section_name : section.section_name,
    blueprints,
    conflicts,
    unassigned,
  };
}

// ============================================================
// FETCH TERM
// ============================================================

async function fetchTerm(termId) {
  const { data, error } = await supabaseAdmin
    .from('academic_terms')
    .select('*')
    .eq('id', termId)
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// GENERATE FOR SUBJECT
// ============================================================

/**
 * Generate schedule for a single subject within a section
 *
 * @param {Object} subject
 * @param {Object} section
 * @param {Object} context
 * @returns {Object} - {
 *   blueprints : [...],
 *   conflicts  : [...],
 *   unassigned : boolean,
 *   reason     : string | null
 * }
 */
async function generateForSubject(subject, section, context, cancellation = null) {
  await assertGenerationNotCancelled(
    cancellation,
    `subject_${subject.id}_resolve`
  );

  const programCode = section.programs?.code || null;
  const sectionMaxClassDaysPerWeek = getSectionDayCapForSection(
    section,
    context.sectionDayCapBySectionId
  );

  // Resolve pattern into blueprints
  const result = resolvePattern(
    subject,
    section,
    context.termId,
    programCode,
    context.teachers,
    context.assignments,
    context.availability,
    context.venues,
    context.existingEntries,
    {
      maxClassDaysPerWeek: sectionMaxClassDaysPerWeek,
      maxSubjectsPerDay: 5,
      avoidSingleSubjectOnePointFiveHourDay: true,
      onePointFivePackingMode: context.onePointFivePackingMode || 'balanced',
      reduceLongVacantGaps: true,
      longVacantGapMode: context.longVacantGapMode || 'balanced',
      longVacantThresholdMinutes: 180,
      enforceExactClassDaysPerWeek: true,
      enforceExactTeacherDaysPerWeek: true,
      preferNonConsecutiveSubjectDays: true,
    }
  );

  if (result.unassigned) {
    return {
      blueprints : [],
      conflicts  : [],
      unassigned : true,
      reason     : result.reason,
    };
  }

  // Check conflicts for each blueprint
  const validBlueprints = [];
  const conflicts       = [];

  for (const blueprint of result.blueprints) {
    await assertGenerationNotCancelled(
      cancellation,
      `subject_${subject.id}_conflict_check`
    );

    const proposedEntry = {
      ...blueprint,
      year_level  : section.year_level,
      program_code: programCode,
      venue       : blueprint._venue,
      subject     : blueprint._subject,
    };

    const detected = checkAllConflicts(
      proposedEntry,
      context.existingEntries
    );

    if (detected.length === 0) {
      validBlueprints.push(blueprint);
    } else {
      conflicts.push({
        blueprint,
        detected,
      });
    }
  }

  const detectedConflicts = conflicts.flatMap((entry) => {
    if (Array.isArray(entry?.detected)) return entry.detected;
    return entry?.type ? [entry] : [];
  });

  // Multi-session subjects must be placed fully or not at all.
  // Saving partial sessions creates inconsistent schedules.
  if (conflicts.length > 0 || validBlueprints.length !== result.blueprints.length) {
    return {
      blueprints : [],
      conflicts,
      unassigned : true,
      reason     : detectedConflicts.length > 0
        ? summarizeConflicts(detectedConflicts)
        : `Could not place all required sessions for ${subject.subject_code}.`,
    };
  }

  return {
    blueprints : validBlueprints,
    conflicts  : [],
    unassigned : false,
    reason     : null,
  };
}

// ============================================================
// SAVE BLUEPRINTS TO DATABASE
// ============================================================

/**
 * Save generated blueprints to schedule_entries table
 *
 * @param {Array}  blueprints
 * @param {string} termId
 * @returns {number} - count of saved entries
 */
async function saveBlueprints(blueprints, termId) {
  if (!blueprints || blueprints.length === 0) return 0;

  // Clean blueprints (remove enriched fields)
  const cleanedBlueprints = cleanBlueprints(blueprints).map((b) => ({
    ...b,
    term_id: termId,
  }));

  const { data, error } = await supabaseAdmin
    .from('schedule_entries')
    .insert(cleanedBlueprints)
    .select();

  if (error) {
    console.error('[saveBlueprints] Error:', error);
    throw error;
  }

  console.log(`[engine] Saved ${data.length} schedule entries.`);
  return data.length;
}

// ============================================================
// LOG CONFLICTS TO DATABASE
// ============================================================

/**
 * Save conflicts to schedule_conflicts table
 *
 * @param {Array}  conflicts
 * @param {string} termId
 */
async function logConflicts(conflicts, termId) {
  if (!conflicts || conflicts.length === 0) return;

  const records = [];

  for (const conflictGroup of conflicts) {
    // conflictGroup = {
    //   subject_id, subject_code, section_id, section_name,
    //   conflicts: [{ blueprint, detected:[{ type, description, entryId }] }]
    // }
    
    if (!conflictGroup.conflicts || conflictGroup.conflicts.length === 0) {
      continue;
    }

    for (const c of conflictGroup.conflicts) {
      const detectedList = Array.isArray(c?.detected)
        ? c.detected
        : (c?.type ? [c] : []);

      for (const detected of detectedList) {
        if (!detected.type) {
          console.warn('[logConflicts] Skipping conflict with no type:', detected);
          continue;
        }

        records.push({
          term_id      : termId,
          entry_a_id   : null, // not saved yet, blueprint only
          entry_b_id   : detected.entryId || null,
          conflict_type: detected.type,
          description  : detected.description || 'No description provided.',
          is_resolved  : false,
        });
      }
    }
  }

  if (records.length === 0) {
    console.log('[engine] No valid conflicts to log.');
    return;
  }

  const { error } = await supabaseAdmin
    .from('schedule_conflicts')
    .insert(records);

  if (error) {
    console.error('[logConflicts] Error:', error);
    throw error;
  }

  console.log(`[engine] Logged ${records.length} conflicts.`);
}

// ============================================================
// BUILD GENERATION SUMMARY
// ============================================================

/**
 * Build a summary object for the generation log
 *
 * @param {string} scope
 * @param {Object} scopeTarget
 * @param {string} regenerationMode
 * @param {number} entriesGenerated
 * @param {number} conflictsDetected
 * @param {number} unassignedCount
 * @param {Array}  results
 * @returns {Object}
 */
function buildGenerationSummary(
  scope,
  scopeTarget,
  regenerationMode,
  entriesGenerated,
  conflictsDetected,
  unassignedCount,
  results,
  strategyUsed,
  strategySummaries,
  scopedRebalanceInfo = null,
  variation = null,
  sectionDayCapRules = []
) {
  const notes = [];

  notes.push(`Scope: ${scope}`);
  notes.push(`Regeneration Mode: ${regenerationMode}`);
  if (strategyUsed) {
    notes.push(`Strategy: ${getStrategyLabel(strategyUsed)}`);
  }
  notes.push(`Sections Processed: ${results.length}`);
  notes.push(`Entries Generated: ${entriesGenerated}`);
  notes.push(`Conflicts Detected: ${conflictsDetected}`);
  notes.push(`Unassigned Subjects: ${unassignedCount}`);

  if (variation?.enabled) {
    notes.push(`Variation Mode: Whole-term reroll #${variation.iteration}`);
  }

  if (Array.isArray(sectionDayCapRules) && sectionDayCapRules.length > 0) {
    notes.push(`Section Day Caps Applied: ${sectionDayCapRules.length} rule(s)`);

    const formattedRules = sectionDayCapRules
      .map((rule) => {
        const programLabel = rule.program_code || rule.program_id;
        return `${programLabel} Year ${rule.year_level}: exactly ${rule.max_days_per_week} day(s)/week`;
      })
      .join('\n');

    notes.push(`\nSection Day Cap Rules:\n${formattedRules}`);
  }

  notes.push(
    'Session Density Policy: 1.5-hour sessions are prioritized on days that already have classes to avoid short single-subject days.'
  );

  notes.push(
    'Vacant Gap Policy: long intra-day vacant gaps (>=3 hours) are penalized during slot selection to keep class flow smoother across departments.'
  );

  notes.push(
    'Daily Subject Cap: each section is limited to max 5 unique subjects per day.'
  );

  notes.push(
    'Subject Spacing Policy: same-subject sessions are prioritized on non-consecutive days when feasible (especially split lecture/lab patterns).'
  );

  notes.push(
    'Teacher Day Policy: teacher assignment is prioritized to reach each teacher\'s max teaching days exactly when feasible, while still respecting hard availability/load constraints.'
  );

  if (scopedRebalanceInfo?.applied) {
    const rebalanceType = scopedRebalanceInfo.rebalance_type || 'neighbor';
    const candidateSetLabel =
      rebalanceType === 'in_scope' ? 'order variant set(s)' : 'neighbor set(s)';
    const neighborNames =
      scopedRebalanceInfo.neighbor_section_names?.join(', ') || 'N/A';
    const searchTierLabel =
      scopedRebalanceInfo.search_tier === 'extended'
        ? 'extended'
        : scopedRebalanceInfo.search_tier === 'none'
          ? 'none'
          : 'core';

    if (rebalanceType === 'in_scope') {
      notes.push(
        'Scoped local rebalance: reran in-scope section ordering variants to unlock constrained placements.'
      );
    } else {
      notes.push(
        `Scoped local rebalance: regenerated ${scopedRebalanceInfo.neighbor_sections_count} ` +
        `neighbor section(s) to unlock constrained placements.`
      );
    }

    notes.push(
      `Scoped local rebalance search: ${searchTierLabel} tier, ` +
      `${scopedRebalanceInfo.candidate_sets_tried || 0} ${candidateSetLabel}, ` +
      `${scopedRebalanceInfo.strategy_runs_tried || 0} strategy run(s).`
    );

    if (rebalanceType !== 'in_scope') {
      notes.push(`Scoped local rebalance neighbors: ${neighborNames}`);
    }

    notes.push(
      `Scoped local rebalance impact: target unassigned ` +
      `${scopedRebalanceInfo.target_before.unassignedCount} -> ` +
      `${scopedRebalanceInfo.target_after.unassignedCount}, target entries ` +
      `${scopedRebalanceInfo.target_before.entriesCount} -> ` +
      `${scopedRebalanceInfo.target_after.entriesCount}.`
    );
  } else if (scopedRebalanceInfo?.attempted) {
    const rebalanceType = scopedRebalanceInfo.rebalance_type || 'neighbor';
    const candidateSetLabel =
      rebalanceType === 'in_scope' ? 'order variant set(s)' : 'neighbor set(s)';
    const ranOutOfBudget = scopedRebalanceInfo.attempt_budget_exhausted;
    const searchTierLabel =
      scopedRebalanceInfo.search_tier === 'extended'
        ? 'extended'
        : scopedRebalanceInfo.search_tier === 'none'
          ? 'none'
          : 'core';
    const noNeighborCandidates = scopedRebalanceInfo.no_neighbor_candidates;
    const noNeighborPool = scopedRebalanceInfo.no_neighbor_pool;
    const noCandidateSets = scopedRebalanceInfo.no_candidate_sets;
    const noOrderVariants = scopedRebalanceInfo.no_order_variants;
    const noStrategyCandidates = scopedRebalanceInfo.no_strategy_candidates;

    let attemptOutcome =
      'but no better target-scope result was found under current constraints.';

    if (ranOutOfBudget) {
      attemptOutcome =
        'but no better target-scope result was found before the search budget was exhausted.';
    } else if (noStrategyCandidates) {
      attemptOutcome =
        'but no strategy candidates were available for scoped rebalance search.';
    } else if (noOrderVariants) {
      attemptOutcome =
        'but no in-scope ordering variants were available for scoped rebalance search.';
    } else if (noNeighborCandidates) {
      attemptOutcome =
        'but no eligible neighbor sections were identified for local rebalance under current data.';
    } else if (noNeighborPool) {
      attemptOutcome =
        'but neighbor sections could not be loaded for local rebalance.';
    } else if (noCandidateSets) {
      attemptOutcome =
        'but no rebalance candidate sets were available after neighbor filtering.';
    }

    notes.push(
      `Scoped local rebalance attempted: tried ${scopedRebalanceInfo.candidate_sets_tried || 0} ` +
      `${candidateSetLabel} across ${scopedRebalanceInfo.strategy_candidates_tried || 0} strategy candidate(s) ` +
      `(${scopedRebalanceInfo.strategy_runs_tried || 0} strategy run(s), ` +
      `${searchTierLabel} tier), ` +
      attemptOutcome
    );
  }

  if (scope !== 'whole_term' && regenerationMode !== 'full_regeneration') {
    notes.push(
      'Scoped run note: sections outside the selected scope were kept fixed. ' +
      'Program/year-level runs can report conflicts or unassigned subjects that ' +
      'disappear when running whole-term full regeneration because more sections can move.'
    );
  }

  if (regenerationMode === 'generate_unscheduled' && unassignedCount > 0) {
    notes.push(
      'Mode note: generate_unscheduled keeps current entries fixed, including ' +
      'selected-scope sections. If a remaining subject cannot fit, rerun the ' +
      'same scope using replace_section first.'
    );
  }

  if (unassignedCount > 0) {
    const unassignedList = results
      .flatMap((r) => r.unassigned)
      .map((u) => `${u.section_name} - ${u.subject_code}: ${u.reason}`)
      .join('\n');
    notes.push(`\nUnassigned Details:\n${unassignedList}`);
  }

  if (strategySummaries && strategySummaries.length > 1) {
    const summaryLines = strategySummaries
      .map((item) => {
        const label = getStrategyLabel(item.strategy);
        return `${label}: entries=${item.entriesCount}, ` +
               `unassigned=${item.unassignedCount}, conflicts=${item.conflictsCount}`;
      })
      .join('\n');
    notes.push(`\nStrategy Results:\n${summaryLines}`);
  }

  if (conflictsDetected > 0 || unassignedCount > 0) {
    const issueNotes = buildIssueNotes(results, {
      scope,
      regenerationMode,
    });

    if (issueNotes.diagnosisLines.length > 0) {
      notes.push('\nIssue Diagnosis:');
      notes.push(...issueNotes.diagnosisLines);
    }

    if (issueNotes.guideLines.length > 0) {
      notes.push('\nAdjustment Guide:');
      notes.push(...issueNotes.guideLines);
    }
  }

  return {
    scope,
    scopeTarget,
    regenerationMode,
    total_entries_generated : entriesGenerated,
    total_conflicts_detected: conflictsDetected,
    total_unassigned        : unassignedCount,
    generation_notes        : notes.join('\n'),
    strategy_used            : strategyUsed || null,
  };
}

const CONFLICT_TYPE_LABELS = {
  [CONFLICT_TYPES.TEACHER_CONFLICT]    : 'Teacher overlap',
  [CONFLICT_TYPES.ROOM_CONFLICT]       : 'Venue overlap',
  [CONFLICT_TYPES.SECTION_CONFLICT]    : 'Section overlap',
  [CONFLICT_TYPES.VENUE_MISMATCH]      : 'Venue type mismatch',
  [CONFLICT_TYPES.INVALID_ASSIGNMENT] : 'Venue program restriction',
  [CONFLICT_TYPES.SATURDAY_RESTRICTION]: 'Saturday restriction',
};

const UNASSIGNED_REASON_LABELS = {
  no_qualified_teacher : 'No qualified teacher assigned',
  teacher_availability: 'Teacher unavailable for required time',
  teacher_load_limit  : 'Teacher load/day limit reached',
  subject_day_cap     : 'Daily subject cap reached',
  venue_unavailable   : 'No suitable venue available',
  split_lec_lab_teacher_overlap : 'Lec/Lab secondary teacher overlap',
  split_lec_lab_secondary_venue : 'Lec/Lab secondary venue unavailable',
  split_lec_lab_availability_window: 'Lec/Lab secondary availability window mismatch',
  split_lec_lab       : 'Lecture/lab days could not align',
  combined_block      : 'No 5-hour block available',
  ojt_block           : 'No 6-hour OJT block available',
  no_time_slot        : 'No open time slot',
  other               : 'Other blockers',
};

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function formatCountSummary(counts, labelMap, limit = 6) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => `${labelMap[key] || key} (${count})`);
}

function classifyUnassignedReason(reason) {
  const text = String(reason || '').toLowerCase();

  if (!text) return 'other';
  if (text.includes('not assigned to teach')) return 'no_qualified_teacher';
  if (text.includes('not available on') || text.includes('availability window')) {
    return 'teacher_availability';
  }
  if (text.includes('max teaching days') || text.includes('max load units')) {
    return 'teacher_load_limit';
  }
  if (text.includes('split_lec_lab')) {
    if (text.includes('teacher time overlap')) {
      return 'split_lec_lab_teacher_overlap';
    }
    if (text.includes('no available lab/lecture venue on secondary day')) {
      return 'split_lec_lab_secondary_venue';
    }
    if (text.includes('outside availability window')) {
      return 'split_lec_lab_availability_window';
    }

    return 'split_lec_lab';
  }
  if (text.includes('no 5-hour block')) return 'combined_block';
  if (text.includes('ojt')) return 'ojt_block';
  if (text.includes('venue')) return 'venue_unavailable';
  if (text.includes('daily subject cap')) return 'subject_day_cap';
  if (
    text.includes('no available slot') ||
    text.includes('no free') ||
    text.includes('could only schedule') ||
    text.includes('no valid') ||
    text.includes('no 3h block') ||
    text.includes('no 6-hour block')
  ) {
    return 'no_time_slot';
  }

  return 'other';
}

function buildIssueNotes(results, options = {}) {
  const {
    scope = 'program',
    regenerationMode = 'generate_unscheduled',
  } = options;

  const diagnosisLines = [];
  const guideLines = [];

  const conflictObjects = results
    .flatMap((sectionResult) => sectionResult.conflicts || [])
    .flatMap((subjectConflict) => subjectConflict.conflicts || [])
    .flatMap((conflictEntry) => conflictEntry.detected || []);

  const conflictCounts = countBy(conflictObjects, (conflict) => conflict.type);
  const conflictSummary = formatCountSummary(
    conflictCounts,
    CONFLICT_TYPE_LABELS
  );

  if (conflictSummary.length > 0) {
    diagnosisLines.push(`- Conflicts by type: ${conflictSummary.join(', ')}`);
  }

  const unassignedReasons = results
    .flatMap((sectionResult) => sectionResult.unassigned || [])
    .map((item) => item.reason)
    .filter(Boolean);

  const splitReasonText = unassignedReasons
    .filter((reason) => String(reason || '').includes('split_lec_lab'))
    .join(' ')
    .toLowerCase();
  const shortSessionReasonText = unassignedReasons
    .filter((reason) => {
      const text = String(reason || '').toLowerCase();
      return (
        text.includes('1.5h x2') ||
        text.includes('split lecture') ||
        text.includes('short single-subject days')
      );
    })
    .join(' ')
    .toLowerCase();

  const reasonCounts = countBy(unassignedReasons, classifyUnassignedReason);
  const reasonSummary = formatCountSummary(
    reasonCounts,
    UNASSIGNED_REASON_LABELS
  );

  if (reasonSummary.length > 0) {
    diagnosisLines.push(`- Unassigned blockers: ${reasonSummary.join(', ')}`);
  }

  if (splitReasonText.includes('teacher time overlap')) {
    diagnosisLines.push(
      '- Split lec/lab secondary blocker detail: teacher overlap on candidate secondary slots.'
    );
  }

  if (splitReasonText.includes('no available lab/lecture venue on secondary day')) {
    diagnosisLines.push(
      '- Split lec/lab secondary blocker detail: no compatible venue available on candidate secondary slots.'
    );
  }

  if (shortSessionReasonText) {
    diagnosisLines.push(
      '- Short-session packing blocker detail: 1.5-hour split sessions could not be aligned into stronger day bundles under current section caps.'
    );
  }

  const conflictTypes = new Set(Object.keys(conflictCounts));
  if (conflictTypes.has(CONFLICT_TYPES.TEACHER_CONFLICT)) {
    guideLines.push(
      '- Teacher conflict: move overlapping blocks, widen availability, or add another qualified teacher.'
    );
  }
  if (conflictTypes.has(CONFLICT_TYPES.ROOM_CONFLICT)) {
    guideLines.push(
      '- Venue conflict: free up the room or add another venue of the same type.'
    );
  }
  if (conflictTypes.has(CONFLICT_TYPES.SECTION_CONFLICT)) {
    guideLines.push(
      '- Section conflict: move one of the section blocks to a free time slot.'
    );
  }
  if (conflictTypes.has(CONFLICT_TYPES.VENUE_MISMATCH)) {
    guideLines.push(
      '- Venue mismatch: update the subject required venue type/subtype or correct venue data.'
    );
  }
  if (conflictTypes.has(CONFLICT_TYPES.INVALID_ASSIGNMENT)) {
    guideLines.push(
      '- Venue restriction: move the class to a venue allowed for the program.'
    );
  }
  if (conflictTypes.has(CONFLICT_TYPES.SATURDAY_RESTRICTION)) {
    guideLines.push(
      '- Saturday restriction: move Year 1 regular subjects to Mon-Fri; Saturday is for NSTP only.'
    );
  }

  const reasonKeys = new Set(Object.keys(reasonCounts));
  if (reasonKeys.has('no_qualified_teacher')) {
    guideLines.push(
      '- No qualified teacher: add a teacher-subject assignment for this term.'
    );
  }
  if (reasonKeys.has('teacher_availability')) {
    guideLines.push(
      '- Teacher unavailable: expand availability hours or adjust assigned days.'
    );
  }
  if (reasonKeys.has('teacher_load_limit')) {
    guideLines.push(
      '- Teacher load limits: increase max load/days or add another qualified teacher.'
    );
  }
  if (reasonKeys.has('subject_day_cap')) {
    guideLines.push(
      '- Daily subject cap: move one subject from that day or open another section day to stay within the 5-subject/day limit.'
    );
  }
  if (reasonKeys.has('venue_unavailable')) {
    guideLines.push(
      '- Venue unavailable: add more venues with the required type/subtype or free existing slots.'
    );
  }
  const hasSplitLecLabIssue =
    reasonKeys.has('split_lec_lab') ||
    reasonKeys.has('split_lec_lab_teacher_overlap') ||
    reasonKeys.has('split_lec_lab_secondary_venue') ||
    reasonKeys.has('split_lec_lab_availability_window');

  if (hasSplitLecLabIssue) {
    guideLines.push(
      '- Lec/Lab split: ensure two separate days with both lecture and lab venues plus matching teacher availability.'
    );

    if (scope !== 'whole_term' && regenerationMode !== 'full_regeneration') {
      guideLines.push(
        '- Scoped limitation: outside-scope entries are fixed in this run, so teacher/venue overlaps can persist even if whole-term full regeneration succeeds.'
      );
    }

    if (splitReasonText.includes('teacher time overlap')) {
      if (scope === 'whole_term' && regenerationMode === 'full_regeneration') {
        guideLines.push(
          '- Lec/Lab split (teacher overlap): use Reroll Alternative, Bottleneck Rescue (Long Block + Split), or Venue Pressure First to generate a different whole-term placement order.'
        );
      } else {
        guideLines.push(
          '- Lec/Lab split (teacher overlap): free one secondary-day slot for the assigned teacher or rerun this scope with Replace Section Schedules.'
        );
      }
    }

    if (splitReasonText.includes('no available lab/lecture venue on secondary day')) {
      if (scope === 'whole_term' && regenerationMode === 'full_regeneration') {
        guideLines.push(
          '- Lec/Lab split (secondary venue): use Reroll Alternative, Bottleneck Rescue (Long Block + Split), or Venue Pressure First so venue-heavy sections are prioritized differently.'
        );
      } else {
        guideLines.push(
          '- Lec/Lab split (secondary venue): reserve one secondary-day lecture/lab venue by moving competing entries or adding another compatible venue.'
        );
      }
    }

    if (splitReasonText.includes('outside availability window')) {
      guideLines.push(
        '- Lec/Lab split (availability window): widen the assigned teacher availability on the secondary day or assign another qualified teacher with a compatible window.'
      );
    }
  }
  if (reasonKeys.has('combined_block')) {
    if (scope === 'whole_term' && regenerationMode === 'full_regeneration') {
      guideLines.push(
        '- Combined block: try Reroll Alternative, Bottleneck Rescue (Long Block + Split), or Venue Pressure First to prioritize long-block sections earlier.'
      );
    } else {
      guideLines.push(
        '- Combined block: open a continuous 5-hour slot and ensure a compatible venue exists.'
      );
    }
  }
  if (reasonKeys.has('ojt_block')) {
    guideLines.push(
      '- OJT block: provide a continuous 6-hour slot and an OJT or OFF CAMPUS venue.'
    );
  }
  if (reasonKeys.has('no_time_slot')) {
    guideLines.push(
      '- No time slot: free section time by moving fixed entries or reducing constraints.'
    );

    if (shortSessionReasonText) {
      guideLines.push(
        '- Short-session packing: try Session Density First (1.5h + Gap Smoothing) to prioritize sections with many 1.5-hour splits and reduce isolated short-day outcomes.'
      );
    }
  }

  if (guideLines.length > 0) {
    guideLines.push('- After adjustments, run Generate Again to re-evaluate.');
  }

  return { diagnosisLines, guideLines };
}

// ============================================================
// CREATE GENERATION LOG
// ============================================================

/**
 * Save generation log to schedule_generation_logs table
 *
 * @param {Object} summary
 * @param {string} termId
 * @returns {string} - log UUID
 */
async function createGenerationLog(summary, termId) {
  const { data, error } = await supabaseAdmin
    .from('schedule_generation_logs')
    .insert({
      term_id                 : termId,
      scope                   : summary.scope,
      regeneration_mode       : summary.regenerationMode,
      scope_target            : summary.scopeTarget,
      total_entries_generated : summary.total_entries_generated,
      total_conflicts_detected: summary.total_conflicts_detected,
      total_unassigned        : summary.total_unassigned,
      generation_notes        : summary.generation_notes,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[createGenerationLog] Error:', error);
    throw error;
  }

  console.log(`[engine] Generation log created: ${data.id}`);
  return data.id;
}

function resolveStrategyKey(strategy) {
  if (strategy === 'auto_best') return 'auto_best';
  if (STRATEGY_PRESETS[strategy]) return strategy;
  return 'auto_best';
}

function getStrategyLabel(strategy) {
  if (strategy === 'auto_best') return 'Auto Best';
  return STRATEGY_PRESETS[strategy]?.label || strategy;
}

function normalizeDeliveryPatternForScoring(subject = {}) {
  const subjectType = String(subject.subject_type || '').toLowerCase();
  const deliveryPattern = String(subject.delivery_pattern || '').toLowerCase();

  if (subjectType === 'lecture_lab') {
    if (deliveryPattern === 'combined_lec_lab') return 'combined_lec_lab';
    return 'split_lec_lab';
  }

  if (subjectType === 'lecture_only') {
    if (deliveryPattern === 'split_lecture_only') return 'split_lecture_only';
    if (deliveryPattern === 'single_day') return 'single_day';
    return 'flexible';
  }

  return deliveryPattern || 'single_day';
}

function buildSectionConstraintScores(context) {
  const { sections, subjects, assignments, term } = context;

  const getSubjectDifficulty = (subject, qualifiedCount) => {
    let score = 0;

    if (subject.delivery_pattern === 'combined_lec_lab') score += 12;
    if (subject.delivery_pattern === 'split_lec_lab') score += 10;
    if (subject.delivery_pattern === 'split_lecture_only') score += 6;
    if (subject.delivery_pattern === 'flexible') score += 4;

    if (subject.subject_type === 'lecture_lab') score += 4;

    // Fewer qualified teachers = harder to place
    if (qualifiedCount <= 1) score += 10;
    else if (qualifiedCount === 2) score += 6;
    else if (qualifiedCount === 3) score += 3;

    return score;
  };

  const scores = new Map();

  sections.forEach((section) => {
    const curriculumSubjects = subjects[section.curriculum_version_id] || [];

    const sectionSubjects = curriculumSubjects.filter(
      (subj) =>
        String(subj.year_level) === String(section.year_level) &&
        subj.semester === term.semester &&
        !shouldSkipSubject(subj)
    );

    const constraintScore = sectionSubjects.reduce((total, subj) => {
      const qualifiedCount = assignments.filter((a) => a.subject_id === subj.id).length;
      return total + getSubjectDifficulty(subj, qualifiedCount);
    }, 0);

    scores.set(section.id, constraintScore);
  });

  return scores;
}

function buildSectionVenuePressureScores(context) {
  const { sections, subjects, term } = context;
  const scores = new Map();

  sections.forEach((section) => {
    const curriculumSubjects = subjects[section.curriculum_version_id] || [];

    const sectionSubjects = curriculumSubjects.filter(
      (subj) =>
        String(subj.year_level) === String(section.year_level) &&
        subj.semester === term.semester &&
        !shouldSkipSubject(subj)
    );

    const pressureScore = sectionSubjects.reduce((total, subject) => {
      const pattern = normalizeDeliveryPatternForScoring(subject);
      const requiredVenueType = String(subject.required_venue_type || '').toLowerCase();
      const hasSpecializedVenueType =
        requiredVenueType && requiredVenueType !== 'classroom';
      const hasVenueSubtype = Boolean(subject.required_venue_subtype);
      const creditUnits = Number(subject.credit_units || 0);

      let score = 0;

      if (pattern === 'combined_lec_lab') score += 16;
      if (pattern === 'split_lec_lab') score += 14;
      if (subject.subject_type === 'lecture_lab') score += 8;
      if (subject.subject_type === 'ojt') score += 12;
      if (hasSpecializedVenueType) score += 8;
      if (hasVenueSubtype) score += 3;
      if (creditUnits >= 4) score += 4;

      return total + score;
    }, 0);

    scores.set(section.id, pressureScore);
  });

  return scores;
}

function buildSectionBottleneckScores(context) {
  const {
    sections,
    subjects,
    assignments,
    term,
    sectionDayCapBySectionId = new Map(),
  } = context;
  const scores = new Map();

  const qualifiedCountBySubjectId = new Map();

  for (const assignment of assignments || []) {
    const subjectId = assignment?.subject_id;
    if (!subjectId) continue;

    qualifiedCountBySubjectId.set(
      subjectId,
      (qualifiedCountBySubjectId.get(subjectId) || 0) + 1
    );
  }

  sections.forEach((section) => {
    const curriculumSubjects = subjects[section.curriculum_version_id] || [];

    const sectionSubjects = curriculumSubjects.filter(
      (subj) =>
        String(subj.year_level) === String(section.year_level) &&
        subj.semester === term.semester &&
        !shouldSkipSubject(subj)
    );

    const dayCap = getSectionDayCapValue(section, sectionDayCapBySectionId);

    const sectionScore = sectionSubjects.reduce((total, subject) => {
      const pattern = normalizeDeliveryPatternForScoring(subject);
      const requiredVenueType = String(subject.required_venue_type || '').toLowerCase();
      const hasSpecializedVenueType =
        requiredVenueType && requiredVenueType !== 'classroom';
      const hasVenueSubtype = Boolean(subject.required_venue_subtype);
      const creditUnits = Number(subject.credit_units || 0);
      const qualifiedCount = qualifiedCountBySubjectId.get(subject.id) || 0;

      let score = 0;

      if (pattern === 'combined_lec_lab') score += 30;
      else if (pattern === 'split_lec_lab') score += 24;
      else if (pattern === 'split_lecture_only') score += 10;
      else if (pattern === 'flexible') score += 6;

      if (subject.subject_type === 'ojt') score += 32;

      if (creditUnits >= 5) score += 10;
      else if (creditUnits >= 4) score += 5;

      if (qualifiedCount <= 1) score += 18;
      else if (qualifiedCount === 2) score += 11;
      else if (qualifiedCount === 3) score += 5;

      if (hasSpecializedVenueType) score += 10;
      if (hasVenueSubtype) score += 4;

      return total + score;
    }, 0);

    let finalScore = sectionScore;

    if (Number.isFinite(dayCap)) {
      if (dayCap <= 4) finalScore += 16;
      else if (dayCap === 5) finalScore += 8;
    }

    const yearLevel = Number(section.year_level || 0);
    if (yearLevel >= 3) {
      finalScore += 3;
    }

    scores.set(section.id, finalScore);
  });

  return scores;
}

function getVenuePressureScore(section, scores) {
  return scores.get(section.id) || 0;
}

function getBottleneckScore(section, scores) {
  return scores.get(section.id) || 0;
}

function getSectionDayCapValue(section, sectionDayCapBySectionId = null) {
  if (!sectionDayCapBySectionId || !section?.id) return null;

  const rawValue = sectionDayCapBySectionId.get(section.id);
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.floor(parsed);
}

function buildSectionSessionDensityScores(context) {
  const { sections, subjects, term, sectionDayCapBySectionId = new Map() } = context;
  const scores = new Map();

  sections.forEach((section) => {
    const curriculumSubjects = subjects[section.curriculum_version_id] || [];

    const sectionSubjects = curriculumSubjects.filter(
      (subj) =>
        String(subj.year_level) === String(section.year_level) &&
        subj.semester === term.semester &&
        !shouldSkipSubject(subj)
    );

    let score = 0;

    sectionSubjects.forEach((subject) => {
      const pattern = normalizeDeliveryPatternForScoring(subject);

      if (pattern === 'split_lecture_only') {
        score += 18;
      } else if (pattern === 'flexible') {
        score += 7;
      }
    });

    const dayCap = getSectionDayCapValue(section, sectionDayCapBySectionId);
    if (Number.isFinite(dayCap)) {
      if (dayCap <= 4) score += 16;
      else if (dayCap === 5) score += 8;
    }

    scores.set(section.id, score);
  });

  return scores;
}

function getSessionDensityScore(section, scores) {
  return scores.get(section.id) || 0;
}

function analyzeGenerationPressure(context) {
  const { sections, subjects, term } = context;
  const sectionCount = sections.length || 1;

  let totalSubjects = 0;
  let splitCombinedSubjects = 0;
  let venueHeavySubjects = 0;
  let longBlockSubjects = 0;
  let shortSessionSubjects = 0;
  let highYearSections = 0;
  let lowYearSections = 0;

  sections.forEach((section) => {
    const yearLevel = Number(section.year_level || 0);
    if (yearLevel >= 3) highYearSections += 1;
    if (yearLevel <= 2) lowYearSections += 1;

    const curriculumSubjects = subjects[section.curriculum_version_id] || [];

    const sectionSubjects = curriculumSubjects.filter(
      (subj) =>
        String(subj.year_level) === String(section.year_level) &&
        subj.semester === term.semester &&
        !shouldSkipSubject(subj)
    );

    totalSubjects += sectionSubjects.length;

    sectionSubjects.forEach((subject) => {
      const pattern = normalizeDeliveryPatternForScoring(subject);
      const requiredVenueType = String(subject.required_venue_type || '').toLowerCase();
      const creditUnits = Number(subject.credit_units || 0);

      if (pattern === 'split_lec_lab' || pattern === 'combined_lec_lab') {
        splitCombinedSubjects += 1;
      }

      if (
        (requiredVenueType && requiredVenueType !== 'classroom') ||
        subject.required_venue_subtype
      ) {
        venueHeavySubjects += 1;
      }

      if (
        pattern === 'combined_lec_lab' ||
        subject.subject_type === 'ojt' ||
        creditUnits >= 5
      ) {
        longBlockSubjects += 1;
      }

      if (pattern === 'split_lecture_only') {
        shortSessionSubjects += 1;
      } else if (pattern === 'flexible') {
        shortSessionSubjects += 0.5;
      }
    });
  });

  const totalConstraintScore = [...(context.sectionConstraintScores?.values() || [])]
    .reduce((sum, score) => sum + Number(score || 0), 0);

  const sectionDayCaps = sections
    .map((section) => getSectionDayCapValue(section, context.sectionDayCapBySectionId))
    .filter((value) => Number.isFinite(value));

  const strictDayCapCount = sectionDayCaps.filter((value) => value <= 4).length;

  const safeSubjectCount = Math.max(totalSubjects, 1);
  const safeDayCapCount = Math.max(sectionDayCaps.length, 1);

  return {
    totalSections: sections.length,
    splitCombinedRatio: splitCombinedSubjects / safeSubjectCount,
    shortSessionRatio: shortSessionSubjects / safeSubjectCount,
    venueHeavyRatio: venueHeavySubjects / safeSubjectCount,
    longBlockRatio: longBlockSubjects / safeSubjectCount,
    highYearRatio: highYearSections / sectionCount,
    lowYearRatio: lowYearSections / sectionCount,
    averageConstraintScore:
      sections.length > 0 ? totalConstraintScore / sections.length : 0,
    hasSectionDayCaps: sectionDayCaps.length > 0,
    strictDayCapRatio: strictDayCapCount / safeDayCapCount,
  };
}

function getStrategyHeuristicScore(strategy, pressure) {
  const baseScores = {
    day_cap_tightest_first: 56,
    session_density_first: 54,
    bottleneck_rescue: 53,
    year_desc_reverse_subjects: 54,
    year_desc_constraints: 52,
    constraints_only: 50,
    constraints_reverse_subjects: 49,
    venue_pressure_constraints: 48,
    year_asc_constraints: 44,
    year_asc_reverse_subjects: 42,
  };

  let score = baseScores[strategy] || 40;

  if (pressure.splitCombinedRatio >= 0.24) {
    if (strategy === 'bottleneck_rescue') {
      score += 14;
    }

    if (
      strategy === 'year_desc_reverse_subjects' ||
      strategy === 'constraints_reverse_subjects' ||
      strategy === 'year_asc_reverse_subjects'
    ) {
      score += 12;
    }
    if (strategy === 'constraints_only') {
      score += 6;
    }
  }

  if (pressure.hasSectionDayCaps) {
    if (strategy === 'day_cap_tightest_first') {
      score += 24;
    }

    if (strategy === 'session_density_first') {
      score += 10;
    }

    if (pressure.strictDayCapRatio >= 0.35) {
      if (strategy === 'bottleneck_rescue') {
        score += 12;
      }

      if (
        strategy === 'constraints_only' ||
        strategy === 'constraints_reverse_subjects'
      ) {
        score += 8;
      }
      if (
        strategy === 'year_desc_reverse_subjects' ||
        strategy === 'year_desc_constraints'
      ) {
        score += 6;
      }
    }
  }

  if (pressure.shortSessionRatio >= 0.14) {
    if (strategy === 'session_density_first') {
      score += 20;
    }

    if (strategy === 'day_cap_tightest_first') {
      score += 6;
    }
  }

  if (pressure.venueHeavyRatio >= 0.18 || pressure.longBlockRatio >= 0.12) {
    if (strategy === 'bottleneck_rescue') {
      score += 22;
    }

    if (strategy === 'venue_pressure_constraints') {
      score += 20;
    }
    if (strategy === 'year_desc_reverse_subjects') {
      score += 6;
    }
  }

  if (pressure.highYearRatio >= 0.45) {
    if (
      strategy === 'year_desc_constraints' ||
      strategy === 'year_desc_reverse_subjects'
    ) {
      score += 8;
    }
  }

  if (pressure.lowYearRatio >= 0.5) {
    if (
      strategy === 'year_asc_constraints' ||
      strategy === 'year_asc_reverse_subjects'
    ) {
      score += 8;
    }
  }

  if (pressure.averageConstraintScore >= 70) {
    if (strategy === 'bottleneck_rescue') {
      score += 6;
    }

    if (
      strategy === 'constraints_only' ||
      strategy === 'constraints_reverse_subjects'
    ) {
      score += 7;
    }
  }

  if (pressure.totalSections >= 35 && strategy === 'venue_pressure_constraints') {
    score += 6;
  }

  if (pressure.totalSections >= 35 && strategy === 'bottleneck_rescue') {
    score += 5;
  }

  return score;
}

function getAutoBestStrategyOrder(context, strategies = AUTO_BEST_STRATEGIES) {
  const pressure = analyzeGenerationPressure(context);

  let candidateStrategies = pressure.hasSectionDayCaps
    ? [...strategies]
    : strategies.filter((strategy) => strategy !== 'day_cap_tightest_first');

  if (pressure.splitCombinedRatio < 0.16 && pressure.longBlockRatio < 0.1) {
    candidateStrategies = candidateStrategies.filter(
      (strategy) => strategy !== 'bottleneck_rescue'
    );
  }

  if (candidateStrategies.length === 0) {
    candidateStrategies = [...strategies];
  }

  const ranked = [...candidateStrategies]
    .map((strategy, index) => ({
      strategy,
      index,
      score: getStrategyHeuristicScore(strategy, pressure),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.index - right.index;
    })
    .map((item) => item.strategy);

  return ranked.slice(0, Math.min(AUTO_BEST_MAX_STRATEGIES, ranked.length));
}

function getConstraintScore(section, scores) {
  return scores.get(section.id) || 0;
}

function compareSectionName(sectionA, sectionB) {
  const a = String(sectionA.section_name || '');
  const b = String(sectionB.section_name || '');
  return a.localeCompare(b);
}

function sortSectionsByStrategy(context, sectionSort) {
  const scores =
    context.sectionConstraintScores || buildSectionConstraintScores(context);
  const venuePressureScores =
    context.sectionVenuePressureScores || buildSectionVenuePressureScores(context);
  const bottleneckScores =
    context.sectionBottleneckScores || buildSectionBottleneckScores(context);
  const sessionDensityScores =
    context.sectionSessionDensityScores || buildSectionSessionDensityScores(context);
  const sectionDayCapBySectionId = context.sectionDayCapBySectionId || new Map();
  const sections = [...context.sections];
  const variation = context.variation;

  switch (sectionSort) {
    case 'day_cap_tightest_first':
      return sections.sort((a, b) => {
        const dayCapA = getSectionDayCapValue(a, sectionDayCapBySectionId);
        const dayCapB = getSectionDayCapValue(b, sectionDayCapBySectionId);
        const normalizedDayCapA = Number.isFinite(dayCapA) ? dayCapA : 99;
        const normalizedDayCapB = Number.isFinite(dayCapB) ? dayCapB : 99;

        if (normalizedDayCapA !== normalizedDayCapB) {
          return normalizedDayCapA - normalizedDayCapB;
        }

        const scoreDiff = getConstraintScore(b, scores) - getConstraintScore(a, scores);
        if (scoreDiff !== 0) return scoreDiff;

        const yearA = Number(a.year_level || 0);
        const yearB = Number(b.year_level || 0);
        if (yearA !== yearB) return yearB - yearA;

        const variationDiff = compareByVariationKey(
          a.id,
          b.id,
          variation,
          'day_cap_tightest_first_tie'
        );
        if (variationDiff !== 0) return variationDiff;

        return compareSectionName(a, b);
      });

    case 'bottleneck_rescue':
      return sections.sort((a, b) => {
        const bottleneckDiff =
          getBottleneckScore(b, bottleneckScores) -
          getBottleneckScore(a, bottleneckScores);
        if (bottleneckDiff !== 0) return bottleneckDiff;

        const venuePressureDiff =
          getVenuePressureScore(b, venuePressureScores) -
          getVenuePressureScore(a, venuePressureScores);
        if (venuePressureDiff !== 0) return venuePressureDiff;

        const scoreDiff = getConstraintScore(b, scores) - getConstraintScore(a, scores);
        if (scoreDiff !== 0) return scoreDiff;

        const yearA = Number(a.year_level || 0);
        const yearB = Number(b.year_level || 0);
        if (yearA !== yearB) return yearB - yearA;

        const variationDiff = compareByVariationKey(
          a.id,
          b.id,
          variation,
          'bottleneck_rescue_tie'
        );
        if (variationDiff !== 0) return variationDiff;

        return compareSectionName(a, b);
      });

    case 'session_density_first':
      return sections.sort((a, b) => {
        const densityDiff =
          getSessionDensityScore(b, sessionDensityScores) -
          getSessionDensityScore(a, sessionDensityScores);
        if (densityDiff !== 0) return densityDiff;

        const dayCapA = getSectionDayCapValue(a, sectionDayCapBySectionId);
        const dayCapB = getSectionDayCapValue(b, sectionDayCapBySectionId);
        const normalizedDayCapA = Number.isFinite(dayCapA) ? dayCapA : 99;
        const normalizedDayCapB = Number.isFinite(dayCapB) ? dayCapB : 99;

        if (normalizedDayCapA !== normalizedDayCapB) {
          return normalizedDayCapA - normalizedDayCapB;
        }

        const scoreDiff = getConstraintScore(b, scores) - getConstraintScore(a, scores);
        if (scoreDiff !== 0) return scoreDiff;

        const yearA = Number(a.year_level || 0);
        const yearB = Number(b.year_level || 0);
        if (yearA !== yearB) return yearB - yearA;

        const variationDiff = compareByVariationKey(
          a.id,
          b.id,
          variation,
          'session_density_first_tie'
        );
        if (variationDiff !== 0) return variationDiff;

        return compareSectionName(a, b);
      });

    case 'venue_pressure_constraints':
      return sections.sort((a, b) => {
        const venuePressureDiff =
          getVenuePressureScore(b, venuePressureScores) -
          getVenuePressureScore(a, venuePressureScores);
        if (venuePressureDiff !== 0) return venuePressureDiff;

        const scoreDiff = getConstraintScore(b, scores) - getConstraintScore(a, scores);
        if (scoreDiff !== 0) return scoreDiff;

        const yearA = Number(a.year_level || 0);
        const yearB = Number(b.year_level || 0);
        if (yearA !== yearB) return yearB - yearA;

        const variationDiff = compareByVariationKey(
          a.id,
          b.id,
          variation,
          'venue_pressure_constraints_tie'
        );
        if (variationDiff !== 0) return variationDiff;

        return compareSectionName(a, b);
      });

    case 'constraints_only':
      return sections.sort((a, b) => {
        const scoreDiff = getConstraintScore(b, scores) - getConstraintScore(a, scores);
        if (scoreDiff !== 0) return scoreDiff;

        const variationDiff = compareByVariationKey(
          a.id,
          b.id,
          variation,
          'constraints_only_tie'
        );
        if (variationDiff !== 0) return variationDiff;

        return compareSectionName(a, b);
      });

    case 'year_asc_constraints':
      return sections.sort((a, b) => {
        const yearA = Number(a.year_level || 0);
        const yearB = Number(b.year_level || 0);
        if (yearA !== yearB) return yearA - yearB;

        const scoreDiff = getConstraintScore(b, scores) - getConstraintScore(a, scores);
        if (scoreDiff !== 0) return scoreDiff;

        const variationDiff = compareByVariationKey(
          a.id,
          b.id,
          variation,
          'year_asc_constraints_tie'
        );
        if (variationDiff !== 0) return variationDiff;

        return compareSectionName(a, b);
      });

    case 'year_desc_constraints':
    default:
      return sections.sort((a, b) => {
        const yearA = Number(a.year_level || 0);
        const yearB = Number(b.year_level || 0);
        if (yearA !== yearB) return yearB - yearA;

        const scoreDiff = getConstraintScore(b, scores) - getConstraintScore(a, scores);
        if (scoreDiff !== 0) return scoreDiff;

        const variationDiff = compareByVariationKey(
          a.id,
          b.id,
          variation,
          'year_desc_constraints_tie'
        );
        if (variationDiff !== 0) return variationDiff;

        return compareSectionName(a, b);
      });
  }
}

async function runStrategy(context, strategyKey, regenerationMode, cancellation = null) {
  const baseConfig = STRATEGY_PRESETS[strategyKey] || STRATEGY_PRESETS.year_desc_constraints;
  const variation = context.variation;
  const onePointFivePackingMode = baseConfig.onePointFivePackingMode || 'balanced';
  const longVacantGapMode = baseConfig.longVacantGapMode || 'balanced';
  const alternateSubjectOrder =
    baseConfig.subjectOrder === 'reverse' ? 'normal' : 'reverse';

  const primarySubjectOrder = variation?.enabled
    ? (getVariationHash(variation, `strategy_primary_subject|${strategyKey}`) % 2 === 0
      ? baseConfig.subjectOrder
      : alternateSubjectOrder)
    : baseConfig.subjectOrder;

  const primaryReverseSections = variation?.enabled
    ? getVariationHash(variation, `strategy_primary_reverse|${strategyKey}`) % 2 === 1
    : false;

  await assertGenerationNotCancelled(
    cancellation,
    `strategy_${strategyKey}_primary`
  );

  const primaryResults = await runGeneration(context, {
    sectionSort  : baseConfig.sectionSort,
    subjectOrder : primarySubjectOrder,
    onePointFivePackingMode,
    longVacantGapMode,
    reverseSections: primaryReverseSections,
  }, cancellation);
  const primarySummary = summarizeResults(primaryResults);

  let results = primaryResults;

  if (shouldRetryWithAlternateOrdering(regenerationMode, primarySummary)) {
    await assertGenerationNotCancelled(
      cancellation,
      `strategy_${strategyKey}_retry`
    );

    console.warn(
      `[generateSchedule] Strategy ${getStrategyLabel(strategyKey)}: retrying with alternate ordering...`
    );
    const retryResults = await runGeneration(context, {
      sectionSort  : baseConfig.sectionSort,
      subjectOrder : primarySubjectOrder === 'reverse' ? 'normal' : 'reverse',
      onePointFivePackingMode,
      longVacantGapMode,
      reverseSections: !primaryReverseSections,
    }, cancellation);

    results = chooseBetterResult(primaryResults, retryResults);
  }

  return results;
}

async function runGeneration(context, options = {}, cancellation = null) {
  const {
    sectionSort    = 'year_desc_constraints',
    subjectOrder   = 'normal',
    onePointFivePackingMode = 'balanced',
    longVacantGapMode = 'balanced',
    reverseSections = false,
    sectionOrderOverride = null,
  } = options;

  const orderedSections =
    Array.isArray(sectionOrderOverride) && sectionOrderOverride.length > 0
      ? [...sectionOrderOverride]
      : sortSectionsByStrategy(context, sectionSort);
  const variedSections =
    Array.isArray(sectionOrderOverride) && sectionOrderOverride.length > 0
      ? orderedSections
      : applySectionOrderVariation(orderedSections, context.variation, sectionSort);
  const finalSections = reverseSections
    ? [...variedSections].reverse()
    : variedSections;

  const results = [];
  const existingEntriesWorking = [...context.existingEntries];

  await assertGenerationNotCancelled(cancellation, 'run_generation_start');

  for (const section of finalSections) {
    await assertGenerationNotCancelled(
      cancellation,
      `run_generation_section_${section.id}`
    );

    const sectionContext = {
      ...context,
      existingEntries: existingEntriesWorking,
      subjectOrder,
      onePointFivePackingMode,
      longVacantGapMode,
    };

    const sectionResult = await generateForSection(
      section,
      sectionContext,
      cancellation
    );
    results.push(sectionResult);

    existingEntriesWorking.push(...sectionResult.blueprints);
  }

  return results;
}

function shouldRetryWithAlternateOrdering(regenerationMode, summary) {
  if (!summary) return false;

  if (summary.conflictsCount > 0 || summary.unassignedCount > 0) {
    return true;
  }

  if (regenerationMode === 'full_regeneration' && summary.entriesCount === 0) {
    return true;
  }

  return false;
}

function chooseBetterResult(primaryResults, retryResults) {
  const primarySummary = summarizeResults(primaryResults);
  const retrySummary = summarizeResults(retryResults);

  // Primary decision: fewer detected conflict events is always better.
  if (retrySummary.conflictsCount < primarySummary.conflictsCount) {
    return retryResults;
  }

  if (retrySummary.conflictsCount > primarySummary.conflictsCount) {
    return primaryResults;
  }

  if (retrySummary.unassignedCount < primarySummary.unassignedCount) {
    return retryResults;
  }

  if (retrySummary.unassignedCount > primarySummary.unassignedCount) {
    return primaryResults;
  }

  if (retrySummary.entriesCount > primarySummary.entriesCount) {
    return retryResults;
  }

  if (retrySummary.entriesCount < primarySummary.entriesCount) {
    return primaryResults;
  }

  return primaryResults;
}

function shouldAttemptScopedNeighborRebalance(
  scope,
  regenerationMode,
  results,
  targetSectionIds
) {
  if (scope === 'whole_term') return false;
  if (regenerationMode !== 'replace_section') return false;
  if (!results || results.length === 0) return false;

  return hasUnassignedInSectionSet(results, targetSectionIds);
}

function shouldAttemptScopedInScopeRebalance(
  scope,
  regenerationMode,
  results,
  targetSectionIds
) {
  if (scope === 'whole_term') return false;
  if (regenerationMode !== 'replace_section') return false;
  if (!results || results.length === 0) return false;

  return hasUnassignedInSectionSet(results, targetSectionIds);
}

function hasUnassignedInSectionSet(results, sectionIdSet) {
  return results.some(
    (sectionResult) =>
      sectionIdSet.has(sectionResult.section_id) &&
      (sectionResult.unassigned?.length || 0) > 0
  );
}

function summarizeResultsForSectionIds(results, sectionIdSet) {
  const scopedResults = results.filter((sectionResult) =>
    sectionIdSet.has(sectionResult.section_id)
  );

  return summarizeResults(scopedResults);
}

function isSummaryBetter(candidate, baseline) {
  if (!candidate || !baseline) return false;

  if (candidate.conflictsCount !== baseline.conflictsCount) {
    return candidate.conflictsCount < baseline.conflictsCount;
  }

  if (candidate.unassignedCount !== baseline.unassignedCount) {
    return candidate.unassignedCount < baseline.unassignedCount;
  }

  if (candidate.entriesCount !== baseline.entriesCount) {
    return candidate.entriesCount > baseline.entriesCount;
  }

  return false;
}

function isSummaryEqual(left, right) {
  if (!left || !right) return false;

  return (
    left.conflictsCount === right.conflictsCount &&
    left.unassignedCount === right.unassignedCount &&
    left.entriesCount === right.entriesCount
  );
}

function getScopedRebalanceStrategyCandidates(primaryStrategy) {
  const ordered = [primaryStrategy, ...AUTO_BEST_STRATEGIES];
  const seen = new Set();
  const strategies = [];

  for (const strategy of ordered) {
    if (!strategy || seen.has(strategy)) continue;
    if (!STRATEGY_PRESETS[strategy]) continue;

    seen.add(strategy);
    strategies.push(strategy);
  }

  return strategies;
}

function buildNeighborSetKey(ids = []) {
  const normalized = [...new Set(ids)].filter(Boolean);
  if (normalized.length === 0) return '';

  return [...normalized]
    .sort((left, right) => String(left).localeCompare(String(right)))
    .join('|');
}

function buildSectionOrderKey(sections = []) {
  const ids = (sections || []).map((section) => section?.id).filter(Boolean);
  if (ids.length === 0) return '';

  return ids.join('|');
}

function rotateSectionOrder(sections = [], offset = 0) {
  const list = [...sections];
  if (list.length === 0) return [];

  const normalized = ((offset % list.length) + list.length) % list.length;
  if (normalized === 0) return list;

  return [...list.slice(normalized), ...list.slice(0, normalized)];
}

function interleaveSectionEdges(sections = []) {
  const list = [...sections];
  if (list.length <= 2) return list;

  const ordered = [];
  let left = 0;
  let right = list.length - 1;

  while (left <= right) {
    ordered.push(list[left]);
    if (left !== right) {
      ordered.push(list[right]);
    }
    left += 1;
    right -= 1;
  }

  return ordered;
}

function buildInScopeOrderVariants(
  baseSections = [],
  maxVariants = 8,
  includeExtended = false
) {
  const base = [...baseSections];
  if (base.length === 0) return [];

  const unique = new Map();
  const push = (sections) => {
    const key = buildSectionOrderKey(sections);
    if (!key || unique.has(key)) return;
    unique.set(key, [...sections]);
  };

  push(base);
  push([...base].reverse());
  push(interleaveSectionEdges(base));

  if (base.length >= 3) {
    push(rotateSectionOrder(base, 1));
  }

  if (base.length >= 4) {
    push(rotateSectionOrder(base, 2));
  }

  if (base.length >= 5) {
    push(rotateSectionOrder(base, Math.floor(base.length / 2)));
  }

  const evenFirst = [
    ...base.filter((_, index) => index % 2 === 0),
    ...base.filter((_, index) => index % 2 === 1),
  ];
  const oddFirst = [
    ...base.filter((_, index) => index % 2 === 1),
    ...base.filter((_, index) => index % 2 === 0),
  ];
  push(evenFirst);
  push(oddFirst);

  if (includeExtended) {
    if (base.length >= 6) {
      push(rotateSectionOrder([...base].reverse(), 1));
      push(rotateSectionOrder([...base].reverse(), 2));
    }

    if (base.length >= 7) {
      push(rotateSectionOrder(base, 3));
    }

    const center = Math.floor((base.length - 1) / 2);
    const middleOut = [];
    middleOut.push(base[center]);

    for (let delta = 1; middleOut.length < base.length; delta += 1) {
      const left = center - delta;
      const right = center + delta;

      if (left >= 0) middleOut.push(base[left]);
      if (right < base.length) middleOut.push(base[right]);
    }

    push(middleOut);
  }

  return [...unique.values()].slice(0, maxVariants);
}

function buildInScopeSubjectOrders(preferredSubjectOrder = 'normal') {
  const primary = preferredSubjectOrder === 'reverse' ? 'reverse' : 'normal';
  const secondary = primary === 'normal' ? 'reverse' : 'normal';

  return [primary, secondary];
}

async function attemptScopedInScopeRebalance({
  context,
  currentResults,
  targetSectionIds,
  strategyUsed,
  regenerationMode,
  rebalanceSettings = DEFAULT_SCOPED_REBALANCE_SETTINGS,
  cancellation = null,
}) {
  await assertGenerationNotCancelled(cancellation, 'in_scope_rebalance_start');

  const targetBefore = summarizeResultsForSectionIds(
    currentResults,
    targetSectionIds
  );
  const strategyCandidates = getScopedRebalanceStrategyCandidates(strategyUsed);

  if (strategyCandidates.length === 0) {
    return {
      attempted: true,
      applied: false,
      results: currentResults,
      neighborSectionIds: [],
      info: {
        attempted: true,
        applied: false,
        rebalance_type: 'in_scope',
        candidate_sets_tried: 0,
        strategy_candidates_tried: 0,
        strategy_runs_tried: 0,
        search_tier: 'none',
        attempt_budget: 0,
        attempt_budget_exhausted: false,
        no_strategy_candidates: true,
        target_before: targetBefore,
      },
    };
  }

  const strategyRunBudget = Math.min(
    rebalanceSettings.maxInScopeStrategyRuns,
    24 + Math.max(targetBefore.unassignedCount || 0, 1) * 20
  );

  let bestCandidate = null;
  let attempts = 0;
  let orderVariantSetsTried = 0;
  let budgetExhausted = false;
  let usedExtended = false;
  let hasAnyOrderVariants = false;

  for (const strategyCandidate of strategyCandidates) {
    await assertGenerationNotCancelled(
      cancellation,
      `in_scope_rebalance_strategy_${strategyCandidate}`
    );

    if (attempts >= strategyRunBudget) {
      budgetExhausted = true;
      break;
    }

    const baseConfig =
      STRATEGY_PRESETS[strategyCandidate] || STRATEGY_PRESETS.year_desc_constraints;
    const baseOrder = sortSectionsByStrategy(context, baseConfig.sectionSort);
    const subjectOrders = buildInScopeSubjectOrders(baseConfig.subjectOrder);

    const coreOrderVariants = buildInScopeOrderVariants(
      baseOrder,
      rebalanceSettings.inScopeCoreOrderVariants,
      false
    );
    const extendedOrderVariants = buildInScopeOrderVariants(
      baseOrder,
      rebalanceSettings.inScopeExtendedOrderVariants,
      true
    );

    if (coreOrderVariants.length > 0 || extendedOrderVariants.length > 0) {
      hasAnyOrderVariants = true;
    }

    const seenOrderKeys = new Set();

    const evaluateOrderVariants = async (orderVariants, searchTier = 'core') => {
      for (const sectionOrderOverride of orderVariants) {
        await assertGenerationNotCancelled(
          cancellation,
          `in_scope_rebalance_${searchTier}_order_variant`
        );

        if (attempts >= strategyRunBudget) {
          budgetExhausted = true;
          return;
        }

        const orderKey = buildSectionOrderKey(sectionOrderOverride);
        if (!orderKey || seenOrderKeys.has(orderKey)) {
          continue;
        }

        seenOrderKeys.add(orderKey);
        orderVariantSetsTried += 1;

        for (const subjectOrder of subjectOrders) {
          await assertGenerationNotCancelled(
            cancellation,
            `in_scope_rebalance_${searchTier}_subject_${subjectOrder}`
          );

          if (attempts >= strategyRunBudget) {
            budgetExhausted = true;
            return;
          }

          attempts += 1;

          const attemptResults = await runGeneration(context, {
            sectionSort: baseConfig.sectionSort,
            subjectOrder,
            onePointFivePackingMode: baseConfig.onePointFivePackingMode || 'balanced',
            longVacantGapMode: baseConfig.longVacantGapMode || 'balanced',
            reverseSections: false,
            sectionOrderOverride,
          }, cancellation);

          const targetAfter = summarizeResultsForSectionIds(
            attemptResults,
            targetSectionIds
          );

          if (!isSummaryBetter(targetAfter, targetBefore)) {
            continue;
          }

          const candidate = {
            strategy: strategyCandidate,
            subjectOrder,
            results: attemptResults,
            targetAfter,
            searchTier,
          };

          if (!bestCandidate) {
            bestCandidate = candidate;
            continue;
          }

          if (isSummaryBetter(candidate.targetAfter, bestCandidate.targetAfter)) {
            bestCandidate = candidate;
            continue;
          }

          if (
            isSummaryEqual(candidate.targetAfter, bestCandidate.targetAfter) &&
            candidate.searchTier === 'core' &&
            bestCandidate.searchTier === 'extended'
          ) {
            bestCandidate = candidate;
          }
        }

        if (
          bestCandidate &&
          bestCandidate.targetAfter.conflictsCount === 0 &&
          bestCandidate.targetAfter.unassignedCount === 0
        ) {
          return;
        }
      }
    };

    await evaluateOrderVariants(coreOrderVariants, 'core');

    const shouldExpand =
      !budgetExhausted &&
      extendedOrderVariants.length > 0 &&
      (!bestCandidate ||
        bestCandidate.targetAfter.conflictsCount > 0 ||
        bestCandidate.targetAfter.unassignedCount > 0);

    if (shouldExpand) {
      usedExtended = true;
      await evaluateOrderVariants(extendedOrderVariants, 'extended');
    }

    if (
      bestCandidate &&
      bestCandidate.targetAfter.conflictsCount === 0 &&
      bestCandidate.targetAfter.unassignedCount === 0
    ) {
      break;
    }
  }

  if (!bestCandidate) {
    return {
      attempted: true,
      applied: false,
      results: currentResults,
      neighborSectionIds: [],
      info: {
        attempted: true,
        applied: false,
        rebalance_type: 'in_scope',
        candidate_sets_tried: orderVariantSetsTried,
        strategy_candidates_tried: strategyCandidates.length,
        strategy_runs_tried: attempts,
        search_tier: usedExtended ? 'extended' : hasAnyOrderVariants ? 'core' : 'none',
        attempt_budget: strategyRunBudget,
        attempt_budget_exhausted: budgetExhausted,
        no_order_variants: !hasAnyOrderVariants,
        target_before: targetBefore,
      },
    };
  }

  return {
    attempted: true,
    applied: true,
    results: bestCandidate.results,
    neighborSectionIds: [],
    info: {
      attempted: true,
      applied: true,
      rebalance_type: 'in_scope',
      candidate_sets_tried: orderVariantSetsTried,
      strategy_candidates_tried: strategyCandidates.length,
      strategy_runs_tried: attempts,
      search_tier: bestCandidate.searchTier || (usedExtended ? 'extended' : 'core'),
      attempt_budget: strategyRunBudget,
      attempt_budget_exhausted: budgetExhausted,
      strategy_used: bestCandidate.strategy,
      subject_order_used: bestCandidate.subjectOrder,
      neighbor_sections_count: 0,
      neighbor_section_names: [],
      target_before: targetBefore,
      target_after: bestCandidate.targetAfter,
    },
  };
}

function buildNeighborCandidateSets(rankedNeighborIds = [], options = {}) {
  const {
    maxSets = 10,
    maxNeighborSize = 4,
    includeCombinations = false,
    combinationPoolSize = 6,
  } = options;

  const ranked = [...new Set(rankedNeighborIds)].filter(Boolean);
  if (ranked.length === 0) return [];

  const unique = new Map();

  const push = (ids) => {
    if (!ids || ids.length === 0) return true;

    const normalized = [...new Set(ids)].filter(Boolean);
    if (normalized.length === 0 || normalized.length > maxNeighborSize) {
      return true;
    }

    const key = buildNeighborSetKey(normalized);
    if (!key || unique.has(key)) {
      return true;
    }

    if (unique.size >= maxSets) {
      return false;
    }

    unique.set(key, normalized);
    return true;
  };

  ranked.slice(0, 4).forEach((id) => push([id]));

  const sizePlan = [2, 3, 4, 5, 6];
  sizePlan.forEach((size) => {
    if (size <= maxNeighborSize && ranked.length >= size) {
      push(ranked.slice(0, size));
    }
  });

  if (includeCombinations && unique.size < maxSets) {
    const combinationPool = ranked.slice(0, Math.min(combinationPoolSize, ranked.length));

    const rollingWindowSizes = [2, 3, 4].filter((size) => size <= maxNeighborSize);
    for (const size of rollingWindowSizes) {
      for (let start = 1; start + size <= combinationPool.length; start += 1) {
        if (!push(combinationPool.slice(start, start + size))) {
          return [...unique.values()];
        }
      }
    }

    const pairLimit = Math.min(combinationPool.length, 7);
    for (let i = 0; i < pairLimit; i += 1) {
      for (let j = i + 1; j < pairLimit; j += 1) {
        if (!push([combinationPool[i], combinationPool[j]])) {
          return [...unique.values()];
        }
      }
    }

    if (maxNeighborSize >= 3) {
      const tripleLimit = Math.min(combinationPool.length, 6);
      for (let anchor = 0; anchor < Math.min(2, tripleLimit); anchor += 1) {
        for (let j = anchor + 1; j < tripleLimit - 1; j += 1) {
          for (let k = j + 1; k < tripleLimit; k += 1) {
            if (!push([combinationPool[anchor], combinationPool[j], combinationPool[k]])) {
              return [...unique.values()];
            }
          }
        }
      }
    }
  }

  return [...unique.values()];
}

async function attemptScopedNeighborRebalance({
  termId,
  context,
  currentResults,
  targetSections,
  targetSectionIds,
  strategyUsed,
  regenerationMode,
  rebalanceSettings = DEFAULT_SCOPED_REBALANCE_SETTINGS,
  cancellation = null,
}) {
  await assertGenerationNotCancelled(cancellation, 'neighbor_rebalance_start');

  const targetBefore = summarizeResultsForSectionIds(
    currentResults,
    targetSectionIds
  );

  const rankedNeighborIds = selectNeighborSectionIdsForRebalance(
    context,
    currentResults,
    targetSectionIds,
    rebalanceSettings.neighborPoolSize
  );

  if (rankedNeighborIds.length === 0) {
    return {
      attempted: true,
      applied: false,
      results: currentResults,
      neighborSectionIds: [],
      info: {
        attempted: true,
        applied: false,
        rebalance_type: 'neighbor',
        candidate_sets_tried: 0,
        strategy_candidates_tried: 0,
        strategy_runs_tried: 0,
        search_tier: 'none',
        attempt_budget: 0,
        attempt_budget_exhausted: false,
        no_neighbor_candidates: true,
        target_before: targetBefore,
      },
    };
  }

  const neighborPoolSections = await fetchSectionsForScope(termId, 'multiple_sections', {
    section_ids: rankedNeighborIds,
  });

  if (!neighborPoolSections || neighborPoolSections.length === 0) {
    return {
      attempted: true,
      applied: false,
      results: currentResults,
      neighborSectionIds: [],
      info: {
        attempted: true,
        applied: false,
        rebalance_type: 'neighbor',
        candidate_sets_tried: 0,
        strategy_candidates_tried: 0,
        strategy_runs_tried: 0,
        search_tier: 'none',
        attempt_budget: 0,
        attempt_budget_exhausted: false,
        no_neighbor_pool: true,
        target_before: targetBefore,
      },
    };
  }

  const neighborPoolById = new Map(
    neighborPoolSections.map((section) => [section.id, section])
  );

  const firstTierNeighbors = rankedNeighborIds.slice(
    0,
    rebalanceSettings.firstTierNeighborCap
  );
  const firstTierCandidateSets = buildNeighborCandidateSets(firstTierNeighbors, {
    maxSets: rebalanceSettings.firstTierMaxSets,
    maxNeighborSize: 4,
    includeCombinations: false,
  });
  const secondTierCandidateSets = buildNeighborCandidateSets(rankedNeighborIds, {
    maxSets: rebalanceSettings.secondTierMaxSets,
    maxNeighborSize: 6,
    includeCombinations: true,
    combinationPoolSize: rebalanceSettings.secondTierCombinationPool,
  });

  const strategyCandidates = getScopedRebalanceStrategyCandidates(strategyUsed);

  if (
    (firstTierCandidateSets.length === 0 && secondTierCandidateSets.length === 0) ||
    strategyCandidates.length === 0
  ) {
    return {
      attempted: true,
      applied: false,
      results: currentResults,
      neighborSectionIds: [],
      info: {
        attempted: true,
        applied: false,
        rebalance_type: 'neighbor',
        candidate_sets_tried: 0,
        strategy_candidates_tried: strategyCandidates.length,
        strategy_runs_tried: 0,
        search_tier: 'none',
        attempt_budget: 0,
        attempt_budget_exhausted: false,
        no_candidate_sets: true,
        target_before: targetBefore,
      },
    };
  }
  const strategyRunBudget = Math.min(
    140,
    rebalanceSettings.maxStrategyRuns +
      Math.max(targetBefore.unassignedCount || 0, 1) * 20
  );

  const candidatePoolSections = [...new Map(
    [...targetSections, ...neighborPoolSections].map((section) => [section.id, section])
  ).values()];
  const candidatePoolSubjects = await fetchSubjectsForSections(candidatePoolSections);

  let bestCandidate = null;
  let attempts = 0;
  let candidateSetsTried = 0;
  let budgetExhausted = false;
  let usedSecondTier = false;
  const seenCandidateSetKeys = new Set();

  const evaluateCandidateSets = async (candidateSets, searchTier = 'core') => {
    for (const rawNeighborIds of candidateSets) {
      await assertGenerationNotCancelled(
        cancellation,
        `neighbor_rebalance_${searchTier}_candidate_set`
      );

      if (attempts >= strategyRunBudget) {
        budgetExhausted = true;
        return;
      }

      const neighborIds = rawNeighborIds.filter((id) => neighborPoolById.has(id));
      if (neighborIds.length === 0) continue;

      const candidateSetKey = buildNeighborSetKey(neighborIds);
      if (!candidateSetKey || seenCandidateSetKeys.has(candidateSetKey)) {
        continue;
      }
      seenCandidateSetKeys.add(candidateSetKey);
      candidateSetsTried += 1;

      const neighborSections = neighborIds
        .map((neighborId) => neighborPoolById.get(neighborId))
        .filter(Boolean);

      if (neighborSections.length === 0) continue;

      const neighborIdSet = new Set(neighborSections.map((section) => section.id));
      const combinedSectionsMap = new Map(
        [...targetSections, ...neighborSections].map((section) => [section.id, section])
      );
      const combinedSections = [...combinedSectionsMap.values()];

      const simulatedExistingEntries = context.existingEntries.filter(
        (entry) => !neighborIdSet.has(entry.section_id)
      );

      const rebalanceContext = {
        ...context,
        sections: combinedSections,
        subjects: candidatePoolSubjects,
        existingEntries: simulatedExistingEntries,
      };
      rebalanceContext.sectionConstraintScores =
        buildSectionConstraintScores(rebalanceContext);

      for (const strategyCandidate of strategyCandidates) {
        await assertGenerationNotCancelled(
          cancellation,
          `neighbor_rebalance_${searchTier}_strategy_${strategyCandidate}`
        );

        if (attempts >= strategyRunBudget) {
          budgetExhausted = true;
          return;
        }

        attempts += 1;

        const rebalanceResults = await runStrategy(
          rebalanceContext,
          strategyCandidate,
          regenerationMode,
          cancellation
        );
        const targetAfter = summarizeResultsForSectionIds(
          rebalanceResults,
          targetSectionIds
        );

        if (!isSummaryBetter(targetAfter, targetBefore)) {
          continue;
        }

        const candidate = {
          strategy: strategyCandidate,
          results: rebalanceResults,
          neighborSections,
          neighborSectionIds: [...neighborIdSet],
          targetAfter,
          searchTier,
        };

        if (!bestCandidate) {
          bestCandidate = candidate;
          continue;
        }

        if (isSummaryBetter(candidate.targetAfter, bestCandidate.targetAfter)) {
          bestCandidate = candidate;
          continue;
        }

        if (
          isSummaryEqual(candidate.targetAfter, bestCandidate.targetAfter) &&
          candidate.neighborSectionIds.length < bestCandidate.neighborSectionIds.length
        ) {
          bestCandidate = candidate;
        }
      }

      if (
        bestCandidate &&
        bestCandidate.targetAfter.conflictsCount === 0 &&
        bestCandidate.targetAfter.unassignedCount === 0
      ) {
        return;
      }
    }
  };

  await evaluateCandidateSets(firstTierCandidateSets, 'core');

  const shouldExpandToSecondTier =
    !budgetExhausted &&
    secondTierCandidateSets.length > 0 &&
    (!bestCandidate ||
      bestCandidate.targetAfter.conflictsCount > 0 ||
      bestCandidate.targetAfter.unassignedCount > 0);

  if (shouldExpandToSecondTier) {
    usedSecondTier = true;
    await evaluateCandidateSets(secondTierCandidateSets, 'extended');
  }

  if (!bestCandidate) {
    return {
      attempted: true,
      applied: false,
      results: currentResults,
      neighborSectionIds: [],
      info: {
        attempted: true,
        applied: false,
        rebalance_type: 'neighbor',
        candidate_sets_tried: candidateSetsTried,
        strategy_candidates_tried: strategyCandidates.length,
        strategy_runs_tried: attempts,
        search_tier: usedSecondTier ? 'extended' : 'core',
        attempt_budget: strategyRunBudget,
        attempt_budget_exhausted: budgetExhausted,
        target_before: targetBefore,
      },
    };
  }

  const neighborSectionNames = bestCandidate.neighborSections
    .map((section) => section.section_name)
    .sort((a, b) => String(a || '').localeCompare(String(b || '')));

  return {
    attempted: true,
    applied: true,
    results: bestCandidate.results,
    neighborSectionIds: bestCandidate.neighborSectionIds,
    info: {
      attempted: true,
      applied: true,
      rebalance_type: 'neighbor',
      candidate_sets_tried: candidateSetsTried,
      strategy_candidates_tried: strategyCandidates.length,
      strategy_runs_tried: attempts,
      search_tier: bestCandidate.searchTier || (usedSecondTier ? 'extended' : 'core'),
      attempt_budget: strategyRunBudget,
      attempt_budget_exhausted: budgetExhausted,
      strategy_used: bestCandidate.strategy,
      neighbor_sections_count: bestCandidate.neighborSectionIds.length,
      neighbor_section_names: neighborSectionNames,
      target_before: targetBefore,
      target_after: bestCandidate.targetAfter,
    },
  };
}

function selectNeighborSectionIdsForRebalance(
  context,
  currentResults,
  targetSectionIds,
  maxNeighborSections = 6
) {
  const targetUnassigned = currentResults
    .flatMap((sectionResult) => sectionResult.unassigned || [])
    .filter((entry) => targetSectionIds.has(entry.section_id));

  if (targetUnassigned.length === 0) return [];

  const unassignedSubjectIds = new Set(
    targetUnassigned.map((entry) => entry.subject_id).filter(Boolean)
  );

  if (unassignedSubjectIds.size === 0) return [];

  const candidateTeacherIds = new Set(
    context.assignments
      .filter((assignment) => unassignedSubjectIds.has(assignment.subject_id))
      .map((assignment) => assignment.teacher_id)
      .filter(Boolean)
  );

  // Fallback when assignment metadata is sparse: infer from scheduled entries of same subject.
  if (candidateTeacherIds.size === 0) {
    context.existingEntries.forEach((entry) => {
      if (unassignedSubjectIds.has(entry.subject_id) && entry.teacher_id) {
        candidateTeacherIds.add(entry.teacher_id);
      }
    });
  }

  const subjectById = buildSubjectLookup(context.subjects);
  const targetSectionById = new Map(
    context.sections.map((section) => [section.id, section])
  );
  const venueNeeds = collectLikelyVenueNeedsForUnassigned(
    targetUnassigned,
    targetSectionById,
    subjectById
  );

  const sectionScores = new Map();
  const sectionNames = new Map();
  const sectionEntryCounts = new Map();

  for (const entry of context.existingEntries) {
    if (!entry.section_id || targetSectionIds.has(entry.section_id)) continue;

    sectionEntryCounts.set(
      entry.section_id,
      (sectionEntryCounts.get(entry.section_id) || 0) + 1
    );

    if (!sectionNames.has(entry.section_id)) {
      sectionNames.set(entry.section_id, entry.section?.section_name || '');
    }

    let score = 0;

    if (candidateTeacherIds.has(entry.teacher_id)) {
      score += 4;
    }

    if (matchesVenueNeed(entry.venue, venueNeeds)) {
      score += 2;
    }

    if (score === 0) continue;

    sectionScores.set(entry.section_id, (sectionScores.get(entry.section_id) || 0) + score);
  }

  const sortSectionIdsByScore = (scores) =>
    [...scores.entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];

        const nameA = sectionNames.get(a[0]) || '';
        const nameB = sectionNames.get(b[0]) || '';
        return String(nameA).localeCompare(String(nameB));
      })
      .slice(0, maxNeighborSections)
      .map(([sectionId]) => sectionId);

  const weightedNeighborIds = sortSectionIdsByScore(sectionScores);
  if (weightedNeighborIds.length > 0) {
    return weightedNeighborIds;
  }

  // Fallback 2: rank by broad resource pressure so rebalance can still attempt.
  const fallbackScores = new Map();

  for (const entry of context.existingEntries) {
    if (!entry.section_id || targetSectionIds.has(entry.section_id)) continue;

    let fallbackScore = 0;

    if (matchesVenueNeed(entry.venue, venueNeeds)) {
      fallbackScore += 3;
    }

    if (candidateTeacherIds.size > 0 && candidateTeacherIds.has(entry.teacher_id)) {
      fallbackScore += 2;
    }

    // Keep busy sections in play as a last-resort unlock candidate.
    fallbackScore += 1;

    fallbackScores.set(
      entry.section_id,
      (fallbackScores.get(entry.section_id) || 0) + fallbackScore
    );
  }

  const broadNeighborIds = sortSectionIdsByScore(fallbackScores);
  if (broadNeighborIds.length > 0) {
    return broadNeighborIds;
  }

  // Final fallback: busiest out-of-scope sections.
  return [...sectionEntryCounts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];

      const nameA = sectionNames.get(a[0]) || '';
      const nameB = sectionNames.get(b[0]) || '';
      return String(nameA).localeCompare(String(nameB));
    })
    .slice(0, maxNeighborSections)
    .map(([sectionId]) => sectionId);
}

function buildSubjectLookup(groupedSubjects = {}) {
  const lookup = new Map();

  Object.values(groupedSubjects || {}).forEach((subjects) => {
    (subjects || []).forEach((subject) => {
      lookup.set(subject.id, subject);
    });
  });

  return lookup;
}

function collectLikelyVenueNeedsForUnassigned(
  unassignedEntries,
  sectionById,
  subjectById
) {
  const needsByKey = new Map();

  for (const entry of unassignedEntries) {
    const subject = subjectById.get(entry.subject_id);
    if (!subject) continue;

    const section = sectionById.get(entry.section_id);
    const programCode = section?.programs?.code || null;

    if (subject.subject_type === 'lecture_lab') {
      addVenueNeed(needsByKey, 'Lecture', 'General');

      if (programCode === 'BSIT') {
        addVenueNeed(needsByKey, 'Lab', 'Computer Lab');
      } else if (programCode === 'BSHM') {
        addVenueNeed(needsByKey, 'Lab', 'Kitchen');
        addVenueNeed(needsByKey, 'Lab', 'Function Hall');
      } else if (subject.required_venue_type) {
        addVenueNeed(
          needsByKey,
          subject.required_venue_type,
          subject.required_venue_subtype || null
        );
      }

      continue;
    }

    if (subject.required_venue_type) {
      addVenueNeed(
        needsByKey,
        subject.required_venue_type,
        subject.required_venue_subtype || null
      );
    }
  }

  return [...needsByKey.values()];
}

function addVenueNeed(needsByKey, venueType, venueSubtype = null) {
  if (!venueType) return;

  const key = `${venueType}::${venueSubtype || '*'}`;

  if (!needsByKey.has(key)) {
    needsByKey.set(key, {
      venue_type: venueType,
      venue_subtype: venueSubtype || null,
    });
  }
}

function matchesVenueNeed(venue, venueNeeds) {
  if (!venue || !venueNeeds || venueNeeds.length === 0) return false;

  return venueNeeds.some((need) => {
    if (venue.venue_type !== need.venue_type) return false;
    if (!need.venue_subtype) return true;
    return venue.venue_subtype === need.venue_subtype;
  });
}

function extractDetectedConflicts(conflictGroups = []) {
  return conflictGroups.flatMap((group) =>
    (group.conflicts || []).flatMap((item) => {
      if (Array.isArray(item?.detected)) return item.detected;
      return item?.type ? [item] : [];
    })
  );
}

function summarizeResults(results) {
  const unassignedCount = results.reduce(
    (total, section) => total + (section.unassigned?.length || 0),
    0
  );
  const entriesCount = results.reduce(
    (total, section) => total + (section.blueprints?.length || 0),
    0
  );
  const conflictsCount = results.reduce(
    (total, section) =>
      total + extractDetectedConflicts(section.conflicts || []).length,
    0
  );

  return { unassignedCount, entriesCount, conflictsCount };
}
//