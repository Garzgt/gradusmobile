import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [current, setCurrent] = useState(null);
  const timerRef = useRef(null);

  const show = useCallback(({ type = 'info', title, message, duration = 3000 }) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrent({ id: Date.now(), type, title, message });
    timerRef.current = setTimeout(() => setCurrent(null), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.overlay} pointerEvents="box-none">
        {current ? <Toast key={current.id} toast={current} /> : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999 },
});
