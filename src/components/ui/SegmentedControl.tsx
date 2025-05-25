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
  style?: any;
  compact?: boolean;
}

export default function SegmentedControl({
  options,
  selectedIndex,
  onChange,
  style,
  compact = false,
}: SegmentedControlProps) {
  const containerRef = React.useRef<View>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  
  const segmentWidth = compact && containerWidth > 0 
    ? containerWidth / options.length 
    : containerWidth > 0 
      ? (containerWidth - 4) / options.length  // 4 for padding
      : 100 / options.length; // fallback percentage
  
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
    <View 
      ref={containerRef}
      style={[
        styles.container, 
        compact && styles.compactContainer,
        style
      ]}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width - (compact ? 0 : 4)); // subtract padding
      }}
    >
      {containerWidth > 0 && (
        <>
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
              key={`segment-${index}`}
              style={[styles.option, { width: segmentWidth }]}
              onPress={() => onChange(index)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  compact && styles.compactText,
                  selectedIndex === index && styles.selectedOptionText,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}
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
  compactContainer: {
    marginHorizontal: 0,
    marginVertical: 0,
    height: 36,
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
  compactText: {
    fontSize: theme.typography.fontSize.xs,
  },
});