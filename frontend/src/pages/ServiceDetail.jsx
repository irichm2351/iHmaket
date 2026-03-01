import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiMapPin, FiStar, FiCalendar, FiMessageSquare, FiPhone, FiMail, FiFlag } from 'react-icons/fi';
import { serviceAPI, reviewAPI, bookingAPI, reportAPI, getImageUrl } from '../utils/api';
import useAuthStore from '../store/authStore';
import Loader from '../components/Loader';
import ImageCarousel from '../components/ImageCarousel';
import toast from 'react-hot-toast';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    reason: '',
    description: '',
  });
  const [reportingLoading, setReportingLoading] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [bookingData, setBookingData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    location: { address: '', city: '', state: '' },
    notes: '',
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      toast.error('Please login to view service details');
      navigate('/login', { replace: true });
      return;
    }
    
    fetchServiceDetails();
    fetchReviews();
  }, [id, isAuthenticated, navigate]);

  const fetchServiceDetails = async () => {
    try {
      const response = await serviceAPI.getServiceById(id);
      setService(response.data.service);
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error('Service not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getServiceReviews(id, { limit: 5 });
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to book a service');
      return;
    }

    try {
      await bookingAPI.createBooking({
        serviceId: service._id,
        providerId: service.providerId._id,
        ...bookingData,
        price: { amount: service.price.amount, currency: service.price.currency },
      });

      toast.success('Booking request sent successfully!');
      setShowBookingModal(false);
      setBookingData({
        scheduledDate: '',
        scheduledTime: '',
        location: { address: '', city: '', state: '' },
        notes: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleReportProvider = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to report a provider');
      navigate('/login');
      return;
    }

    if (!reportData.reason || !reportData.description.trim()) {
      toast.error('Please provide a reason and description');
      return;
    }

    try {
      setReportingLoading(true);
      
      await reportAPI.createReport({
        providerId: service.providerId._id,
        serviceId: service._id,
        reason: reportData.reason,
        description: reportData.description
      });
      
      toast.success('Report submitted successfully. Our team will review it shortly.');
      setShowReportModal(false);
      setReportData({ reason: '', description: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setReportingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h2>
          <Link to="/services" className="text-primary-600 hover:text-primary-700">
            Browse Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Images Carousel */}
          <ImageCarousel images={service.images} title={service.title} />

          {/* Service Info */}
          <div className="card p-6 mb-6">
            <span className="badge bg-primary-100 text-primary-700 mb-4">
              {service.category}
            </span>

            <h1 className="text-3xl font-bold mb-4">{service.title}</h1>

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center">
                <FiStar className="text-yellow-400 fill-yellow-400 mr-1" />
                <span className="font-semibold">{service.rating?.toFixed(1)}</span>
                <span className="text-gray-500 ml-1">({service.totalReviews} reviews)</span>
              </div>
              <div className="flex items-center text-gray-600">
                <FiMapPin className="mr-1" />
                {service.location?.lga || service.location?.city}, {service.location?.state}
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{service.description}</p>
          </div>

          {/* Reviews */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Reviews</h2>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start space-x-3">
                      <img
                        src={review.customerId?.profilePic || 'https://via.placeholder.com/40'}
                        alt={review.customerId?.name}
                        className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-primary-400 transition"
                        onClick={() => {
                          const imageUrl = getImageUrl(review.customerId?.profilePic);
                          if (imageUrl) {
                            setViewingImage(imageUrl);
                          }
                        }}
                        title="View picture"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{review.customerId?.name}</span>
                          <div className="flex items-center">
                            <FiStar className="text-yellow-400 fill-yellow-400 mr-1" size={16} />
                            <span>{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No reviews yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Price & Booking */}
          <div className="card p-6 mb-6">
            <div className="mb-6">
              <div className="text-3xl font-bold text-primary-600 mb-1">
                ₦{service.price?.amount?.toLocaleString()}
              </div>
              {service.price?.negotiable && (
                <span className="text-sm text-gray-600">Negotiable</span>
              )}
            </div>

            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full btn btn-primary mb-3 flex items-center justify-center"
            >
              <FiCalendar className="mr-2" />
              Book Now
            </button>

            <Link
              to={`/messages/${service.providerId?._id}`}
              className="w-full btn btn-outline flex items-center justify-center"
            >
              <FiMessageSquare className="mr-2" />
              Message Provider
            </Link>
          </div>

          {/* Provider Info */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Service Provider</h3>

            <div className="flex items-center space-x-3 mb-4">
              <img
                src={service.providerId?.profilePic || 'https://via.placeholder.com/60'}
                alt={service.providerId?.name}
                className="w-16 h-16 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary-400 transition"
                onClick={() => {
                  const imageUrl = getImageUrl(service.providerId?.profilePic);
                  if (imageUrl) {
                    setViewingImage(imageUrl);
                  }
                }}
                title="View picture"
              />
              <div>
                <Link
                  to={`/providers/${service.providerId?._id}`}
                  className="font-semibold text-lg hover:text-primary-600"
                >
                  {service.providerId?.name}
                </Link>
                <div className="flex items-center text-sm">
                  <FiStar className="text-yellow-400 fill-yellow-400 mr-1" size={14} />
                  <span>{service.providerId?.rating?.toFixed(1)} ({service.providerId?.totalReviews} reviews)</span>
                </div>
              </div>
            </div>

            {service.providerId?.bio && (
              <p className="text-sm text-gray-600 mb-4">{service.providerId.bio}</p>
            )}

            <div className="space-y-2 text-sm">
              {service.providerId?.phone && (
                <div className="flex items-center text-gray-600">
                  <FiPhone className="mr-2" />
                  {service.providerId.phone}
                </div>
              )}
              {service.providerId?.email && (
                <div className="flex items-center text-gray-600">
                  <FiMail className="mr-2" />
                  {service.providerId.email}
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <FiMapPin className="mr-2" />
                {service.providerId?.location?.lga || service.providerId?.location?.city}, {service.providerId?.location?.state}
              </div>
            </div>

            {/* Report Button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full mt-4 btn btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center justify-center"
            >
              <FiFlag className="mr-2" />
              Report Provider
            </button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Book Service</h2>
            
            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label htmlFor="booking-date" className="block text-sm font-medium mb-1">Date</label>
                <input
                  id="booking-date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingData.scheduledDate}
                  onChange={(e) => setBookingData({ ...bookingData, scheduledDate: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="booking-time" className="block text-sm font-medium mb-1">Time</label>
                <input
                  id="booking-time"
                  type="time"
                  required
                  value={bookingData.scheduledTime}
                  onChange={(e) => setBookingData({ ...bookingData, scheduledTime: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="booking-address" className="block text-sm font-medium mb-1">Location Address</label>
                <input
                  id="booking-address"
                  type="text"
                  required
                  value={bookingData.location.address}
                  onChange={(e) => setBookingData({ ...bookingData, location: { ...bookingData.location, address: e.target.value } })}
                  className="input"
                  placeholder="Full address"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="booking-city" className="block text-sm font-medium mb-1">City</label>
                  <input
                    id="booking-city"
                    type="text"
                    required
                    value={bookingData.location.city}
                    onChange={(e) => setBookingData({ ...bookingData, location: { ...bookingData.location, city: e.target.value } })}
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="booking-state" className="block text-sm font-medium mb-1">State</label>
                  <input
                    id="booking-state"
                    type="text"
                    required
                    value={bookingData.location.state}
                    onChange={(e) => setBookingData({ ...bookingData, location: { ...bookingData.location, state: e.target.value } })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="booking-notes" className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Any special requirements..."
                />
              </div>

              <div className="flex space-x-3">
                <button type="submit" className="flex-1 btn btn-primary">
                  Confirm Booking
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Provider Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-2">Report Provider</h2>
            <p className="text-gray-600 text-sm mb-4">
              Please describe the issue with this provider. Our team will review your report.
            </p>
            
            <form onSubmit={handleReportProvider} className="space-y-4">
              <div>
                <label htmlFor="report-reason" className="block text-sm font-medium mb-2">Reason *</label>
                <select
                  id="report-reason"
                  required
                  value={reportData.reason}
                  onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                  className="input"
                >
                  <option value="">Select a reason</option>
                  <option value="Spam">Spam</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Scam/Fraud">Scam/Fraud</option>
                  <option value="Poor Service">Poor Service</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="report-description" className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  id="report-description"
                  required
                  value={reportData.description}
                  onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                  className="input"
                  rows="4"
                  placeholder="Please provide details about the issue..."
                  minLength={10}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={reportingLoading}
                  className="flex-1 btn btn-primary"
                >
                  {reportingLoading ? 'Submitting...' : 'Submit Report'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportData({ reason: '', description: '' });
                  }}
                  className="flex-1 btn btn-secondary"
                  disabled={reportingLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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

export default ServiceDetail;
