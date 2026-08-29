import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../../context/ToastContext';
import { getOrGenerateCertificateUrl, openCertificate } from '../services/certificateService';

const HONOR_CONFIG = {
  presidents_list: {
    label: "President's List",
    icon: 'trophy',
    color: '#D97706',
    bg: '#FEF3C7',
  },
  deans_list: {
    label: "Dean's List",
    icon: 'ribbon',
    color: '#2A7AB6',
    bg: '#EBF4FC',
  },
  top25_university: {
    label: 'Top 25 University',
    icon: 'star',
    color: '#1a3c5e',
    bg: '#EEF4FA',
  },
};

function termLabel(term) {
  if (!term) return '—';
  const sem = term.semester === 1 ? '1st Semester' : '2nd Semester';
  return `${sem} ${term.school_year}`;
}

export default function HonorCard({ item, user, onCertificateGenerated }) {
  const config = HONOR_CONFIG[item.honor_type] ?? HONOR_CONFIG.deans_list;
  const toast = useToast();
  const [generating, setGenerating] = useState(false);

  const handleCertificatePress = async () => {
    if (generating) return;
    if (item.certificate_url) {
      openCertificate({ url: item.certificate_url });
      return;
    }
    setGenerating(true);
    const { url, localUri, error } = await getOrGenerateCertificateUrl(user, item);
    setGenerating(false);
    if (error || !url) {
      toast.show({
        type: 'error',
        title: 'Could not generate certificate',
        message: error?.message || 'Please try again.',
      });
      return;
    }
    onCertificateGenerated?.(item.id, url);
    openCertificate({ url, localUri });
  };

  return (
    <View style={styles.card}>
      <View style={[styles.cardTop, { backgroundColor: config.color }]}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
          <Ionicons name={config.icon} size={26} color="#FFFFFF" />
        </View>
        <View style={styles.cardTopText}>
          <Text style={styles.honorLabel}>{config.label}</Text>
          {item.term?.is_active && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current Term</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>TERM</Text>
          <Text style={styles.infoValue}>{termLabel(item.term)}</Text>
        </View>
        <View style={styles.rightGroup}>
          {item.rank && (
            <View style={[styles.infoItem, { alignItems: 'flex-end' }]}>
              <Text style={styles.infoLabel}>RANK</Text>
              <Text style={[styles.gwaValue, { color: config.color }]}>#{item.rank}</Text>
            </View>
          )}
          <View style={[styles.infoItem, { alignItems: 'flex-end' }]}>
            <Text style={styles.infoLabel}>GWA</Text>
            <Text style={[styles.gwaValue, { color: config.color }]}>
              {parseFloat(item.gwa).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.certBtn}
        onPress={handleCertificatePress}
        disabled={generating}
        activeOpacity={0.8}
      >
        {generating ? (
          <ActivityIndicator size="small" color="#2A7AB6" />
        ) : (
          <Ionicons
            name={item.certificate_url ? 'document-text-outline' : 'ribbon-outline'}
            size={15}
            color="#2A7AB6"
          />
        )}
        <Text style={styles.certBtnText}>
          {generating
            ? 'Generating…'
            : item.certificate_url
              ? 'View Certificate'
              : 'Generate Certificate'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 10,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTopText: {
    flex: 1,
    gap: 6,
  },
  honorLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  currentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoItem: {
    gap: 3,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8BA4BC',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2A3A',
  },
  gwaValue: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'right',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerV: {
    width: 1,
    height: 36,
    backgroundColor: '#EEF4FA',
  },
  certBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 2,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#EBF4FC',
  },
  certBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A7AB6',
  },
});
