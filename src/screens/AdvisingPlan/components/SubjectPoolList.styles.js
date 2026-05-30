import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 18,
		padding: 14,
		shadowColor: '#1a3c5e',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 10,
		elevation: 2,
		marginBottom: 14,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	title: {
		fontSize: 14,
		fontWeight: '800',
		color: '#1A2A3A',
	},
	countBadge: {
		backgroundColor: '#EBF4FC',
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	countText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#2A7AB6',
	},
	subtitle: {
		fontSize: 12,
		color: '#8BA4BC',
		marginBottom: 10,
	},
	listWrap: {
		gap: 0,
	},
	rowDivider: {
		height: 1,
		backgroundColor: '#EEF4FA',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
		paddingVertical: 12,
		paddingHorizontal: 6,
		borderRadius: 12,
	},
	rowSelected: {
		backgroundColor: '#F3F8FD',
	},
	checkCircle: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 1.5,
		borderColor: '#C8DFF0',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 2,
	},
	checkCircleSelected: {
		backgroundColor: '#2A7AB6',
		borderColor: '#2A7AB6',
	},
	rowBody: {
		flex: 1,
		gap: 4,
	},
	codeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
	},
	codeTag: {
		backgroundColor: '#EBF4FC',
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 3,
	},
	codeText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#2A7AB6',
	},
	unitsText: {
		fontSize: 11,
		color: '#8BA4BC',
		fontWeight: '600',
	},
	nameText: {
		fontSize: 13,
		fontWeight: '600',
		color: '#1A2A3A',
	},
	metaText: {
		fontSize: 11,
		color: '#8BA4BC',
	},
	emptyState: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 10,
	},
	emptyText: {
		fontSize: 12,
		color: '#8BA4BC',
	},
});
