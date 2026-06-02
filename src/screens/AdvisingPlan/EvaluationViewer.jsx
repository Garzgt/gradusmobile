import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import styles from './EvaluationViewer.styles';
import {
  EVALUATION_URL,
  buildEvaluationScanScript,
  parseEvaluationMessage,
  summarizeEvaluation,
} from './services/evaluationViewerService';

const STORAGE_KEY = 'advising.evaluationScan';

export default function EvaluationViewer() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);

  const [canScan, setCanScan] = useState(false);
  const [scanState, setScanState] = useState('idle');
  const [scanError, setScanError] = useState('');
  const [subjects, setSubjects] = useState([]);

  const summary = useMemo(() => summarizeEvaluation(subjects), [subjects]);

  // ── scan logic unchanged ──────────────────────────────────────────────────
  const handleNavigationChange = useCallback((navState) => {
    const url = navState?.url || '';
    setCanScan(url.includes('#student/evaluation'));
  }, []);

  const handleScan = useCallback(() => {
    if (!webViewRef.current) return;
    setScanError('');
    setScanState('scanning');
    webViewRef.current.injectJavaScript(buildEvaluationScanScript());
  }, []);

  const handleMessage = useCallback(async (event) => {
    const parsed = parseEvaluationMessage(event.nativeEvent.data);
    if (!parsed) return;

    if (parsed.type === 'EVALUATION_SCAN') {
      const nextSubjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];
      setSubjects(nextSubjects);
      setScanState('done');
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ subjects: nextSubjects, scannedAt: new Date().toISOString() })
        );
      } catch {
        // non-blocking
      }
      return;
    }

    if (parsed.type === 'EVALUATION_SCAN_ERROR') {
      setScanState('error');
      setScanError(parsed.message || 'Scan failed.');
    }
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const notCompleted = summary.total - summary.completed;

  const bannerConfig = useMemo(() => {
    if (scanState === 'scanning') {
      return { bg: '#1a3c5e', spinning: true, text: 'Scanning your evaluation…' };
    }
    if (scanState === 'error') {
      return { bg: '#FADBD8', icon: 'alert-circle', iconColor: '#C0392B', text: scanError || 'Scan failed. Please try again.', textColor: '#C0392B' };
    }
    if (scanState === 'done') {
      return { bg: '#1a3c5e', icon: 'checkmark-circle', iconColor: '#4FC3F7', done: true };
    }
    if (canScan) {
      return { bg: '#2A7AB6', icon: 'radio-button-on', iconColor: '#FFFFFF', text: 'Evaluation page detected. Tap Scan when ready.', textColor: '#FFFFFF' };
    }
    return { bg: '#EBF4FC', icon: 'information-circle-outline', iconColor: '#2A7AB6', text: 'Log in and open the evaluation page to start scanning.', textColor: '#2A7AB6' };
  }, [scanState, scanError, canScan]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.decOrb} />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>ADVISING</Text>
        <Text style={styles.headerTitle}>Evaluation Viewer</Text>
        <Text style={styles.headerSubtitle}>Scan your PSU evaluation results</Text>
      </View>

      <View style={styles.content}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: bannerConfig.bg }]}>
          {bannerConfig.spinning ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name={bannerConfig.icon} size={16} color={bannerConfig.iconColor} />
          )}

          {bannerConfig.done ? (
            <View style={styles.statusChipRow}>
              <View style={[styles.statusChip, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Text style={[styles.statusChipText, { color: '#FFFFFF' }]}>{summary.total} subjects</Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: '#2A7AB6' }]}>
                <Text style={[styles.statusChipText, { color: '#FFFFFF' }]}>✓ {summary.completed} completed</Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Text style={[styles.statusChipText, { color: 'rgba(255,255,255,0.8)' }]}>{notCompleted} remaining</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.statusBannerText, { color: bannerConfig.textColor }]}>
              {bannerConfig.text}
            </Text>
          )}
        </View>

        {/* WebView — stops above the floating tab bar */}
        <View style={[styles.webWrap, { marginBottom: insets.bottom + 86 }]}>
          <WebView
            ref={webViewRef}
            source={{ uri: EVALUATION_URL }}
            style={styles.webView}
            onNavigationStateChange={handleNavigationChange}
            onMessage={handleMessage}
            startInLoadingState
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
          />

          {/* Floating buttons inside WebView, above the tab bar */}
          <View style={[styles.actionWrap, { bottom: 14 }]}>
            {scanState === 'done' && (
              <TouchableOpacity
                style={styles.backPlanButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done-outline" size={16} color="#FFFFFF" />
                <Text style={styles.backPlanText}>Done</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.scanButton, (!canScan || scanState === 'scanning') && styles.scanButtonDisabled]}
              onPress={handleScan}
              disabled={!canScan || scanState === 'scanning'}
              activeOpacity={0.8}
            >
              {scanState === 'scanning' ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
              )}
              <Text style={[styles.scanText, (!canScan || scanState === 'scanning') && styles.scanTextDisabled]}>
                {scanState === 'scanning' ? 'Scanning…' : scanState === 'done' ? 'Scan again' : 'Scan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
