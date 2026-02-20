import { useState, useEffect } from 'react';
import { FiUsers, FiShoppingBag, FiPower, FiSlash, FiTrash2, FiSearch, FiChevronDown, FiChevronUp, FiMessageSquare, FiSend } from 'react-icons/fi';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { getAuthToken, API_URL } from '../utils/api';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'kyc', 'reports', or 'messages'
  const [kycStatus, setKycStatus] = useState('pending');
  const [expandedKyc, setExpandedKyc] = useState({}); // Track which KYC submissions are expanded
  const [reports, setReports] = useState([]);
  const [reportStatus, setReportStatus] = useState('all');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    adminNotes: ''
  });
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkMessageLoading, setBulkMessageLoading] = useState(false);
  const [recipientType, setRecipientType] = useState('all'); // 'all', 'providers', 'customers', 'individual'
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [subscriptionSettings, setSubscriptionSettings] = useState({
    enabled: false,
    amount: 2000,
    currency: 'NGN',
    interval: 'monthly'
  });
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionSaving, setSubscriptionSaving] = useState(false);
  const limit = 10;

  const toggleKycExpand = (id) => {
    setExpandedKyc(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'kyc') {
      fetchKycSubmissions();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'subscription') {
      fetchSubscriptionSettings();
    }
  }, [search, role, status, page, activeTab, kycStatus, reportStatus]);

  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/admin/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSubscriptionSettings = async () => {
    try {
      setSubscriptionLoading(true);
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/admin/subscription-settings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setSubscriptionSettings(data.settings);
      }
    } catch (error) {
      toast.error('Error fetching subscription settings');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleSaveSubscriptionSettings = async () => {
    try {
      setSubscriptionSaving(true);
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/admin/subscription-settings`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscriptionSettings)
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success('Subscription settings updated');
        setSubscriptionSettings(data.settings);
      } else {
        toast.error(data.message || 'Failed to update settings');
      }
    } catch (error) {
      toast.error('Error updating subscription settings');
    } finally {
      setSubscriptionSaving(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const params = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
        ...(role !== 'all' && { role }),
        ...(status !== 'all' && { status })
      });

      const response = await fetch(
        `${API_URL}/admin/users?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      toast.error('Error fetching users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKycSubmissions = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const params = new URLSearchParams({
        page,
        limit,
        status: kycStatus
      });

      const response = await fetch(
        `${API_URL}/admin/kyc?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setKycSubmissions(data.submissions);
      }
    } catch (error) {
      toast.error('Error fetching KYC submissions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/admin/users/${userId}/status`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Error updating user status');
    }
  };

  const handleRestrict = async (userId) => {
    const reason = prompt('Enter restriction reason:');
    if (!reason) return;

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/admin/users/${userId}/restrict`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Error restricting user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success('User deleted');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/admin/users/${userId}/role`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: newRole })
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Error updating role');
    }
  };

  const handleApproveKyc = async (userId) => {
    if (!confirm('Approve this KYC submission? The user will be automatically changed to a service provider.')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/admin/kyc/${userId}/approve`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success('✅ KYC approved! User is now a service provider.');
        fetchKycSubmissions();
        fetchStats();
      }
    } catch (error) {
      toast.error('Error approving KYC');
    }
  };

  const handleRejectKyc = async (userId) => {
    const reason = prompt('Enter rejection reason (user will see this):');
    if (!reason) return;

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/admin/kyc/${userId}/reject`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success('KYC rejected. User has been notified.');
        fetchKycSubmissions();
        fetchStats();
      }
    } catch (error) {
      toast.error('Error rejecting KYC');
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const params = new URLSearchParams({
        page,
        limit,
        ...(reportStatus !== 'all' && { status: reportStatus })
      });

      const response = await fetch(
        `${API_URL}/reports?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      toast.error('Error fetching reports');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (report) => {
    setSelectedReport(report);
    setStatusUpdateData({
      status: report.status,
      adminNotes: report.adminNotes || ''
    });
    setShowStatusModal(true);
  };

  const handleUpdateReportStatus = async (e) => {
    e.preventDefault();
    
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/reports/${selectedReport._id}/status`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(statusUpdateData)
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success('Report status updated');
        setShowStatusModal(false);
        setSelectedReport(null);
        setStatusUpdateData({ status: '', adminNotes: '' });
        fetchReports();
      }
    } catch (error) {
      toast.error('Error updating report status');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/reports/${reportId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success('Report deleted');
        fetchReports();
      }
    } catch (error) {
      toast.error('Error deleting report');
    }
  };

  const handleSendBulkMessage = async (e) => {
    e.preventDefault();

    if (!bulkMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (bulkMessage.length > 2000) {
      toast.error('Message is too long (max 2000 characters)');
      return;
    }

    if (recipientType === 'individual' && selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    let confirmMessage = '';
    if (recipientType === 'all') {
      confirmMessage = `Send this message to all ${stats.totalUsers || 'all'} users?`;
    } else if (recipientType === 'providers') {
      confirmMessage = `Send this message to all ${stats.totalProviders || 'all'} providers?`;
    } else if (recipientType === 'customers') {
      const customerCount = (stats.totalUsers || 0) - (stats.totalProviders || 0);
      confirmMessage = `Send this message to all ${customerCount} customers?`;
    } else {
      confirmMessage = `Send this message to ${selectedUsers.length} selected user(s)?`;
    }

    const confirmSend = confirm(confirmMessage);
    if (!confirmSend) return;

    setBulkMessageLoading(true);
    try {
      const token = getAuthToken();
      const payload = { 
        text: bulkMessage,
        recipientType
      };

      if (recipientType === 'individual') {
        payload.recipientIds = selectedUsers;
      }

      const response = await fetch(
        `${API_URL}/messages/bulk/send-all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(`Message sent to ${data.messagesSent} ${recipientType === 'individual' ? 'user(s)' : recipientType === 'providers' ? 'provider(s)' : recipientType === 'customers' ? 'customer(s)' : 'user(s)'}`);
        setBulkMessage('');
        setSelectedUsers([]);
        setRecipientType('all');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error sending bulk message');
      console.error(error);
    } finally {
      setBulkMessageLoading(false);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage users and control the platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm">Total Users</p>
            <h3 className="text-3xl font-bold text-gray-900">{stats.totalUsers || 0}</h3>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <p className="text-gray-600 text-sm">Providers</p>
            <h3 className="text-3xl font-bold text-gray-900">{stats.totalProviders || 0}</h3>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm">Services</p>
            <h3 className="text-3xl font-bold text-gray-900">{stats.totalServices || 0}</h3>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm">Pending KYC</p>
            <h3 className="text-3xl font-bold text-gray-900">{stats.pendingKyc || 0}</h3>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
            <p className="text-gray-600 text-sm">Restricted</p>
            <h3 className="text-3xl font-bold text-gray-900">{stats.restrictedUsers || 0}</h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap gap-2 border-b overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('users');
                setPage(1);
              }}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => {
                setActiveTab('kyc');
                setPage(1);
              }}
              className={`px-6 py-3 font-medium transition relative ${
                activeTab === 'kyc'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              KYC Verification
              {stats.pendingKyc > 0 && (
                <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                  {stats.pendingKyc}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('reports');
                setPage(1);
              }}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'reports'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Report Management
            </button>
            <button
              onClick={() => {
                setActiveTab('messages');
                setPage(1);
              }}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'messages'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiMessageSquare className="inline mr-2" />
              Send Message to Users
            </button>
            <button
              onClick={() => {
                setActiveTab('subscription');
                setPage(1);
              }}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'subscription'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Subscription Control
            </button>
          </div>
        </div>

        {/* Filters */}
        {activeTab === 'users' && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="admin-search" className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    id="admin-search"
                    type="text"
                    placeholder="Name or email..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="admin-role" className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  id="admin-role"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="customer">Customer</option>
                  <option value="provider">Provider</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="admin-status" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  id="admin-status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearch('');
                    setRole('all');
                    setStatus('all');
                    setPage(1);
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="kyc-status-filter" className="block text-sm font-medium text-gray-700 mb-2">KYC Status</label>
                <select
                  id="kyc-status-filter"
                  value={kycStatus}
                  onChange={(e) => {
                    setKycStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Provider Subscription</h2>
                <p className="text-gray-600">Enable or disable provider subscriptions</p>
              </div>
            </div>

            {subscriptionLoading ? (
              <div className="py-8">
                <Loader size="md" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Status</label>
                  <div className="flex items-center gap-3">
                    <input
                      id="subscription-enabled"
                      type="checkbox"
                      checked={subscriptionSettings.enabled}
                      onChange={(e) =>
                        setSubscriptionSettings({
                          ...subscriptionSettings,
                          enabled: e.target.checked
                        })
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="subscription-enabled" className="text-sm text-gray-700">
                      {subscriptionSettings.enabled ? 'Enabled' : 'Disabled'}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Amount (NGN)</label>
                  <input
                    type="number"
                    value={subscriptionSettings.amount}
                    onChange={(e) =>
                      setSubscriptionSettings({
                        ...subscriptionSettings,
                        amount: Number(e.target.value)
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <input
                    type="text"
                    value={subscriptionSettings.currency}
                    onChange={(e) =>
                      setSubscriptionSettings({
                        ...subscriptionSettings,
                        currency: e.target.value.toUpperCase()
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interval</label>
                  <select
                    value={subscriptionSettings.interval}
                    onChange={(e) =>
                      setSubscriptionSettings({
                        ...subscriptionSettings,
                        interval: e.target.value
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleSaveSubscriptionSettings}
                disabled={subscriptionSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:bg-gray-400"
              >
                {subscriptionSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user._id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="customer">Customer</option>
                          <option value="provider">Provider</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.isRestricted
                              ? 'bg-red-100 text-red-700'
                              : user.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.isRestricted ? 'Restricted' : user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleStatus(user._id)}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                            className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition"
                          >
                            <FiPower size={18} />
                          </button>
                          <button
                            onClick={() => handleRestrict(user._id)}
                            title="Restrict"
                            className="p-2 hover:bg-orange-100 rounded text-orange-600 transition"
                          >
                            <FiSlash size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            title="Delete"
                            className="p-2 hover:bg-red-100 rounded text-red-600 transition"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 hover:bg-blue-700"
              >
                Previous
              </button>
              <span className="text-gray-600">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={users.length < limit}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* KYC Submissions Table */}
        {activeTab === 'kyc' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycSubmissions.map((submission) => (
                    <tr key={submission._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{submission.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{submission.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {submission.kycData?.idType || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {submission.kycSubmittedAt
                          ? new Date(submission.kycSubmittedAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            submission.kycStatus === 'verified'
                              ? 'bg-green-100 text-green-700'
                              : submission.kycStatus === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {submission.kycStatus}
                        </span>
                        {submission.kycRejectionReason && (
                          <div className="text-xs text-red-600 mt-1">
                            Reason: {submission.kycRejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-3">
                          {/* Toggle Button */}
                          <button
                            onClick={() => toggleKycExpand(submission._id)}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {expandedKyc[submission._id] ? (
                              <>
                                <FiChevronUp size={16} />
                                Hide Images
                              </>
                            ) : (
                              <>
                                <FiChevronDown size={16} />
                                View Images
                              </>
                            )}
                          </button>

                          {/* Images Section - Collapsible */}
                          {expandedKyc[submission._id] && (
                            <div className="flex gap-3">
                              {submission.kycData?.imageUrl && (
                                <div className="flex flex-col gap-1">
                                  <img
                                    src={submission.kycData.imageUrl}
                                    alt="ID Document"
                                    className="w-24 h-24 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80"
                                    onClick={() => window.open(submission.kycData.imageUrl, '_blank')}
                                  />
                                  <span className="text-xs text-gray-600 text-center">ID Document</span>
                                </div>
                              )}
                              {submission.kycData?.selfieUrl && (
                                <div className="flex flex-col gap-1">
                                  <img
                                    src={submission.kycData.selfieUrl}
                                    alt="Selfie"
                                    className="w-24 h-24 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80"
                                    onClick={() => window.open(submission.kycData.selfieUrl, '_blank')}
                                  />
                                  <span className="text-xs text-gray-600 text-center">Selfie</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {submission.kycStatus === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveKyc(submission._id)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectKyc(submission._id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 hover:bg-blue-700"
              >
                Previous
              </button>
              <span className="text-gray-600">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={kycSubmissions.length < limit}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="p-6 border-b">
              <div className="flex gap-4">
                <select
                  value={reportStatus}
                  onChange={(e) => {
                    setReportStatus(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Reports</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            </div>

            {/* Reports Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No reports found
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{report.reporterId?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{report.reporterId?.email || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{report.providerId?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{report.providerId?.email || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                            {report.reason}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-sm text-gray-700 truncate" title={report.description}>
                            {report.description}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              report.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : report.status === 'reviewed'
                                ? 'bg-blue-100 text-blue-800'
                                : report.status === 'resolved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenStatusModal(report)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 hover:bg-blue-700"
              >
                Previous
              </button>
              <span className="text-gray-600">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={reports.length < limit}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Update Report Status</h3>
            <form onSubmit={handleUpdateReportStatus}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusUpdateData.status}
                    onChange={(e) =>
                      setStatusUpdateData({ ...statusUpdateData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    value={statusUpdateData.adminNotes}
                    onChange={(e) =>
                      setStatusUpdateData({ ...statusUpdateData, adminNotes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Add notes about this report..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedReport(null);
                    setStatusUpdateData({ status: '', adminNotes: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Message Tab */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
              <FiMessageSquare className="mx-auto mb-4 text-blue-600" size={48} />
              <h2 className="text-2xl font-bold mb-2">Send Message to All Users</h2>
              <p className="text-gray-600">
                Send a message that will be delivered to all {stats.totalUsers || 0} users on the platform.
              </p>
            </div>

            <form onSubmit={handleSendBulkMessage} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Send Message To
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientType('all');
                      setSelectedUsers([]);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      recipientType === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Users
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientType('providers');
                      setSelectedUsers([]);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      recipientType === 'providers'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Providers ({stats.totalProviders || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientType('customers');
                      setSelectedUsers([]);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      recipientType === 'customers'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Customers ({(stats.totalUsers || 0) - (stats.totalProviders || 0)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('individual')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      recipientType === 'individual'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Individual
                  </button>
                </div>
              </div>

              {recipientType === 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Users ({selectedUsers.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUserSelector(!showUserSelector)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>{selectedUsers.length > 0 ? `${selectedUsers.length} user(s) selected` : 'Click to select users'}</span>
                    <FiChevronDown className={`transition ${showUserSelector ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showUserSelector && (
                    <div className="mt-2 border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto bg-gray-50">
                      <div className="text-sm text-gray-600 mb-3">
                        Search and select users to send message to
                      </div>
                      <div className="space-y-2">
                        {users && users.length > 0 ? (
                          users.map(user => (
                            <label key={user._id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, user._id]);
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </label>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No users available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="bulk-message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message Content
                </label>
                <textarea
                  id="bulk-message"
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="Enter your message here. This will be sent to all users..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="6"
                  maxLength="2000"
                  required
                />
                <div className="mt-2 flex justify-between">
                  <span className="text-sm text-gray-500">
                    {bulkMessage.length}/2000 characters
                  </span>
                  {bulkMessage.length > 1800 && (
                    <span className="text-sm text-orange-600">Character limit warning</span>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Important Notes:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ This message will appear in every user's message inbox</li>
                  <li>✓ Users will receive notifications about this message</li>
                  <li>✓ This is a broadcast message, users cannot reply directly to you through it</li>
                  <li>✓ Make sure your message is appropriate and clear</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={bulkMessageLoading || !bulkMessage.trim()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition"
              >
                <FiSend size={20} />
                {bulkMessageLoading ? 'Sending to all users...' : 'Send to All Users'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
