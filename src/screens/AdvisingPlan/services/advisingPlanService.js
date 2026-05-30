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
