import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../utils/api';

const RateProviderScreen = () => {
  const router = useRouter();
  const { serviceId, providerId } = useLocalSearchParams();
  const [bookingId, setBookingId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async () => {
    if (!serviceId || !providerId) {
      setMessage('Open this screen from a service to auto-fill provider details.');
      return;
    }

    if (!bookingId || !comment) {
      setMessage('Booking ID and comment are required.');
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      await api.post('/reviews', {
        bookingId,
        serviceId,
        providerId,
        rating,
        comment,
      });
      setMessage('Review submitted successfully.');
      setBookingId('');
      setComment('');
      setTimeout(() => router.back(), 800);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
    <View style={styles.container}>
      {/* White Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Provider</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="star" size={24} color="#3b82f6" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Share Your Experience</Text>
            <Text style={styles.subtitle}>Help others by rating this provider.</Text>
          </View>
        </View>

      <View style={styles.card}>
        <Text style={styles.label}>Booking ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste your completed booking ID"
          value={bookingId}
          onChangeText={setBookingId}
        />

        <Text style={styles.label}>Your Rating</Text>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity key={value} onPress={() => setRating(value)}>
              <MaterialCommunityIcons
                name={value <= rating ? 'star' : 'star-outline'}
                size={28}
                color={value <= rating ? '#f59e0b' : '#d1d5db'}
              />
            </TouchableOpacity>
          ))}
          <Text style={styles.ratingValue}>{rating}.0</Text>
        </View>

        <Text style={styles.label}>Comment</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your experience"
          value={comment}
          onChangeText={setComment}
          multiline
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    paddingTop: 48,
    minHeight: 120,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingValue: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  message: {
    marginTop: 12,
    fontSize: 12,
    color: '#2563eb',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RateProviderScreen;
