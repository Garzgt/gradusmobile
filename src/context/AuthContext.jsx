import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { GoogleSignin, statusCodes, isErrorWithCode } from '@react-native-google-signin/google-signin';
import { supabase } from '../config/supabase';
import { registerForPushNotificationsAsync, savePushToken } from '../services/core/pushNotificationService';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

const PSU_DOMAIN = '@pampangastateu.edu.ph';

// Google Play Services caches the last-picked account natively, independent of Supabase's
// session — without this, GoogleSignin.signIn() silently re-selects the same (e.g. blocked)
// account next time instead of showing the picker again. Swallow errors since this is a
// best-effort cleanup (e.g. no-op when there was no native session to begin with).
const signOutGoogle = async () => {
  try {
    await GoogleSignin.signOut();
  } catch {}
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDomainBlocked, setIsDomainBlocked] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const domainBlockedRef = useRef(false);
  const deactivatedRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setIsLoading(true);
        fetchProfile(session.user);
      } else {
        setProfile(null);
        if (!domainBlockedRef.current) {
          setIsDomainBlocked(false);
        }
        if (!deactivatedRef.current) {
          setIsDeactivated(false);
        }
        domainBlockedRef.current = false;
        deactivatedRef.current = false;
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fallback for when the realtime socket below is momentarily disconnected (e.g. after a long
  // background stretch) — re-runs the check on foreground-resume so it's never worse than that.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && session?.user && !domainBlockedRef.current && !deactivatedRef.current) {
        checkStillActive(session.user);
      }
    });
    return () => sub.remove();
  }, [session]);

  // Primary mechanism: reacts the moment an admin deactivates this student, even while the app
  // stays open in the foreground — the AppState check above only catches it on next resume.
  // Requires the `students` table to be added to the `supabase_realtime` publication.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || domainBlockedRef.current || deactivatedRef.current) return;

    const channel = supabase
      .channel(`student-status-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'students', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new?.is_active === false) {
            deactivatedRef.current = true;
            supabase.auth.signOut();
            signOutGoogle();
            setIsDeactivated(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // Returns false (and signs the user out) if this student's account has been deactivated.
  // No students row yet (e.g. brand-new account mid-setup) is not treated as deactivated.
  const checkStillActive = async (user) => {
    const { data: student } = await supabase
      .from('students')
      .select('is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (student && student.is_active === false) {
      deactivatedRef.current = true;
      await supabase.auth.signOut();
      await signOutGoogle();
      setIsDeactivated(true);
      return false;
    }
    return true;
  };

  const fetchProfile = async (user) => {
    const email = user?.email ?? '';

    if (!email.endsWith(PSU_DOMAIN)) {
      domainBlockedRef.current = true;
      await supabase.auth.signOut();
      await signOutGoogle();
      setIsDomainBlocked(true);
      setIsLoading(false);
      return;
    }

    const stillActive = await checkStillActive(user);
    if (!stillActive) {
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setProfile(data ?? null);
    setIsLoading(false);

    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        const { error } = await savePushToken(user.id, token);
        if (error) console.warn('[AuthContext] savePushToken failed (non-fatal):', error.message);
      }
    } catch (err) {
      console.warn('[AuthContext] push registration failed (non-fatal):', err.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) return { error: new Error('Google Sign-In did not return an ID token.') };

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      return { error };
    } catch (err) {
      if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
        return { error: null };
      }
      return { error: err };
    }
  };

  const signOut = async () => {
    setIsDomainBlocked(false);
    setIsDeactivated(false);
    await supabase.auth.signOut();
    await signOutGoogle();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        isDomainBlocked,
        isDeactivated,
        isAuthenticated: !!session,
        isProfileComplete: !!profile,
        signInWithGoogle,
        signOut,
        refreshProfile: () => session?.user && fetchProfile(session.user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
