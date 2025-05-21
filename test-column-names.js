// Test column names directly
const fs = require('fs');

// Function to simulate a peptide update that we can inspect in various ways
async function simulateUpdate() {
  try {
    // Define test data
    const testId = 'test-' + Date.now();
    const peptide = {
      id: testId,
      name: 'TEST-COLUMN',
      vials: [{id: 'test-vial', isActive: true, remainingAmountUnits: 10}],
      doseLogs: []
    };
    
    // Test various update payloads to understand schema behavior
    const testUpdates = [
      {
        description: "Only lowercase",
        payload: { doselogs: [], vials: peptide.vials }
      },
      {
        description: "Only camelCase",
        payload: { doseLogs: [], vials: peptide.vials }
      },
      {
        description: "Both variants",
        payload: { doseLogs: [], doselogs: [], vials: peptide.vials }
      },
      {
        description: "No dose logs at all",
        payload: { vials: peptide.vials }
      },
      {
        description: "Only vials camelCase",
        payload: { Vials: peptide.vials }
      },
      {
        description: "Split update - lowercase doselogs",
        isMultistep: true,
        payload1: { vials: peptide.vials },
        payload2: { doselogs: [] }
      },
      {
        description: "Split update - camelCase doseLogs",
        isMultistep: true,
        payload1: { vials: peptide.vials },
        payload2: { doseLogs: [] }
      }
    ];
    
    // Log the test cases
    console.log("========== COLUMN NAME TEST CASES ==========");
    console.log(JSON.stringify(testUpdates, null, 2));
    
    // Write to file so we can examine it directly from the app
    fs.writeFileSync('./column-test-cases.json', JSON.stringify(testUpdates, null, 2));
    console.log("Test cases written to column-test-cases.json");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run simulation
simulateUpdate();