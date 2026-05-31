function timeToMinutes(time) {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
}

function isTimeOverlap(startA, endA, startB, endB) {
	return timeToMinutes(startA) < timeToMinutes(endB) &&
		timeToMinutes(endA) > timeToMinutes(startB);
}

function conflictsWith(candidate, assignedEntries) {
	return assignedEntries.some(
		(a) =>
			Number(a.day_of_week) === Number(candidate.day_of_week) &&
			isTimeOverlap(a.start_time, a.end_time, candidate.start_time, candidate.end_time)
	);
}

// Group a flat list of entries into sections (each section = all days it meets).
function groupBySection(entries) {
	const map = {};
	entries.forEach((entry) => {
		const key = entry.section_id || `nosec_${entry.day_of_week}_${entry.start_time}`;
		if (!map[key]) map[key] = [];
		map[key].push(entry);
	});
	return Object.values(map);
}

// entriesBySubjectCode: { [subjectCode]: schedule_entry[] }
// Returns { assigned: entry[], unscheduled: { subjectCode, reason }[] }
// Each entry in assigned has _subjectCode set.
export function autoAssignFromSchedule(entriesBySubjectCode) {
	const assigned = [];
	const unscheduled = [];

	for (const [subjectCode, entries] of Object.entries(entriesBySubjectCode)) {
		if (!Array.isArray(entries) || entries.length === 0) {
			unscheduled.push({ subjectCode, reason: 'No available schedule found.' });
			continue;
		}

		// Group by section so we evaluate complete meeting patterns (e.g. Mon+Wed together)
		const sections = groupBySection(entries);
		let placed = false;

		for (const sectionEntries of sections) {
			// A section is only viable if ALL its day-entries are conflict-free
			const hasConflict = sectionEntries.some((e) => conflictsWith(e, assigned));
			if (!hasConflict) {
				sectionEntries.forEach((e) => {
					assigned.push({ ...e, _subjectCode: subjectCode });
				});
				placed = true;
				break;
			}
		}

		if (!placed) {
			unscheduled.push({
				subjectCode,
				reason: 'All available time slots conflict with your current plan.',
			});
		}
	}

	return { assigned, unscheduled };
}

export default { autoAssignFromSchedule };
