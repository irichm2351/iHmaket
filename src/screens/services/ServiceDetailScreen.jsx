import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import api, { getImageUrl } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { NIGERIAN_STATES } from '../../utils/nigeriaData';

const ServiceDetailScreen = ({ route, serviceId }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const id = serviceId || route?.params?.id;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [timePeriod, setTimePeriod] = useState('AM');
  const [isSaved, setIsSaved] = useState(false);
  const [bookingData, setBookingData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    location: { address: '', city: '', state: '' },
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Auto-format date as user types (YYYY-MM-DD)
  const formatDate = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    
    if (cleaned.length >= 4) {
      formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    }
    if (cleaned.length >= 6) {
      formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6) + '-' + cleaned.slice(6, 8);
    }
    
    return formatted;
  };

  // Auto-format time as user types (HH:MM AM/PM)
  const formatTime = (text) => {
    const cleaned = text.replace(/[^0-9APMapm]/g, '');
    const numbers = cleaned.replace(/[APMapm]/g, '');
    const letters = cleaned.replace(/[0-9]/g, '').toUpperCase();
    
    let formatted = numbers;
    if (numbers.length >= 2) {
      formatted = numbers.slice(0, 2) + ':' + numbers.slice(2, 4);
    }
    if (numbers.length >= 4 && letters) {
      formatted = numbers.slice(0, 2) + ':' + numbers.slice(2, 4) + ' ' + letters.slice(0, 2);
    }
    
    return formatted;
  };

  useEffect(() => {
    if (id) {
      fetchServiceDetails();
      fetchReviews();
      if (user) {
        checkIfSaved();
      }
    }
  }, [id, user]);

  // Refresh saved status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (id && user) {
        checkIfSaved();
      }
    }, [id, user])
  );

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/services/${id}`);
      setService(response.data.service);
    } catch (error) {
      console.error('Error fetching service:', error);
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await api.get(`/reviews/service/${id}`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const response = await api.get(`/users/${user?._id}`);
      if (response.data.success && response.data.user?.savedServices) {
        const savedServices = response.data.user.savedServices;
        // Handle both populated objects and IDs
        const isSavedService = savedServices.some(service => {
          // If it's an object (populated), compare _id
          if (typeof service === 'object' && service?._id) {
            return service._id === id;
          }
          // If it's just an ID string
          return service === id;
        });
        setIsSaved(isSavedService);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const response = await api.post(`/users/save-service/${id}`);
      if (response.data.success) {
        // Use the saved status from the response
        const newSavedStatus = response.data.saved;
        setIsSaved(newSavedStatus);
        Alert.alert(
          'Success',
          newSavedStatus ? 'Added to favorites' : 'Removed from favorites'
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleBookService = async () => {
    if (!bookingData.scheduledDate || !bookingData.scheduledTime || !bookingData.location.address || !bookingData.location.state || !bookingData.location.city) {
      Alert.alert('Error', 'Please fill in all required fields (Date, Time, State, City, and Address)');
      return;
    }

    // Ensure time has AM/PM
    const timeWithPeriod = bookingData.scheduledTime.includes('AM') || bookingData.scheduledTime.includes('PM') 
      ? bookingData.scheduledTime 
      : bookingData.scheduledTime + ' ' + timePeriod;

    try {
      setSubmitting(true);
      
      // Convert date string to Date object
      const dateObj = new Date(bookingData.scheduledDate);
      
      const response = await api.post('/bookings', {
        serviceId: service._id,
        providerId: service.providerId._id,
        scheduledDate: dateObj.toISOString(),
        scheduledTime: timeWithPeriod,
        location: {
          address: bookingData.location.address,
          city: bookingData.location.city,
          state: bookingData.location.state,
        },
        notes: bookingData.notes,
        price: {
          amount: service.price.amount,
          currency: 'NGN'
        }
      });

      if (response.data.success) {
        Alert.alert('Success', 'Booking request sent successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setShowBookingModal(false);
              setBookingData({
                scheduledDate: '',
                scheduledTime: '',
                location: { address: '', city: '', state: '' },
                notes: '',
              });
              setTimePeriod('AM');
              
              // If provider booked, show My Bookings tab; if customer, show default bookings
              if (user?.role === 'provider') {
                router.push({
                  pathname: '/bookings',
                  params: { bookingType: 'placed' }
                });
              } else {
                router.push('/bookings');
              }
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error booking service:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to create booking. Please check all fields.';
      Alert.alert('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMessageProvider = () => {
    if (!service?.providerId) {
      Alert.alert('Error', 'Provider information not available');
      return;
    }

    // Navigate to messages screen with provider info
    router.push({
      pathname: '/(tabs)/messages',
      params: {
        providerId: service.providerId._id,
        providerName: service.providerId.name,
        providerProfilePic: service.providerId.profilePic,
        fromPreviousScreen: true,
      },
    });
  };

  const handleViewProviderProfile = () => {
    if (!service?.providerId?._id) {
      Alert.alert('Error', 'Provider information not available');
      return;
    }

    router.push(`/provider/${service.providerId._id}`);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color="#fbbf24"
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>Service not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        {service.images && service.images.length > 0 && (
          <View style={styles.imageSection}>
            <Image
              source={{ uri: getImageUrl(service.images[selectedImageIndex]?.url) }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            {service.images.length > 1 && (
              <FlatList
                horizontal
                data={service.images}
                keyExtractor={(item, index) => index.toString()}
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailList}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedImageIndex(index)}
                    style={[
                      styles.thumbnail,
                      selectedImageIndex === index && styles.thumbnailActive,
                    ]}
                  >
                    <Image
                      source={{ uri: getImageUrl(item.url) }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* Service Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{service.title}</Text>
            {user && service.providerId?._id !== user._id && (
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleToggleFavorite}
              >
                <MaterialCommunityIcons
                  name={isSaved ? "heart" : "heart-outline"}
                  size={28}
                  color={isSaved ? "#ec4899" : "#6b7280"}
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ₦{Number(service.price?.amount || 0).toLocaleString('en-NG')}
              {service.price?.negotiable && (
                <Text style={styles.negotiable}> • Negotiable</Text>
              )}
            </Text>
          </View>
          <Text style={styles.description}>{service.description}</Text>
        </View>

        {/* Provider Info */}
        {service.providerId && (
          <View style={styles.providerSection}>
            <Text style={styles.sectionTitle}>Service Provider</Text>
            <TouchableOpacity style={styles.providerCard} onPress={handleViewProviderProfile}>
              <View style={styles.providerHeader}>
                {service.providerId.profilePic ? (
                  <Image
                    source={{ uri: getImageUrl(service.providerId.profilePic) }}
                    style={styles.providerAvatar}
                  />
                ) : (
                  <MaterialCommunityIcons name="account-circle" size={50} color="#3b82f6" />
                )}
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{service.providerId.name}</Text>
                  {service.providerId.phone && (
                    <View style={styles.providerDetail}>
                      <MaterialCommunityIcons name="phone" size={14} color="#6b7280" />
                      <Text style={styles.providerDetailText}>{service.providerId.phone}</Text>
                    </View>
                  )}
                  {service.providerId.location && (
                    <View style={styles.providerDetail}>
                      <MaterialCommunityIcons name="map-marker" size={14} color="#6b7280" />
                      <Text style={styles.providerDetailText}>
                        {service.providerId.location.city}, {service.providerId.location.state}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {service.providerId.bio && (
                <Text style={styles.providerBio}>{service.providerId.bio}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Service Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{service.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>
              {service.location?.city}, {service.location?.state}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>
              {`₦${Number(service.price?.amount || 0).toLocaleString('en-NG')}${service.price?.negotiable ? ' • Negotiable' : ''}`}
            </Text>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviewsLoading ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.customerId?.name}</Text>
                  <View style={styles.reviewStars}>{renderStars(review.rating)}</View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noReviews}>No reviews yet</Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.chatButton} onPress={handleMessageProvider}>
          <MaterialCommunityIcons name="message-text" size={20} color="white" />
          <Text style={styles.buttonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => setShowBookingModal(true)}
        >
          <MaterialCommunityIcons name="calendar-check" size={20} color="white" />
          <Text style={styles.buttonText}>Book Service</Text>
        </TouchableOpacity>
      </View>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Service</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Scheduled Date * (Format: YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-02-15"
                  value={bookingData.scheduledDate}
                  onChangeText={(text) => {
                    const formatted = formatDate(text);
                    setBookingData({ ...bookingData, scheduledDate: formatted });
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!submitting}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Scheduled Time * (Format: HH:MM AM/PM)</Text>
                <View style={styles.timeInputContainer}>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="10:00"
                    value={bookingData.scheduledTime.replace(/ AM| PM/g, '')}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9:]/g, '');
                      let formatted = cleaned;
                      if (cleaned.length === 2 && !cleaned.includes(':')) {
                        formatted = cleaned + ':';
                      }
                      setBookingData({ ...bookingData, scheduledTime: formatted + ' ' + timePeriod });
                    }}
                    keyboardType="numeric"
                    maxLength={5}
                    editable={!submitting}
                  />
                  <View style={styles.periodButtons}>
                    <TouchableOpacity
                      style={[styles.periodButton, timePeriod === 'AM' && styles.periodButtonActive]}
                      onPress={() => {
                        setTimePeriod('AM');
                        const timeWithoutPeriod = bookingData.scheduledTime.replace(/ AM| PM/g, '');
                        setBookingData({ ...bookingData, scheduledTime: timeWithoutPeriod + ' AM' });
                      }}
                    >
                      <Text style={[styles.periodButtonText, timePeriod === 'AM' && styles.periodButtonTextActive]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.periodButton, timePeriod === 'PM' && styles.periodButtonActive]}
                      onPress={() => {
                        setTimePeriod('PM');
                        const timeWithoutPeriod = bookingData.scheduledTime.replace(/ AM| PM/g, '');
                        setBookingData({ ...bookingData, scheduledTime: timeWithoutPeriod + ' PM' });
                      }}
                    >
                      <Text style={[styles.periodButtonText, timePeriod === 'PM' && styles.periodButtonTextActive]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>State *</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowStateDropdown(true)}
                >
                  <Text style={[styles.inputText, !bookingData.location.state && styles.placeholderText]}>
                    {bookingData.location.state || 'Select State'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter city"
                  value={bookingData.location.city}
                  onChangeText={(text) =>
                    setBookingData({
                      ...bookingData,
                      location: { ...bookingData.location, city: text },
                    })
                  }
                  editable={!submitting}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter address"
                  value={bookingData.location.address}
                  onChangeText={(text) =>
                    setBookingData({
                      ...bookingData,
                      location: { ...bookingData.location, address: text },
                    })
                  }
                  editable={!submitting}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Additional Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any special requirements?"
                  value={bookingData.notes}
                  onChangeText={(text) => setBookingData({ ...bookingData, notes: text })}
                  multiline={true}
                  numberOfLines={4}
                  editable={!submitting}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleBookService}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* State Dropdown Modal */}
        <Modal
          visible={showStateDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStateDropdown(false)}
        >
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setShowStateDropdown(false)}
          >
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Select State</Text>
                <TouchableOpacity onPress={() => setShowStateDropdown(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={NIGERIAN_STATES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      bookingData.location.state === item && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setBookingData({
                        ...bookingData,
                        location: { ...bookingData.location, state: item },
                      });
                      setShowStateDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        bookingData.location.state === item && styles.dropdownItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {bookingData.location.state === item && (
                      <MaterialCommunityIcons name="check" size={20} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  imageSection: {
    backgroundColor: '#f3f4f6',
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  thumbnailList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#3b82f6',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  infoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
  },
  negotiable: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '400',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  providerSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  providerCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e5e7eb',
  },
  providerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  providerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  providerDetailText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
  },
  providerBio: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 18,
  },
  detailsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  reviewsSection: {
    padding: 16,
  },
  reviewCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  noReviews: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 14,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  timeInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  dropdownItemTextActive: {
    fontWeight: '600',
    color: '#3b82f6',
  },
});

export default ServiceDetailScreen;
