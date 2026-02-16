import React from 'react';
import { useAuthStore } from '../../src/store/authStore';
import AdminScreen from '../../src/screens/admin/AdminScreen';
import { View, Text } from 'react-native';

function AdminTabWrapper() {
  const { user } = useAuthStore();

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#ef4444' }}>
          Access Denied
        </Text>
        <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 8, paddingHorizontal: 20, textAlign: 'center' }}>
          You do not have permission to access admin features.
        </Text>
      </View>
    );
  }

  return <AdminScreen />;
}

export default AdminTabWrapper;
