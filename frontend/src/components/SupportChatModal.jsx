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
        setSystemMessage(`📞 New support request from ${supportAlert.user.name}. Click "Accept" to start helping.`);
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
          console.log('\n========== USER CREATING SUPPORT TICKET ==========');
          console.log('User ID:', userId);
          console.log('User Role:', userRole);
          
          debugSupport.info('User creating support ticket', { userId });
          const response = await supportAPI.createSupportMessage({
            text: 'User opened support chat'
          });

          console.log('Support ticket response:', response.data);
          console.log('=================================================\n');

          if (response.data?.ticket?._id) {
            setTicketId(response.data.ticket._id);
            setTicketStatus(response.data.ticket.status);
            setSystemMessage('⏳ Your support request has been sent! Waiting for admin to accept...');
            debugSupport.success('Support ticket created', {
              ticketId: response.data.ticket._id
            });
            
            // Show confirmation toast
            toast.success('Support request sent! An admin will be with you shortly.', {
              duration: 4000,
              icon: '✉️'
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
          debugSupport.info('Loading support messages', { ticketId });
          const response = await supportAPI.getSupportMessages(ticketId);
          if (response.data?.messages) {
            debugSupport.info('Loaded support messages', {
              ticketId,
              count: response.data.messages.length,
              messages: response.data.messages.map(m => ({ 
                _id: m._id,
                senderRole: m.senderRole,
                text: m.text.substring(0, 30)
              }))
            });
            setMessages(response.data.messages);
          }
        } catch (error) {
          debugSupport.error('Failed to load messages', { 
            ticketId,
            errorMessage: error.message 
          });
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
        debugSupport.socket('Received support message', {
          ticketId: data.ticketId,
          senderRole: data.senderRole,
          text: data.text.substring(0, 30)
        });
        
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === data._id);
          if (exists) {
            debugSupport.info('Message already exists, skipping duplicate');
            return prev;
          }
          return [...prev, {
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
        setSystemMessage(`✅ ${data.admin.name} has accepted your request and is ready to help!`);
        debugSupport.success('Admin assigned', { adminName: data.admin.name });
        
        // Show toast notification to user
        if (userRole !== 'admin') {
          toast.success(`${data.admin.name} has accepted your request! You can now chat.`, {
            duration: 5000,
            icon: '✅'
          });
        }
        
        // Reload messages after admin accepts
        const reloadMessages = async () => {
          try {
            const response = await supportAPI.getSupportMessages(ticketId);
            if (response.data?.messages) {
              debugSupport.info('Reloaded messages after admin assigned');
              setMessages(response.data.messages);
            }
          } catch (error) {
            debugSupport.error('Failed to reload messages', { ticketId });
          }
        };
        
        reloadMessages();
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
      setSystemMessage(`✅ Request accepted! You're now chatting with ${supportingUser?.name || 'user'}.`);
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
              // Handle both string IDs and object IDs
              const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
              const isMine = senderId === userId;
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
            <div className="px-4 py-3 border-b bg-yellow-50 flex flex-col gap-2">
              <p className="text-xs text-orange-700 font-semibold">
                ⚠️ {supportingUser?.name} is waiting for your response
              </p>
              <button
                onClick={handleAcceptRequest}
                className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition shadow-md"
              >
                ✅ Accept Support Request
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
