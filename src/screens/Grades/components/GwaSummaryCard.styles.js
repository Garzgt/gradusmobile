import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#1a3c5e',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  decOrb: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(42,122,182,0.18)',
    top: -50,
    right: -40,
  },
  left: {
    flex: 1,
    gap: 1,
  },
  smallLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5,
  },
  gwaNumber: {
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 44,
    letterSpacing: -1,
  },
  description: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '400',
  },
  termLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 54,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    marginTop: 1,
  },
});
