import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

const ServicesScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [savedServices, setSavedServices] = useState([]);
  const { category } = useLocalSearchParams();

  useEffect(() => {
    if (category && category !== 'More') {
      setSelectedCategory(category);
    }
  }, [category]);

  useEffect(() => {
    fetchServices();
    if (user) {
      fetchSavedServices();
    }
  }, [selectedCategory, user]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      
      const response = await api.get('/services', { params });
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedServices = async () => {
    try {
      const response = await api.get(`/users/${user?._id}`);
      if (response.data.success && response.data.user?.savedServices) {
        const savedServicesData = response.data.user.savedServices;
        // Extract IDs whether they're objects or strings
        const savedIds = savedServicesData.map(service => 
          typeof service === 'object' && service?._id ? service._id : service
        );
        setSavedServices(savedIds);
      }
    } catch (error) {
      console.error('Error fetching saved services:', error);
    }
  };

  const handleToggleFavorite = async (serviceId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      const response = await api.post(`/users/save-service/${serviceId}`);
      if (response.data.success) {
        // Update local saved services state based on server response
        if (response.data.saved) {
          setSavedServices([...savedServices, serviceId]);
        } else {
          setSavedServices(savedServices.filter(id => id !== serviceId));
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const isSaved = (serviceId) => savedServices.includes(serviceId);

  const categories = [
    'All',
    'Plumbing',
    'Cleaning',
    'Beauty & Makeup',
    'IT & Tech Support',
    'Photography',
    'Catering',
    'Tutoring',
    'Home Repair',
  ];

  return (
    <View style={styles.container}>
      {/* Category Dropdown + Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={styles.categoryDropdown}
            onPress={() => setShowCategoryDropdown(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryDropdownText} numberOfLines={1}>
              {selectedCategory || 'All'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#6b7280" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={fetchServices}
            />
          </View>
        </View>
      </View>

      {/* Category Dropdown Modal */}
      {showCategoryDropdown && (
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownMenu}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedCategory(cat === 'All' ? null : cat);
                  setShowCategoryDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    (selectedCategory === null && cat === 'All') || selectedCategory === cat
                      ? styles.dropdownItemTextActive
                      : null,
                  ]}
                >
                  {cat}
                </Text>
                {((selectedCategory === null && cat === 'All') || selectedCategory === cat) && (
                  <MaterialCommunityIcons name="check" size={18} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Provider CTA */}
      {user?.role !== 'customer' && (
        <View style={styles.providerCta}>
          <View style={styles.providerCtaCard}>
            <View style={styles.providerCtaIcon}>
              <MaterialCommunityIcons name="briefcase-plus" size={24} color="#3b82f6" />
            </View>
            <View style={styles.providerCtaContent}>
              <Text style={styles.providerCtaTitle}>Are you a provider?</Text>
              <Text style={styles.providerCtaText}>Post your service and get bookings fast.</Text>
            </View>
            <TouchableOpacity
              style={styles.providerCtaButton}
              onPress={() => router.push('/post-service')}
            >
              <Text style={styles.providerCtaButtonText}>Post Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Services List */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : services.length === 0 ? (
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="inbox" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No services found</Text>
        </View>
      ) : (
        <ScrollView style={styles.servicesList}>
          {services.map((service) => (
            <TouchableOpacity
              key={service._id}
              style={styles.serviceCard}
              onPress={() => router.push(`/service/${service._id}`)}
            >
              <View style={styles.serviceImage}>
                {service.images && service.images.length > 0 ? (
                  <Image
                    source={{ uri: typeof service.images[0] === 'object' ? service.images[0].url : service.images[0] }}
                    style={styles.serviceImageContent}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialCommunityIcons name="image" size={40} color="#d1d5db" />
                )}
                {user && service.providerId?._id !== user._id && (
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={(e) => handleToggleFavorite(service._id, e)}
                  >
                    <MaterialCommunityIcons
                      name={isSaved(service._id) ? "heart" : "heart-outline"}
                      size={24}
                      color={isSaved(service._id) ? "#ec4899" : "white"}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.title}</Text>
                <View style={styles.providerRow}>
                  {service.provider?.profilePic && (
                    <Image
                      source={{ uri: service.provider.profilePic }}
                      style={styles.providerAvatar}
                    />
                  )}
                  <View style={styles.providerNameWrapper}>
                    <Text style={styles.serviceProvider}>{service.provider?.name || 'Unknown'}</Text>
                    {service.provider?._id && (
                      <TouchableOpacity
                        style={styles.viewProviderButton}
                        onPress={() => router.push(`/provider/${service.provider._id}`)}
                      >
                        <Text style={styles.viewProviderText}>View Profile</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={16} color="#f59e0b" />
                  <Text style={styles.rating}>
                    {service.rating > 0 ? service.rating.toFixed(1) : 'No ratings'}
                  </Text>
                  {service.totalReviews > 0 && (
                    <Text style={styles.reviews}> ({service.totalReviews})</Text>
                  )}
                </View>
                <Text style={styles.price}>
                  {`₦${Number(service.price?.amount || 0).toLocaleString('en-NG')}${service.price?.negotiable ? ' • Negotiable' : ''}`}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchSection: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    minWidth: 110,
    maxWidth: 140,
  },
  categoryDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 6,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 70,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingTop: 8,
    paddingBottom: 12,
    zIndex: 10,
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  providerCta: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  providerCtaCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  providerCtaIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerCtaContent: {
    marginBottom: 10,
  },
  providerCtaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  providerCtaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  providerCtaButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  providerCtaButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryTagActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryTagInactive: {
    backgroundColor: 'white',
    borderColor: '#e5e7eb',
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryTagTextActive: {
    color: 'white',
  },
  categoryTagTextInactive: {
    color: '#6b7280',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9ca3af',
  },
  servicesList: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  serviceImageContent: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 6,
    zIndex: 1,
  },
  serviceInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  providerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#e5e7eb',
  },
  providerNameWrapper: {
    flex: 1,
  },
  serviceProvider: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  viewProviderButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#eff6ff',
  },
  viewProviderText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  reviews: {
    marginLeft: 2,
    fontSize: 12,
    color: '#6b7280',
  },
  price: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
});

export default ServicesScreen;
