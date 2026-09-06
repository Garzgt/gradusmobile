import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C8DFF0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#2A7AB6',
    borderColor: '#2A7AB6',
  },
  checkboxTextWrap: {
    flex: 1,
    gap: 3,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2A3A',
  },
  checkboxHint: {
    fontSize: 12,
    color: '#8BA4BC',
    lineHeight: 17,
  },
  yearWrap: {
    marginTop: 16,
  },
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
    justifyContent: 'space-between',
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
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A7AB6',
    letterSpacing: 0.3,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
