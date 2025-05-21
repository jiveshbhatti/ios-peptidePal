const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Take a screenshot of the current state
const takeScreenshot = (filename) => {
  return new Promise((resolve, reject) => {
    const command = `xcrun simctl io 7B956034-A72F-42F7-A74A-42C44308CE07 screenshot ${filename}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error taking screenshot: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Screenshot stderr: ${stderr}`);
      }
      console.log(`Screenshot saved to ${filename}`);
      resolve(stdout);
    });
  });
};

// Main test sequence
const runTest = async () => {
  console.log('Starting Expo test...');
  
  // Launch Expo Go
  console.log('Launching Expo Go...');
  exec('xcrun simctl launch 7B956034-A72F-42F7-A74A-42C44308CE07 host.exp.Exponent', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error launching Expo Go: ${error.message}`);
      return;
    }
    console.log('Expo Go launched');
  });
  
  // Wait for app to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Take a screenshot of the home screen
  await takeScreenshot('expo-home.png');
  
  // Wait a bit more for any loading
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Take another screenshot to see if anything changed
  await takeScreenshot('expo-home-after-wait.png');
  
  console.log('Test completed');
};

// Run the test
runTest().catch(console.error);
