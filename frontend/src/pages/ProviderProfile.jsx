import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiMapPin, FiStar, FiMail, FiPhone, FiCalendar, FiMessageSquare, FiAward } from 'react-icons/fi';
import { userAPI, serviceAPI, reviewAPI, getImageUrl } from '../utils/api';
import useAuthStore from '../store/authStore';
import ServiceCard from '../components/ServiceCard';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const ProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const [viewingImage, setViewingImage] = useState(null);

  useEffect(() => {
    fetchProviderData();
  }, [id]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      const [providerRes, servicesRes, reviewsRes] = await Promise.all([
        userAPI.getUserById(id),
        serviceAPI.getServicesByProvider(id),
        reviewAPI.getProviderReviews(id)
      ]);

      setProvider(providerRes.data.user);
      setServices(servicesRes.data.services);
      setReviews(reviewsRes.data.reviews);
    } catch (error) {
      console.error('Error fetching provider data:', error);
      toast.error('Failed to load provider profile');
    } finally {
      setLoading(false);
    }
  };

  const handleContactProvider = () => {
    if (!isAuthenticated) {
      toast.error('Please login to contact providers');
      navigate('/login');
      return;
    }

    navigate('/messages', { state: { providerId: id } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Provider Not Found</h2>
          <p className="text-gray-600 mb-4">The provider you're looking for doesn't exist.</p>
          <Link to="/services" className="btn btn-primary">
            Browse Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Provider Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <img
              src={getImageUrl(provider.profilePic)}
              alt={provider.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-primary-100 cursor-pointer hover:ring-2 hover:ring-primary-400 transition"
              onClick={() => {
                const imageUrl = getImageUrl(provider.profilePic);
                if (imageUrl) {
                  setViewingImage(imageUrl);
                }
              }}
              title="View picture"
            />
          </div>

          {/* Provider Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{provider.name}</h1>
                <div className="flex items-center space-x-4 text-gray-600 mb-2">
                  {provider.location?.city && (
                    <div className="flex items-center">
                      <FiMapPin className="mr-1" />
                      <span>{provider.location.city}, {provider.location.state}</span>
                    </div>
                  )}
                  {provider.rating > 0 && (
                    <div className="flex items-center">
                      <FiStar className="text-yellow-400 mr-1" />
                      <span className="font-semibold">{provider.rating.toFixed(1)}</span>
                      <span className="ml-1">({provider.totalReviews} reviews)</span>
                    </div>
                  )}
                </div>
                {provider.isVerified && (
                  <div className="flex items-center text-green-600">
                    <FiAward className="mr-1" />
                    <span className="text-sm font-medium">Verified Provider</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleContactProvider}
                className="btn btn-primary flex items-center"
              >
                <FiMessageSquare className="mr-2" />
                Contact Provider
              </button>
            </div>

            {provider.bio && (
              <p className="text-gray-700 mb-4">{provider.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {provider.email && (
                <div className="flex items-center">
                  <FiMail className="mr-2" />
                  <span>{provider.email}</span>
                </div>
              )}
              {provider.phone && (
                <div className="flex items-center">
                  <FiPhone className="mr-2" />
                  <span>{provider.phone}</span>
                </div>
              )}
              <div className="flex items-center">
                <FiCalendar className="mr-2" />
                <span>Member since {new Date(provider.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('services')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'services'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'reviews'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'services' && (
        <div>
          {services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No services available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard key={service._id} service={service} showProvider={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div>
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src={getImageUrl(review.customerId?.profilePic)}
                        alt={review.customerId?.name}
                        className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary-400 transition"
                        onClick={() => {
                          const imageUrl = getImageUrl(review.customerId?.profilePic);
                          if (imageUrl) {
                            setViewingImage(imageUrl);
                          }
                        }}
                        title="View picture"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {review.customerId?.name}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500">
                          <FiCalendar className="mr-1" />
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, index) => (
                        <FiStar
                          key={index}
                          className={`${
                            index < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {review.serviceId && (
                    <Link
                      to={`/services/${review.serviceId._id}`}
                      className="text-sm text-primary-600 hover:text-primary-700 mb-2 inline-block"
                    >
                      Service: {review.serviceId.title}
                    </Link>
                  )}

                  <p className="text-gray-700 mb-3">{review.comment}</p>

                  {review.response && (
                    <div className="bg-gray-50 rounded-lg p-4 mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        Response from provider:
                      </p>
                      <p className="text-sm text-gray-600">{review.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-lg font-medium"
            >
              Close (ESC)
            </button>
            <img
              src={viewingImage}
              alt="Profile"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderProfile;
