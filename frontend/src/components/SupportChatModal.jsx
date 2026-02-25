import { useEffect, useRef, useState } from 'react';
import { FiX, FiSend } from 'react-icons/fi';
import { supportAPI } from '../utils/api';
import socket from '../utils/socket';
import toast from 'react-hot-toast';
import { debugSupport } from '../utils/debugSupport';

const SupportChatModal = ({ onClose, userId, userRole, userName, userProfilePic, supportAlert }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [ticketId, setTicketId] = useState(supportAlert?.ticketId || null);
  const [ticketStatus, setTicketStatus] = useState(supportAlert ? 'open' : null);
  const [supportingUser, setSupportingUser] = useState(supportAlert?.user || null);
  const [assignedAdmin, setAssignedAdmin] = useState(null);
  const [systemMessage, setSystemMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Set up system message based on role
  useEffect(() => {
    if (userRole === 'admin') {
      if (supportAlert?.user) {
        setSystemMessage(`Supporting: ${supportAlert.user.name}`);
      }
    } else {
      setSystemMessage('Connecting to support team...');
    }
  }, [userRole, supportAlert]);

  // For admin: Set supporting user info from alert
  useEffect(() => {
    if (userRole === 'admin' && supportAlert) {
      setSupportingUser(supportAlert.user);
      setTicketId(supportAlert.ticketId);
      setTicketStatus('open');
    }
  }, [supportAlert, userRole]);

  // For user: Create support ticket on first load
  useEffect(() => {
    if (userRole !== 'admin' && !ticketId) {
      const createTicket = async () => {
        try {
          debugSupport.info('User creating support ticket', { userId });
          const response = await supportAPI.createSupportMessage({
            text: 'User opened support chat'
          });

          if (response.data?.ticket?._id) {
            setTicketId(response.data.ticket._id);
            setTicketStatus(response.data.ticket.status);
            setSystemMessage('Support request sent! Waiting for admin...');
            debugSupport.success('Support ticket created', {
              ticketId: response.data.ticket._id
            });
          }
        } catch (error) {
          debugSupport.error('Failed to create support ticket', {
            errorMessage: error.message
          });
          toast.error('Failed to create support request');
        }
      };

      createTicket();
    }
  }, [userRole]);

  // Load support messages
  useEffect(() => {
    if (ticketId) {
      const loadMessages = async () => {
        try {
          const response = await supportAPI.getSupportMessages(ticketId);
          if (response.data?.messages) {
            debugSupport.info('Loaded support messages', {
              ticketId,
              count: response.data.messages.length
            });
            setMessages(response.data.messages);
          }
        } catch (error) {
          debugSupport.error('Failed to load messages', { ticketId });
        }
      };

      loadMessages();
    }
  }, [ticketId]);

  // Listen for incoming support messages
  useEffect(() => {
    const handleSupportMessage = (data) => {
      // Only add if it's for this ticket
      if (data.ticketId === ticketId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === data._id);
          return exists ? prev : [...prev, {
            _id: data._id,
            text: data.text,
            senderId: data.senderId,
            senderName: data.senderName,
            senderProfilePic: data.senderProfilePic,
            senderRole: data.senderRole,
            createdAt: data.createdAt
          }];
        });
      }
    };

    const handleSupportAssigned = (data) => {
      if (data.ticketId === ticketId) {
        setAssignedAdmin(data.admin);
        setTicketStatus('assigned');
        setSystemMessage(`${data.admin.name} is helping you!`);
        debugSupport.success('Admin assigned', { adminName: data.admin.name });
      }
    };

    socket.on('support_message', handleSupportMessage);
    socket.on('support_assigned', handleSupportAssigned);

    return () => {
      socket.off('support_message', handleSupportMessage);
      socket.off('support_assigned', handleSupportAssigned);
    };
  }, [ticketId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !ticketId) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      debugSupport.info(`${userRole} sending message`, { ticketId });

      if (userRole === 'admin') {
        // Admin sending message
        const response = await supportAPI.sendSupportMessage(ticketId, {
          text: textToSend
        });

        debugSupport.success('Admin message sent', {
          messageId: response.data.message._id
        });
      } else {
        // User sending message
        const response = await supportAPI.sendSupportMessage(ticketId, {
          text: textToSend
        });

        debugSupport.success('User message sent', {
          messageId: response.data.message._id
        });
      }
    } catch (error) {
      debugSupport.error('Failed to send message', {
        errorMessage: error.message
      });
      toast.error('Failed to send message');
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  // For admin: Accept the support request
  const handleAcceptRequest = async () => {
    if (!ticketId) return;

    try {
      debugSupport.info('Admin accepting support request', { ticketId });
      const response = await supportAPI.acceptSupportRequest(ticketId, {
        text: `Hi! I'm here to help. What do you need assistance with?`
      });

      setTicketStatus(response.data.ticket.status);
      setSystemMessage('You accepted the request');
      debugSupport.success('Request accepted', { ticketId });
      toast.success('Support request accepted!');
    } catch (error) {
      debugSupport.error('Failed to accept request', {
        errorMessage: error.message
      });
      toast.error('Failed to accept request');
    }
  };

  // For admin: Close the ticket
  const handleCloseTicket = async () => {
    if (!ticketId) return;

    try {
      debugSupport.info('Admin closing ticket', { ticketId });
      await supportAPI.updateTicketStatus(ticketId, 'closed');
      toast.success('Ticket closed');
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      toast.error('Failed to close ticket');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-20" onClick={onClose}></div>

      {/* Chat Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full md:w-96 h-96 flex flex-col z-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex-1">
            {userRole === 'admin' ? (
              <>
                <p className="font-semibold text-sm">Supporting User</p>
                <p className="text-xs text-primary-100">{supportingUser?.name || 'User'}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm">Support Chat</p>
                <p className="text-xs text-primary-100">
                  {assignedAdmin ? assignedAdmin.name : 'Waiting for admin...'}
                </p>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-primary-600 rounded-full transition">
            <FiX size={20} />
          </button>
        </div>

        {/* System Message */}
        {systemMessage && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-700 text-center">
            {systemMessage}
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length > 0 ? (
            messages.map((message) => {
              const isMine = message.senderId === userId;
              return (
                <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
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
              <p>Messages will appear here</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-white rounded-b-lg">
          {/* Admin Actions */}
          {userRole === 'admin' && ticketStatus === 'open' && (
            <div className="px-4 py-3 border-b bg-yellow-50 flex gap-2">
              <button
                onClick={handleAcceptRequest}
                className="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-semibold rounded hover:bg-green-600 transition"
              >
                Accept Request
              </button>
            </div>
          )}

          {userRole === 'admin' && ticketStatus === 'assigned' && (
            <div className="px-4 py-2 border-b bg-gray-100 flex gap-2">
              <button
                onClick={handleCloseTicket}
                className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition"
              >
                Close Ticket
              </button>
            </div>
          )}

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={
                  userRole === 'admin' && ticketStatus === 'open'
                    ? 'Accept request to reply...'
                    : 'Type message...'
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                disabled={
                  sending ||
                  (userRole === 'admin' && ticketStatus === 'open') ||
                  ticketStatus === 'closed'
                }
              />
              <button
                type="submit"
                disabled={
                  sending ||
                  !messageText.trim() ||
                  (userRole === 'admin' && ticketStatus === 'open') ||
                  ticketStatus === 'closed'
                }
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
