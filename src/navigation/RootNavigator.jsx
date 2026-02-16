import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ServicesScreen from '../screens/services/ServicesScreen';
import ServiceDetailScreen from '../screens/services/ServiceDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import BookingsScreen from '../screens/bookings/BookingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: 'white' },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyleInterpolator: ({ current }) => ({
        headerStyle: {
          opacity: current.progress,
        },
      }),
    }}
  >
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="ServiceDetail" 
      component={ServiceDetailScreen}
      options={{ title: 'Service Details' }}
    />
  </Stack.Navigator>
);

const AppStack = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: true,
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: '#9ca3af',
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeStack}
      options={{
        title: 'Home',
        tabBarLabel: 'Home',
        headerShown: false,
      }}
    />
    <Tab.Screen
      name="Services"
      component={ServicesScreen}
      options={{
        title: 'Browse Services',
        tabBarLabel: 'Services',
      }}
    />
    <Tab.Screen
      name="Bookings"
      component={BookingsScreen}
      options={{
        title: 'My Bookings',
        tabBarLabel: 'Bookings',
      }}
    />
    <Tab.Screen
      name="Messages"
      component={MessagesScreen}
      options={{
        title: 'Messages',
        tabBarLabel: 'Messages',
      }}
    />
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        title: 'My Dashboard',
        tabBarLabel: 'Dashboard',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
        tabBarLabel: 'Profile',
      }}
    />
  </Tab.Navigator>
);

export const RootNavigator = () => {
  const { token, initializeAuth } = useAuthStore();
  const [isReady, setIsReady] = React.useState(false);
  const [isSignout, setIsSignout] = React.useState(false);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        await initializeAuth();
      } catch (e) {
        console.error(e);
      } finally {
        setIsReady(true);
      }
    };

    bootstrapAsync();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default RootNavigator;
