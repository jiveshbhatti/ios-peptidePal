import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { config } from '../config';

// Log the current environment
console.log(`Running in ${config.env} environment with ${config.supabase.label} database`);

// Get database credentials from config
const SUPABASE_URL_VALUE = config.supabase.url;
const SUPABASE_ANON_KEY_VALUE = config.supabase.key;

// Special config for web to avoid Node.js dependencies
const options = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
};

// Add specific web configurations if needed
if (Platform.OS === 'web') {
  options.global = {
    fetch: fetch.bind(globalThis),
    Headers,
    FormData,
    Blob,
  };
}

export const supabase = createClient(SUPABASE_URL_VALUE, SUPABASE_ANON_KEY_VALUE, options);

// Log connection info (redacting sensitive parts of the key)
console.log(`Connected to Supabase at: ${SUPABASE_URL_VALUE}`);
console.log(`Using key: ${SUPABASE_ANON_KEY_VALUE.substring(0, 8)}...${SUPABASE_ANON_KEY_VALUE.substring(SUPABASE_ANON_KEY_VALUE.length - 8)}`);