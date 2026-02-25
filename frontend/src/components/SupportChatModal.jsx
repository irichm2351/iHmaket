import { useEffect, useRef, useState } from 'react';
import { FiX, FiSend } from 'react-icons/fi';
import { messageAPI, supportAPI } from '../utils/api';
import socket from '../utils/socket';
import toast from 'react-hot-toast';
import { debugSupport } from '../utils/debugSupport';

const SupportChatModal = ({ onClose, userId, userRole, userName, userProfilePic, supportAlert }) => {
  const [messages, setMessages] = useState(() => ([
    {
      _id: 'system-1',
      text: userRole === 'admin' 
        ? `User ${supportAlert?.user?.name} needs help` 
        : 'How may I help you?',
      system: true,
      createdAt: new Date()
    }
  ]));
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [assignedAdmin, setAssignedAdmin] = useState(null);
  const [ticketId, setTicketId] = useState(null);
  const [ticketStatus, setTicketStatus] = useState('open');
  const [supportingUser, setSupportingUser] = useState(supportAlert?.user || null); // For admin
  const messagesEndRef = useRef(null);

  // For admins: Set the supporting user from the alert
  useEffect(() => {
    if (userRole === 'admin' && supportAlert) {
      setSupportingUser(supportAlert.user);
      setTicketId(supportAlert.ticketId);
    }
  }, [supportAlert, userRole]);

  // Load message history for admin with supporting user
  useEffect(() => {
    if (userRole === 'admin' && supportingUser?._id) {
      const loadMessageHistory = async () => {
        try {
          const response = await messageAPI.getConversation(supportingUser._id);
          if (response.data?.messages) {
            const systemMessage = messages[0]; // Keep initial system message
            setMessages([systemMessage, ...response.data.messages]);
          }
        } catch (error) {
          console.error('Failed to load message history:', error);
        }
      };
      loadMessageHistory();
    }
  }, [userRole, supportingUser?._id]);

  // Load ticket details for status tracking
  useEffect(() => {
    if (ticketId) {
      const loadTicketStatus = async () => {
        try {
          const response = await supportAPI.getTicketDetails(ticketId);
          if (response.data?.ticket?.status) {
            setTicketStatus(response.data.ticket.status);
          }
        } catch (error) {
          console.error('Failed to load ticket status:', error);
        }
      };
      loadTicketStatus();
    }
  }, [ticketId]);

  // When user opens chat, create a support ticket
  useEffect(() => {
    if (userRole !== 'admin' && !ticketId) {
      const createTicket = async () => {
        try {
          debugSupport.info('User creating support ticket', { userId });
          const response = await supportAPI.createSupportMessage({
            text: 'User opened support chat',
            ticketId: null
          });
          if (response.data?.ticket?._id) {
            setTicketId(response.data.ticket._id);
            debugSupport.success('Support ticket created', { 
              ticketId: response.data.ticket._id,
              status: response.data.ticket.status
            });
          }
        } catch (error) {
          debugSupport.error('Failed to create support ticket', {
            errorMessage: error.message,
            errorCode: error.response?.status
          });
          console.error('Failed to create support ticket:', error);
        }
      };
      createTicket();
    }
  }, [userRole]);

  // Socket listeners for users and admins
  useEffect(() => {
    // For users: Listen for admin assignment
    if (userRole !== 'admin') {
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
            text: `Admin ${data.admin?.name} is now helping`,
            system: true,
            createdAt: new Date()
          }
        ]);
      };

      socket.on('support_assigned', handleSupportAssigned);
      return () => socket.off('support_assigned', handleSupportAssigned);
    }

    // For admins: Listen for messages from the user
    if (userRole === 'admin' && supportingUser?._id) {
      const handleReceiveMessage = (data) => {
        const senderId = typeof data.senderId === 'string' ? data.senderId : data.senderId?._id;
        if (senderId === supportingUser._id) {
          setMessages((prev) => {
            const exists = prev.some((m) => m._id === data._id);
            return exists ? prev : [...prev, data];
          });
        }
      };

      socket.on('receive_message', handleReceiveMessage);
      return () => socket.off('receive_message', handleReceiveMessage);
    }
  }, [userId, userRole, supportingUser?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    debugSupport.info(`${userRole} sending message`, {
      role: userRole,
      receiverId: userRole === 'admin' ? supportingUser?._id : assignedAdmin?._id,
      messagePreview: textToSend.substring(0, 50)
    });

    setMessages((prev) => [...prev, localMessage]);

    try {
      if (userRole === 'admin' && supportingUser?._id) {
        // Admin sending message to user
        const response = await messageAPI.sendMessage({
          receiverId: supportingUser._id,
          text: textToSend
        });

        const newMessage = response.data.message;
        debugSupport.success('Admin message sent to user', { 
          messageId: newMessage._id,
          userId: supportingUser._id
        });

        setMessages((prev) => {
          const filtered = prev.filter((m) => m._id !== localMessage._id);
          const exists = filtered.some((m) => m._id === newMessage._id);
          return exists ? filtered : [...filtered, newMessage];
        });
      } else if (assignedAdmin?._id) {
        // User sending message to assigned admin
        const response = await messageAPI.sendMessage({
          receiverId: assignedAdmin._id,
          text: textToSend
        });

        const newMessage = response.data.message;
        debugSupport.success('User message sent to admin', { 
          messageId: newMessage._id,
          adminId: assignedAdmin._id
        });

        setMessages((prev) => {
          const filtered = prev.filter((m) => m._id !== localMessage._id);
          const exists = filtered.some((m) => m._id === newMessage._id);
          return exists ? filtered : [...filtered, newMessage];
        });
      } else {
        // User starting support request
        const response = await supportAPI.createSupportMessage({
          text: textToSend,
          ticketId
        });

        debugSupport.success('User support message sent', {
          ticketId: response.data.ticket?._id,
          messagePreview: textToSend.substring(0, 50)
        });

        if (response.data?.ticket?._id) {
          setTicketId(response.data.ticket._id);
        }
      }
    } catch (error) {
      debugSupport.error('Failed to send message', {
        role: userRole,
        errorMessage: error.message,
        errorCode: error.response?.status
      });
      toast.error(error.response?.data?.message || 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m._id !== localMessage._id));
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateTicketStatus = async (newStatus) => {
    if (!ticketId) return;

    debugSupport.info('Admin updating ticket status', {
      ticketId,
      oldStatus: ticketStatus,
      newStatus
    });

    try {
      const response = await supportAPI.updateTicketStatus(ticketId, newStatus);
      if (response.data?.ticket?.status) {
        setTicketStatus(response.data.ticket.status);
        debugSupport.success('Ticket status updated', {
          ticketId,
          status: response.data.ticket.status
        });
        toast.success(`Ticket marked as ${newStatus}`);
        
        if (newStatus === 'closed') {
          setTimeout(() => onClose(), 1000);
        }
      }
    } catch (error) {
      debugSupport.error('Failed to update ticket status', {
        ticketId,
        newStatus,
        errorMessage: error.message,
        errorCode: error.response?.status
      });
      toast.error(error.response?.data?.message || 'Failed to update ticket status');
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
          <div className="flex-1">
            {userRole === 'admin' ? (
              <>
                <p className="font-semibold">Supporting User</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-primary-100">{supportingUser?.name || 'User'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    ticketStatus === 'open' ? 'bg-yellow-400 text-gray-900' :
                    ticketStatus === 'assigned' ? 'bg-blue-400 text-white' :
                    'bg-green-400 text-white'
                  }`}>
                    {ticketStatus}
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="font-semibold">Support Team</p>
                {assignedAdmin?.name ? (
                  <p className="text-xs text-primary-100">{assignedAdmin.name}</p>
                ) : (
                  <p className="text-xs text-primary-100 flex items-center gap-2">
                    <span className="inline-flex w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></span>
                    Waiting for support...
                  </p>
                )}
              </>
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
        <div className="border-t bg-white">
          {/* Admin Actions */}
          {userRole === 'admin' && ticketStatus !== 'closed' && (
            <div className="px-4 py-2 border-b bg-gray-100 flex gap-2 text-xs">
              {ticketStatus === 'open' && (
                <button
                  onClick={() => handleUpdateTicketStatus('assigned')}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Assign to Me
                </button>
              )}
              {ticketStatus === 'assigned' && (
                <button
                  onClick={() => handleUpdateTicketStatus('closed')}
                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                >
                  Resolve
                </button>
              )}
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                disabled={sending || ticketStatus === 'closed'}
              />
              <button
                type="submit"
                disabled={sending || !messageText.trim() || ticketStatus === 'closed'}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                <FiSend size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupportChatModal;
