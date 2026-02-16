import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../utils/api';

const ResetPasswordScreen = () => {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Reset token is missing. Please restart the reset process.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password
      });
      if (response.data?.success) {
        Alert.alert('Success', 'Your password has been updated.');
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Error', response.data?.message || 'Unable to reset password');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Password</Text>
        </View>

        <View style={styles.card}>
          <MaterialCommunityIcons name="lock-check" size={48} color="#3b82f6" />
          <Text style={styles.title}>Set a new password</Text>
          <Text style={styles.subtitle}>
            Use a strong password you do not use elsewhere.
          </Text>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock" size={20} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock" size={20} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity
            style={[styles.resetButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isSubmitting}
          >
            <Text style={styles.resetButtonText}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerRow: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  resetButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;
