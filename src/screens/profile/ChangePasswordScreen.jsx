import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';

const ChangePasswordScreen = () => {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      Alert.alert('Success', 'Password changed successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.formContainer}>
        {/* Current Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password *</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock" size={20} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showCurrentPassword}
              value={formData.currentPassword}
              onChangeText={(value) => setFormData({ ...formData, currentPassword: value })}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
              <MaterialCommunityIcons
                name={showCurrentPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password *</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-plus" size={20} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showNewPassword}
              value={formData.newPassword}
              onChangeText={(value) => setFormData({ ...formData, newPassword: value })}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <MaterialCommunityIcons
                name={showNewPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Password must be at least 6 characters</Text>
        </View>

        {/* Confirm New Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password *</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-check" size={20} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(value) => setFormData({ ...formData, confirmPassword: value })}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <MaterialCommunityIcons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color="white" />
              <Text style={styles.submitButtonText}>Change Password</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Info */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            For security reasons, you'll be logged out after changing your password.
          </Text>
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
    backgroundColor: '#3b82f6',
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
});

export default ChangePasswordScreen;
