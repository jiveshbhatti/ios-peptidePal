import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

// Same Supabase credentials as the web app
const SUPABASE_URL = 'https://yawjzpovpfccgisrrfjo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o';

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

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);