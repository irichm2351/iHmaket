import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../store/authStore';

const DEFAULT_SETTINGS = {
  messages: true,
  bookings: true,
  reviews: true,
  promotions: false,
  emailNotifications: true,
  pushNotifications: true,
};

const NotificationsScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const settingsKey = useMemo(() => {
    const userId = user?._id || 'guest';
    // SecureStore keys allow only alphanumeric, '.', '-', '_'
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9._-]/g, '_');
    return `notificationSettings_${safeUserId}`;
  }, [user?._id]);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const saved = await SecureStore.getItemAsync(settingsKey);
        if (saved && isMounted) {
          const parsed = JSON.parse(saved);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (error) {
        console.log('Failed to load notification settings:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [settingsKey]);

  const toggleSetting = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);

    try {
      await SecureStore.setItemAsync(settingsKey, JSON.stringify(updated));
    } catch (error) {
      console.log('Failed to save notification settings:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Notification Types Section */}
      {isLoading && (
        <View style={styles.loadingRow}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      )}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        <Text style={styles.sectionDesc}>Choose what notifications you want to receive</Text>

        <View style={styles.settingsList}>
          {/* Messages */}
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons name="message" size={22} color="#3b82f6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Messages</Text>
              <Text style={styles.settingDesc}>New messages from users</Text>
            </View>
            <Switch
              value={settings.messages}
              onValueChange={() => toggleSetting('messages')}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={settings.messages ? '#3b82f6' : '#f3f4f6'}
            />
          </View>

          {/* Bookings */}
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons name="calendar-check" size={22} color="#3b82f6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Bookings</Text>
              <Text style={styles.settingDesc}>Booking updates and confirmations</Text>
            </View>
            <Switch
              value={settings.bookings}
              onValueChange={() => toggleSetting('bookings')}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={settings.bookings ? '#3b82f6' : '#f3f4f6'}
            />
          </View>

          {/* Reviews & Ratings */}
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons name="star" size={22} color="#3b82f6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Reviews & Ratings</Text>
              <Text style={styles.settingDesc}>New reviews and ratings</Text>
            </View>
            <Switch
              value={settings.reviews}
              onValueChange={() => toggleSetting('reviews')}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={settings.reviews ? '#3b82f6' : '#f3f4f6'}
            />
          </View>

          {/* Promotions */}
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons name="tag" size={22} color="#3b82f6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Promotions</Text>
              <Text style={styles.settingDesc}>Special offers and deals</Text>
            </View>
            <Switch
              value={settings.promotions}
              onValueChange={() => toggleSetting('promotions')}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={settings.promotions ? '#3b82f6' : '#f3f4f6'}
            />
          </View>
        </View>
      </View>

      {/* Delivery Method Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Method</Text>
        <Text style={styles.sectionDesc}>How you want to receive notifications</Text>

        <View style={styles.settingsList}>
          {/* Push Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons name="bell" size={22} color="#3b82f6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Receive push notifications</Text>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={() => toggleSetting('pushNotifications')}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={settings.pushNotifications ? '#3b82f6' : '#f3f4f6'}
            />
          </View>

          {/* Email Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons name="email" size={22} color="#3b82f6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingDesc}>Receive email notifications</Text>
            </View>
            <Switch
              value={settings.emailNotifications}
              onValueChange={() => toggleSetting('emailNotifications')}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={settings.emailNotifications ? '#3b82f6' : '#f3f4f6'}
            />
          </View>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="information" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          You can customize your notification preferences at any time. Important account and security notifications will always be sent.
        </Text>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
    backgroundColor: '#3b82f6',
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  loadingRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingText: {
    fontSize: 13,
    color: '#6b7280',
  },
  settingsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 8,
    margin: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
});

export default NotificationsScreen;
