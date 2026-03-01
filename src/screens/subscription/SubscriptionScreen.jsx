import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const SubscriptionScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reference, setReference] = useState('');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscription/status');
      if (response.data.success) {
        setStatus(response.data.status);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [])
  );

  const handleSubscribe = async () => {
    try {
      setProcessing(true);
      const response = await api.post('/subscription/initialize');
      if (!response.data.success) {
        Alert.alert('Error', response.data.message || 'Failed to start subscription');
        return;
      }

      const { authorizationUrl, reference: ref } = response.data;
      setReference(ref);

      if (authorizationUrl) {
        await WebBrowser.openBrowserAsync(authorizationUrl);
      }
    } catch (error) {
      console.error('Error initializing subscription:', error);
      Alert.alert('Error', 'Unable to start subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (!reference) {
      Alert.alert('Missing Reference', 'Please start a subscription first.');
      return;
    }

    try {
      setProcessing(true);
      const response = await api.get(`/subscription/verify/${reference}`);
      if (response.data.success) {
        Alert.alert('Success', 'Subscription activated');
        fetchStatus();
      } else {
        Alert.alert('Error', response.data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying subscription:', error);
      Alert.alert('Error', 'Unable to verify payment');
    } finally {
      setProcessing(false);
    }
  };

  const renderStatus = () => {
    if (!status) return null;

    if (!status.enabled) {
      return 'Subscription is currently disabled by admin.';
    }

    if (status.isActive) {
      return `Active until ${new Date(status.expiresAt).toLocaleDateString()}`;
    }

    return 'Inactive - subscription required to use provider features.';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Subscription</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>Monthly Subscription</Text>
            <Text style={styles.amount}>NGN {status?.amount || 2000}</Text>
            <Text style={styles.status}>{renderStatus()}</Text>
          </View>

          {user?.role !== 'provider' ? (
            <Text style={styles.note}>Only providers can subscribe.</Text>
          ) : (
            <View>
              <TouchableOpacity
                style={[styles.button, !status?.enabled && styles.buttonDisabled]}
                onPress={handleSubscribe}
                disabled={processing || !status?.enabled}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Subscribe with Paystack</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.buttonOutline, !reference && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={processing || !reference}
              >
                <Text style={styles.buttonOutlineText}>I have paid - Verify</Text>
              </TouchableOpacity>

              <Text style={styles.helpText}>
                After payment, return to this screen and tap "Verify".
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 8,
  },
  status: {
    marginTop: 8,
    color: '#6b7280',
  },
  note: {
    color: '#6b7280',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  helpText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default SubscriptionScreen;
