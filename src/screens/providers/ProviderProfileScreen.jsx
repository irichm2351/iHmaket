import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const ProviderProfileScreen = ({ providerId }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const [showRateModal, setShowRateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (providerId) {
      fetchProviderData();
    }
  }, [providerId]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      const [providerRes, servicesRes, reviewsRes] = await Promise.all([
        api.get(`/users/${providerId}`),
        api.get(`/services/provider/${providerId}`),
        api.get(`/reviews/provider/${providerId}`),
      ]);

      setProvider(providerRes.data.user || providerRes.data);
      setServices(servicesRes.data.services || []);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Error fetching provider profile:', error);
      setProvider(null);
      setServices([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageProvider = () => {
    if (!provider?._id) {
      return;
    }

    router.push({
      pathname: '/(tabs)/messages',
      params: {
        providerId: provider._id,
        providerName: provider.name,
        providerProfilePic: provider.profilePic,
        fromPreviousScreen: true,
      },
    });
  };

  const handleCallProvider = async () => {
    if (!provider?.phone) {
      Alert.alert('No Phone Number', 'This provider has not provided a phone number.');
      return;
    }

    try {
      await Linking.openURL(`tel:${provider.phone}`);
    } catch (error) {
      Alert.alert('Error', 'Unable to make call at this time');
    }
  };

  const handleRateProvider = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment for your rating');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/reviews', {
        providerId: provider._id,
        rating,
        comment: comment.trim(),
      });

      if (response.data.success) {
        Alert.alert('Success', 'Your rating has been submitted!');
        setShowRateModal(false);
        setRating(5);
        setComment('');
        // Refresh provider data
        fetchProviderData();
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportProvider = async () => {
    if (!reportReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for reporting this provider');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/reports', {
        providerId: provider._id,
        reason: reportReason.trim(),
      });

      if (response.data.success) {
        Alert.alert('Success', 'Your report has been submitted. Our team will review it shortly.');
        setShowReportModal(false);
        setReportReason('');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;

    const apiBase = process.env.EXPO_PUBLIC_API_URL || 'https://ihmaket-backend.onrender.com/api';
    const baseUrl = apiBase.replace('/api', '');
    return `${baseUrl}${url}`;
  };

  if (loading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.centerContent}>
        <MaterialCommunityIcons name="account-alert" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>Provider not found</Text>
      </View>
    );
  }

  const locationText = [provider?.location?.city, provider?.location?.state]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header Card */}
        <View style={styles.headerCard}>
          {/* Profile Picture */}
          <Image
            source={{ uri: getImageUrl(provider.profilePic) || 'https://via.placeholder.com/96' }}
            style={styles.avatar}
          />
          
          {/* Provider Info */}
          <View style={styles.headerInfo}>
            <Text style={styles.providerLabel}>Service Provider</Text>
            <Text style={styles.providerName}>{provider.name}</Text>
            
            {/* Rating */}
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={16} color="#f59e0b" />
              <Text style={styles.ratingText}>
                {provider.rating?.toFixed(1) || '0.0'} ({provider.totalReviews || 0} reviews)
              </Text>
            </View>

            {/* Phone */}
            {provider.phone && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="phone" size={16} color="#6b7280" />
                <Text style={styles.infoText}>{provider.phone}</Text>
              </View>
            )}

            {/* Email */}
            {provider.email && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="email" size={16} color="#6b7280" />
                <Text style={styles.infoText}>{provider.email}</Text>
              </View>
            )}

            {/* Location */}
            {locationText && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
                <Text style={styles.infoText}>{locationText}</Text>
              </View>
            )}
          </View>
        </View>

        {provider.bio ? (
          <View style={styles.bioCard}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{provider.bio}</Text>
          </View>
        ) : null}

        {provider._id !== user?._id && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleMessageProvider}>
              <MaterialCommunityIcons name="message-text" size={18} color="white" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonTertiary]} onPress={handleCallProvider}>
              <MaterialCommunityIcons name="phone" size={18} color="white" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={() => setShowRateModal(true)}>
              <MaterialCommunityIcons name="star" size={18} color="white" />
              <Text style={styles.actionButtonText}>Rate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={() => setShowReportModal(true)}>
              <MaterialCommunityIcons name="flag" size={18} color="white" />
              <Text style={styles.actionButtonText}>Report</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'services' && styles.tabButtonActive]}
            onPress={() => setActiveTab('services')}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
              Services ({services.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'reviews' && styles.tabButtonActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews ({reviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'services' ? (
          services.length === 0 ? (
            <View style={styles.centerContentSmall}>
              <MaterialCommunityIcons name="briefcase-search" size={40} color="#d1d5db" />
              <Text style={styles.emptyText}>No services available</Text>
            </View>
          ) : (
            <FlatList
              data={services}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.serviceCard}
                  onPress={() => router.push(`/service/${item._id}`)}
                >
                  <View style={styles.serviceImageWrapper}>
                    {item.images && item.images.length > 0 ? (
                      <Image
                        source={{ uri: getImageUrl(item.images[0]?.url || item.images[0]) }}
                        style={styles.serviceImage}
                      />
                    ) : (
                      <MaterialCommunityIcons name="image" size={36} color="#d1d5db" />
                    )}
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>{item.title}</Text>
                    <Text style={styles.servicePrice}>
                      ₦{Number(item.price?.amount || 0).toLocaleString('en-NG')}
                      {item.price?.negotiable ? ' • Negotiable' : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          )
        ) : reviews.length === 0 ? (
          <View style={styles.centerContentSmall}>
            <MaterialCommunityIcons name="star-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        ) : (
          <View style={styles.reviewList}>
            {reviews.map((review) => (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{review.customerId?.name || 'Customer'}</Text>
                  <View style={styles.reviewRating}>
                    <MaterialCommunityIcons name="star" size={14} color="#f59e0b" />
                    <Text style={styles.reviewRatingText}>{review.rating?.toFixed(1) || '0.0'}</Text>
                  </View>
                </View>
                {review.serviceId?.title ? (
                  <Text style={styles.reviewService}>Service: {review.serviceId.title}</Text>
                ) : null}
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Rate Modal */}
      <Modal
        visible={showRateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate {provider?.name}</Text>
              <TouchableOpacity onPress={() => setShowRateModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            {/* Star Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Your Rating</Text>
              <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity key={value} onPress={() => setRating(value)}>
                    <MaterialCommunityIcons
                      name={value <= rating ? 'star' : 'star-outline'}
                      size={32}
                      color={value <= rating ? '#f59e0b' : '#d1d5db'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingValue}>{rating}.0 Stars</Text>
            </View>

            {/* Comment */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Comment</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Share your experience with this provider..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
                editable={!isSubmitting}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleRateProvider}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>Submit Rating</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Provider</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            {/* Report Reason */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Reason for Report</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Please explain why you're reporting this provider..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                value={reportReason}
                onChangeText={setReportReason}
                editable={!isSubmitting}
              />
            </View>

            <Text style={styles.reportInfo}>
              Our team will review your report and take appropriate action if needed.
            </Text>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, styles.submitButtonDanger, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleReportProvider}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerContentSmall: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 15,
    color: '#6b7280',
  },
  headerCard: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    backgroundColor: '#e5e7eb',
  },
  headerInfo: {
    width: '100%',
    alignItems: 'center',
  },
  providerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  providerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#374151',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#6b7280',
  },
  bioCard: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  bioText: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#eab308',
  },
  actionButtonTertiary: {
    backgroundColor: '#06b6d4',
  },
  actionButtonDanger: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  serviceImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  reviewList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reviewCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  reviewService: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  reviewComment: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
  },
  reviewDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    textAlignVertical: 'top',
    fontFamily: 'System',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDanger: {
    backgroundColor: '#ef4444',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  reportInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
    marginTop: 8,
    lineHeight: 16,
  },
});

export default ProviderProfileScreen;
