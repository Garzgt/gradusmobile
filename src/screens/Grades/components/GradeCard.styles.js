import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#1A2A3A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  code: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8BA4BC',
    letterSpacing: 0.5,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2A3A',
    lineHeight: 19,
  },
  units: {
    fontSize: 11,
    color: '#8BA4BC',
    fontWeight: '400',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    gap: 4,
  },
  grade: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A2A3A',
    letterSpacing: -0.5,
  },
  gradePassed: {
    color: '#16A34A',
  },
  gradeFailed: {
    color: '#DC2626',
  },
  gradePending: {
    color: '#8BA4BC',
  },
});
