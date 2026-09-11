import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../../config/supabase';

// The version baked into this build at compile time (app.config.js -> expo.version).
export const currentVersion = Constants.expoConfig?.version ?? '0.0.0';

// Numeric dotted-version compare. Returns -1 / 0 / 1 like a sort comparator.
// Non-numeric or missing segments are treated as 0, so "1.0" and "1.0.0" match.
export function compareVersions(a, b) {
  const left = String(a ?? '').split('.');
  const right = String(b ?? '').split('.');
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i++) {
    const l = parseInt(left[i], 10) || 0;
    const r = parseInt(right[i], 10) || 0;
    if (l !== r) return l < r ? -1 : 1;
  }
  return 0;
}

// True when this build is older than the minimum the backend still accepts.
export function isOutdated(minSupportedVersion) {
  if (!minSupportedVersion) return false;
  return compareVersions(currentVersion, minSupportedVersion) < 0;
}

// Reads the requirement row for this platform. Public-readable by design: the
// gate has to work before the student is authenticated, since a broken build
// often cannot complete login at all.
export async function fetchVersionRequirement() {
  const { data, error } = await supabase
    .from('app_versions')
    .select('platform, latest_version, min_supported_version, download_url, release_notes')
    .eq('platform', Platform.OS)
    .maybeSingle();

  if (error) throw error;
  return data;
}
