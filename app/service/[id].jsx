import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ServiceDetailScreen from '../../src/screens/services/ServiceDetailScreen';

export default function ServiceDetailRoute() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Service Details',
          headerStyle: {
            backgroundColor: '#3b82f6',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" style={{ marginLeft: 16 }} />
            </TouchableOpacity>
          ),
        }} 
      />
      <ServiceDetailScreen serviceId={id} />
    </>
  );
}
