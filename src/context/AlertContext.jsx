import React, { createContext, useCallback, useContext, useState } from 'react';
import AlertModal from '../components/AlertModal';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback((alertConfig) => {
    setConfig(alertConfig);
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setConfig(null), 300);
  }, []);

  return (
    <AlertContext.Provider value={{ show }}>
      {children}
      <AlertModal visible={visible} config={config} onDismiss={dismiss} />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used inside AlertProvider');
  return ctx;
}
