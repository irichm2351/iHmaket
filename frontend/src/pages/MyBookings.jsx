import { useState, useEffect } from 'react';
import { bookingAPI, reviewAPI, getImageUrl } from '../utils/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { FiCalendar, FiMapPin, FiClock, FiStar, FiX } from 'react-icons/fi';
import useAuthStore from '../store/authStore';

const MyBookings = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await bookingAPI.getMyBookings(params);
      setBookings(response.data.bookings);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await bookingAPI.updateBookingStatus(bookingId, status);
      toast.success(`Booking ${status} successfully`);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update booking');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await bookingAPI.cancelBooking(bookingId, 'Cancelled by user');
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setReviewData({ rating: 5, comment: '' });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewData.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    if (reviewData.comment.trim().length < 10) {
      toast.error('Review must be at least 10 characters');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewAPI.createReview({
        serviceId: selectedBooking.serviceId._id,
        providerId: selectedBooking.providerId._id,
        bookingId: selectedBooking._id,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 border-b">
        {['all', 'pending', 'accepted', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium capitalize transition ${
              filter === status
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20">
          <Loader size="lg" />
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="card p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Service Image */}
                <img
                  src={getImageUrl(booking.serviceId?.images?.[0]?.url)}
                  alt={booking.serviceId?.title}
                  className="w-full md:w-48 h-48 object-cover rounded-lg"
                />

                {/* Booking Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">
                        {booking.serviceId?.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {user.role === 'provider' ? 'Customer' : 'Provider'}: {' '}
                        {user.role === 'provider' 
                          ? booking.customerId?.name 
                          : booking.providerId?.name}
                      </p>
                    </div>
                    <span className={`badge ${
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      booking.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                      booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <FiCalendar className="mr-2" />
                      {new Date(booking.scheduledDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiClock className="mr-2" />
                      {booking.scheduledTime}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiMapPin className="mr-2" />
                      {booking.location.address}
                    </div>
                    <div className="font-semibold text-primary-600">
                      ₦{booking.price.amount.toLocaleString()}
                    </div>
                  </div>

                  {booking.notes && (
                    <p className="text-sm text-gray-600 mb-4">
                      <span className="font-medium">Notes:</span> {booking.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {user.role === 'provider' && booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(booking._id, 'accepted')}
                          className="btn btn-primary text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking._id, 'rejected')}
                          className="btn btn-secondary text-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {user.role === 'provider' && booking.status === 'accepted' && (
                      <button
                        onClick={() => handleUpdateStatus(booking._id, 'completed')}
                        className="btn btn-primary text-sm"
                      >
                        Mark as Completed
                      </button>
                    )}

                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="btn bg-red-600 text-white hover:bg-red-700 text-sm"
                      >
                        Cancel Booking
                      </button>
                    )}

                    {user.role === 'customer' && booking.status === 'completed' && (
                      <button
                        onClick={() => openReviewModal(booking)}
                        className="btn bg-yellow-600 text-white hover:bg-yellow-700 text-sm flex items-center"
                      >
                        <FiStar className="mr-1" size={16} />
                        Rate Provider
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl text-gray-500">No bookings found</p>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Rate Service Provider</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Provider: {selectedBooking.providerId?.name}</h3>
              <p className="text-sm text-gray-600">Service: {selectedBooking.serviceId?.title}</p>
            </div>

            {/* Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating (1-5 stars)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    type="button"
                    aria-label={`Rate ${star} stars`}
                    className={`text-3xl transition ${
                      star <= reviewData.rating
                        ? 'text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  >
                    <FiStar fill={star <= reviewData.rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
                Your Review (minimum 10 characters)
              </label>
              <textarea
                id="review-comment"
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                placeholder="Share your experience with this service provider..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none"
                rows="4"
              />
              <p className="text-xs text-gray-500 mt-1">
                {reviewData.comment.length} characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                disabled={submittingReview}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
