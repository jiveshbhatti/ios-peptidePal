import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { theme } from '@/constants/theme';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export default function SegmentedControl({
  options,
  selectedIndex,
  onChange,
}: SegmentedControlProps) {
  const { width } = useWindowDimensions();
  const segmentWidth = (width - theme.spacing.md * 2) / options.length;
  
  const translateX = React.useRef(new Animated.Value(selectedIndex * segmentWidth)).current;
  
  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: selectedIndex * segmentWidth,
      stiffness: 200,
      damping: 25,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex, segmentWidth]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.selectedIndicator,
          {
            width: segmentWidth,
            transform: [{ translateX }],
          },
        ]}
      />
      {options.map((option, index) => (
        <TouchableOpacity
          key={option}
          style={[styles.option, { width: segmentWidth }]}
          onPress={() => onChange(index)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.optionText,
              selectedIndex === index && styles.selectedOptionText,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[100],
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    height: 44,
    position: 'relative',
    padding: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: theme.borderRadius.md - 2,
    backgroundColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  option: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  optionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.gray[500],
  },
  selectedOptionText: {
    color: theme.colors.gray[800],
    fontWeight: '600',
  },
});