export const EVALUATION_URL = 'https://sms.pampangastateu.edu.ph/#student/evaluation';

const STATUS_CLASSES = ['success', 'warning', 'danger', 'info'];

export function buildEvaluationScanScript() {
	return `
(function () {
	try {
		const table = Array.from(document.querySelectorAll('table')).find((candidate) => {
			const text = candidate.innerText.toLowerCase();
			return text.includes('subject code') && text.includes('descriptive title');
		});

		if (!table) {
			window.ReactNativeWebView.postMessage(JSON.stringify({
				type: 'EVALUATION_SCAN_ERROR',
				message: 'Evaluation table not found'
			}));
			return true;
		}

		const headerRow = table.querySelector('tr');
		if (!headerRow) {
			window.ReactNativeWebView.postMessage(JSON.stringify({
				type: 'EVALUATION_SCAN_ERROR',
				message: 'Evaluation table header not found'
			}));
			return true;
		}

		const headerCells = Array.from(headerRow.querySelectorAll('th,td'));
		const headerMap = {};
		let colIndex = 0;
		headerCells.forEach((cell) => {
			const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
			const label = cell.innerText.trim().toLowerCase();
			for (let i = 0; i < colspan; i += 1) {
				headerMap[label] = colIndex;
				colIndex += 1;
			}
		});

		const expandRowCells = (row) => {
			const cells = Array.from(row.querySelectorAll('td'));
			const expanded = [];
			let col = 0;
			cells.forEach((cell) => {
				const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
				const text = cell.innerText.trim();
				for (let i = 0; i < colspan; i += 1) {
					expanded[col] = text;
					col += 1;
				}
			});
			return expanded;
		};

		const parseYearTerm = (value) => {
			const match = value.match(/(\d)(?:st|nd|rd|th)\s*Year\s*-\s*(\d)(?:st|nd|rd|th)\s*Semester/i);
			if (!match) return { yearLevel: null, semester: null };
			return { yearLevel: Number(match[1]), semester: Number(match[2]) };
		};

		const rows = Array.from(table.querySelectorAll('tr')).slice(1);
		const subjects = [];

		rows.forEach((row) => {
			const cells = expandRowCells(row);
			if (cells.length === 0) return;

			const joined = cells.join(' ').toLowerCase();
			if (
				joined.startsWith('total') ||
				joined.includes('total :') ||
				joined.startsWith('average') ||
				joined.includes('average :')
			) {
				return;
			}

			const subjectCode = (cells[headerMap['subject code']] || '').trim();
			if (!subjectCode) return;

			const yearTerm = (cells[headerMap['year term']] || '').trim();
			const { yearLevel, semester } = parseYearTerm(yearTerm);

			const subjectName = (cells[headerMap['descriptive title']] || '').trim();
			const units = Number(cells[headerMap['credit']] || 0) || 0;

			const prereqIndex = headerMap['pre-req.'] !== undefined
				? headerMap['pre-req.']
				: headerMap['pre-req'];
			const prerequisitesRaw = (cells[prereqIndex] || '').trim();
			const prerequisites = prerequisitesRaw
				? prerequisitesRaw.split(',').map((item) => item.trim()).filter(Boolean)
				: [];

			const statusClass = ${JSON.stringify(STATUS_CLASSES)}
				.find((name) => row.classList.contains(name)) || 'none';

			subjects.push({
				subjectCode,
				subjectName,
				units,
				yearLevel,
				semester,
				yearTermLabel: yearTerm,
				prerequisites,
				status: statusClass
			});
		});

		window.ReactNativeWebView.postMessage(JSON.stringify({
			type: 'EVALUATION_SCAN',
			subjects
		}));
	} catch (error) {
		window.ReactNativeWebView.postMessage(JSON.stringify({
			type: 'EVALUATION_SCAN_ERROR',
			message: error && error.message ? error.message : 'Scan failed'
		}));
	}
	return true;
})();
`;
}

export function parseEvaluationMessage(rawMessage) {
	if (!rawMessage) return null;
	try {
		const parsed = JSON.parse(rawMessage);
		if (!parsed || typeof parsed !== 'object' || !parsed.type) return null;
		return parsed;
	} catch (error) {
		return null;
	}
}

export function summarizeEvaluation(subjects) {
	const summary = {
		total: 0,
		completed: 0,
		byStatus: {
			success: 0,
			warning: 0,
			danger: 0,
			info: 0,
			none: 0,
		},
	};

	if (!Array.isArray(subjects)) return summary;

	subjects.forEach((subject) => {
		summary.total += 1;
		if (subject.status === 'success') summary.completed += 1;
		if (summary.byStatus[subject.status] !== undefined) {
			summary.byStatus[subject.status] += 1;
		} else {
			summary.byStatus.none += 1;
		}
	});

	return summary;
}

export default {
	EVALUATION_URL,
	buildEvaluationScanScript,
	parseEvaluationMessage,
	summarizeEvaluation,
};
