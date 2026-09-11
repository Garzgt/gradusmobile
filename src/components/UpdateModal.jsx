import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, BackHandler, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { currentVersion } from '../services/core/appVersionService';

export default function UpdateModal({ visible, requirement }) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.88);
      opacity.setValue(0);
    }
  }, [visible]);

  // Swallow the Android hardware back press so the gate cannot be dismissed.
  useEffect(() => {
    if (!visible) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visible]);

  if (!visible) return null;

  const downloadUrl = requirement?.download_url;
  const latest = requirement?.latest_version;
  const notes = requirement?.release_notes;

  const handleDownload = async () => {
    if (!downloadUrl || opening) return;
    setOpening(true);
    try {
      await WebBrowser.openBrowserAsync(downloadUrl);
    } catch {
      // Browser refused to open — leave the gate up so the student can retry.
    } finally {
      setOpening(false);
    }
  };

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          <View style={styles.iconWrap}>
            <Ionicons name="warning" size={32} color="#B7770D" />
          </View>

          <Text style={styles.title}>Update Required</Text>

          <Text style={styles.message}>
            This version of Gradus is no longer supported. Download the latest version to continue.
          </Text>

          {notes ? (
            <View style={styles.notes}>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, !downloadUrl && styles.btnDisabled]}
            onPress={handleDownload}
            activeOpacity={0.8}
            disabled={!downloadUrl || opening}
          >
            <Text style={styles.btnText}>
              {opening ? 'Opening\u2026' : 'Download Update'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.version}>
            {latest ? `Version ${currentVersion} \u2192 ${latest}` : `Version ${currentVersion}`}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#1a3c5e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A2A3A',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: '#5A7490',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  notes: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  notesText: {
    fontSize: 12,
    color: '#5A7490',
    lineHeight: 18,
  },
  btn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1a3c5e',
  },
  btnDisabled: { backgroundColor: '#8BA4BC' },
  btnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  version: {
    fontSize: 11,
    color: '#8BA4BC',
    textAlign: 'center',
    marginTop: 12,
  },
});
