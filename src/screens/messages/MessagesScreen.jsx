import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

const MessagesScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { resetMessageCount } = useNotificationStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const scrollViewRef = useRef(null);

  const providerId = params?.providerId;
  const providerName = params?.providerName;
  const providerProfilePic = params?.providerProfilePic;
  const fromPreviousScreen = params?.fromPreviousScreen;

  useEffect(() => {
    if (providerId && providerName && fromPreviousScreen) {
      // Directly open conversation with provider if passed from bookings/service detail
      setShowConversationList(false);
      setSelectedConversation({
        _id: providerId,
        providerId: providerId,
        name: providerName,
        profilePic: providerProfilePic
      });
      fetchMessages(providerId);
      // IMPORTANT: Don't clear params here - let the tab wrapper handle it
    } else if (!providerId && !providerName) {
      // Only show conversation list if no params at all (clicking Messages tab after params cleared)
      setShowConversationList(true);
      setMessages([]);
      setSelectedConversation(null);
      fetchConversations();
    }
  }, [providerId, providerName, providerProfilePic, fromPreviousScreen]);

  useFocusEffect(
    React.useCallback(() => {
      // Refresh conversations when screen gains focus without params
      if (!providerId && !providerName && !fromPreviousScreen) {
        setShowConversationList(true);
        setMessages([]);
        setSelectedConversation(null);
        fetchConversations();
        // Reset message count when viewing messages
        resetMessageCount();
      }
    }, [providerId, providerName, fromPreviousScreen, resetMessageCount])
  );

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      const conversationsData =
        response.data?.conversations ||
        response.data?.data?.conversations ||
        response.data?.data ||
        [];
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const resolveConversationUser = (conversation) => {
    if (conversation?.user) {
      return conversation.user;
    }

    const lastMessage = conversation?.lastMessage;
    if (!lastMessage) {
      return null;
    }

    const sender = lastMessage.senderId;
    const receiver = lastMessage.receiverId;
    if (sender?._id && receiver?._id && user?._id) {
      return sender._id === user._id ? receiver : sender;
    }

    return sender || receiver || null;
  };

  const fetchMessages = async (receiverId) => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/${receiverId}`);
      const messagesData = response.data.messages || [];
      
      console.log('=== FETCHED MESSAGES ===');
      console.log('Number of messages:', messagesData.length);
      
      if (messagesData.length > 0) {
        console.log('Sample message structure:');
        const sampleMsg = messagesData[0];
        console.log('- _id:', sampleMsg._id, '(type:', typeof sampleMsg._id, ')');
        console.log('- text:', sampleMsg.text);
        console.log('- senderId:', sampleMsg.senderId);
        console.log('- Full first message:', JSON.stringify(sampleMsg, null, 2));
        
        // Validate all message IDs
        const invalidMessages = messagesData.filter(m => !m._id);
        if (invalidMessages.length > 0) {
          console.warn('WARNING: Found messages without _id:', invalidMessages.length);
        }
      }
      
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      return;
    }

    if (!selectedConversation?.providerId && !selectedConversation?._id) {
      Alert.alert('Error', 'No provider selected');
      return;
    }

    try {
      setSending(true);
      const receiverId = selectedConversation.providerId || selectedConversation._id;
      
      const response = await api.post('/messages', {
        receiverId: receiverId,
        text: messageText.trim(),
      });

      if (response.data.success) {
        const newMessage = response.data.message;
        
        // Ensure the message has an _id
        if (!newMessage._id) {
          console.error('Warning: New message missing _id:', newMessage);
        }
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setMessageText('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    const otherUser = resolveConversationUser(conversation) || conversation;
    setSelectedConversation({
      _id: otherUser?._id,
      providerId: otherUser?._id,
      name: otherUser?.name || 'User',
      profilePic: otherUser?.profilePic
    });
    setShowConversationList(false);
    fetchMessages(otherUser?._id || conversation._id || conversation.providerId);
  };

  const handleDeleteMessage = (messageId) => {
    if (!messageId) {
      return;
    }

    Alert.alert(
      'Delete message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/messages/${messageId}`);
              setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
  };

  const handleEditMessage = (message) => {
    console.log('=== EDIT MESSAGE CLICKED ===');
    console.log('Full message object:', message);
    console.log('Message ID:', message._id);
    console.log('Message ID type:', typeof message._id);
    console.log('Message text:', message.text);
    console.log('Message senderId:', message.senderId);
    
    // Check if message has _id
    if (!message || !message._id) {
      console.error('ERROR: Message or message._id is undefined');
      Alert.alert('Error', 'Cannot edit message: Message ID is missing.');
      return;
    }
    
    // Ensure _id is a string
    const messageId = String(message._id);
    console.log('Converted message ID:', messageId);
    console.log('Message ID length:', messageId.length);
    
    // Validate MongoDB ObjectId format (24 hex characters)
    if (messageId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(messageId)) {
      console.error('ERROR: Invalid message ID format:', messageId);
      Alert.alert('Error', 'Cannot edit message: Invalid message ID format.');
      return;
    }
    
    setEditingMessageId(messageId);
    setEditText(message.text || '');
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      Alert.alert('Error', 'Message text cannot be empty');
      return;
    }
    
    if (!editingMessageId) {
      Alert.alert('Error', 'Message ID is missing');
      return;
    }

    try {
      console.log('=== SAVING EDIT ===');
      console.log('Editing message ID:', editingMessageId);
      console.log('New text:', editText.trim());
      console.log('API URL:', `${process.env.EXPO_PUBLIC_API_URL || 'https://ihmaket-backend.onrender.com/api'}/messages/${editingMessageId}`);

      const response = await api.put(`/messages/${editingMessageId}`, {
        text: editText.trim()
      });

      console.log('=== EDIT RESPONSE ===');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.success) {
        const updatedMessage = response.data.message || response.data.data;
        
        console.log('Message updated successfully');
        
        // Update the message in the list
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg._id === editingMessageId || String(msg._id) === String(editingMessageId)) {
              return {
                ...msg,
                text: editText.trim(),
                isEdited: true,
                updatedAt: updatedMessage?.updatedAt || new Date().toISOString()
              };
            }
            return msg;
          })
        );
        
        setEditingMessageId(null);
        setEditText('');
      } else {
        const errorMsg = response.data?.message || 'Failed to edit message';
        console.error('Edit failed:', errorMsg);
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      console.error('=== EDIT ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to edit message';
      
      if (error.response?.status === 404) {
        errorMessage = 'Message not found in database. It may have been deleted.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You are not authorized to edit this message';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid request';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const handleMessagePress = (message) => {
    const isMyMessage = message.senderId?._id === user?._id || message.senderId === user?._id;
    if (!isMyMessage) return;

    Alert.alert(
      'Message Options',
      'What would you like to do?',
      [
        {
          text: 'Edit',
          onPress: () => handleEditMessage(message)
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteMessage(message._id)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleDeleteConversation = async (otherUserId) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? All messages will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/messages/conversation/${otherUserId}`);
              if (response.data && response.data.success) {
                setConversations((prev) => 
                  prev.filter((conv) => {
                    const user = resolveConversationUser(conv);
                    return user?._id !== otherUserId;
                  })
                );
              } else {
                Alert.alert('Error', response.data?.message || 'Failed to delete conversation');
              }
            } catch (error) {
              console.error('Error deleting conversation:', error);
              const errorMessage = error.response?.data?.message || error.message || 'Failed to delete conversation';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const handleBackToConversations = () => {
    if (fromPreviousScreen && params?.scrollToBookingId) {
      // Navigate back to bookings screen with scroll parameter
      router.push({
        pathname: '/(tabs)/bookings',
        params: {
          scrollToBookingId: params.scrollToBookingId,
        },
      });
    } else if (fromPreviousScreen) {
      // Try to go back for other screens (serviceDetail, providerProfile)
      router.back();
    } else {
      // Stay in messages and show conversation list
      setShowConversationList(true);
      setMessages([]);
      setSelectedConversation(null);
    }
  };

  const handleCallUser = async () => {
    if (!selectedConversation?.phone) {
      // Fetch the user's phone number if not available
      try {
        const userId = selectedConversation?.providerId || selectedConversation?._id;
        if (!userId) {
          Alert.alert('Error', 'User information not available');
          return;
        }

        const response = await api.get(`/users/${userId}`);
        const userPhone = response.data.user?.phone || response.data.phone;

        if (!userPhone) {
          Alert.alert('No Phone Number', 'This user has not provided a phone number.');
          return;
        }

        // Open the phone dialer
        await Linking.openURL(`tel:${userPhone}`);
      } catch (error) {
        Alert.alert('Error', 'Failed to retrieve user phone number');
      }
    } else {
      // Phone number is already available
      try {
        await Linking.openURL(`tel:${selectedConversation.phone}`);
      } catch (error) {
        Alert.alert('Error', 'Unable to make call at this time');
      }
    }
  };

  const renderRightActions = (progress, dragX, otherUserId) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.swipeActionContainer, { transform: [{ scale }] }]}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteConversation(otherUserId)}
        >
          <MaterialCommunityIcons name="delete" size={24} color="white" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Conversation List View
  if (showConversationList) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Top White Header Bar */}
        <View style={styles.topHeaderBar}>
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversations..."
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        </View>

        {/* Conversations */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.centerContent}>
            <MaterialCommunityIcons name="message-text-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start chatting with service providers
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item, index) => {
              const otherUser = resolveConversationUser(item);
              return otherUser?._id || item._id || String(index);
            }}
            renderItem={({ item }) => {
              const otherUser = resolveConversationUser(item);
              const handleProfilePress = () => {
                router.push(`/provider/${otherUser?._id}`);
              };
              return (
                <Swipeable
                  renderRightActions={(progress, dragX) =>
                    renderRightActions(progress, dragX, otherUser?._id)
                  }
                  overshootRight={false}
                >
                  <TouchableOpacity
                    style={styles.conversationItem}
                    onPress={() => handleSelectConversation(item)}
                  >
                    <TouchableOpacity
                      style={styles.avatar}
                      onPress={handleProfilePress}
                      activeOpacity={0.7}
                    >
                      {otherUser?.profilePic ? (
                        <Image
                          source={{ uri: otherUser.profilePic }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name="account-circle"
                          size={50}
                          color="#3b82f6"
                        />
                      )}
                    </TouchableOpacity>
                    <View style={styles.conversationInfo}>
                      <Text style={styles.conversationName}>{otherUser?.name || 'User'}</Text>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.lastMessage?.text || 'No messages yet'}
                      </Text>
                    </View>
                    <View style={styles.conversationMeta}>
                      <Text style={styles.timestamp}>
                        {item.lastMessage?.createdAt
                          ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </Text>
                      {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{item.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              );
            }}
          />
        )}
      </View>
      </GestureHandlerRootView>
    );
  }

  // Chat View
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
    <View style={styles.container}>
      {/* Top White Header Bar with content at bottom */}
      <View style={styles.topHeaderBar}>
        <View style={styles.chatContent}>
          <TouchableOpacity onPress={handleBackToConversations} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#3b82f6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatHeaderProfile}
            onPress={() =>
              router.push(`/provider/${selectedConversation?.providerId || selectedConversation?._id}`)
            }
          >
            {selectedConversation?.profilePic ? (
              <Image
                source={{ uri: selectedConversation.profilePic }}
                style={styles.chatHeaderAvatar}
              />
            ) : (
              <View style={styles.chatHeaderAvatarPlaceholder}>
                <MaterialCommunityIcons name="account-circle" size={40} color="#3b82f6" />
              </View>
            )}
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderName}>{selectedConversation?.name}</Text>
              <Text style={styles.chatHeaderStatus}>Active now</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.phoneButton} onPress={handleCallUser} activeOpacity={0.7}>
            <MaterialCommunityIcons name="phone" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Start the conversation!</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
        >
          {messages.map((msg, index) => {
            const isMyMessage = msg.senderId?._id === user?._id || msg.senderId === user?._id;
            const isEditing = editingMessageId === msg._id;
            
            // Ensure message has required fields before rendering
            if (!msg._id) {
              console.warn('Message missing _id at index', index, msg);
              return null;
            }
            
            if (isEditing) {
              return (
                <View key={msg._id} style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    autoFocus
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity style={styles.cancelEditButton} onPress={handleCancelEdit}>
                      <Text style={styles.cancelEditText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveEditButton} onPress={handleSaveEdit}>
                      <Text style={styles.saveEditText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
            
            return (
              <TouchableOpacity
                key={msg._id}
                activeOpacity={isMyMessage ? 0.7 : 1}
                onLongPress={isMyMessage ? () => handleMessagePress(msg) : undefined}
                style={[
                  styles.messageBubble,
                  isMyMessage ? styles.userMessage : styles.providerMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isMyMessage ? styles.userMessageText : styles.providerMessageText,
                  ]}
                >
                  {msg.text}
                  {msg.isEdited && <Text style={styles.editedLabel}> (edited)</Text>}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    isMyMessage ? styles.userMessageTime : styles.providerMessageTime,
                  ]}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          value={messageText}
          onChangeText={setMessageText}
          editable={!sending}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={sending || !messageText.trim()}
        >
          <MaterialCommunityIcons
            name="send"
            size={20}
            color={sending || !messageText.trim() ? '#d1d5db' : '#3b82f6'}
          />
        </TouchableOpacity>
      </View>
    </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchSection: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 13,
    color: '#9ca3af',
  },
  conversationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  avatar: {
    marginRight: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: '#6b7280',
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#3b82f6',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  topHeaderBar: {
    height: 100,
    backgroundColor: 'white',
    justifyContent: 'flex-end',
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  chatHeaderProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneButton: {
    padding: 8,
    marginLeft: 10,
  },
  chatHeaderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  chatHeaderAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  chatHeaderStatus: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageBubble: {
    marginVertical: 5,
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
  },
  providerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 14,
    marginBottom: 2,
  },
  userMessageText: {
    color: 'white',
  },
  providerMessageText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 11,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  providerMessageTime: {
    color: '#6b7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  editContainer: {
    marginVertical: 5,
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  editInput: {
    fontSize: 14,
    color: '#1f2937',
    minHeight: 40,
    maxHeight: 100,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  cancelEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  cancelEditText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  saveEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  saveEditText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
  },
  editedLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  swipeActionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    paddingHorizontal: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default MessagesScreen;
