import React, { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, TextInput, Image } from 'react-native';
import Constants from 'expo-constants';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '../src/store/authStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

const FONT_SCALE = 1.12;

const scaleFontStyle = (style: any): any => {
  if (!style) return style;
  if (Array.isArray(style)) return style.map(scaleFontStyle);
  if (typeof style === 'object' && style.fontSize) {
    return { ...style, fontSize: Math.round(style.fontSize * FONT_SCALE) };
  }
  return style;
};

let fontScalePatched = false;
if (!fontScalePatched) {
  const textRender = (Text as any).render;
  if (textRender) {
    (Text as any).render = function render(...args: any[]) {
      const origin = textRender.call(this, ...args);
      return React.cloneElement(origin, {
        style: scaleFontStyle(origin.props.style),
      });
    };
  }

  const textInputRender = (TextInput as any).render;
  if (textInputRender) {
    (TextInput as any).render = function render(...args: any[]) {
      const origin = textInputRender.call(this, ...args);
      return React.cloneElement(origin, {
        style: scaleFontStyle(origin.props.style),
      });
    };
  }

  fontScalePatched = true;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, initializeAuth } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  const [showSplash, setShowSplash] = useState(isExpoGo);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        await initializeAuth();
      } catch (e) {
        console.error(e);
      } finally {
        setIsReady(true);
        // Hide splash after 2 seconds only in Expo Go
        if (isExpoGo) {
          setTimeout(() => {
            setShowSplash(false);
          }, 2000);
        }
      }
    };

    bootstrapAsync();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (user && inAuthGroup) {
      // Redirect to tabs if authenticated and trying to access auth
      router.replace('/(tabs)');
    } else if (!user && !inAuthGroup) {
      // Redirect to auth if not authenticated and trying to access protected routes
      router.replace('/(auth)/login');
    }
  }, [user, segments, isReady]);

  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1e40af', justifyContent: 'center', alignItems: 'center' }}>
        <Image 
          source={require('../assets/images/iHmaket.jpg')} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
