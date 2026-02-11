import { Link } from 'react-router-dom';
import { FiCalendar, FiMessageSquare, FiHeart, FiPlus, FiStar, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { serviceAPI, bookingAPI } from '../utils/api';
import Loader from '../components/Loader';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    services: 0,
    bookings: 0,
    pendingBookings: 0,
  });
  const [recentServices, setRecentServices] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (user.role === 'provider') {
        const servicesResponse = await serviceAPI.getProviderServices(user._id);
        setRecentServices(servicesResponse.data.services.slice(0, 3));
        setStats(prev => ({ ...prev, services: servicesResponse.data.services.length }));
      }

      const bookingsResponse = await bookingAPI.getMyBookings({});
      setRecentBookings(bookingsResponse.data.bookings.slice(0, 5));
      setStats(prev => ({
        ...prev,
        bookings: bookingsResponse.data.bookings.length,
        pendingBookings: bookingsResponse.data.bookings.filter(b => b.status === 'pending').length,
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      try {
        await serviceAPI.deleteService(serviceId);
        toast.success('Service deleted successfully');
        setRecentServices(recentServices.filter(s => s._id !== serviceId));
        setStats(prev => ({ ...prev, services: prev.services - 1 }));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting service');
        console.error('Error deleting service:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600">
          {user.role === 'provider' ? 'Manage your services and bookings' : 'Track your bookings and saved services'}
        </p>
      </div>

      {/* Warning for customers or unverified providers */}
      {(user.role === 'customer' || (user.role === 'provider' && !user.isVerified)) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">Want to offer services?</h3>
          <p className="text-blue-800 text-sm mb-3">
            {user.role === 'customer' 
              ? 'Become a service provider by submitting your KYC verification.'
              : 'Your account needs KYC verification before you can post services.'}
          </p>
          <Link
            to="/profile"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            {user.role === 'customer' ? 'Become Service Provider' : 'Complete KYC Verification'}
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {user.role === 'provider' && (
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Services</p>
                <p className="text-3xl font-bold">{stats.services}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <FiPlus className="text-primary-600" size={24} />
              </div>
            </div>
          </div>
        )}

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Bookings</p>
              <p className="text-3xl font-bold">{stats.bookings}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiCalendar className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Pending Requests</p>
              <p className="text-3xl font-bold">{stats.pendingBookings}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiMessageSquare className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          to="/bookings"
          className="card p-6 text-center hover:shadow-lg transition"
        >
          <FiCalendar className="mx-auto mb-3 text-primary-600" size={32} />
          <h3 className="font-semibold">My Bookings</h3>
        </Link>

        <Link
          to="/messages"
          className="card p-6 text-center hover:shadow-lg transition"
        >
          <FiMessageSquare className="mx-auto mb-3 text-primary-600" size={32} />
          <h3 className="font-semibold">Messages</h3>
        </Link>

        <Link
          to="/saved"
          className="card p-6 text-center hover:shadow-lg transition"
        >
          <FiHeart className="mx-auto mb-3 text-primary-600" size={32} />
          <h3 className="font-semibold">Saved Services</h3>
        </Link>

        {user.role === 'provider' && (
          <Link
            to="/post-service"
            className="card p-6 text-center hover:shadow-lg transition bg-primary-50"
          >
            <FiPlus className="mx-auto mb-3 text-primary-600" size={32} />
            <h3 className="font-semibold text-primary-600">Post New Service</h3>
          </Link>
        )}
      </div>

      {/* Recent Services (Providers Only) */}
      {user.role === 'provider' && (
        <div className="card p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">My Service Ads</h2>
              <p className="text-gray-600 text-sm mt-1">Manage and monitor your posted services</p>
            </div>
            <Link 
              to="/post-service"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition inline-flex items-center gap-2"
            >
              <FiPlus size={18} />
              New Service
            </Link>
          </div>

          {recentServices.length > 0 ? (
            <div className="space-y-3">
              {recentServices.map((service) => (
                <div
                  key={service._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <Link
                    to={`/services/${service._id}`}
                    className="flex items-center space-x-4 flex-1"
                  >
                    <img
                      src={service.images?.[0]?.url || 'https://via.placeholder.com/60'}
                      alt={service.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold">{service.title}</h3>
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <span className="flex items-center">
                          <FiStar className="mr-1 text-yellow-400 fill-yellow-400" size={14} />
                          {service.rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="flex items-center">
                          <FiEye className="mr-1" size={14} />
                          {service.views} views
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-primary-600">₦{service.price.amount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        service.availability === 'Available' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {service.availability}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/edit-service/${service._id}`}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                        title="Edit service"
                      >
                        <FiEdit2 size={18} />
                      </Link>
                      <button
                        onClick={() => handleDeleteService(service._id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        title="Delete service"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiPlus className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600 font-medium">No service ads yet</p>
              <p className="text-gray-500 text-sm mb-4">Start by posting your first service to reach customers</p>
              <Link 
                to="/post-service"
                className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Create Your First Service
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Bookings</h2>
            <Link to="/bookings" className="text-primary-600 hover:text-primary-700 text-sm">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Service</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking._id} className="border-b last:border-0">
                    <td className="py-3 px-4">{booking.serviceId?.title}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(booking.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      ₦{booking.price.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
