import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '@/constants/theme';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';

type UnitType = 'mg' | 'mcg' | 'IU';
type VolumeUnit = 'ml' | 'cc';

export default function CalculatorScreen() {
  // Calculator inputs
  const [peptideAmount, setPeptideAmount] = useState('');
  const [peptideUnit, setPeptideUnit] = useState<UnitType>('mg');
  const [bacWaterAmount, setBacWaterAmount] = useState('');
  const [bacWaterUnit, setBacWaterUnit] = useState<VolumeUnit>('ml');
  const [desiredDoseAmount, setDesiredDoseAmount] = useState('');
  const [desiredDoseUnit, setDesiredDoseUnit] = useState<UnitType>('mcg');
  
  // Calculator outputs
  const [concentration, setConcentration] = useState<string | null>(null);
  const [injectionVolume, setInjectionVolume] = useState<string | null>(null);
  const [dosesPerVial, setDosesPerVial] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Handle unit conversion
  const convertToMcg = (amount: number, unit: UnitType): number => {
    switch (unit) {
      case 'mg': return amount * 1000; // 1mg = 1000mcg
      case 'mcg': return amount;
      case 'IU': return amount; // IU is a separate unit, this is approximate
      default: return amount;
    }
  };
  
  const calculate = () => {
    try {
      // Convert all inputs to numbers
      const peptideAmountNum = parseFloat(peptideAmount);
      const bacWaterAmountNum = parseFloat(bacWaterAmount);
      const desiredDoseAmountNum = parseFloat(desiredDoseAmount);
      
      if (isNaN(peptideAmountNum) || isNaN(bacWaterAmountNum) || isNaN(desiredDoseAmountNum)) {
        throw new Error('Please enter valid numbers for all fields');
      }
      
      // Convert peptide amount to mcg for calculations
      const peptideAmountMcg = convertToMcg(peptideAmountNum, peptideUnit);
      
      // Calculate concentration (mcg/ml)
      const concentrationValue = peptideAmountMcg / bacWaterAmountNum;
      
      // Calculate injection volume (ml)
      const desiredDoseMcg = convertToMcg(desiredDoseAmountNum, desiredDoseUnit);
      const injectionVolumeValue = desiredDoseMcg / concentrationValue;
      
      // Calculate doses per vial
      const dosesPerVialValue = peptideAmountMcg / desiredDoseMcg;
      
      // Format results
      setConcentration(`${concentrationValue.toFixed(2)} mcg/${bacWaterUnit}`);
      setInjectionVolume(`${injectionVolumeValue.toFixed(2)} ${bacWaterUnit}`);
      setDosesPerVial(`${Math.floor(dosesPerVialValue)} doses`);
      setShowResults(true);
    } catch (error) {
      console.error('Calculation error:', error);
      setShowResults(false);
    }
  };
  
  const resetCalculator = () => {
    setPeptideAmount('');
    setBacWaterAmount('');
    setDesiredDoseAmount('');
    setShowResults(false);
  };
  
  // Automatically calculate when all fields are filled
  useEffect(() => {
    if (peptideAmount && bacWaterAmount && desiredDoseAmount) {
      calculate();
    } else {
      setShowResults(false);
    }
  }, [peptideAmount, peptideUnit, bacWaterAmount, bacWaterUnit, desiredDoseAmount, desiredDoseUnit]);
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.title}>Reconstitution Calculator</Text>
          
          <Card style={styles.card} variant="elevated">
            {/* Peptide Amount Input */}
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Peptide Amount</Text>
                <Input
                  value={peptideAmount}
                  onChangeText={setPeptideAmount}
                  placeholder="0.0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.unitContainer}>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.unitButtons}>
                  {(['mg', 'mcg', 'IU'] as UnitType[]).map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitButton,
                        peptideUnit === unit && styles.activeUnitButton,
                      ]}
                      onPress={() => setPeptideUnit(unit)}
                    >
                      <Text style={[
                        styles.unitButtonText,
                        peptideUnit === unit && styles.activeUnitButtonText,
                      ]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
            {/* BAC Water Amount Input */}
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>BAC Water Amount</Text>
                <Input
                  value={bacWaterAmount}
                  onChangeText={setBacWaterAmount}
                  placeholder="0.0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.unitContainer}>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.unitButtons}>
                  {(['ml', 'cc'] as VolumeUnit[]).map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitButton,
                        bacWaterUnit === unit && styles.activeUnitButton,
                      ]}
                      onPress={() => setBacWaterUnit(unit)}
                    >
                      <Text style={[
                        styles.unitButtonText,
                        bacWaterUnit === unit && styles.activeUnitButtonText,
                      ]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
            {/* Desired Dose Input */}
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Desired Dose</Text>
                <Input
                  value={desiredDoseAmount}
                  onChangeText={setDesiredDoseAmount}
                  placeholder="0.0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.unitContainer}>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.unitButtons}>
                  {(['mg', 'mcg', 'IU'] as UnitType[]).map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitButton,
                        desiredDoseUnit === unit && styles.activeUnitButton,
                      ]}
                      onPress={() => setDesiredDoseUnit(unit)}
                    >
                      <Text style={[
                        styles.unitButtonText,
                        desiredDoseUnit === unit && styles.activeUnitButtonText,
                      ]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <Button 
                title="Reset" 
                onPress={resetCalculator} 
                variant="outline"
                style={styles.button}
              />
              <Button 
                title="Calculate" 
                onPress={calculate}
                style={styles.button}
              />
            </View>
          </Card>
          
          {showResults && (
            <Card style={styles.resultsCard} variant="elevated">
              <Text style={styles.resultsTitle}>Results</Text>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Concentration:</Text>
                <Text style={styles.resultValue}>{concentration}</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Injection Volume:</Text>
                <Text style={styles.resultValue}>{injectionVolume}</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Doses per Vial:</Text>
                <Text style={styles.resultValue}>{dosesPerVial}</Text>
              </View>
              
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Draw {injectionVolume} to get a dose of {desiredDoseAmount} {desiredDoseUnit}
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  section: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500',
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    flex: 2,
    marginRight: theme.spacing.md,
  },
  unitContainer: {
    flex: 1,
  },
  unitButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unitButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  activeUnitButton: {
    backgroundColor: theme.colors.primary,
  },
  unitButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[700],
    fontWeight: '500',
  },
  activeUnitButtonText: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  resultsCard: {
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  resultsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  resultLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[700],
    fontWeight: '500',
  },
  resultValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: theme.colors.primaryLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[700],
    textAlign: 'center',
  },
});