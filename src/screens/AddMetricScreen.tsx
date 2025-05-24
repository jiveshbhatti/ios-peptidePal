import React from 'react';
import { View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AddMetricModal from '@/components/AddMetricModal';

type AddMetricScreenRouteProp = {
  params: {
    type: 'weight' | 'measurement';
  };
};

export default function AddMetricScreen() {
  const route = useRoute<AddMetricScreenRouteProp>();
  const navigation = useNavigation();
  const { type } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <AddMetricModal
        visible={true}
        onClose={() => navigation.goBack()}
        type={type}
        onSuccess={() => navigation.goBack()}
      />
    </View>
  );
}