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
import { useRouter } from 'expo-router';
import api from '../../utils/api';

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const [inputType, setInputType] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetRequest = async () => {
    const selectedValue = inputType === 'email' ? email.trim() : phone.trim();
    if (!selectedValue) {
      Alert.alert('Error', `Please enter your ${inputType}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = inputType === 'email'
        ? { email: selectedValue }
        : { phone: selectedValue };
      const response = await api.post('/auth/forgot-password', payload);
      if (response.data?.success && response.data?.resetToken) {
        router.push({
          pathname: '/(auth)/reset-password',
          params: { token: response.data.resetToken }
        });
        setEmail('');
        setPhone('');
        return;
      }
      Alert.alert('Error', response.data?.message || 'Unable to start reset');
      setEmail('');
      setPhone('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to start reset');
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
          <Text style={styles.headerTitle}>Forgot Password</Text>
        </View>

        <View style={styles.card}>
          <MaterialCommunityIcons name="lock-reset" size={48} color="#3b82f6" />
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Choose email or phone number used during registration.
          </Text>

          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={[
                styles.selectorButton,
                inputType === 'email' && styles.selectorButtonActive,
              ]}
              onPress={() => setInputType('email')}
            >
              <MaterialCommunityIcons
                name="email"
                size={18}
                color={inputType === 'email' ? 'white' : '#6b7280'}
              />
              <Text
                style={[
                  styles.selectorText,
                  inputType === 'email' && styles.selectorTextActive,
                ]}
              >
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.selectorButton,
                inputType === 'phone' && styles.selectorButtonActive,
              ]}
              onPress={() => setInputType('phone')}
            >
              <MaterialCommunityIcons
                name="phone"
                size={18}
                color={inputType === 'phone' ? 'white' : '#6b7280'}
              />
              <Text
                style={[
                  styles.selectorText,
                  inputType === 'phone' && styles.selectorTextActive,
                ]}
              >
                Phone
              </Text>
            </TouchableOpacity>
          </View>

          {inputType === 'email' ? (
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email" size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!isSubmitting}
              />
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="phone" size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!isSubmitting}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.resetButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleResetRequest}
            disabled={isSubmitting}
          >
            <Text style={styles.resetButtonText}>
              {isSubmitting ? 'Checking...' : 'Continue'}
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
  selectorRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  selectorButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  selectorTextActive: {
    color: 'white',
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

export default ForgotPasswordScreen;
