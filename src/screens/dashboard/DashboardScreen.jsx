import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

const DashboardScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myServices, setMyServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [savedServices, setSavedServices] = useState([]);
  const [loadingSavedServices, setLoadingSavedServices] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    fetchMyServices();
    fetchSavedServices();
    if (user?.role === 'provider') {
      fetchSubscriptionStatus();
    }
  }, []);

  // Refresh services when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchMyServices();
      fetchSavedServices();
      if (user?.role === 'provider') {
        fetchSubscriptionStatus();
      }
    }, [])
  );

  const fetchSubscriptionStatus = async () => {
    try {
      setSubscriptionLoading(true);
      const response = await api.get('/subscription/status');
      if (response.data.success) {
        setSubscriptionStatus(response.data.status);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings');
      const bookings = response.data.bookings || [];
      
      setStats({
        totalBookings: bookings.length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        totalEarnings: bookings.reduce((sum, b) => sum + (b.service?.price || 0), 0),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyServices = async () => {
    try {
      setLoadingServices(true);
      const response = await api.get(`/services/provider/${user?._id}`);
      if (response.data.success) {
        setMyServices(response.data.services || []);
      }
    } catch (error) {
      console.error('Error fetching my services:', error);
      setMyServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchSavedServices = async () => {
    try {
      setLoadingSavedServices(true);
      const response = await api.get(`/users/${user?._id}`);
      if (response.data.success && response.data.user?.savedServices) {
        // Store the savedServices (works whether populated or not for count)
        setSavedServices(response.data.user.savedServices);
      }
    } catch (error) {
      console.error('Error fetching saved services:', error);
      setSavedServices([]);
    } finally {
      setLoadingSavedServices(false);
    }
  };

  const subscriptionBlocked =
    subscriptionStatus?.enabled &&
    subscriptionStatus?.isProvider &&
    !subscriptionStatus?.isActive;

  const getSubscriptionBadgeText = () => {
    if (!subscriptionStatus?.isActive || !subscriptionStatus?.expiresAt) {
      return null;
    }
    const expiryDate = new Date(subscriptionStatus.expiresAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `Active until ${expiryDate}`;
  };

  const handleProviderAction = (path) => {
    if (subscriptionBlocked) {
      Alert.alert(
        'Subscription Required',
        'Provider features are blocked until you subscribe.'
      );
      router.push('/subscription');
      return;
    }
    router.push(path);
  };

  const handleDeleteService = (serviceId, serviceTitle) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${serviceTitle}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/services/${serviceId}`);
              if (response.data.success) {
                Alert.alert('Success', 'Service deleted successfully');
                // Refresh all dashboard data
                fetchMyServices();
                fetchSavedServices();
                fetchDashboardStats();
              }
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete service');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.subGreeting}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          {user?.role === 'provider' && subscriptionStatus?.isActive && (
            <View style={styles.subscriptionBadge}>
              <MaterialCommunityIcons name="check-decagram" size={14} color="#065f46" />
              <Text style={styles.subscriptionBadgeText}>{getSubscriptionBadgeText()}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={() => router.push('/profile')}
        >
          {user?.profilePic ? (
            <Image 
              source={{ uri: user.profilePic }} 
              style={styles.profileImage}
            />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={50} color="#3b82f6" />
          )}
        </TouchableOpacity>
      </View>

      {user?.role === 'provider' && subscriptionBlocked && (
        <View style={styles.subscriptionBanner}>
          <View style={styles.subscriptionBannerText}>
            <Text style={styles.subscriptionTitle}>Subscription Required</Text>
            <Text style={styles.subscriptionText}>
              Provider features are blocked until you subscribe.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.subscriptionButton}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.subscriptionButtonText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Cards */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                <MaterialCommunityIcons name="calendar-check" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>{stats?.totalBookings || 0}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{stats?.completedBookings || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name="clock" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>{stats?.pendingBookings || 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/saved-services')}
            >
              <View style={[styles.statIcon, { backgroundColor: '#fce7f3' }]}>
                <MaterialCommunityIcons name="heart" size={24} color="#ec4899" />
              </View>
              <Text style={styles.statValue}>{savedServices?.length || 0}</Text>
              <Text style={styles.statLabel}>Saved Favorites</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          {user?.role === 'provider' && (
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionCard} onPress={() => handleProviderAction('/post-service')}>
                  <MaterialCommunityIcons name="plus-circle" size={28} color="#3b82f6" />
                  <Text style={styles.actionText}>Post Service</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/rate-provider')}>
                  <MaterialCommunityIcons name="star" size={28} color="#3b82f6" />
                  <Text style={styles.actionText}>Reviews</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* My Service Ads */}
          {user?.role === 'provider' && (
            <View style={styles.adsSection}>
              <View style={styles.adsHeaderRow}>
                <View>
                  <Text style={styles.adsTitle}>My Service Ads</Text>
                  <Text style={styles.adsSubtitle}>Manage and monitor your posted services</Text>
                </View>
                <TouchableOpacity style={styles.adsButton} onPress={() => handleProviderAction('/post-service')}>
                  <Text style={styles.adsButtonText}>New Service</Text>
                </TouchableOpacity>
              </View>
              {loadingServices ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                </View>
              ) : myServices.length > 0 ? (
                <FlatList
                  data={myServices}
                  keyExtractor={(item) => item._id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.serviceItemCard}>
                      <View style={styles.serviceImageContainer}>
                        {item.images && item.images.length > 0 ? (
                          <Image
                            source={{ uri: typeof item.images[0] === 'object' ? item.images[0].url : item.images[0] }}
                            style={styles.serviceImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <MaterialCommunityIcons name="image" size={40} color="#d1d5db" />
                          </View>
                        )}
                      </View>
                      <View style={styles.serviceInfoContainer}>
                        <Text style={styles.serviceName} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.serviceCategory}>{item.category}</Text>
                        <View style={styles.serviceRatingRow}>
                          <MaterialCommunityIcons name="star" size={14} color="#f59e0b" />
                          <Text style={styles.serviceRating}>{(item.rating || 0).toFixed(1)}</Text>
                          <Text style={styles.serviceStatus}>• {item.isActive ? 'Active' : 'Inactive'}</Text>
                        </View>
                        <Text style={styles.servicePrice}>
                          {`₦${Number(item.price?.amount || 0).toLocaleString('en-NG')}${item.price?.negotiable ? ' • Negotiable' : ''}`}
                        </Text>
                      </View>
                      <View style={styles.serviceActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => router.push(`/service/edit/${item._id}`)}
                        >
                          <MaterialCommunityIcons name="pencil" size={20} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleDeleteService(item._id, item.title)}
                        >
                          <MaterialCommunityIcons name="delete" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              ) : (
                <View style={styles.adsCard}>
                  <MaterialCommunityIcons name="briefcase-search" size={32} color="#9ca3af" />
                  <Text style={styles.adsEmpty}>No service ads yet</Text>
                </View>
              )}
            </View>
          )}

          {/* Account Status */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Account Status</Text>
            <View style={styles.statusCard}>
              {/* Account Type */}
              <View style={styles.statusItem}>
                <MaterialCommunityIcons 
                  name={user?.role === 'provider' ? 'briefcase-account' : 'account'} 
                  size={20} 
                  color="#3b82f6" 
                />
                <Text style={styles.statusText}>
                  {user?.role === 'provider' ? 'Provider Account' : 'Customer Account'}
                </Text>
              </View>

              {/* Provider Verification Status */}
              {user?.role === 'provider' && (
                <View style={styles.statusItem}>
                  <MaterialCommunityIcons 
                    name={user?.isVerified ? 'check-decagram' : 'alert-circle'} 
                    size={20} 
                    color={user?.isVerified ? '#10b981' : '#f59e0b'} 
                  />
                  <Text style={styles.statusText}>
                    {user?.isVerified ? 'Verified Provider' : 'Verification Pending'}
                  </Text>
                </View>
              )}

              {/* Become a Provider Option for Customers */}
              {user?.role === 'customer' && (
                <TouchableOpacity 
                  style={styles.becomeProviderButton}
                  onPress={() => router.push('/kyc')}
                >
                  <MaterialCommunityIcons name="briefcase-plus" size={20} color="white" />
                  <Text style={styles.becomeProviderText}>Become a Provider</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    height: 130,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 12,
    color: '#6b7280',
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  centerContent: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statIcon: {
    width: 45,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionsSection: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  adsSection: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  adsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  adsSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  adsButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  adsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  adsCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  adsEmpty: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  activitySection: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusText: {
    marginLeft: 12,
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
  becomeProviderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  becomeProviderText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceItemCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceImageContainer: {
    width: 90,
    height: 90,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  serviceInfoContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  serviceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceRating: {
    fontSize: 11,
    color: '#111827',
    marginLeft: 3,
    fontWeight: '600',
  },
  serviceStatus: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 6,
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
  },
  serviceActions: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionBanner: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionBannerText: {
    flex: 1,
    marginRight: 10,
  },
  subscriptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  subscriptionText: {
    fontSize: 12,
    color: '#92400e',
  },
  subscriptionButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  subscriptionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  subscriptionBadgeText: {
    color: '#065f46',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default DashboardScreen;
