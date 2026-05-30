import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DEEDF7',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: '#1A2A3A',
    lineHeight: 20,
  },
  domain: {
    fontWeight: '600',
    color: '#2A7AB6',
  },
});
