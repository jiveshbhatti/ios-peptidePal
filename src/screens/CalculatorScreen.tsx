import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  TextInput,
} from 'react-native';
import { theme } from '@/constants/theme';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import * as Icon from 'react-native-feather';
import { AppHaptics } from '@/utils/haptics';

type UnitType = 'mg' | 'mcg' | 'IU';
type VolumeUnit = 'ml' | 'units';
type CalcMode = 'standard' | 'reverse' | 'dilution';

interface CalculationResult {
  concentration: number;
  concentrationUnit: string;
  injectionVolume: number;
  injectionVolumeUnit: string;
  injectionUnits: number;
  dosesPerVial: number;
  daysSupply?: number;
}

export default function CalculatorScreenEnhanced() {
  // Calculator mode
  const [mode, setMode] = useState<CalcMode>('standard');
  
  // Standard calculator inputs
  const [peptideAmount, setPeptideAmount] = useState('');
  const [peptideUnit, setPeptideUnit] = useState<UnitType>('mg');
  const [bacWaterAmount, setBacWaterAmount] = useState('');
  const [bacWaterUnit, setBacWaterUnit] = useState<VolumeUnit>('ml');
  const [desiredDoseAmount, setDesiredDoseAmount] = useState('');
  const [desiredDoseUnit, setDesiredDoseUnit] = useState<UnitType>('mcg');
  
  // Syringe size selection
  const [syringeSize, setSyringeSize] = useState<'1ml' | '0.5ml' | '0.3ml'>('1ml');
  
  // Input refs for focus management
  const peptideInputRef = useRef<TextInput>(null);
  const bacWaterInputRef = useRef<TextInput>(null);
  const doseInputRef = useRef<TextInput>(null);
  
  // Debug input changes
  const handlePeptideAmountChange = (text: string) => {
    console.log('Peptide amount changed:', text);
    setPeptideAmount(text);
  };
  
  // Reverse calculator inputs
  const [targetVolume, setTargetVolume] = useState('');
  const [targetVolumeUnit, setTargetVolumeUnit] = useState<VolumeUnit>('units');
  
  // Additional inputs
  const [dosesPerDay, setDosesPerDay] = useState('1');
  
  // Calculator outputs
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  
  // Common peptide presets
  const presets = [
    { name: 'BPC-157', amount: 5, unit: 'mg' as UnitType, typicalDose: 250, doseUnit: 'mcg' as UnitType },
    { name: 'TB-500', amount: 5, unit: 'mg' as UnitType, typicalDose: 2.5, doseUnit: 'mg' as UnitType },
    { name: 'Semaglutide', amount: 3, unit: 'mg' as UnitType, typicalDose: 0.25, doseUnit: 'mg' as UnitType },
    { name: 'Tirzepatide', amount: 5, unit: 'mg' as UnitType, typicalDose: 2.5, doseUnit: 'mg' as UnitType },
    { name: 'NAD+', amount: 50, unit: 'mg' as UnitType, typicalDose: 50, doseUnit: 'mg' as UnitType },
    { name: 'Tesamorelin', amount: 1, unit: 'mg' as UnitType, typicalDose: 1, doseUnit: 'mg' as UnitType },
  ];
  
  // Handle unit conversion
  const convertToMcg = (amount: number, unit: UnitType): number => {
    switch (unit) {
      case 'mg': return amount * 1000;
      case 'mcg': return amount;
      case 'IU': return amount; // This would need peptide-specific conversion
      default: return amount;
    }
  };
  
  const convertToMl = (amount: number, unit: VolumeUnit): number => {
    switch (unit) {
      case 'ml': return amount;
      case 'units': return amount / getUnitsPerMl(); // units per ml depends on syringe size
      default: return amount;
    }
  };
  
  const getUnitsPerMl = (): number => {
    switch (syringeSize) {
      case '1ml': return 100;
      case '0.5ml': return 50;
      case '0.3ml': return 30;
      default: return 100;
    }
  };
  
  const convertMlToUnits = (ml: number): number => {
    return ml * getUnitsPerMl();
  };
  
  const calculate = () => {
    try {
      const peptideAmountNum = parseFloat(peptideAmount);
      const bacWaterAmountNum = parseFloat(bacWaterAmount);
      const desiredDoseAmountNum = parseFloat(desiredDoseAmount);
      const dosesPerDayNum = parseFloat(dosesPerDay) || 1;
      
      if (isNaN(peptideAmountNum) || isNaN(bacWaterAmountNum) || isNaN(desiredDoseAmountNum)) {
        Alert.alert('Invalid Input', 'Please enter valid numbers for all required fields');
        return;
      }
      
      // Convert to standard units (mcg and ml)
      const peptideAmountMcg = convertToMcg(peptideAmountNum, peptideUnit);
      const bacWaterAmountMl = convertToMl(bacWaterAmountNum, bacWaterUnit);
      
      let concentrationValue: number;
      let injectionVolumeValue: number;
      let desiredDoseMcg: number;
      
      if (mode === 'standard') {
        // Standard calculation
        concentrationValue = peptideAmountMcg / bacWaterAmountMl;
        desiredDoseMcg = convertToMcg(desiredDoseAmountNum, desiredDoseUnit);
        injectionVolumeValue = desiredDoseMcg / concentrationValue;
      } else if (mode === 'reverse') {
        // Reverse calculation - find water amount for target volume
        const targetVolumeNum = parseFloat(targetVolume);
        if (isNaN(targetVolumeNum)) {
          Alert.alert('Invalid Input', 'Please enter a valid target volume');
          return;
        }
        
        const targetVolumeMl = convertToMl(targetVolumeNum, targetVolumeUnit);
        desiredDoseMcg = convertToMcg(desiredDoseAmountNum, desiredDoseUnit);
        
        // Calculate required concentration
        concentrationValue = desiredDoseMcg / targetVolumeMl;
        
        // Calculate required water amount
        const requiredWaterMl = peptideAmountMcg / concentrationValue;
        setBacWaterAmount(requiredWaterMl.toFixed(2));
        
        injectionVolumeValue = targetVolumeMl;
      } else {
        // Future: dilution calculation
        return;
      }
      
      const dosesPerVialValue = peptideAmountMcg / desiredDoseMcg;
      const daysSupplyValue = dosesPerVialValue / dosesPerDayNum;
      
      const newResult: CalculationResult = {
        concentration: concentrationValue,
        concentrationUnit: 'mcg/ml',
        injectionVolume: injectionVolumeValue,
        injectionVolumeUnit: 'ml',
        injectionUnits: convertMlToUnits(injectionVolumeValue),
        dosesPerVial: Math.floor(dosesPerVialValue),
        daysSupply: Math.floor(daysSupplyValue),
      };
      
      setResult(newResult);
      setShowResults(true);
      
      // Animate results
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      AppHaptics.impactMedium();
    } catch (error) {
      console.error('Calculation error:', error);
      Alert.alert('Calculation Error', 'Unable to calculate. Please check your inputs.');
    }
  };
  
  const resetCalculator = () => {
    setPeptideAmount('');
    setBacWaterAmount('');
    setDesiredDoseAmount('');
    setTargetVolume('');
    setShowResults(false);
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    AppHaptics.selection();
  };
  
  const applyPreset = (preset: typeof presets[0]) => {
    console.log('Applying preset:', preset);
    setPeptideAmount(preset.amount.toString());
    setPeptideUnit(preset.unit);
    setDesiredDoseAmount(preset.typicalDose.toString());
    setDesiredDoseUnit(preset.doseUnit);
    setBacWaterAmount('3'); // Default to 3ml
    AppHaptics.selection();
  };
  
  const saveCalculation = () => {
    if (!result) return;
    
    // In the future, this could save to a history or create a peptide
    Alert.alert(
      'Save Calculation',
      'Would you like to save this calculation for future reference?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: () => {
            AppHaptics.success();
            Alert.alert('Saved', 'Calculation saved successfully');
          }
        }
      ]
    );
  };
  
  // Auto-calculate when inputs change
  useEffect(() => {
    if (peptideAmount && bacWaterAmount && desiredDoseAmount) {
      const timer = setTimeout(() => {
        calculate();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
    }
  }, [peptideAmount, peptideUnit, bacWaterAmount, bacWaterUnit, desiredDoseAmount, desiredDoseUnit, targetVolume, targetVolumeUnit, mode, dosesPerDay]);
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Calculator Mode Selector */}
        <View style={styles.modeSelector}>
          <SegmentedControl
            options={['Standard', 'Target Volume']}
            selectedIndex={mode === 'standard' ? 0 : 1}
            onChange={(index) => {
              setMode(index === 0 ? 'standard' : 'reverse');
              resetCalculator();
            }}
          />
        </View>
        
        {/* Quick Presets */}
        <View style={styles.presetsSection}>
          <Text style={styles.sectionTitle}>Quick Presets</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.presetsList}>
              {presets.map((preset) => (
                <TouchableOpacity
                  key={preset.name}
                  style={styles.presetButton}
                  onPress={() => applyPreset(preset)}
                >
                  <Text style={styles.presetName}>{preset.name}</Text>
                  <Text style={styles.presetInfo}>
                    {preset.amount}{preset.unit} • {preset.typicalDose}{preset.doseUnit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        
        {/* Input Fields */}
        <Card style={styles.inputCard} variant="elevated">
          <Text style={styles.cardTitle}>Peptide Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Peptide Amount</Text>
            <View style={styles.inputRow}>
              <Input
                value={peptideAmount}
                onChangeText={handlePeptideAmountChange}
                placeholder="0"
                keyboardType="decimal-pad"
                containerStyle={{ flex: 1, marginRight: theme.spacing.sm }}
              />
              <View style={styles.unitSelector}>
                <SegmentedControl
                  options={['mg', 'mcg']}
                  selectedIndex={peptideUnit === 'mg' ? 0 : 1}
                  onChange={(index) => setPeptideUnit(index === 0 ? 'mg' : 'mcg')}
                  compact={true}
                />
              </View>
            </View>
          </View>
          
          {mode === 'standard' ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bacteriostatic Water</Text>
              <View style={styles.inputRow}>
                <Input
                  value={bacWaterAmount}
                  onChangeText={setBacWaterAmount}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  containerStyle={{ flex: 1, marginRight: theme.spacing.sm }}
                />
                <View style={styles.unitSelector}>
                  <SegmentedControl
                    options={['ml', 'units']}
                    selectedIndex={bacWaterUnit === 'ml' ? 0 : 1}
                    onChange={(index) => setBacWaterUnit(index === 0 ? 'ml' : 'units')}
                    compact={true}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Injection Volume</Text>
              <View style={styles.inputRow}>
                <Input
                  value={targetVolume}
                  onChangeText={setTargetVolume}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  containerStyle={{ flex: 1, marginRight: theme.spacing.sm }}
                />
                <View style={styles.unitSelector}>
                  <SegmentedControl
                    options={['units', 'ml']}
                    selectedIndex={targetVolumeUnit === 'units' ? 0 : 1}
                    onChange={(index) => setTargetVolumeUnit(index === 0 ? 'units' : 'ml')}
                    compact={true}
                  />
                </View>
              </View>
            </View>
          )}
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Desired Dose</Text>
            <View style={styles.inputRow}>
              <Input
                value={desiredDoseAmount}
                onChangeText={setDesiredDoseAmount}
                placeholder="0"
                keyboardType="decimal-pad"
                containerStyle={{ flex: 1, marginRight: theme.spacing.sm }}
              />
              <View style={styles.unitSelector}>
                <SegmentedControl
                  options={['mg', 'mcg']}
                  selectedIndex={desiredDoseUnit === 'mg' ? 0 : 1}
                  onChange={(index) => setDesiredDoseUnit(index === 0 ? 'mg' : 'mcg')}
                  compact={true}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Syringe Size</Text>
            <View style={styles.syringeSelector}>
              <SegmentedControl
                options={['1ml (100u)', '0.5ml (50u)', '0.3ml (30u)']}
                selectedIndex={syringeSize === '1ml' ? 0 : syringeSize === '0.5ml' ? 1 : 2}
                onChange={(index) => setSyringeSize(index === 0 ? '1ml' : index === 1 ? '0.5ml' : '0.3ml')}
              />
            </View>
          </View>
          
          <View style={[styles.inputGroup, { marginBottom: 0 }]}>
            <Text style={styles.inputLabel}>Doses Per Day</Text>
            <View style={styles.inputRow}>
              <Input
                value={dosesPerDay}
                onChangeText={setDosesPerDay}
                placeholder="1"
                keyboardType="number-pad"
                containerStyle={{ flex: 1 }}
              />
              <Text style={styles.optionalLabel}>(Optional)</Text>
            </View>
          </View>
        </Card>
        
        {/* Results */}
        {showResults && result && (
          <Animated.View
            style={[
              styles.resultsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Card style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Calculation Results</Text>
                <TouchableOpacity onPress={saveCalculation}>
                  <Icon.Save color={theme.colors.primary} width={20} height={20} />
                </TouchableOpacity>
              </View>
              
              {mode === 'reverse' && (
                <View style={styles.resultItem}>
                  <View style={styles.resultIcon}>
                    <Icon.Droplet color={theme.colors.primary} width={24} height={24} />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultLabel}>Required Water</Text>
                    <Text style={styles.resultValue}>{bacWaterAmount} ml</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.resultItem}>
                <View style={styles.resultIcon}>
                  <Icon.Target color={theme.colors.secondary} width={24} height={24} />
                </View>
                <View style={styles.resultContent}>
                  <Text style={styles.resultLabel}>Concentration</Text>
                  <Text style={styles.resultValue}>
                    {result.concentration.toFixed(2)} {result.concentrationUnit}
                  </Text>
                </View>
              </View>
              
              <View style={styles.resultItem}>
                <View style={styles.resultIcon}>
                  <Icon.Activity color={theme.colors.accent} width={24} height={24} />
                </View>
                <View style={styles.resultContent}>
                  <Text style={styles.resultLabel}>Injection Volume</Text>
                  <Text style={styles.resultValue}>
                    {result.injectionVolume.toFixed(3)} ml ({result.injectionUnits.toFixed(0)} units)
                  </Text>
                  <Text style={styles.resultSubtext}>
                    on {syringeSize} syringe
                  </Text>
                </View>
              </View>
              
              <View style={styles.resultItem}>
                <View style={styles.resultIcon}>
                  <Icon.Package color={theme.colors.warning} width={24} height={24} />
                </View>
                <View style={styles.resultContent}>
                  <Text style={styles.resultLabel}>Doses Per Vial</Text>
                  <Text style={styles.resultValue}>{result.dosesPerVial} doses</Text>
                </View>
              </View>
              
              {result.daysSupply && (
                <View style={styles.resultItem}>
                  <View style={styles.resultIcon}>
                    <Icon.Calendar color={theme.colors.success} width={24} height={24} />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultLabel}>Days Supply</Text>
                    <Text style={styles.resultValue}>{result.daysSupply} days</Text>
                  </View>
                </View>
              )}
            </Card>
            
            {/* Insulin Syringe Guide */}
            <Card style={styles.guideCard}>
              <Text style={styles.guideTitle}>Syringe Measurement Guide</Text>
              <View style={styles.guideContent}>
                <View style={styles.guideItem}>
                  <Text style={styles.guideUnits}>{result.injectionUnits.toFixed(0)} units</Text>
                  <Text style={styles.guideDescription}>on your {syringeSize} syringe</Text>
                </View>
                {((syringeSize === '0.5ml' && result.injectionUnits > 50) || 
                  (syringeSize === '0.3ml' && result.injectionUnits > 30)) ? (
                  <View style={styles.guideWarning}>
                    <Icon.AlertCircle color={theme.colors.warning} width={16} height={16} />
                    <Text style={styles.guideWarningText}>
                      Volume exceeds syringe capacity. Consider using a larger syringe
                    </Text>
                  </View>
                ) : null}
              </View>
            </Card>
          </Animated.View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Reset"
            onPress={resetCalculator}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Calculate"
            onPress={calculate}
            style={styles.actionButton}
          />
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
  modeSelector: {
    padding: theme.spacing.md,
  },
  presetsSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  presetsList: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  presetButton: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minWidth: 120,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  presetName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: 2,
  },
  presetInfo: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[600],
  },
  inputCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
  },
  unitSelector: {
    width: 120,
    marginLeft: theme.spacing.sm,
  },
  syringeSelector: {
    width: '100%',
  },
  resultsContainer: {
    paddingHorizontal: theme.spacing.md,
  },
  resultCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  resultTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  resultContent: {
    flex: 1,
  },
  resultLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    marginBottom: 2,
  },
  resultValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  resultSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[500],
    marginTop: 2,
  },
  guideCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary + '10',
    borderColor: theme.colors.primary + '30',
    borderWidth: 1,
  },
  guideTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.sm,
  },
  guideContent: {
    gap: theme.spacing.sm,
  },
  guideItem: {
    alignItems: 'center',
  },
  guideUnits: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  guideDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  guideWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '10',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  guideWarningText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.warning,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});