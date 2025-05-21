const fs = require('fs');
const path = require('path');

// Get environment name from command line argument
const env = process.argv[2] || 'development';

if (!['development', 'production'].includes(env)) {
  console.error('Invalid environment. Use "development" or "production".');
  process.exit(1);
}

// Update babel.config.js to use the selected environment
const babelConfigPath = path.join(__dirname, 'babel.config.js');
let babelConfig = fs.readFileSync(babelConfigPath, 'utf8');

babelConfig = babelConfig.replace(
  /path": "\.env\.[^"]+"/,
  `path": ".env.${env}"`
);

fs.writeFileSync(babelConfigPath, babelConfig);

console.log(`Environment set to ${env}`);
console.log('Restart your Expo server for changes to take effect.');