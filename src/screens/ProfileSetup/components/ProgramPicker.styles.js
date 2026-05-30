import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5A7A99',
    marginBottom: 8,
  },
  grid: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C8DFF0',
    backgroundColor: '#FFFFFF',
  },
  cardSelected: {
    backgroundColor: '#2A7AB6',
    borderColor: '#2A7AB6',
  },
  cardContent: {
    flex: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A7AB6',
    letterSpacing: 0.4,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipSubText: {
    fontSize: 12,
    color: '#8BA4BC',
    marginTop: 2,
    lineHeight: 16,
  },
  chipSubTextSelected: {
    color: '#DEEDF7',
  },
  loading: {
    marginTop: 8,
  },
});
