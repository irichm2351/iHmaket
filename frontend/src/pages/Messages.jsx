import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { FiSearch, FiSend, FiUser } from 'react-icons/fi';
import { messageAPI, userAPI } from '../utils/api';
import useAuthStore from '../store/authStore';
import useMessageStore from '../store/messageStore';
import socket, { connectSocket } from '../utils/socket';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { setConversations: setStoreConversations } = useMessageStore();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [typing, setTyping] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const conversationsRef = useRef([]);
  const selectedConversationRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const notificationSoundRef = useRef(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Create notification sound
    notificationSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWe77eWeTRAMUKfj8LZjGwU4kte0');
  }, []);



  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    socketRef.current = socket;
    connectSocket(user._id);

    const handleIncomingMessage = (data) => {
      const senderId = typeof data.senderId === 'string' ? data.senderId : data.senderId?._id;
      const receiverId = typeof data.receiverId === 'string' ? data.receiverId : data.receiverId?._id;
      const otherUserId = senderId === user._id ? receiverId : senderId;
      const otherUser = senderId === user._id ? data.receiverId : data.senderId;
      
      // Check if this is a message received (not sent by current user)
      const isReceivedMessage = senderId !== user._id;
      const isCurrentConversation = selectedConversationRef.current?.user?._id === otherUserId;

      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.user?._id === otherUserId);
        const updated = [...prev];

        if (existingIndex >= 0) {
          const existing = updated[existingIndex];
          updated[existingIndex] = {
            ...existing,
            lastMessage: data,
            unreadCount:
              selectedConversationRef.current?.user?._id === otherUserId
                ? 0
                : (existing.unreadCount || 0) + 1
          };
        } else if (otherUserId && otherUserId !== user._id) {
          // Don't create new conversation for self-messages
          updated.unshift({
            user: typeof otherUser === 'object' ? otherUser : { _id: otherUserId },
            lastMessage: data,
            unreadCount: selectedConversationRef.current?.user?._id === otherUserId ? 0 : 1
          });
        }

        return updated;
      });

      if (selectedConversationRef.current?.user?._id === otherUserId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === data._id);
          return exists ? prev : [...prev, data];
        });
      }

      // Show notification and play sound for received messages
      if (isReceivedMessage) {
        // Play notification sound
        if (notificationSoundRef.current) {
          notificationSoundRef.current.play().catch(err => console.log('Audio play failed:', err));
        }

        // Show browser notification if not viewing the conversation
        if (!isCurrentConversation && 'Notification' in window && Notification.permission === 'granted') {
          const senderName = typeof otherUser === 'object' ? otherUser.name : 'Someone';
          const notification = new Notification('New Message', {
            body: `${senderName}: ${data.text}`,
            icon: typeof otherUser === 'object' ? otherUser.profilePic : '/favicon.ico',
            badge: '/favicon.ico',
            tag: otherUserId,
            requireInteraction: false
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          // Auto close after 5 seconds
          setTimeout(() => notification.close(), 5000);
        }
      }
    };

    const handleTyping = (data) => {
      if (data?.senderId === selectedConversationRef.current?.user?._id) {
        setTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(false), 1500);
      }
    };

    // Remove any existing listeners to prevent duplicates
    socketRef.current.off('receive_message');
    socketRef.current.off('user_typing');
    
    socketRef.current.on('receive_message', handleIncomingMessage);
    socketRef.current.on('user_typing', handleTyping);
    
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current?.off('receive_message');
      socketRef.current?.off('user_typing');
      // Don't disconnect - keep connection alive
      // socketRef.current?.disconnect();
      // socketRef.current = null;
    };
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchConversations();
  }, [isAuthenticated]);

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (!userId || !isAuthenticated) return;

    const openConversation = async () => {
      try {
        const existing = conversationsRef.current.find((c) => c.user?._id === userId);
        if (existing) {
          setSelectedConversation(existing);
          return;
        }

        const response = await userAPI.getUserById(userId);
        const newConversation = {
          user: response.data.user,
          lastMessage: null,
          unreadCount: 0
        };

        setConversations((prev) => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
      } catch (error) {
        toast.error('Failed to open conversation');
      }
    };

    openConversation();
  }, [searchParams, isAuthenticated, user?._id]);

  useEffect(() => {
    if (!selectedConversation?.user?._id) return;
    fetchMessages(selectedConversation.user._id);
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Sync local conversations with message store
  useEffect(() => {
    if (conversations.length > 0) {
      setStoreConversations(conversations);
    }
  }, [conversations, setStoreConversations]);

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await messageAPI.getConversations();
      const list = response.data.conversations || [];
      setConversations(list);
      setStoreConversations(list); // Sync with message store for unread tracking
      if (!selectedConversation && list.length > 0) {
        setSelectedConversation(list[0]);
      }
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (userId) => {
    setLoadingMessages(true);
    try {
      const response = await messageAPI.getMessages(userId, { limit: 100 });
      setMessages(response.data.messages || []);
      setConversations((prev) =>
        prev.map((c) =>
          c.user?._id === userId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation?.user?._id) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);
    
    try {
      const response = await messageAPI.sendMessage({
        receiverId: selectedConversation.user._id,
        text: textToSend
      });

      const newMessage = response.data.message;
      
      // Only add if not already in messages (avoid duplicate from socket)
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === newMessage._id);
        return exists ? prev : [...prev, newMessage];
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.user?._id === selectedConversation.user._id
            ? { ...c, lastMessage: newMessage, unreadCount: 0 }
            : c
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (!socketRef.current || !selectedConversation?.user?._id) return;
    if (selectedConversation.user._id === user?._id) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 800) return;
    lastTypingSentRef.current = now;
    socketRef.current.emit('typing', {
      receiverId: selectedConversation.user._id,
      senderId: user._id
    });
  };

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    return conversations.filter((c) =>
      c.user?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Messages</h2>
          <p className="text-gray-600">Please login to view your messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations */}
        <div className="lg:col-span-1 card p-4 h-[75vh] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Messages</h2>
          </div>

          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {loadingConversations ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader size="md" />
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.user?._id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedConversation?.user?._id === conversation.user?._id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={conversation.user?.profilePic || 'https://via.placeholder.com/40'}
                      alt={conversation.user?.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">
                          {conversation.user?.name}
                        </p>
                        {conversation.lastMessage?.createdAt && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.text || 'No messages yet'}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="min-w-[24px] h-6 px-2 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              No conversations yet
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="lg:col-span-2 card p-4 h-[75vh] flex flex-col">
          {selectedConversation ? (
            <>
              <div className="border-b pb-3 mb-4 flex items-center gap-3">
                <img
                  src={selectedConversation.user?.profilePic || 'https://via.placeholder.com/40'}
                  alt={selectedConversation.user?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">
                    {selectedConversation.user?.name}
                  </p>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>

              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader size="md" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {messages.map((message) => {
                    const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
                    const isMine = senderId === user?._id;
                    return (
                      <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isMine ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                          <p>{message.text}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-100' : 'text-gray-500'}`}>
                            {format(new Date(message.createdAt), 'p')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {typing && (
                    <div className="text-xs text-gray-500">Typing...</div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      handleTyping();
                    }}
                    disabled={sending}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <FiSend />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <FiSend size={32} className="mb-3" />
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
