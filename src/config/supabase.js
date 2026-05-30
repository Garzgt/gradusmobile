import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as ExpoCrypto from 'expo-crypto';

// Polyfill WebCrypto so Supabase PKCE uses SHA-256 (not available natively in RN)
if (!global.crypto) global.crypto = {};

if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = (array) => {
    const bytes = ExpoCrypto.getRandomBytes(array.length);
    for (let i = 0; i < array.length; i++) array[i] = bytes[i];
    return array;
  };
}

if (!global.crypto.subtle) {
  global.crypto.subtle = {
    digest: async (algorithm, data) => {
      const name = (typeof algorithm === 'string' ? algorithm : algorithm.name).toUpperCase();
      if (name !== 'SHA-256') throw new Error(`Unsupported digest algorithm: ${name}`);
      // data is ArrayBuffer of UTF-8 bytes — reconstruct the string for expo-crypto
      const bytes = new Uint8Array(data);
      const str = bytes.reduce((s, b) => s + String.fromCharCode(b), '');
      const hex = await ExpoCrypto.digestStringAsync(
        ExpoCrypto.CryptoDigestAlgorithm.SHA256,
        str,
        { encoding: ExpoCrypto.CryptoEncoding.HEX }
      );
      const out = new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
      return out.buffer;
    },
  };
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const hybridStorage = {
  _mem: {},
  async getItem(key) {
    if (this._mem[key] !== undefined) return this._mem[key];
    try { return await AsyncStorage.getItem(key); } catch { return null; }
  },
  async setItem(key, value) {
    this._mem[key] = value;
    try { await AsyncStorage.setItem(key, value); } catch {}
  },
  async removeItem(key) {
    delete this._mem[key];
    try { await AsyncStorage.removeItem(key); } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: hybridStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
