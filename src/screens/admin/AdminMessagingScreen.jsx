import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const AdminMessagingScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const recipientOptions = [
    { value: 'all', label: 'All Users', icon: 'account-group' },
    { value: 'providers', label: 'All Providers', icon: 'briefcase' },
    { value: 'customers', label: 'All Customers', icon: 'shopping-outline' },
    { value: 'individual', label: 'Individual Users', icon: 'account-multiple' },
  ];

  useEffect(() => {
    if (recipientType === 'individual') {
      fetchUsers();
    }
  }, [recipientType]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get('/admin/users?limit=100');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    if (recipientType === 'individual' && selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user');
      return;
    }

    Alert.alert(
      'Confirm Send',
      `Send this message to ${
        recipientType === 'all'
          ? 'all users'
          : recipientType === 'providers'
          ? 'all providers'
          : recipientType === 'customers'
          ? 'all customers'
          : `${selectedUsers.length} selected user(s)`
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setSending(true);
              const payload = {
                text: messageText.trim(),
                recipientType,
              };

              if (recipientType === 'individual') {
                payload.recipientIds = selectedUsers.map(u => u._id);
              }

              const response = await api.post('/messages/bulk/send-all', payload);

              Alert.alert(
                'Success',
                `Message sent to ${response.data.messagesSent} user(s)`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setMessageText('');
                      setSelectedUsers([]);
                      setRecipientType('all');
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to send message');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u._id === user._id);
      if (exists) {
        return prev.filter((u) => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Message to Users</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
        {/* Recipient Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send To</Text>
          {recipientOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.recipientOption,
                recipientType === option.value && styles.recipientOptionActive,
              ]}
              onPress={() => {
                setRecipientType(option.value);
                if (option.value !== 'individual') {
                  setSelectedUsers([]);
                }
              }}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={24}
                color={recipientType === option.value ? '#3b82f6' : '#6b7280'}
              />
              <Text
                style={[
                  styles.recipientOptionText,
                  recipientType === option.value && styles.recipientOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {recipientType === option.value && (
                <MaterialCommunityIcons name="check-circle" size={20} color="#3b82f6" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* User Selection for Individual */}
        {recipientType === 'individual' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Select Users ({selectedUsers.length} selected)
            </Text>
            <TouchableOpacity
              style={styles.selectUsersButton}
              onPress={() => setShowUserPicker(true)}
            >
              <MaterialCommunityIcons name="account-search" size={20} color="#3b82f6" />
              <Text style={styles.selectUsersButtonText}>Choose Users</Text>
            </TouchableOpacity>

            {selectedUsers.length > 0 && (
              <View style={styles.selectedUsersContainer}>
                {selectedUsers.map((user) => (
                  <View key={user._id} style={styles.selectedUserChip}>
                    <Text style={styles.selectedUserName}>{user.name}</Text>
                    <TouchableOpacity onPress={() => toggleUserSelection(user)}>
                      <MaterialCommunityIcons name="close-circle" size={18} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Message Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message here..."
            placeholderTextColor="#9ca3af"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            keyboardAppearance="default"
          />
          <Text style={styles.characterCount}>{messageText.length} characters</Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, (sending || !messageText.trim()) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={sending || !messageText.trim()}
        >
          {sending ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="white" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* User Picker Modal */}
      <Modal visible={showUserPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Users</Text>
              <TouchableOpacity onPress={() => setShowUserPicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Users List */}
            {loadingUsers ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
                  const isSelected = selectedUsers.find((u) => u._id === item._id);
                  return (
                    <TouchableOpacity
                      style={[styles.userItem, isSelected && styles.userItemSelected]}
                      onPress={() => toggleUserSelection(item)}
                    >
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                      </View>
                      {isSelected && (
                        <MaterialCommunityIcons name="check-circle" size={24} color="#3b82f6" />
                      )}
                    </TouchableOpacity>
                  );
                }}
                style={styles.usersList}
              />
            )}

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowUserPicker(false)}
            >
              <Text style={styles.doneButtonText}>Done ({selectedUsers.length} selected)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#3b82f6',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  recipientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  recipientOptionActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  recipientOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 12,
    flex: 1,
  },
  recipientOptionTextActive: {
    color: '#1f2937',
  },
  selectUsersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  selectUsersButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 8,
  },
  selectedUsersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  selectedUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369a1',
  },
  messageInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'right',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 10,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  centerContent: {
    padding: 40,
    alignItems: 'center',
  },
  usersList: {
    maxHeight: 400,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  userItemSelected: {
    backgroundColor: '#eff6ff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  doneButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
});

export default AdminMessagingScreen;
