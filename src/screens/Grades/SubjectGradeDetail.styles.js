import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#1a3c5e' },
  scroll: { backgroundColor: '#F2F6FA' },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  decOrb: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(42,122,182,0.15)', top: -60, right: -30,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  headerLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2, marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -0.3, lineHeight: 28,
  },

  // ── Empty / Error ─────────────────────────────────────────────────────────
  emptyBox:  { margin: 24, alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 15, color: '#1A2A3A', fontWeight: '600', textAlign: 'center' },

  // ── Info card ─────────────────────────────────────────────────────────────
  infoCard: {
    margin: 16, marginBottom: 0,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingTop: 4,
    elevation: 2,
    shadowColor: '#1A2A3A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
  },
  infoLabel: { fontSize: 13, color: '#8BA4BC', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#1A2A3A', fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  divider:   { height: 1, backgroundColor: '#EBF4FC', marginHorizontal: 16 },

  // ── Final grade card ──────────────────────────────────────────────────────
  gradeCard: {
    marginHorizontal: 16, marginTop: 14, marginBottom: 0,
    backgroundColor: '#1a3c5e', borderRadius: 20, padding: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#1a3c5e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8,
  },
  decOrbCard: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(42,122,182,0.18)', top: -70, right: -50,
  },
  gradeCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  gradeCardTitle: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5,
  },
  equivalentGrade: {
    fontSize: 56, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1, marginBottom: 16,
  },
  gradeRow:  { flexDirection: 'row', alignItems: 'center' },
  gradeChip: { flex: 1, alignItems: 'center' },
  gradeSep:  { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.12)' },
  gradeChipLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '600',
    letterSpacing: 0.5, marginBottom: 2, textTransform: 'uppercase',
  },
  gradeChipValue: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  // ── Breakdown wrapper ─────────────────────────────────────────────────────
  breakdownWrap: { marginTop: 20, marginHorizontal: 16, marginBottom: 8 },
  breakdownTitle: {
    fontSize: 11, fontWeight: '700', color: '#8BA4BC',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },

  // ── Period section ────────────────────────────────────────────────────────
  periodSection: {
    backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#1A2A3A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 6,
  },
  periodHeader: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 18, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  periodHeaderLabel: {
    fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.65)', letterSpacing: 2,
  },
  periodHeaderRight:  { alignItems: 'flex-end' },
  periodHeaderGrade:  { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  periodHeaderSub:    { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '600', letterSpacing: 0.5 },
  compBlocksWrap:     { paddingBottom: 4 },
  blockDivider:       { height: 6, backgroundColor: '#EBF4FC' },

  // ── Component block (Quizzes, Activities, etc.) ───────────────────────────
  compBlock: {
    borderBottomWidth: 1, borderBottomColor: '#F0F6FC',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  compBlockHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  compBlockLeft:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compBlockIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#EBF4FC', alignItems: 'center', justifyContent: 'center',
  },
  compBlockTitle:    { fontSize: 13, fontWeight: '700', color: '#1A2A3A' },
  compBlockScore:    { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  compBlockScoreVal: { fontSize: 16, fontWeight: '800', color: '#1a3c5e' },
  compBlockScoreMax: { fontSize: 11, color: '#8BA4BC', fontWeight: '500' },
  compBlockBody:     { gap: 0 },

  // ── Score row with mini bar ───────────────────────────────────────────────
  scoreRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#F5F9FD',
  },
  scoreLabel: { fontSize: 13, color: '#5A7A9A', fontWeight: '500', width: 90 },
  scoreRight: { flex: 1, alignItems: 'flex-end', gap: 4 },
  miniBarBg: {
    width: '100%', height: 5, borderRadius: 3,
    backgroundColor: '#EBF4FC', overflow: 'hidden',
  },
  miniBarFill: { height: '100%', borderRadius: 3, backgroundColor: '#2A7AB6' },
  scoreText:   { fontSize: 13, fontWeight: '700', color: '#1A2A3A' },
  scoreMax:    { fontSize: 12, fontWeight: '400', color: '#8BA4BC' },

  // ── Subtotal chips ────────────────────────────────────────────────────────
  subtotalRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#F0F6FC',
  },
  subtotalChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F2F6FA', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  subtotalChipLabel:   { fontSize: 11, color: '#8BA4BC', fontWeight: '500' },
  subtotalChipVal:     { fontSize: 12, fontWeight: '700', color: '#1A2A3A' },

  // ── Attendance rows ───────────────────────────────────────────────────────
  attRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7,
    borderTopWidth: 1, borderTopColor: '#F5F9FD',
  },
  attIconWrap: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  attMeeting:    { fontSize: 12, fontWeight: '600', color: '#5A7A9A', width: 44 },
  attDate:       { flex: 1, fontSize: 12, color: '#8BA4BC', fontWeight: '400' },
  attBadge:      { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  attBadgeText:  { fontSize: 11, fontWeight: '700' },

  attSummary: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 10, marginTop: 10, paddingVertical: 10,
  },
  attSummaryItem:  { flex: 1, alignItems: 'center', gap: 2 },
  attSummarySep:   { width: 1, height: 28, backgroundColor: '#E2EBF4' },
  attSummaryNum:   { fontSize: 18, fontWeight: '800' },
  attSummaryLabel: {
    fontSize: 10, color: '#8BA4BC', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // ── No-data states ────────────────────────────────────────────────────────
  noDataText: { fontSize: 13, color: '#8BA4BC', fontStyle: 'italic', paddingVertical: 8 },
  noGradeBox: {
    margin: 16, padding: 32, alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 18,
    elevation: 1,
    shadowColor: '#1A2A3A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  noGradeText:    { fontSize: 16, fontWeight: '700', color: '#1A2A3A' },
  noGradeSubText: { fontSize: 13, color: '#8BA4BC', textAlign: 'center', lineHeight: 19 },
});
