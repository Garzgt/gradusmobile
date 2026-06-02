import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TYPE_ICON = {
  success: { name: 'checkmark-circle', color: '#2A7AB6' },
  error:   { name: 'alert-circle',     color: '#C0392B' },
  warning: { name: 'warning',          color: '#B7770D' },
  info:    { name: 'information-circle', color: '#2A7AB6' },
};

export default function AlertModal({ visible, config, onDismiss }) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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

  if (!config) return null;

  const buttons = config.buttons?.length ? config.buttons : [{ text: 'OK' }];
  const iconConfig = config.type ? TYPE_ICON[config.type] : null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          {/* Icon */}
          {iconConfig && (
            <View style={styles.iconWrap}>
              <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
            </View>
          )}

          {/* Title */}
          {config.title ? (
            <Text style={styles.title}>{config.title}</Text>
          ) : null}

          {/* Message */}
          {config.message ? (
            <Text style={styles.message}>{config.message}</Text>
          ) : null}

          {/* Buttons */}
          <View style={[styles.buttonRow, buttons.length === 1 && styles.buttonRowSingle]}>
            {buttons.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              const isPrimary = !isCancel && i === buttons.length - 1;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    isCancel && styles.btnCancel,
                    isDestructive && styles.btnDestructive,
                    isPrimary && !isDestructive && styles.btnPrimary,
                    buttons.length === 1 && styles.btnFull,
                  ]}
                  onPress={() => { onDismiss(); btn.onPress?.(); }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isCancel && styles.btnTextCancel,
                      isDestructive && styles.btnTextDestructive,
                      isPrimary && !isDestructive && styles.btnTextPrimary,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,25,45,0.55)',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonRowSingle: {
    flexDirection: 'column',
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#EEF4FA',
  },
  btnFull: { flex: undefined, width: '100%' },
  btnCancel: { backgroundColor: '#F0F4F8' },
  btnPrimary: { backgroundColor: '#1a3c5e' },
  btnDestructive: { backgroundColor: '#FADBD8' },
  btnText: { fontSize: 14, fontWeight: '700', color: '#5A7490' },
  btnTextCancel: { color: '#5A7490' },
  btnTextPrimary: { color: '#FFFFFF' },
  btnTextDestructive: { color: '#C0392B' },
});
