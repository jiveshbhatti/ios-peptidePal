import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { config } from '../config';

// Create a singleton instance that can be updated
let supabaseInstance: SupabaseClient | null = null;

// Special config for auth and storage
const options = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: Platform.OS === 'web' ? {
    fetch: fetch.bind(globalThis),
    Headers,
    FormData,
    Blob,
  } : undefined,
};

/**
 * Get the current Supabase client instance
 * Creates a new instance if one doesn't exist
 */
export function getSupabaseClient(): SupabaseClient {
  // If we don't have an instance yet, create one
  if (!supabaseInstance) {
    // Get database credentials from config
    const SUPABASE_URL = config.supabase.url;
    const SUPABASE_KEY = config.supabase.key;
    
    // Create the client
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, options);
    
    // Log connection info
    console.log(`[DYNAMIC] Connected to Supabase at: ${SUPABASE_URL}`);
    console.log(`[DYNAMIC] Using database: ${config.supabase.label}`);
  }
  
  return supabaseInstance;
}

/**
 * Update the Supabase client instance when environment changes
 * This should be called after switching environments
 */
export function updateSupabaseClient(): SupabaseClient {
  // Log that we're updating
  console.log(`[DYNAMIC] Updating Supabase client to ${config.supabase.label} database...`);
  
  // Create a new client
  supabaseInstance = createClient(config.supabase.url, config.supabase.key, options);
  
  // Log the new connection
  console.log(`[DYNAMIC] Supabase client updated: ${config.supabase.url}`);
  console.log(`[DYNAMIC] Now using: ${config.supabase.label}`);
  
  return supabaseInstance;
}

// Export a default instance for backward compatibility
export const supabase = getSupabaseClient();