import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    gap: 12,
  },
  field: {
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A7A99',
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#F4F9FD',
    borderWidth: 1.5,
    borderColor: '#D8ECF8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A2A3A',
  },
  inputFocused: {
    borderColor: '#2A7AB6',
    backgroundColor: '#FFFFFF',
  },
  optional: {
    fontSize: 11,
    color: '#9DB8CC',
    fontWeight: '400',
  },
});
