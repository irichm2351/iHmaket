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

        try {
          console.log('=== PROFILE PICTURE UPLOAD START ===');
          console.log('Selected image:', {
            uri: image.uri,
            type: image.type,
            fileName: image.fileName,
          });

          const token = await SecureStore.getItemAsync('authToken');
          if (!token) {
            throw new Error('No authentication token found. Please login again.');
          }

          const uploadUrl = `${API_URL}/auth/upload-profile-pic`;
          
          console.log('Upload URL:', uploadUrl);
          console.log('Token length:', token.length);

          // Create FormData for upload
          const formData = new FormData();
          formData.append('profilePic', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.fileName || `profile-${Date.now()}.jpg`,
          });

          console.log('Uploading file via fetch...');

          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          console.log('Response status:', response.status);
          console.log('Response ok:', response.ok);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Server error:', errorData);
            throw new Error(errorData.message || `Upload failed with status ${response.status}`);
          }

          const uploadData = await response.json();
          console.log('Upload response:', uploadData);

          if (uploadData.success && uploadData.profilePic) {
            console.log('Upload successful!');
            setProfilePic(uploadData.profilePic);
            updateProfilePicture(uploadData.profilePic);
            Alert.alert('Success', 'Profile picture updated successfully');
            console.log('=== PROFILE PICTURE UPLOAD SUCCESS ===');
          } else {
            throw new Error(uploadData.message || 'Server response invalid');
          }
        } catch (error) {
          console.error('=== UPLOAD ERROR ===');
          console.error('Message:', error.message);
          console.error('Type:', error.constructor.name);
          
          // Determine appropriate error message
          let errorMessage = error.message;
          if (error.message.includes('Network')) {
            errorMessage = 'Network error - check your internet connection and server is online';
          }
          
          Alert.alert('Upload Failed', errorMessage);
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('ImagePicker error:', error);
      Alert.alert('Error', 'Failed to pick image');
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    await logout();
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
