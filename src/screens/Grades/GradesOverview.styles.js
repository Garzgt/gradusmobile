import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1a3c5e',
  },
  header: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  decOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(42,122,182,0.15)',
    top: -60,
    right: -30,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  scroll: {
    backgroundColor: '#F2F6FA',
  },
  emptyBox: {
    margin: 24,
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2A3A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: '#8BA4BC',
    textAlign: 'center',
    lineHeight: 19,
  },
  listSection: {
    marginTop: 12,
  },
  sectionTitleCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#1A2A3A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8BA4BC',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
