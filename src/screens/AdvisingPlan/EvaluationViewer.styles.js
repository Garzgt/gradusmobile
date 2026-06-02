import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a3c5e' },

  // Header
  header: {
    backgroundColor: '#1a3c5e',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  decOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(42,122,182,0.18)',
    top: -60,
    right: -40,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },

  // Content
  content: { flex: 1, backgroundColor: '#F2F6FA' },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusBannerText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  statusChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  statusChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // WebView area
  webWrap: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: { flex: 1, backgroundColor: '#FFFFFF' },

  // Floating action buttons inside WebView
  actionWrap: {
    position: 'absolute',
    right: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a3c5e',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  scanButtonDisabled: {
    backgroundColor: '#C8DFF0',
  },
  scanText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanTextDisabled: {
    color: 'rgba(255,255,255,0.6)',
  },
  backPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A7AB6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  backPlanText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
