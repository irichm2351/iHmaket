import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const REJECTION_REASONS = [
  'Documents unclear or unreadable',
  'ID document appears fake or altered',
  'Selfie does not match ID photo',
  'Expired ID document',
  'Incomplete information',
  'Underage (below 18 years)',
  'Suspicious activity detected',
  'Other issue'
];

const AdminScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [view, setView] = useState('dashboard'); // dashboard, users, userDetail, kyc
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [restrictModalVisible, setRestrictModalVisible] = useState(false);
  const [restrictReason, setRestrictReason] = useState('');
  const [newRole, setNewRole] = useState('');
  const [page, setPage] = useState(1);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [kycFilter, setKycFilter] = useState('pending');
  const [selectedKycModal, setSelectedKycModal] = useState(null);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState('');
  const [expandedKycIds, setExpandedKycIds] = useState({});
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ uri: '', title: '' });
  const [subscriptionSettings, setSubscriptionSettings] = useState({
    enabled: false,
    amount: 2000,
    currency: 'NGN',
    interval: 'monthly'
  });
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionSaving, setSubscriptionSaving] = useState(false);
  const filterOptions = ['all', 'provider', 'customer', 'active', 'inactive', 'restricted'];

  useEffect(() => {
    fetchDashboardStats();
    fetchSubscriptionSettings();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch dashboard stats');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionSettings = async () => {
    try {
      setSubscriptionLoading(true);
      const response = await api.get('/admin/subscription-settings');
      if (response.data.success) {
        setSubscriptionSettings(response.data.settings);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        try {
          const fallback = await api.get('/subscription/settings');
          if (fallback.data.success) {
            setSubscriptionSettings(fallback.data.settings);
            return;
          }
        } catch (fallbackError) {
          // fall through to alert below
        }
        Alert.alert(
          'Update Required',
          'Subscription settings are not available on this backend. Please deploy the latest backend or update the API URL.'
        );
      } else {
        Alert.alert('Error', 'Failed to fetch subscription settings');
      }
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleSaveSubscriptionSettings = async () => {
    try {
      setSubscriptionSaving(true);
      const response = await api.put('/admin/subscription-settings', subscriptionSettings);
      if (response.data.success) {
        Alert.alert('Success', 'Subscription settings updated');
        setSubscriptionSettings(response.data.settings);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update settings');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        Alert.alert(
          'Update Required',
          'Subscription settings are not available on this backend. Please deploy the latest backend or update the API URL.'
        );
      } else {
        Alert.alert('Error', 'Failed to update subscription settings');
      }
    } finally {
      setSubscriptionSaving(false);
    }
  };

  const fetchUsers = async (filterType = 'all', search = '') => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 20,
      };

      if (filterType !== 'all') {
        if (filterType === 'active') {
          params.status = 'active';
        } else if (filterType === 'inactive') {
          params.status = 'inactive';
        } else if (filterType === 'restricted') {
          params.status = 'restricted';
        } else {
          params.role = filterType;
        }
      }

      if (search) {
        params.search = search;
      }

      const response = await api.get('/admin/users', { params });
      setUsers(response.data.users);
      setPage(1);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKycSubmissions = async (status = 'pending') => {
    try {
      setLoading(true);
      const params = {};
      if (status !== 'all') {
        params.status = status;
      }
      const response = await api.get('/admin/kyc', { params });
      setKycSubmissions(response.data.submissions || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch KYC submissions');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveKyc = async (kycId) => {
    try {
      setLoading(true);
      const response = await api.put(`/admin/kyc/${kycId}/approve`);
      if (response.data.success) {
        Alert.alert('Success', 'KYC approved successfully');
        fetchKycSubmissions(kycFilter);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to approve KYC');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectKyc = async (kycId) => {
    try {
      setLoading(true);
      const response = await api.put(`/admin/kyc/${kycId}/reject`, {
        reason: selectedRejectionReason || REJECTION_REASONS[0]
      });
      if (response.data.success) {
        Alert.alert('Success', 'KYC rejected');
        setSelectedKycModal(null);
        setSelectedRejectionReason('');
        fetchKycSubmissions(kycFilter);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject KYC');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleKycDetails = (kycId) => {
    setExpandedKycIds((prev) => ({
      ...prev,
      [kycId]: !prev[kycId],
    }));
  };

  const handleUpdateRole = async () => {
    if (!newRole) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    try {
      await api.put(`/admin/users/${selectedUser._id}/role`, { role: newRole });
      Alert.alert('Success', `User role updated to ${newRole}`);
      setRoleModalVisible(false);
      setNewRole('');
      fetchUserDetail(selectedUser._id);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleStatus = async () => {
    try {
      await api.put(`/admin/users/${selectedUser._id}/status`);
      Alert.alert('Success', `User ${selectedUser.isActive ? 'deactivated' : 'activated'}`);
      fetchUserDetail(selectedUser._id);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle user status');
    }
  };

  const handleToggleRestriction = async () => {
    if (selectedUser.isRestricted === false && !restrictReason) {
      Alert.alert('Error', 'Please provide a reason for restriction');
      return;
    }

    try {
      await api.put(`/admin/users/${selectedUser._id}/restrict`, {
        reason: restrictReason
      });
      Alert.alert('Success', `User ${selectedUser.isRestricted ? 'unrestricted' : 'restricted'}`);
      setRestrictModalVisible(false);
      setRestrictReason('');
      fetchUserDetail(selectedUser._id);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle restriction');
    }
  };

  const handleDeleteUser = async () => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to permanently delete this user? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${selectedUser._id}`);
              Alert.alert('Success', 'User deleted successfully');
              setView('users');
              fetchUsers(filter, searchQuery);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (view === 'dashboard') {
      await fetchDashboardStats();
      await fetchSubscriptionSettings();
    } else if (view === 'users') {
      await fetchUsers(filter, searchQuery);
    } else if (view === 'kyc') {
      await fetchKycSubmissions(kycFilter);
    }
    setRefreshing(false);
  };

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>User Management & Control</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => {
                  setFilter('all');
                  fetchUsers('all', '');
                  setView('users');
                }}
              >
                <MaterialCommunityIcons name="account-multiple" size={32} color="#3b82f6" />
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => {
                  setFilter('provider');
                  fetchUsers('provider', '');
                  setView('users');
                }}
              >
                <MaterialCommunityIcons name="briefcase" size={32} color="#10b981" />
                <Text style={styles.statValue}>{stats.totalProviders}</Text>
                <Text style={styles.statLabel}>Providers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => {
                  setFilter('customer');
                  fetchUsers('customer', '');
                  setView('users');
                }}
              >
                <MaterialCommunityIcons name="shopping-outline" size={32} color="#f59e0b" />
                <Text style={styles.statValue}>{stats.totalCustomers}</Text>
                <Text style={styles.statLabel}>Customers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => {
                  setFilter('inactive');
                  fetchUsers('inactive', '');
                  setView('users');
                }}
              >
                <MaterialCommunityIcons name="account-off" size={32} color="#ef4444" />
                <Text style={styles.statValue}>{stats.totalUsers - stats.activeUsers}</Text>
                <Text style={styles.statLabel}>Inactive</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => {
                  setFilter('restricted');
                  fetchUsers('restricted', '');
                  setView('users');
                }}
              >
                <MaterialCommunityIcons name="lock-alert" size={32} color="#e11d48" />
                <Text style={styles.statValue}>{stats.restrictedUsers}</Text>
                <Text style={styles.statLabel}>Restricted</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => {
                  setKycFilter('pending');
                  fetchKycSubmissions('pending');
                  setView('kyc');
                }}
              >
                <MaterialCommunityIcons name="clipboard-check" size={32} color="#8b5cf6" />
                <Text style={styles.statValue}>{stats.pendingKyc || 0}</Text>
                <Text style={styles.statLabel}>Pending KYC</Text>
              </TouchableOpacity>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                setFilter('all');
                fetchUsers('all', '');
                setView('users');
              }}
            >
              <MaterialCommunityIcons name="account-search" size={20} color="white" />
              <Text style={styles.viewAllButtonText}>View All Users</Text>
            </TouchableOpacity>

            {/* Send Message Button */}
            <TouchableOpacity
              style={styles.sendMessageButton}
              onPress={() => router.push('/admin-messaging')}
            >
              <MaterialCommunityIcons name="message-text" size={20} color="#3b82f6" />
              <Text style={styles.sendMessageButtonText}>Send Message to Users</Text>
            </TouchableOpacity>

            {/* Subscription Control */}
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionTitle}>Provider Subscription</Text>
                <Text style={styles.subscriptionSubtitle}>Enable or disable subscriptions</Text>
              </View>

              {subscriptionLoading ? (
                <View style={styles.subscriptionLoading}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                </View>
              ) : (
                <View>
                  <View style={styles.subscriptionRow}>
                    <Text style={styles.subscriptionLabel}>Status</Text>
                    <TouchableOpacity
                      style={[
                        styles.subscriptionToggle,
                        subscriptionSettings.enabled && styles.subscriptionToggleActive
                      ]}
                      onPress={() =>
                        setSubscriptionSettings({
                          ...subscriptionSettings,
                          enabled: !subscriptionSettings.enabled
                        })
                      }
                    >
                      <Text style={styles.subscriptionToggleText}>
                        {subscriptionSettings.enabled ? 'Enabled' : 'Disabled'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.subscriptionRow}>
                    <Text style={styles.subscriptionLabel}>Monthly Amount (NGN)</Text>
                    <TextInput
                      style={styles.subscriptionInput}
                      keyboardType="numeric"
                      value={String(subscriptionSettings.amount)}
                      onChangeText={(value) =>
                        setSubscriptionSettings({
                          ...subscriptionSettings,
                          amount: Number(value || 0)
                        })
                      }
                    />
                  </View>

                  <View style={styles.subscriptionRow}>
                    <Text style={styles.subscriptionLabel}>Currency</Text>
                    <TextInput
                      style={styles.subscriptionInput}
                      value={subscriptionSettings.currency}
                      onChangeText={(value) =>
                        setSubscriptionSettings({
                          ...subscriptionSettings,
                          currency: value.toUpperCase()
                        })
                      }
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.subscriptionSaveButton}
                    onPress={handleSaveSubscriptionSettings}
                    disabled={subscriptionSaving}
                  >
                    <Text style={styles.subscriptionSaveText}>
                      {subscriptionSaving ? 'Saving...' : 'Save Settings'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              </View>
          </>
        ) : null}
      </ScrollView>
    );
  }

  // Users List View
  if (view === 'users') {
    return (
      <View style={styles.container}>
        {/* Back Button & Search */}
        <View style={styles.usersHeader}>
          <View style={styles.usersHeaderContent}>
            <TouchableOpacity onPress={() => setView('dashboard')}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.usersHeaderTitle}>Users</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Filter Dropdown + Search */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterDropdownOpen(true)}
          >
            <MaterialCommunityIcons name="tune-vertical" size={18} color="#1f2937" />
            <Text style={styles.filterButtonText}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#6b7280" />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                fetchUsers(filter, text);
              }}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <Modal transparent visible={filterDropdownOpen} animationType="fade">
          <TouchableOpacity
            style={styles.filterOverlay}
            activeOpacity={1}
            onPress={() => setFilterDropdownOpen(false)}
          >
            <View style={styles.filterMenu}>
              {filterOptions.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterOption, filter === f && styles.filterOptionActive]}
                  onPress={() => {
                    setFilter(f);
                    fetchUsers(f, searchQuery);
                    setFilterDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[styles.filterOptionText, filter === f && styles.filterOptionTextActive]}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Users List */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : users.length === 0 ? (
          <View style={styles.centerContent}>
            <MaterialCommunityIcons name="account-search-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userCard}
                onPress={() => fetchUserDetail(item._id)}
              >
                <View style={styles.userCardContent}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
                    <View style={styles.userMeta}>
                      <View style={[styles.roleBadge, styles[`role_${item.role}`]]}>
                        <Text style={styles.roleBadgeText}>{item.role}</Text>
                      </View>
                      {item.isRestricted && (
                        <View style={styles.restrictedBadge}>
                          <MaterialCommunityIcons name="lock" size={12} color="#fff" />
                          <Text style={styles.restrictedText}> Restricted</Text>
                        </View>
                      )}
                      {!item.isActive && (
                        <View style={styles.inactiveBadge}>
                          <Text style={styles.inactiveText}>Inactive</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#d1d5db" />
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.usersList}
          />
        )}
      </View>
    );
  }

  // User Detail View
  if (view === 'userDetail' && selectedUser) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <TouchableOpacity onPress={() => setView('users')}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.detailHeaderTitle}>User Details</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* User Info Card */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{selectedUser.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{selectedUser.email}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Role</Text>
            <Text style={styles.detailValue}>{selectedUser.role}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: selectedUser.isActive ? '#10b981' : '#ef4444' }]}>
              {selectedUser.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          {selectedUser.isRestricted && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Restriction Reason</Text>
              <Text style={styles.detailValue}>{selectedUser.restrictionReason || 'N/A'}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Services</Text>
            <Text style={styles.detailValue}>{selectedUser.servicesCount || 0}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bookings</Text>
            <Text style={styles.detailValue}>{selectedUser.bookingsCount || 0}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Joined</Text>
            <Text style={styles.detailValue}>
              {new Date(selectedUser.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => setRoleModalVisible(true)}
          >
            <MaterialCommunityIcons name="briefcase" size={20} color="white" />
            <Text style={styles.actionButtonText}>Change Role</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleToggleStatus}
          >
            <MaterialCommunityIcons
              name={selectedUser.isActive ? 'account-off' : 'account-check'}
              size={20}
              color="white"
            />
            <Text style={styles.actionButtonText}>
              {selectedUser.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.warningButton]}
            onPress={() => setRestrictModalVisible(true)}
          >
            <MaterialCommunityIcons
              name={selectedUser.isRestricted ? 'lock-open' : 'lock'}
              size={20}
              color="white"
            />
            <Text style={styles.actionButtonText}>
              {selectedUser.isRestricted ? 'Unrestrict' : 'Restrict'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleDeleteUser}>
            <MaterialCommunityIcons name="delete" size={20} color="white" />
            <Text style={styles.actionButtonText}>Delete User</Text>
          </TouchableOpacity>
        </View>

        {/* Role Change Modal */}
        <Modal visible={roleModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change User Role</Text>
              <Text style={styles.modalSubtitle}>Current Role: {selectedUser.role}</Text>

              {['customer', 'provider', 'admin'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleOption, newRole === role && styles.roleOptionSelected]}
                  onPress={() => setNewRole(role)}
                >
                  <MaterialCommunityIcons
                    name={newRole === role ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={20}
                    color={newRole === role ? '#3b82f6' : '#d1d5db'}
                  />
                  <Text style={styles.roleOptionText}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setRoleModalVisible(false);
                    setNewRole('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleUpdateRole}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Restriction Modal */}
        <Modal visible={restrictModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedUser.isRestricted ? 'Unrestrict User' : 'Restrict User'}
              </Text>

              {!selectedUser.isRestricted && (
                <>
                  <Text style={styles.modalSubtitle}>Reason for restriction:</Text>
                  <TextInput
                    style={styles.restrictionInput}
                    placeholder="Enter reason for restriction..."
                    value={restrictReason}
                    onChangeText={setRestrictReason}
                    placeholderTextColor="#9ca3af"
                    multiline
                  />
                </>
              )}

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setRestrictModalVisible(false);
                    setRestrictReason('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleToggleRestriction}
                >
                  <Text style={styles.confirmButtonText}>
                    {selectedUser.isRestricted ? 'Unrestrict' : 'Restrict'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // KYC Management View
  if (view === 'kyc') {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('dashboard')} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>KYC Management</Text>
            <Text style={styles.headerSubtitle}>Review & approve KYC submissions</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {['pending', 'verified', 'rejected', 'all'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterTab, kycFilter === status && styles.filterTabActive]}
              onPress={() => {
                setKycFilter(status);
                fetchKycSubmissions(status === 'all' ? '' : status);
              }}
            >
              <Text style={[styles.filterTabText, kycFilter === status && styles.filterTabTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : kycSubmissions.length === 0 ? (
          <View style={styles.centerContent}>
            <MaterialCommunityIcons name="clipboard-check" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No KYC submissions found</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {kycSubmissions.map((submission) => {
              const isExpanded = expandedKycIds[submission._id] ?? submission.kycStatus === 'pending';
              return (
                <View key={submission._id} style={styles.kycCard}>
                  <View style={styles.kycHeader}>
                  <View>
                    <Text style={styles.kycUserName}>{submission.name}</Text>
                    <Text style={styles.kycUserEmail}>{submission.email}</Text>
                  </View>
                  <View style={[styles.kycStatusBadge, styles[`kycStatus${submission.kycStatus}`]]}>
                    <Text style={styles.kycStatusText}>{submission.kycStatus}</Text>
                  </View>
                  </View>

                  <TouchableOpacity
                    style={styles.kycToggle}
                    onPress={() => toggleKycDetails(submission._id)}
                  >
                    <Text style={styles.kycToggleText}>
                      {isExpanded ? 'Hide details' : 'View details'}
                    </Text>
                    <MaterialCommunityIcons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#6b7280"
                    />
                  </TouchableOpacity>

                  {isExpanded && submission.kycData && (
                    <View style={styles.kycDetails}>
                      <View style={styles.kycDetailRow}>
                        <MaterialCommunityIcons name="card-account-details" size={16} color="#6b7280" />
                        <Text style={styles.kycDetailLabel}>ID Type:</Text>
                        <Text style={styles.kycDetailValue}>{submission.kycData.idType}</Text>
                      </View>
                      <View style={styles.kycDetailRow}>
                        <MaterialCommunityIcons name="identifier" size={16} color="#6b7280" />
                        <Text style={styles.kycDetailLabel}>ID Number:</Text>
                        <Text style={styles.kycDetailValue}>{submission.kycData.idNumber}</Text>
                      </View>
                      {submission.kycSubmittedAt && (
                        <View style={styles.kycDetailRow}>
                          <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
                          <Text style={styles.kycDetailLabel}>Submitted:</Text>
                          <Text style={styles.kycDetailValue}>
                            {new Date(submission.kycSubmittedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {isExpanded && submission.kycData && (submission.kycData.imageUrl || submission.kycData.selfieUrl) && (
                    <View style={styles.kycImages}>
                      <Text style={styles.kycImagesTitle}>Verification Photos</Text>
                      <View style={styles.kycImagesRow}>
                        {submission.kycData.imageUrl && (
                          <View style={styles.kycImageContainer}>
                            <Text style={styles.kycImageLabel}>ID Card</Text>
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedImage({ uri: submission.kycData.imageUrl, title: 'ID Card' });
                                setImageViewerVisible(true);
                              }}
                              activeOpacity={0.8}
                            >
                              <Image
                                source={{ uri: submission.kycData.imageUrl }}
                                style={styles.kycImage}
                                resizeMode="cover"
                              />
                              <View style={styles.imageOverlay}>
                                <MaterialCommunityIcons name="magnify-plus" size={24} color="white" />
                              </View>
                            </TouchableOpacity>
                          </View>
                        )}
                        {submission.kycData.selfieUrl && (
                          <View style={styles.kycImageContainer}>
                            <Text style={styles.kycImageLabel}>Selfie</Text>
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedImage({ uri: submission.kycData.selfieUrl, title: 'Selfie' });
                                setImageViewerVisible(true);
                              }}
                              activeOpacity={0.8}
                            >
                              <Image
                                source={{ uri: submission.kycData.selfieUrl }}
                                style={styles.kycImage}
                                resizeMode="cover"
                              />
                              <View style={styles.imageOverlay}>
                                <MaterialCommunityIcons name="magnify-plus" size={24} color="white" />
                              </View>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {submission.kycStatus === 'pending' && (
                    <View style={styles.kycActions}>
                      <TouchableOpacity
                        style={[styles.kycButton, styles.kycApproveButton]}
                        onPress={() => {
                          Alert.alert(
                            'Approve KYC',
                            `Approve KYC for ${submission.name}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Approve',
                                onPress: () => handleApproveKyc(submission._id),
                              },
                            ]
                          );
                        }}
                      >
                        <MaterialCommunityIcons name="check-circle" size={20} color="white" />
                        <Text style={styles.kycButtonText}>Approve</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.kycButton, styles.kycRejectButton]}
                        onPress={() => {
                          setSelectedKycModal(submission);
                          setSelectedRejectionReason(REJECTION_REASONS[0]);
                        }}
                      >
                        <MaterialCommunityIcons name="close-circle" size={20} color="white" />
                        <Text style={styles.kycButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isExpanded && submission.kycRejectionReason && (
                    <View style={styles.rejectionReason}>
                      <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
                      <Text style={styles.rejectionReasonText}>{submission.kycRejectionReason}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Reject KYC Modal */}
        <Modal visible={selectedKycModal !== null} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reject KYC</Text>
              <Text style={styles.modalSubtitle}>
                Select reason for {selectedKycModal?.name}:
              </Text>

              <ScrollView style={styles.reasonDropdown} nestedScrollEnabled>
                {REJECTION_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonOption,
                      selectedRejectionReason === reason && styles.reasonOptionSelected
                    ]}
                    onPress={() => setSelectedRejectionReason(reason)}
                  >
                    <View style={styles.radioButton}>
                      {selectedRejectionReason === reason && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={[
                      styles.reasonText,
                      selectedRejectionReason === reason && styles.reasonTextSelected
                    ]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => {
                    setSelectedKycModal(null);
                    setSelectedRejectionReason('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    if (selectedKycModal) {
                      handleRejectKyc(selectedKycModal._id);
                    }
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Full Screen Image Viewer Modal */}
        <Modal 
          visible={imageViewerVisible} 
          transparent 
          animationType="fade"
          onRequestClose={() => setImageViewerVisible(false)}
        >
          <View style={styles.imageViewerOverlay}>
            <View style={styles.imageViewerHeader}>
              <Text style={styles.imageViewerTitle}>{selectedImage.title}</Text>
              <TouchableOpacity
                style={styles.imageViewerCloseButton}
                onPress={() => setImageViewerVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageViewerContent}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.imageViewerImage}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.imageViewerFooter}>
              <Text style={styles.imageViewerHint}>Pinch to zoom • Tap outside to close</Text>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  return null;
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
    backgroundColor: '#3b82f6',
  },
  headerContent: {
    marginTop: 'auto',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  backButton: {
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  statsGrid: {
    paddingHorizontal: 12,
    paddingTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  viewAllButton: {
    marginHorizontal: 16,
    marginVertical: 20,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sendMessageButton: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: 'white',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
    shadowColor: '#1f2937',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  sendMessageButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  subscriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#1f2937',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  subscriptionHeader: {
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subscriptionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  subscriptionLoading: {
    paddingVertical: 12,
  },
  subscriptionRow: {
    marginBottom: 12,
  },
  subscriptionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  subscriptionInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  subscriptionToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  subscriptionToggleActive: {
    backgroundColor: '#dbeafe',
  },
  subscriptionToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
  },
  subscriptionSaveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  subscriptionSaveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  usersHeader: {
    height: 80,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  usersHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  usersHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 120,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 6,
    flexShrink: 1,
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
  },
  filterMenu: {
    marginTop: 140,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 6,
  },
  filterOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterOptionActive: {
    backgroundColor: '#eff6ff',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
  },
  filterOptionTextActive: {
    color: '#2563eb',
  },
  usersList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userCardContent: {
    flexDirection: 'row',
    aligning: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  role_provider: {
    backgroundColor: '#dbeafe',
  },
  role_customer: {
    backgroundColor: '#fef3c7',
  },
  role_admin: {
    backgroundColor: '#dcfce7',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  restrictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
    marginRight: 8,
  },
  restrictedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
  },
  inactiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  inactiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  detailHeader: {
    height: 100,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  detailHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  detailCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#8b5cf6',
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    maxWidth: '75%',
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 18,
    textAlign: 'center',
    lineHeight: 18,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  roleOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 12,
  },
  restrictionInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  modalButtonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonPrimary: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalButtonTextPrimary: {
    color: 'white',
  },
  reasonDropdown: {
    maxHeight: 240,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    paddingVertical: 4,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    marginVertical: 3,
    borderRadius: 6,
  },
  reasonOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  reasonText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
    lineHeight: 18,
  },
  reasonTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: 'white',
  },
  kycCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  kycHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  kycUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  kycUserEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
  kycStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  kycStatuspending: {
    backgroundColor: '#fef3c7',
  },
  kycStatusverified: {
    backgroundColor: '#d1fae5',
  },
  kycStatusrejected: {
    backgroundColor: '#fee2e2',
  },
  kycStatusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  kycToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  kycToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  kycDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  kycDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  kycDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 4,
  },
  kycDetailValue: {
    fontSize: 13,
    color: '#1f2937',
    flex: 1,
  },
  kycImages: {
    marginTop: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  kycImagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  kycImagesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kycImageContainer: {
    flex: 1,
  },
  kycImageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  kycImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  imageViewerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  imageViewerCloseButton: {
    padding: 8,
  },
  imageViewerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
  },
  imageViewerFooter: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  imageViewerHint: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  kycActions: {
    flexDirection: 'row',
    gap: 10,
  },
  kycButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  kycApproveButton: {
    backgroundColor: '#10b981',
  },
  kycRejectButton: {
    backgroundColor: '#ef4444',
  },
  kycButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  rejectionReason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  rejectionReasonText: {
    fontSize: 12,
    color: '#dc2626',
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
});

export default AdminScreen;
