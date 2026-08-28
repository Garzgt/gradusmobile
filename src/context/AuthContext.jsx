import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../config/supabase';
import { registerForPushNotificationsAsync, savePushToken } from '../services/core/pushNotificationService';

WebBrowser.maybeCompleteAuthSession();

const PSU_DOMAIN = '@pampangastateu.edu.ph';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDomainBlocked, setIsDomainBlocked] = useState(false);
  const domainBlockedRef = useRef(false);

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
        domainBlockedRef.current = false;
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user) => {
    const email = user?.email ?? '';

    if (!email.endsWith(PSU_DOMAIN)) {
      domainBlockedRef.current = true;
      await supabase.auth.signOut();
      setIsDomainBlocked(true);
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
    const redirectUrl = 'gradus://';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });

    if (error || !data?.url) return { error };

    return new Promise((resolve) => {
      let finished = false;

      const finish = async (url) => {
        if (finished) return;
        finished = true;
        linkingSub.remove();

        if (!url) {
          resolve({ error: null });
          return;
        }

        const { queryParams } = Linking.parse(url);
        const code = queryParams?.code;
        const urlError = queryParams?.error_description ?? queryParams?.error;

        if (urlError) {
          resolve({ error: new Error(decodeURIComponent(urlError.replace(/\+/g, ' '))) });
          return;
        }
        if (!code) {
          resolve({ error: null });
          return;
        }

        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        resolve({ error: sessionError ?? null });
      };

      const linkingSub = Linking.addEventListener('url', ({ url }) => {
        if (url?.startsWith('gradus:')) finish(url);
      });

      WebBrowser.openAuthSessionAsync(data.url, redirectUrl)
        .then((result) => {
          if (result.type === 'success' && result.url) {
            finish(result.url);
          } else {
            setTimeout(() => finish(null), 500);
          }
        })
        .catch(() => finish(null));
    });
  };

  const signOut = async () => {
    setIsDomainBlocked(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        isDomainBlocked,
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
