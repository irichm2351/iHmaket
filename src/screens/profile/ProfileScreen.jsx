import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import api, { API_URL } from '../../utils/api';
import * as SecureStore from 'expo-secure-store';

const ProfileScreen = () => {
  const router = useRouter();
  const { user, logout, updateProfilePicture } = useAuthStore();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.profilePic || null);

  const pickAndUploadImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const image = result.assets[0];
        setUploadingImage(true);

        console.log('\n=== STARTING PROFILE PICTURE UPLOAD ===\n');
        console.log('Image selected:', {
          uri: image.uri,
          type: image.type,
          fileName: image.fileName,
        });

        // Step 1: Get token
        const token = await SecureStore.getItemAsync('authToken');
        console.log('Token retrieved:', token ? '✅ YES' : '❌ NO');
        
        if (!token) {
          throw new Error('No authentication token found. Please login again.');
        }

        // Step 2: Build URL
        const uploadUrl = `${API_URL}/auth/upload-profile-pic`;
        console.log('Upload URL:', uploadUrl);

        // Step 3: Create FormData
        const formData = new FormData();
        formData.append('profilePic', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || `profile-${Date.now()}.jpg`,
        });
        console.log('FormData created ✅');

        // Step 4: Make request
        console.log('\nSending request...');
        console.log('Method: POST');
        console.log('Headers:', {
          'Authorization': `Bearer ${token.substring(0, 20)}...`,
        });

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // Step 5: Check response
        console.log('\n=== RESPONSE RECEIVED ===\n');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        // Step 6: Parse response
        let responseData;
        const responseText = await response.text();
        console.log('Response text length:', responseText.length);
        
        try {
          responseData = JSON.parse(responseText);
          console.log('Response parsed ✅');
          console.log('Response data:', responseData);
        } catch (parseError) {
          console.error('Failed to parse response:', parseError.message);
          console.error('Raw response:', responseText.substring(0, 200));
          throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}`);
        }

        // Step 7: Check success
        if (!response.ok) {
          console.error('❌ Upload failed');
          console.error('Status:', response.status);
          console.error('Message:', responseData.message);
          throw new Error(responseData.message || `Upload failed with status ${response.status}`);
        }

        if (responseData.success && responseData.profilePic) {
          console.log('✅ Upload successful!');
          console.log('New profile picture URL:', responseData.profilePic);
          
          setProfilePic(responseData.profilePic);
          updateProfilePicture(responseData.profilePic);
          
          console.log('\n=== UPLOAD COMPLETE ===\n');
          Alert.alert('Success ✅', 'Profile picture updated successfully!');
        } else {
          throw new Error(responseData.message || 'Server returned success: false');
        }
      }
    } catch (error) {
      console.error('\n=== ❌ UPLOAD ERROR ===\n');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('\n');
      
      Alert.alert(
        'Upload Failed ❌', 
        error.message || 'Network error. Check your connection and try again.'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const testConnection = async () => {
    try {
      console.log('\n=== TESTING BACKEND CONNECTION ===\n');
      const testUrl = `${API_URL}/auth/test`;
      console.log('Testing URL:', testUrl);
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      console.log('✅ Connection successful!');
      console.log('Response:', data);
      
      Alert.alert(
        'Connection ✅',
        'Backend is reachable and working correctly!'
      );
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      Alert.alert(
        'Connection ❌',
        'Cannot reach backend: ' + error.message
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {profilePic ? (
              <Image
                source={{ uri: profilePic }}
                style={styles.avatarImage}
              />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={80} color="#3b82f6" />
            )}
          </View>
          <TouchableOpacity
            style={[styles.uploadPictureButton, uploadingImage && styles.uploadPictureButtonDisabled]}
            onPress={pickAndUploadImage}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons name="camera-plus" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Profile Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => router.push('/profile/edit')}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#3b82f6" />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Edit Profile</Text>
            <Text style={styles.optionDesc}>Update your information</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => router.push('/profile/change-password')}
        >
          <MaterialCommunityIcons name="lock" size={20} color="#3b82f6" />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Change Password</Text>
            <Text style={styles.optionDesc}>Update your password</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => router.push('/profile/notifications')}
        >
          <MaterialCommunityIcons name="bell" size={20} color="#3b82f6" />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Notifications</Text>
            <Text style={styles.optionDesc}>Manage your alerts</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionItem} 
          onPress={() => router.push('/profile/help-support')}
        >
          <MaterialCommunityIcons name="help-circle" size={20} color="#3b82f6" />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Help & Support</Text>
            <Text style={styles.optionDesc}>Get help</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => router.push('/profile/terms-privacy')}
        >
          <MaterialCommunityIcons name="file-document" size={20} color="#3b82f6" />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Terms & Privacy</Text>
            <Text style={styles.optionDesc}>View our policies</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#d1d5db" />
        </TouchableOpacity>
      </View>

      {/* Test Connection Button */}
      <TouchableOpacity style={styles.testButton} onPress={testConnection}>
        <MaterialCommunityIcons name="wifi-check" size={20} color="#3b82f6" />
        <Text style={styles.testButtonText}>Test Backend Connection</Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  profileHeader: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    marginBottom: 0,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  uploadPictureButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  uploadPictureButtonDisabled: {
    backgroundColor: '#93c5fd',
    opacity: 0.7,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 10,
  },
  testButton: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 10,
  },
});

export default ProfileScreen;
