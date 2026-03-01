import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

const ProfileScreen = () => {
  const router = useRouter();
  const { user, logout, updateProfilePicture } = useAuthStore();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.profilePic || null);

  const pickAndUploadImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        console.log('Image selection cancelled');
        return;
      }

      const image = result.assets[0];
      const originalUri = image.uri;
      let uploadUri = originalUri;

      // Android can return content:// URIs which break uploads. Copy to cache.
      if (originalUri.startsWith('content://')) {
        const extension = (originalUri.split('.').pop() || 'jpg').split('?')[0];
        const cachePath = `${FileSystem.cacheDirectory}profile-${Date.now()}.${extension}`;
        await FileSystem.copyAsync({ from: originalUri, to: cachePath });
        uploadUri = cachePath;
      }
      setUploadingImage(true);

      console.log('=== PROFILE PICTURE UPLOAD START ===');
      console.log('Selected image:', {
        uri: originalUri,
        uploadUri,
        type: image.type,
        mimeType: image.mimeType,
        width: image.width,
        height: image.height,
      });

      // Create FormData
      const formData = new FormData();
      const mimeType = image.mimeType || (image.type && image.type !== 'image' ? image.type : null) || 'image/jpeg';
      const filename = image.fileName || `profile-${Date.now()}.jpg`;

      formData.append('profilePic', {
        uri: uploadUri,
        type: mimeType,
        name: filename,
      });

      console.log('Uploading via axios...');

      // Use axios instance for upload with explicit multipart header (matching web version)
      const response = await api.post('/auth/upload-profile-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60 second timeout
      });

      console.log('=== UPLOAD RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Data:', response.data);

      if (response.data.success && response.data.profilePic) {
        console.log('✅ Upload Successful!');
        console.log('Picture URL:', response.data.profilePic);
        
        // Update local state and auth store
        setProfilePic(response.data.profilePic);
        updateProfilePicture(response.data.profilePic);
        
        Alert.alert('Success', 'Profile picture updated successfully!');
        console.log('=== PROFILE PICTURE UPLOAD SUCCESS ===');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      let errorMessage = error.message;
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Upload timeout - server took too long to respond';
      } else if (error.message.includes('Network') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error - check your internet connection';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed - please login again';
      } else if (error.response?.status === 413) {
        errorMessage = 'File is too large';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
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

        {user?.role === 'provider' && (
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => router.push('/subscription')}
          >
            <MaterialCommunityIcons name="credit-card" size={20} color="#3b82f6" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Subscription</Text>
              <Text style={styles.optionDesc}>Manage your plan</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#d1d5db" />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.optionItem} 
          onPress={() => router.push('/profile/help-support')}
        >
          <MaterialCommunityIcons name="frequently-asked-questions" size={20} color="#3b82f6" />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>FAQs</Text>
            <Text style={styles.optionDesc}>Learn about the app</Text>
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
});

export default ProfileScreen;
