declare module '@env' {
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  export const ENV: 'development' | 'production';
}

// Add global __DEV__ variable which is provided by React Native
declare global {
  var __DEV__: boolean;
}