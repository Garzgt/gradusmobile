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

  const statusText = useMemo(() => {
    if (scanState === 'scanning') return 'Scanning your evaluation table...';
    if (scanState === 'done') return `Scan complete. ${summary.total} subjects found.`;
    if (scanState === 'error') return scanError || 'Scan failed. Please try again.';
    if (canScan) return 'Tap Scan to read your evaluation results.';
    return 'Open the evaluation page to enable scanning.';
  }, [scanState, scanError, summary.total, canScan]);

  const statusMeta = useMemo(() => {
    if (scanState !== 'done') return '';
    const notCompleted = summary.total - summary.completed;
    return `Completed: ${summary.completed}  |  Not completed: ${notCompleted}`;
  }, [scanState, summary.total, summary.completed]);

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
          JSON.stringify({
            subjects: nextSubjects,
            scannedAt: new Date().toISOString(),
          })
        );
      } catch (error) {
        // Non-blocking storage failure.
      }
      return;
    }

    if (parsed.type === 'EVALUATION_SCAN_ERROR') {
      setScanState('error');
      setScanError(parsed.message || 'Scan failed.');
    }
  }, []);

  const contentStyle = useMemo(
    () => [styles.content, { paddingBottom: insets.bottom + 40 }],
    [insets.bottom]
  );
  const webWrapStyle = useMemo(
    () => [styles.webWrap, { marginBottom: insets.bottom + 8 }],
    [insets.bottom]
  );
  const actionWrapStyle = useMemo(
    () => [styles.actionWrap, { bottom: insets.bottom + 8 }],
    [insets.bottom]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Evaluation Viewer</Text>
            <Text style={styles.headerSubtitle}>Scan your PSU evaluation results</Text>
          </View>
        </View>
      </View>

      <View style={contentStyle}>
        <View style={styles.tipCard}>
          <Ionicons name="information-circle-outline" size={18} color="#2A7AB6" />
          <Text style={styles.tipText}>
            Log in, open the evaluation page, then tap Scan. Blue rows are treated as completed.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Ionicons name="clipboard-outline" size={18} color="#2A7AB6" />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusText}>{statusText}</Text>
            {statusMeta ? <Text style={styles.statusMeta}>{statusMeta}</Text> : null}
          </View>
        </View>

        <View style={webWrapStyle}>
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

          <View style={actionWrapStyle}>
            <TouchableOpacity
              style={[styles.scanButton, !canScan && styles.scanButtonDisabled]}
              onPress={handleScan}
              disabled={!canScan || scanState === 'scanning'}
              activeOpacity={0.8}
            >
              {scanState === 'scanning' ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
              )}
              <Text style={[styles.scanText, !canScan && styles.scanTextDisabled]}>
                {scanState === 'scanning' ? 'Scanning...' : 'Scan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
