const puppeteer = require('puppeteer');

async function testExpoApp() {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Browser launched');
    
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      console.log(`Console [${msg.type()}]: ${msg.text()}`);
    });
    
    // Capture network errors
    page.on('pageerror', error => {
      console.log(`Page error: ${error.message}`);
    });
    
    // Monitor network requests
    page.on('request', request => {
      console.log(`Request: ${request.url()}`);
    });
    
    page.on('requestfailed', request => {
      console.log(`Request failed: ${request.url()}: ${request.failure().errorText}`);
    });
    
    console.log('Going to Expo page...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Loaded Expo page');
    
    // Take screenshot of the main page
    await page.screenshot({ path: 'expo-home-new.png', fullPage: true });
    console.log('Screenshot saved as expo-home-new.png');
    
    // Wait for 5 seconds to allow any content to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to find any React error boundary message
    const errorBoundary = await page.evaluate(() => {
      const errorElements = Array.from(document.querySelectorAll('pre, div')).filter(el => {
        return el.textContent && el.textContent.includes('Error');
      });
      return errorElements.map(el => el.textContent);
    });
    
    if (errorBoundary.length > 0) {
      console.log('Found error messages in UI:');
      errorBoundary.forEach((error, i) => console.log(`Error ${i+1}:`, error));
    } else {
      console.log('No error messages found in UI');
    }
    
    // Evaluate if there are any React elements rendered
    const reactComponents = await page.evaluate(() => {
      // Look for elements with data-reactroot or similar
      const reactElements = document.querySelectorAll('[data-reactroot], [data-reactid], [class*="react"]');
      return reactElements.length;
    });
    
    console.log(`Found ${reactComponents} potential React elements`);
    
    await browser.close();
    console.log('Browser closed');
    
  } catch (error) {
    console.error('Error running test:', error);
  }
}

testExpoApp();