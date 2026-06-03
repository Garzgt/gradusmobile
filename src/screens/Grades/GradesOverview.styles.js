import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a3c5e' },
  header: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  decOrb: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(42,122,182,0.15)',
    top: -60, right: -30,
  },
  headerLabel: {
    fontSize: 10, fontWeight: '700',
    color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28, fontWeight: '800',
    color: '#FFFFFF', letterSpacing: -0.5,
  },
  headerBottom: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 6,
  },
  headerSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.45)',
  },
  termSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    maxWidth: 160,
  },
  termSelectorText: {
    fontSize: 11, fontWeight: '600',
    color: 'rgba(255,255,255,0.9)', flexShrink: 1,
  },

  scroll: { backgroundColor: '#F2F6FA' },

  emptyBox: { margin: 24, alignItems: 'center', padding: 24 },
  emptyText: {
    fontSize: 16, fontWeight: '700', color: '#1A2A3A',
    textAlign: 'center', marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13, color: '#8BA4BC', textAlign: 'center', lineHeight: 19,
  },

  listSection: { marginTop: 12 },
  sectionTitleCard: {
    marginHorizontal: 10, marginBottom: 8,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
    elevation: 2,
    shadowColor: '#1A2A3A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#8BA4BC',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },

  // ── History modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#D1E4F4', alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16, fontWeight: '800', color: '#1A2A3A',
  },
  termRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#F0F6FC',
  },
  termRowSelected: {
    backgroundColor: '#F0F8FF',
    marginHorizontal: -20, paddingHorizontal: 20,
  },
  termRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  termRowLabel: { fontSize: 14, fontWeight: '600', color: '#1A2A3A' },
  termRowLabelSelected: { color: '#1a3c5e', fontWeight: '700' },
  termRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  termRowCount: { fontSize: 12, color: '#8BA4BC', fontWeight: '500' },
  currentBadge: {
    backgroundColor: '#DCFCE7', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  currentBadgeText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
});
