import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

const SavedServicesScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [savedServices, setSavedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSavedServices();
  }, []);

  // Refresh saved services when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSavedServices();
    }, [])
  );

  const fetchSavedServices = async () => {
    try {
      setLoading(true);
      
      // Get user's saved service data (already populated by backend)
      const userResponse = await api.get(`/users/${user?._id}`);
      const savedServicesData = userResponse.data.user?.savedServices || [];
      
      if (savedServicesData.length === 0) {
        setSavedServices([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // If savedServices are already populated objects, use them directly
      if (savedServicesData[0] && typeof savedServicesData[0] === 'object' && savedServicesData[0]._id) {
        // Filter out any null values
        const validServices = savedServicesData.filter(service => service && service._id);
        setSavedServices(validServices);
      } else {
        // If they're just IDs, fetch the full service details
        const savedServiceIds = savedServicesData;
        const servicesResponse = await api.get('/services');
        const allServices = servicesResponse.data.services || [];
        const filtered = allServices.filter(service => 
          savedServiceIds.includes(service._id)
        );
        setSavedServices(filtered);
      }
    } catch (error) {
      console.error('Error fetching saved services:', error);
      console.error('Error details:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load saved services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedServices();
  };

  const handleRemoveSaved = async (serviceId) => {
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this service from your favorites?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/users/save-service/${serviceId}`);
              // Remove from local state
              setSavedServices(savedServices.filter(s => s._id !== serviceId));
              Alert.alert('Success', 'Removed from favorites');
            } catch (error) {
              console.error('Error removing saved service:', error);
              Alert.alert('Error', 'Failed to remove from favorites');
            }
          },
        },
      ]
    );
  };

  const handleViewService = (serviceId) => {
    router.push(`/service/${serviceId}`);
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (typeof url === 'object' && url.url) return url.url;
    if (url.startsWith('http')) return url;
    return url;
  };

  if (loading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Favorites</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      {savedServices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="heart-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Saved Services</Text>
          <Text style={styles.emptyText}>
            Start exploring and save your favorite services here
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/services')}
          >
            <Text style={styles.exploreButtonText}>Explore Services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.servicesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.countText}>
            {savedServices.length} {savedServices.length === 1 ? 'Service' : 'Services'} Saved
          </Text>
          
          {savedServices.map((service) => (
            <TouchableOpacity
              key={service._id}
              style={styles.serviceCard}
              onPress={() => handleViewService(service._id)}
            >
              <View style={styles.serviceImageContainer}>
                {service.images && service.images.length > 0 ? (
                  <Image
                    source={{ uri: getImageUrl(service.images[0]) }}
                    style={styles.serviceImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="image" size={40} color="#d1d5db" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.heartButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveSaved(service._id);
                  }}
                >
                  <MaterialCommunityIcons name="heart" size={24} color="#ec4899" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName} numberOfLines={2}>
                  {service.title}
                </Text>
                
                <View style={styles.providerRow}>
                  <MaterialCommunityIcons name="account" size={14} color="#6b7280" />
                  <Text style={styles.providerName} numberOfLines={1}>
                    {service.providerId?.name || 'Unknown Provider'}
                  </Text>
                </View>

                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker" size={14} color="#6b7280" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {service.location?.city}, {service.location?.state}
                  </Text>
                </View>

                <View style={styles.bottomRow}>
                  <View style={styles.ratingRow}>
                    <MaterialCommunityIcons name="star" size={14} color="#f59e0b" />
                    <Text style={styles.ratingText}>
                      {service.rating ? service.rating.toFixed(1) : 'No ratings'}
                    </Text>
                  </View>
                  
                  <Text style={styles.price}>
                    ₦{Number(service.price?.amount || 0).toLocaleString('en-NG')}
                    {service.price?.negotiable && (
                      <Text style={styles.negotiable}> • Neg</Text>
                    )}
                  </Text>
                </View>

                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{service.category}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          
          <View style={{ height: 20 }} />
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
  header: {
    height: 100,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  servicesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginVertical: 12,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceInfo: {
    padding: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#1f2937',
    marginLeft: 4,
    fontWeight: '500',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  negotiable: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '400',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
});

export default SavedServicesScreen;
