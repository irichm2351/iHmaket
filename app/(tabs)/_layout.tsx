import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useNotificationStore } from '../../src/store/notificationStore';
import { io } from 'socket.io-client';

const BadgeIcon = ({ name, size, color, count }) => (
  <View>
    <MaterialCommunityIcons name={name} size={size} color={color} />
    {count > 0 && (
      <View
        style={{
          position: 'absolute',
          right: -6,
          top: -3,
          backgroundColor: '#ef4444',
          borderRadius: 10,
          minWidth: 20,
          height: 20,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: 'white',
        }}
      >
        <Text
          style={{
            color: 'white',
            fontSize: 11,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    )}
  </View>
);

export default function TabLayout() {
  const { user } = useAuthStore();
  const { messageCount, bookingCount, initializeNotificationCounts, incrementMessageCount, incrementBookingCount } =
    useNotificationStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user?._id) {
      // Initialize notification counts on app load
      initializeNotificationCounts(user._id);

      // Setup socket.io listeners for real-time notifications
      // Extract base URL without /api path
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ihmaket-backend.onrender.com/api';
      const baseUrl = apiUrl.replace('/api', '') || 'https://ihmaket-backend.onrender.com';
      
      const socket = io(baseUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('Socket connected');
        socket.emit('user-login', user._id);
      });

      // Listen for new messages
      socket.on('new-message', (data) => {
        console.log('New message received:', data);
        incrementMessageCount();
      });

      // Listen for new bookings
      socket.on('new-booking', (data) => {
        console.log('New booking received:', data);
        incrementBookingCount();
      });

      // Listen for booking status updates
      socket.on('booking-status-updated', (data) => {
        console.log('Booking status updated:', data);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user?._id]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#3b82f6',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
      sceneContainerStyle={{
        backgroundColor: '#ffffff',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <BadgeIcon name="calendar-check" size={24} color={color} count={bookingCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <BadgeIcon name="message-text" size={24} color={color} count={messageCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={
          isAdmin
            ? {
                title: 'Admin',
                headerShown: false,
                tabBarIcon: ({ color }) => (
                  <MaterialCommunityIcons name="shield-account" size={24} color={color} />
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="services"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
