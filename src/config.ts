// Configuration file for the app
// Handles environment variables

// Get environment values or use defaults
const ENV = process.env.ENV || 'development';

// Configuration object
export const config = {
  env: ENV,
  isDevelopment: ENV === 'development',
  isProduction: ENV === 'production',
  
  // Firebase is now the only database
  firebase: {
    // Firebase config is handled in firebase-config.js
    label: ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'
  }
};

// Log the current configuration
console.log(`App config loaded: Environment: ${config.env}`);

// Export environment info for debugging
export function getEnvironmentInfo() {
  return {
    env: config.env,
    isDevelopment: config.isDevelopment,
    isProduction: config.isProduction,
    firebase: config.firebase.label
  };
}