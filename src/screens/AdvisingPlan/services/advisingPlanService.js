export const DEFAULT_COMPLETED_STATUSES = ['success'];

export function normalizeSubjectCode(value) {
	if (!value) return '';
	return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function parseYearTermLabel(value) {
	if (!value) return { yearLevel: null, semester: null };
	const label = String(value);
	const yearMatch = label.match(/(\d+)\s*(?:st|nd|rd|th)?\s*year/i);
	const semMatch = label.match(/(\d+)\s*(?:st|nd|rd|th)?\s*(?:semester|term|sem)/i);
	return {
		yearLevel: yearMatch ? Number(yearMatch[1]) : null,
		semester: semMatch ? Number(semMatch[1]) : null,
	};
}

export function resolveYearSemester(subject) {
	const yearLevel = Number(subject?.yearLevel || subject?.year_level) || null;
	const semester = Number(subject?.semester) || null;
	if (yearLevel && semester) return { yearLevel, semester };
	const fallback = parseYearTermLabel(subject?.yearTermLabel || subject?.year_term);
	return {
		yearLevel: yearLevel || fallback.yearLevel,
		semester: semester || fallback.semester,
	};
}

export function buildCompletionSet(subjects, completedStatuses = DEFAULT_COMPLETED_STATUSES) {
	const set = new Set();
	if (!Array.isArray(subjects)) return set;

	subjects.forEach((subject) => {
		if (completedStatuses.includes(subject.status)) {
			const normalized = normalizeSubjectCode(subject.subjectCode);
			if (normalized) set.add(normalized);
		}
	});

	return set;
}

export function getMissingPrereqs(subject, completedSet) {
	if (!subject?.prerequisites?.length) return [];
	return subject.prerequisites.filter((item) => {
		const normalized = normalizeSubjectCode(item);
		return normalized && !completedSet.has(normalized);
	});
}

export function buildEligiblePools({
	subjects,
	currentYearLevel,
	currentSemester,
	completedStatuses = DEFAULT_COMPLETED_STATUSES,
}) {
	const safeSubjects = Array.isArray(subjects) ? subjects : [];
	const completedSet = buildCompletionSet(safeSubjects, completedStatuses);
	const eligibleBack = [];
	const eligibleCurrent = [];
	const blocked = [];

	safeSubjects.forEach((subject) => {
		if (completedStatuses.includes(subject.status)) return;
		const resolved = resolveYearSemester(subject);
		if (!resolved.yearLevel || !resolved.semester) return;
		if (resolved.semester !== currentSemester) return;
		if (resolved.yearLevel > currentYearLevel) return;

		const missing = getMissingPrereqs(subject, completedSet);
		if (missing.length > 0) {
			blocked.push({ ...subject, missingPrereqs: missing });
			return;
		}

		if (resolved.yearLevel < currentYearLevel) {
			eligibleBack.push({ ...subject, yearLevel: resolved.yearLevel, semester: resolved.semester });
		} else {
			eligibleCurrent.push({ ...subject, yearLevel: resolved.yearLevel, semester: resolved.semester });
		}
	});

	return { eligibleBack, eligibleCurrent, blocked, completedSet };
}

export function formatSemesterLabel(semester) {
	if (semester === 1) return '1st Semester';
	if (semester === 2) return '2nd Semester';
	return 'Semester';
}

// Fetch published schedule_entries for the given subject codes in a term.
// Returns { [portalSubjectCode]: schedule_entry[] } grouped by original portal code.
export async function fetchScheduleEntriesForSubjects(termId, subjectCodes, supabase) {
	console.log('[ADVISING] fetchScheduleEntriesForSubjects called', { termId, subjectCodes });
	if (!termId || !subjectCodes?.length) {
		console.log('[ADVISING] Early exit: missing termId or subjectCodes');
		return {};
	}

	// Normalize portal codes to match the normalized_subject_code column in Supabase
	const normalizedToOriginal = {};
	subjectCodes.forEach((code) => {
		const norm = normalizeSubjectCode(code);
		if (norm) normalizedToOriginal[norm] = code;
	});
	const normalizedCodes = Object.keys(normalizedToOriginal);
	console.log('[ADVISING] Normalized codes to query:', normalizedCodes);
	if (!normalizedCodes.length) return {};

	// Look up subjects by normalized_subject_code
	const { data: subjects, error: subErr } = await supabase
		.from('subjects')
		.select('id, subject_code, normalized_subject_code, title, credit_units')
		.in('normalized_subject_code', normalizedCodes);

	console.log('[ADVISING] subjects query result:', { subjects, subErr });
	if (subErr) { console.log('[ADVISING] subjects query ERROR:', subErr); return {}; }
	if (!subjects?.length) { console.log('[ADVISING] No subjects found for normalized codes'); return {}; }

	// Map subject_id → original portal code
	const idToOriginalCode = {};
	const subjectIds = [];
	subjects.forEach((s) => {
		const origCode = normalizedToOriginal[s.normalized_subject_code];
		if (origCode) {
			idToOriginalCode[s.id] = origCode;
			subjectIds.push(s.id);
		}
	});
	console.log('[ADVISING] Matched subject IDs:', subjectIds, 'idToOriginalCode:', idToOriginalCode);

	if (!subjectIds.length) {
		console.log('[ADVISING] No subject IDs matched');
		return {};
	}

	// Fetch entries for the active term (website publish sets is_locked on the term, not schedule_status on entries)
	const { data: entries, error: entErr } = await supabase
		.from('schedule_entries')
		.select(`
			id, subject_id, section_id, teacher_id, venue_id,
			day_of_week, start_time, end_time, schedule_status,
			subjects:subject_id ( id, subject_code, normalized_subject_code, title, credit_units, lec_units, lab_units, delivery_pattern, color_hex ),
			sections:section_id ( id, section_code, year_level, programs:program_id ( code, name ) ),
			teachers:teacher_id ( id, first_name, last_name ),
			venues:venue_id ( id, name )
		`)
		.eq('term_id', termId)
		.in('subject_id', subjectIds);

	console.log('[ADVISING] schedule_entries query result:', { count: entries?.length, entErr, sample: entries?.[0] });
	if (entErr) { console.log('[ADVISING] schedule_entries ERROR:', entErr); return {}; }
	if (!entries?.length) { console.log('[ADVISING] No entries found for these subjects in active term'); return {}; }

	// Group by original portal subject code
	const grouped = {};
	entries.forEach((entry) => {
		const origCode = idToOriginalCode[entry.subject_id];
		if (!origCode) return;
		if (!grouped[origCode]) grouped[origCode] = [];
		grouped[origCode].push(entry);
	});

	return grouped;
}

export default {
	DEFAULT_COMPLETED_STATUSES,
	normalizeSubjectCode,
	parseYearTermLabel,
	resolveYearSemester,
	buildCompletionSet,
	getMissingPrereqs,
	buildEligiblePools,
	formatSemesterLabel,
};
