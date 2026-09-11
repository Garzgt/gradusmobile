import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { fetchVersionRequirement, isOutdated, currentVersion } from '../services/core/appVersionService';
import UpdateModal from '../components/UpdateModal';
import BrandedLoader from '../components/BrandedLoader';
import { hideSplash } from '../config/splash';

const CACHE_KEY = 'gradus.versionRequirement';

const UpdateContext = createContext(null);

export function UpdateProvider({ children }) {
  const [requirement, setRequirement] = useState(null);
  const [outdated, setOutdated] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const checkingRef = useRef(false);

  // Applies a requirement row and caches it. The cache is what stops a student
  // from dodging the gate by turning off data: once we have ever seen that this
  // build is unsupported, the block survives restarts and offline launches.
  const apply = useCallback(async (row, { cache = true } = {}) => {
    if (!row) return;
    setRequirement(row);
    setOutdated(isOutdated(row.min_supported_version));
    if (cache) {
      try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(row)); } catch {}
    }
  }, []);

  const check = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const row = await fetchVersionRequirement();
      if (row) await apply(row);
    } catch {
      // Network or Supabase failure. Fail open — students already blocked by the
      // cached requirement stay blocked, everyone else keeps working offline.
    } finally {
      checkingRef.current = false;
    }
  }, [apply]);

  // Cached requirement first so a known-outdated build gates instantly, with no
  // window where the old app is usable while the network call is in flight.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && !cancelled) await apply(JSON.parse(cached), { cache: false });
      } catch {}
      if (!cancelled) {
        setHydrated(true);
        check();
      }
    })();

    return () => { cancelled = true; };
  }, [apply, check]);

  useEffect(() => {
    if (outdated) hideSplash();
  }, [outdated]);

  // Reacts the moment a new minimum is published, even while the app is open.
  useEffect(() => {
    const channel = supabase
      .channel('app-versions-gate')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_versions' },
        () => check()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [check]);

  // Catches a requirement published while the app sat in the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  return (
    <UpdateContext.Provider value={{ requirement, outdated, currentVersion, check }}>
      {!hydrated ? <BrandedLoader /> : !outdated && children}
      <UpdateModal visible={outdated} requirement={requirement} />
    </UpdateContext.Provider>
  );
}

export function useUpdateGate() {
  const ctx = useContext(UpdateContext);
  if (!ctx) throw new Error('useUpdateGate must be used inside UpdateProvider');
  return ctx;
}
