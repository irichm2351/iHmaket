import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoginLoading, setSocialLoginLoading] = useState(false);
  const { login, googleLogin, isLoading } = useAuthStore();

  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  // Set up automatic redirect URI for Expo proxy
  const redirectUrl = AuthSession.makeRedirectUri({
    useProxy: true,
    projectNameForProxy: '@irichmoses/ihmaket',
  });

  // Set up OAuth request
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId || '',
      redirectUri: redirectUrl,
      scopes: ['profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      prompt: AuthSession.Prompt.SelectAccount,
      usePKCE: false,
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    }
  );

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success' && response.params?.access_token) {
      handleOAuthSuccess(response.params.access_token);
    }
  }, [response]);

  const handleOAuthSuccess = async (accessToken) => {
    const loginResult = await googleLogin(accessToken);
    if (!loginResult.success) {
      Alert.alert('Login Failed', loginResult.error);
    }
    setSocialLoginLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoginLoading(true);
    try {
      if (!request) {
        Alert.alert('Error', 'Google OAuth not ready yet, please try again');
        setSocialLoginLoading(false);
        return;
      }

      const result = await promptAsync();
      
      if (result.type !== 'success') {
        setSocialLoginLoading(false);
      }
      // OAuth response is handled by useEffect above
    } catch (error) {
      Alert.alert('Error', 'Google login failed: ' + error.message);
      setSocialLoginLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Info', 'Apple Sign-In is only available on iOS');
      return;
    }

    setSocialLoginLoading(true);
    try {
      const appleClientId = process.env.EXPO_PUBLIC_APPLE_CLIENT_ID;
      if (!appleClientId) {
        Alert.alert('Error', 'Apple Client ID not configured');
        setSocialLoginLoading(false);
        return;
      }

      Alert.alert(
        'Apple Sign-In',
        'Unfortunately, Apple Sign-In requires native implementation. For now, please use email/password or Google login.',
        [{ text: 'OK', onPress: () => setSocialLoginLoading(false) }]
      );
    } catch (error) {
      Alert.alert('Error', 'Apple login error: ' + error.message);
      setSocialLoginLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      {/* Logo/Header */}
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <View style={styles.mkpLogo}>
            <Text style={styles.mkpText}>iH</Text>
          </View>
          <Text style={styles.servoText}>maket</Text>
        </View>
        <Text style={styles.tagline}>Find trusted professionals</Text>
      </View>

      {/* Login Form */}
      <View style={styles.formSection}>
        <Text style={styles.formTitle}>Welcome Back</Text>
        <Text style={styles.formSubtitle}>Sign in to your account</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="email" size={20} color="#6b7280" />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="lock" size={20} color="#6b7280" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            editable={!isLoading}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye' : 'eye-off'}
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* ===== SOCIAL LOGIN - DISABLED FOR DEVELOPMENT =====
            Uncomment this section when deploying to production with a real domain
            Google OAuth requires https:// domain (not IP addresses or exp:// URLs)
            
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleLogin}
            disabled={socialLoginLoading || isLoading}
          >
            {socialLoginLoading ? (
              <ActivityIndicator color="#1f2937" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={20} color="#1f2937" />
                <Text style={styles.socialButtonText}>Google</Text>
              </>
            )}
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleAppleLogin}
              disabled={socialLoginLoading || isLoading}
            >
              {socialLoginLoading ? (
                <ActivityIndicator color="#1f2937" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="apple" size={20} color="#1f2937" />
                  <Text style={styles.socialButtonText}>Apple</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        ===== END SOCIAL LOGIN ===== */}
      </View>

      {/* Sign Up Link */}
      <View style={styles.signupSection}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.signupLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    paddingBottom: 60,
  },
  headerSection: {
    alignItems: 'center',
    paddingBottom: 80,
    width: '100%',
    maxWidth: 360,
    marginTop: -18,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mkpLogo: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  mkpText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
  },
  servoText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tagline: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  formSection: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 22,
    marginTop: 2,
    width: '100%',
  },
  forgotPasswordText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 13,
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 6,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 12,
  },
  signupText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signupLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});

export default LoginScreen;
