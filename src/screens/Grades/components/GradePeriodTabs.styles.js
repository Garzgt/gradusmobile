import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  scroll: {
    marginTop: 16,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EBF4FC',
  },
  tabActive: {
    backgroundColor: '#1a3c5e',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A7AB6',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
