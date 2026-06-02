import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TYPE_CONFIG = {
  success: { icon: 'checkmark-circle', bg: '#1a3c5e', accent: '#2A7AB6' },
  error:   { icon: 'alert-circle',     bg: '#C0392B', accent: '#E74C3C' },
  warning: { icon: 'warning',          bg: '#9A6009', accent: '#F0B429' },
  info:    { icon: 'information-circle', bg: '#2A7AB6', accent: '#5BA4D4' },
};

export default function Toast({ toast }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 12, backgroundColor: config.bg, transform: [{ translateY }], opacity },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: config.accent }]}>
        <Ionicons name={config.icon} size={18} color="#FFFFFF" />
      </View>
      <View style={styles.textWrap}>
        {toast.title ? <Text style={styles.title}>{toast.title}</Text> : null}
        <Text style={styles.message}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  message: { fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 17 },
});
