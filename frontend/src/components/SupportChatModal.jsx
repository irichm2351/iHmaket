import { useEffect, useRef, useState } from 'react';
import { FiX, FiSend } from 'react-icons/fi';
import { messageAPI } from '../utils/api';
import socket from '../utils/socket';
import toast from 'react-hot-toast';
import Loader from './Loader';

const SupportChatModal = ({ admin, onClose, userId }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    socketRef.current = socket;

    const handleReceiveMessage = (data) => {
      const senderId = typeof data.senderId === 'string' ? data.senderId : data.senderId?._id;
      if (senderId === admin._id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === data._id);
          return exists ? prev : [...prev, data];
        });
      }
    };

    socketRef.current.on('receive_message', handleReceiveMessage);
    return () => {
      socketRef.current?.off('receive_message', handleReceiveMessage);
    };
  }, [admin._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await messageAPI.getMessages(admin._id, { limit: 50 });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const response = await messageAPI.sendMessage({
        receiverId: admin._id,
        text: textToSend
      });

      const newMessage = response.data.message;
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === newMessage._id);
        return exists ? prev : [...prev, newMessage];
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-20" onClick={onClose}></div>

      {/* Chat Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full md:w-64 h-80 md:h-80 flex flex-col z-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-t-lg flex items-center justify-between">
          <p className="font-semibold">Support Team</p>
          <button
            onClick={onClose}
            className="p-1 hover:bg-primary-600 rounded-full transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader size="md" />
            </div>
          ) : messages.length > 0 ? (
            messages.map((message) => {
              const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
              const isMine = senderId === userId;
              return (
                <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      isMine
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-primary-100' : 'text-gray-500'}`}>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              <p>Start a conversation with our support team</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-white rounded-b-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !messageText.trim()}
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              <FiSend size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupportChatModal;
