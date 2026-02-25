import { useState, useEffect } from 'react';
import socket from '../utils/socket';
import { debugSupport } from '../utils/debugSupport';
import { supportAPI } from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const SocketDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState({
    connected: false,
    socketId: null,
    url: null
  });
  const [onlineUsers, setOnlineUsers] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const updateStatus = () => {
      setSocketStatus({
        connected: socket.connected,
        socketId: socket.id,
        url: socket.io?.uri || 'Unknown'
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    socket.on('connect', updateStatus);
    socket.on('disconnect', updateStatus);

    return () => {
      clearInterval(interval);
      socket.off('connect', updateStatus);
      socket.off('disconnect', updateStatus);
    };
  }, []);

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch(`${socketStatus.url}/api/debug/online-users`);
      const data = await response.json();
      setOnlineUsers(data);
      toast.success(`${data.totalOnline} users online`);
    } catch (error) {
      toast.error('Failed to fetch online users');
      console.error(error);
    }
  };

  const testSupportRequest = () => {
    debugSupport.info('Testing support request emission');
    socket.emit('support_request', {
      ticketId: 'test-123',
      user: {
        _id: user?._id,
        name: user?.name || 'Test User',
        profilePic: user?.profilePic
      },
      lastMessage: 'Test support request',
      createdAt: new Date()
    });
    toast.success('Test support request sent!');
  };

  const reconnectSocket = () => {
    socket.disconnect();
    setTimeout(() => {
      socket.connect();
      if (user?._id) {
        socket.emit('user_connected', user._id);
      }
      toast.success('Reconnected socket');
    }, 500);
  };

  const clearLogs = () => {
    debugSupport.clearLogs();
    toast.success('Debug logs cleared');
  };

  const exportLogs = () => {
    debugSupport.exportLogs();
    toast.success('Logs exported');
  };

  const checkAdminStatus = async () => {
    try {
      debugSupport.info('Checking admin online status');
      const response = await supportAPI.debugGetOnlineAdmins();
      const data = response.data;
      
      if (data.success) {
        console.log('📊 Admin Status:', data);
        const adminList = data.admins
          .map(a => `${a.name} (${a.online ? '🟢 ONLINE' : '🔴 OFFLINE'})`)
          .join(', ');
        toast.success(`${data.onlineCount}/${data.totalAdmins} admins online: ${adminList}`);
      }
    } catch (error) {
      debugSupport.error('Failed to check admin status', { error: error.message });
      toast.error('Failed to check admin status');
      console.error(error);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-8 z-40 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg hover:bg-gray-700 transition"
      >
        🔧 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-8 z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-300">
      {/* Header */}
      <div className="bg-gray-800 text-white p-3 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold text-sm">Socket Debug Panel</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white">
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {/* Socket Status */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm">Socket Connection</h4>
          <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={socketStatus.connected ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {socketStatus.connected ? '✅ Connected' : '❌ Disconnected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Socket ID:</span>
              <span className="text-gray-800 font-mono">{socketStatus.socketId || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">URL:</span>
              <span className="text-gray-800 font-mono text-xs break-all">{socketStatus.url}</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 text-sm">User Info</h4>
            <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="text-gray-800 font-mono">{user._id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="text-gray-800">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className={user.role === 'admin' ? 'text-blue-600 font-semibold' : 'text-gray-800'}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Online Users */}
        {onlineUsers && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 text-sm">Online Users</h4>
            <div className="bg-gray-50 p-2 rounded text-xs">
              <div className="mb-1">
                <span className="text-gray-600">Total:</span> {onlineUsers.totalOnline}
              </div>
              <div className="max-h-20 overflow-y-auto">
                <div className="text-gray-600 mb-1">User IDs:</div>
                {onlineUsers.onlineUserIds.map((id, index) => (
                  <div key={index} className="font-mono text-xs text-gray-800 truncate">
                    {id}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm">Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={fetchOnlineUsers}
              className="px-3 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
            >
              Check Online
            </button>
            <button
              onClick={reconnectSocket}
              className="px-3 py-2 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
            >
              Reconnect
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={checkAdminStatus}
                className="px-3 py-2 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600 transition"
              >
                Admin Status
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                onClick={testSupportRequest}
                className="px-3 py-2 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition"
              >
                Test Alert
              </button>
            )}
            <button
              onClick={exportLogs}
              className="px-3 py-2 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition"
            >
              Export Logs
            </button>
            <button
              onClick={clearLogs}
              className="px-3 py-2 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
            >
              Clear Logs
            </button>
            <button
              onClick={() => {
                debugSupport.summary();
                toast.success('Check console for summary');
              }}
              className="px-3 py-2 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition"
            >
              Log Summary
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 border-t pt-2 mt-2">
          <p className="mb-1">Console commands:</p>
          <code className="block bg-gray-100 p-1 rounded">window.__SUPPORT_DEBUG_LOGS()</code>
          <code className="block bg-gray-100 p-1 rounded mt-1">window.__EXPORT_SUPPORT_LOGS()</code>
        </div>
      </div>
    </div>
  );
};

export default SocketDebugPanel;
