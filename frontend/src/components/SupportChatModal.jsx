import { useEffect, useRef, useState } from 'react';
import { FiX, FiSend } from 'react-icons/fi';
import { messageAPI, supportAPI } from '../utils/api';
import socket from '../utils/socket';
import toast from 'react-hot-toast';

const SupportChatModal = ({ onClose, userId }) => {
  const [messages, setMessages] = useState(() => ([
    {
      _id: 'system-1',
      text: 'How may I help you?',
      system: true,
      createdAt: new Date()
    }
  ]));
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [assignedAdmin, setAssignedAdmin] = useState(null);
  const [ticketId, setTicketId] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Create support ticket when modal opens
  useEffect(() => {
    const initializeSupportTicket = async () => {
      try {
        console.log('[Support Chat] Creating support ticket...');
        const response = await supportAPI.createSupportTicket();
        console.log('[Support Chat] Ticket response:', response.data);
        
        if (response.data?.ticket?._id) {
          setTicketId(response.data.ticket._id);
          console.log('[Support Chat] Ticket created:', response.data.ticket._id);
          
          if (response.data.alreadyExists) {
            console.log('[Support Chat] Existing ticket found');
          } else {
            console.log('[Support Chat] New ticket created, admins notified');
          }
        }
      } catch (error) {
        console.error('[Support Chat] Failed to create support ticket:', error);
        console.error('[Support Chat] Error details:', error.response?.data);
        // Don't show error to user, they can still send messages
      }
    };

    initializeSupportTicket();
  }, []);

  useEffect(() => {
    socketRef.current = socket;

    const handleSupportAssigned = (data) => {
      if (!data?.userId || data.userId.toString() !== userId?.toString()) {
        return;
      }

      setAssignedAdmin(data.admin);
      if (data.ticketId) {
        setTicketId(data.ticketId);
      }

      setMessages((prev) => [
        ...prev,
        {
          _id: `system-${Date.now()}`,
          text: `Support Agent: ${data.admin?.name} joined the chat`,
          system: true,
          createdAt: new Date()
        }
      ]);

      setIsMinimized(true);
    };

    socketRef.current.on('support_assigned', handleSupportAssigned);
    return () => {
      socketRef.current?.off('support_assigned', handleSupportAssigned);
    };
  }, [userId]);

  useEffect(() => {
    if (!assignedAdmin?._id) return;
    socketRef.current = socket;

    const handleReceiveMessage = (data) => {
      const senderId = typeof data.senderId === 'string' ? data.senderId : data.senderId?._id;
      if (senderId === assignedAdmin._id) {
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
  }, [assignedAdmin?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-white border border-gray-200 shadow-lg rounded-full px-4 py-2 hover:bg-gray-50 transition"
        >
          <span className="inline-flex w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-medium text-gray-800">
            Support Team
          </span>
          {assignedAdmin?.name && (
            <span className="text-xs text-gray-500">({assignedAdmin.name})</span>
          )}
        </button>
        <button
          onClick={onClose}
          className="ml-2 text-xs text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>
    );
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    const localMessage = {
      _id: `local-${Date.now()}`,
      text: textToSend,
      senderId: userId,
      createdAt: new Date()
    };

    setMessages((prev) => [...prev, localMessage]);

    try {
      if (assignedAdmin?._id) {
        const response = await messageAPI.sendMessage({
          receiverId: assignedAdmin._id,
          text: textToSend
        });

        const newMessage = response.data.message;
        setMessages((prev) => {
          const filtered = prev.filter((m) => m._id !== localMessage._id);
          const exists = filtered.some((m) => m._id === newMessage._id);
          return exists ? filtered : [...filtered, newMessage];
        });
      } else {
        const response = await supportAPI.createSupportMessage({
          text: textToSend,
          ticketId
        });

        if (response.data?.ticket?._id) {
          setTicketId(response.data.ticket._id);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m._id !== localMessage._id));
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
          <div>
            <p className="font-semibold">Support Team</p>
            {assignedAdmin?.name ? (
              <p className="text-xs text-primary-100">{assignedAdmin.name}</p>
            ) : (
              <p className="text-xs text-primary-100 flex items-center gap-2">
                <span className="inline-flex w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></span>
                Waiting for support...
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-primary-600 rounded-full transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length > 0 ? (
            messages.map((message) => {
              if (message.system) {
                return (
                  <div key={message._id} className="text-center text-xs text-gray-500">
                    {message.text}
                  </div>
                );
              }

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
