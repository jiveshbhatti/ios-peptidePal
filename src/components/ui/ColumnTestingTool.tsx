import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { theme } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { config } from '@/config';

/**
 * A tool for testing column name issues in the database
 */
export default function ColumnTestingTool() {
  const [results, setResults] = useState<Array<{description: string, success: boolean, error?: string}>>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Create a test peptide and run various update scenarios
  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    const testResults = [];
    
    try {
      // Create a test peptide
      const testId = `test-${Date.now()}`;
      console.log(`Creating test peptide with ID: ${testId}`);
      
      const testPeptide = {
        id: testId,
        name: 'COLUMN-TEST-TOOL',
        vials: [{id: 'test-vial', isActive: true, remainingAmountUnits: 10}]
      };
      
      // Insert the test peptide
      const { error: insertError } = await supabase
        .from('peptides')
        .insert(testPeptide);
        
      if (insertError) {
        console.error("Failed to create test peptide:", insertError);
        setResults([{ 
          description: "Create test peptide", 
          success: false, 
          error: insertError.message 
        }]);
        setIsRunning(false);
        return;
      }
      
      testResults.push({
        description: "Create test peptide", 
        success: true
      });
      
      // Fetch the current entry to see column names
      const { data, error: fetchError } = await supabase
        .from('peptides')
        .select('*')
        .eq('id', testId)
        .single();
        
      if (fetchError) {
        testResults.push({
          description: "Fetch test peptide",
          success: false,
          error: fetchError.message
        });
      } else {
        const columnNames = Object.keys(data);
        testResults.push({
          description: "Fetch column names",
          success: true,
          error: `Columns: ${columnNames.join(', ')}`
        });
      }
      
      // Try the tests
      
      // Test 1: Update with only lowercase doselogs
      try {
        const { error } = await supabase
          .from('peptides')
          .update({ doselogs: [] })
          .eq('id', testId);
          
        testResults.push({
          description: "Update with lowercase 'doselogs'",
          success: !error,
          error: error ? error.message : undefined
        });
      } catch (e) {
        testResults.push({
          description: "Update with lowercase 'doselogs'",
          success: false,
          error: e.message
        });
      }
      
      // Test 2: Update with only camelCase doseLogs
      try {
        const { error } = await supabase
          .from('peptides')
          .update({ "doseLogs": [] })
          .eq('id', testId);
          
        testResults.push({
          description: "Update with camelCase 'doseLogs'",
          success: !error,
          error: error ? error.message : undefined
        });
      } catch (e) {
        testResults.push({
          description: "Update with camelCase 'doseLogs'",
          success: false,
          error: e.message
        });
      }
      
      // Test 3: Update with only vials
      try {
        const { error } = await supabase
          .from('peptides')
          .update({ vials: [] })
          .eq('id', testId);
          
        testResults.push({
          description: "Update with just 'vials'",
          success: !error,
          error: error ? error.message : undefined
        });
      } catch (e) {
        testResults.push({
          description: "Update with just 'vials'",
          success: false,
          error: e.message
        });
      }
      
      // Test 4: Multi-step update - vials first, then doselogs
      try {
        // First update vials
        const { error: vialError } = await supabase
          .from('peptides')
          .update({ vials: [] })
          .eq('id', testId);
          
        if (vialError) {
          testResults.push({
            description: "Multi-step: Update vials",
            success: false,
            error: vialError.message
          });
        } else {
          // Then update doselogs
          const { error: logError } = await supabase
            .from('peptides')
            .update({ doselogs: [] })
            .eq('id', testId);
            
          testResults.push({
            description: "Multi-step: Update vials then doselogs",
            success: !logError,
            error: logError ? logError.message : undefined
          });
        }
      } catch (e) {
        testResults.push({
          description: "Multi-step update",
          success: false,
          error: e.message
        });
      }
      
      // Test 5: Update all fields atomically
      try {
        const { error } = await supabase
          .from('peptides')
          .update({ 
            vials: [],
            doselogs: [],
            name: "UPDATED-TEST-TOOL"
          })
          .eq('id', testId);
          
        testResults.push({
          description: "Update all fields atomically",
          success: !error,
          error: error ? error.message : undefined
        });
      } catch (e) {
        testResults.push({
          description: "Update all fields atomically",
          success: false,
          error: e.message
        });
      }
      
      // Test 6: Combination update - both formats
      try {
        const { error } = await supabase
          .from('peptides')
          .update({ 
            vials: [],
            doselogs: [],
            doseLogs: []
          })
          .eq('id', testId);
          
        testResults.push({
          description: "Update with both doselogs and doseLogs",
          success: !error,
          error: error ? error.message : undefined
        });
      } catch (e) {
        testResults.push({
          description: "Update with both formats",
          success: false,
          error: e.message
        });
      }
      
      // Test 7: Insert with just lowercase
      try {
        const newId = `test-l-${Date.now()}`;
        const { error } = await supabase
          .from('peptides')
          .insert({ 
            id: newId,
            name: "LOWERCASE-TEST",
            vials: [],
            doselogs: []
          });
          
        testResults.push({
          description: "Insert with lowercase 'doselogs'",
          success: !error,
          error: error ? error.message : undefined
        });
        
        // Clean up
        await supabase.from('peptides').delete().eq('id', newId);
      } catch (e) {
        testResults.push({
          description: "Insert with lowercase 'doselogs'",
          success: false,
          error: e.message
        });
      }
      
      // Test 8: Insert with just camelCase
      try {
        const newId = `test-c-${Date.now()}`;
        const { error } = await supabase
          .from('peptides')
          .insert({ 
            id: newId,
            name: "CAMELCASE-TEST",
            vials: [],
            doseLogs: []
          });
          
        testResults.push({
          description: "Insert with camelCase 'doseLogs'",
          success: !error,
          error: error ? error.message : undefined
        });
        
        // Clean up
        await supabase.from('peptides').delete().eq('id', newId);
      } catch (e) {
        testResults.push({
          description: "Insert with camelCase 'doseLogs'",
          success: false,
          error: e.message
        });
      }
      
      // Clean up main test record
      await supabase
        .from('peptides')
        .delete()
        .eq('id', testId);
        
      testResults.push({
        description: "Clean up test peptide",
        success: true
      });
      
    } catch (error) {
      console.error("Error during tests:", error);
      testResults.push({
        description: "Unexpected error",
        success: false,
        error: error.message
      });
    } finally {
      setResults(testResults);
      setIsRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Database Column Testing</Text>
        <Text style={styles.subtitle}>
          Current database: {config.supabase.label}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.runButton, isRunning && styles.runningButton]}
        onPress={runTests}
        disabled={isRunning}
      >
        <Text style={styles.runButtonText}>
          {isRunning ? 'Running Tests...' : 'Run Column Tests'}
        </Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <View 
            key={index} 
            style={[
              styles.resultItem,
              result.success ? styles.successItem : styles.errorItem
            ]}
          >
            <Text style={styles.resultDescription}>{result.description}</Text>
            <Text style={styles.resultStatus}>
              {result.success ? '✅ Success' : '❌ Failed'}
            </Text>
            {result.error && (
              <Text style={styles.errorText}>{result.error}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.gray[800],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  runButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  runningButton: {
    backgroundColor: theme.colors.gray[400],
  },
  runButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: theme.typography.fontSize.base,
  },
  resultsContainer: {
    maxHeight: 400,
  },
  resultItem: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  successItem: {
    backgroundColor: theme.colors.success + '20',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
  },
  errorItem: {
    backgroundColor: theme.colors.danger + '20',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.danger,
  },
  resultDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.gray[800],
  },
  resultStatus: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[700],
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
    fontFamily: 'monospace',
  },
});