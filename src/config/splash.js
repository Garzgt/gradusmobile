import * as SplashScreen from 'expo-splash-screen';

// Docs for SDK 57 call for preventAutoHideAsync in global scope, not awaited and
// not inside a component. Importing this module is what arms it.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

let hidden = false;

// Idempotent: several places race to be "first paint ready" (auth resolving, the
// update gate appearing), and hideAsync is meant to fire once.
export function hideSplash() {
  if (hidden) return;
  hidden = true;
  SplashScreen.hideAsync().catch(() => {});
}

// Safety net. Without this, anything that stalls before the first screen renders
// leaves the user staring at a splash with no way forward.
setTimeout(hideSplash, 6000);
