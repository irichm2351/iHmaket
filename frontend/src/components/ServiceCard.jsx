import { Link } from 'react-router-dom';
import { FiMapPin, FiStar, FiHeart } from 'react-icons/fi';
import { useState } from 'react';
import { userAPI, getImageUrl } from '../utils/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const ServiceCard = ({ service, showProvider = true, viewMode = 'grid' }) => {
  const { isAuthenticated } = useAuthStore();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to save services');
      return;
    }

    setSaving(true);
    try {
      const response = await userAPI.toggleSaveService(service._id);
      setIsSaved(response.data.saved);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Link to={`/services/${service._id}`} className={`card overflow-hidden group block ${
      viewMode === 'list' ? 'flex' : ''
    }`}>
      {/* Image */}
      <div className={`${
        viewMode === 'list'
          ? 'w-32 h-32 flex-shrink-0 overflow-hidden'
          : 'relative'
      } bg-gray-200`}>
        <img
          src={getImageUrl(service.images?.[0]?.url)}
          alt={service.title}
          className={`${
            viewMode === 'list'
              ? 'w-full h-full object-cover'
              : 'w-full h-auto'
          }`}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        
        {/* Save Button */}
        {viewMode !== 'list' && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
          >
            <FiHeart
              size={20}
              className={isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}
            />
          </button>
        )}

        {/* Featured Badge */}
        {service.isFeatured && (
          <span className={`absolute ${
            viewMode === 'list' ? 'top-1 left-1' : 'top-3 left-3'
          } bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full text-xs font-semibold`}>
            Featured
          </span>
        )}

        {/* Image Count */}
        {service.images?.length > 1 && viewMode !== 'list' && (
          <span className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs font-semibold">
            {service.images.length} images
          </span>
        )}
      </div>

      {/* Content */}
      <div className={`${viewMode === 'list' ? 'flex-1' : ''} p-2`}>
        {/* Category */}
        <span className="inline-block px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full mb-1">
          {service.category}
        </span>

        {/* Title */}
        <h3 className={`font-semibold text-gray-900 mb-1 ${
          viewMode === 'list' ? 'text-base line-clamp-1' : 'text-lg line-clamp-2'
        }`}>
          {service.title}
        </h3>

        {/* Description */}
        {viewMode !== 'list' && (
          <p className="text-sm text-gray-600 mb-1.5 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Provider Info */}
        {showProvider && service.providerId && viewMode !== 'list' && (
          <div className="flex items-center space-x-2 mb-1.5">
            <img
              src={service.providerId.profilePic || 'https://via.placeholder.com/32'}
              alt={service.providerId.name}
              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary-400 transition"
              onClick={(e) => {
                e.preventDefault();
                const imageUrl = getImageUrl(service.providerId.profilePic);
                if (imageUrl) {
                  setViewingImage(imageUrl);
                }
              }}
              title="View picture"
            />
            <span className="text-sm text-gray-700 font-medium">
              {service.providerId.name}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-start justify-between flex-wrap gap-2 ${
          viewMode === 'list' ? '' : 'pt-2 border-t'
        }`}>
          {/* Price Section */}
          <div className="flex flex-col">
            <span className={`font-bold text-primary-600 ${
              viewMode === 'list' ? 'text-lg' : 'text-xl'
            }`}>
              ₦{service.price?.amount?.toLocaleString()}
            </span>
            {service.price?.negotiable && (
              <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded mt-0.5 w-fit">
                Negotiable
              </span>
            )}
          </div>

          {/* Rating Section */}
          <div className="flex flex-col items-end">
            <div className="flex items-center space-x-1">
              <FiStar className="text-yellow-400 fill-yellow-400" size={viewMode === 'list' ? 16 : 18} />
              <span className="text-sm font-bold text-gray-900">
                {service.rating?.toFixed(1) || '0.0'}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              ({service.totalReviews || 0} reviews)
            </span>
          </div>

          {/* Save Button for List View */}
          {viewMode === 'list' && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1 text-gray-600 hover:text-red-500 transition"
              title="Save service"
            >
              <FiHeart
                size={18}
                className={isSaved ? 'fill-red-500 text-red-500' : ''}
              />
            </button>
          )}
        </div>

        {/* Location */}
        {viewMode !== 'list' && (
          <div className="flex items-center text-sm text-gray-500 mt-0.5">
            <FiMapPin size={14} className="mr-1" />
            {service.location?.lga && `${service.location.lga}, `}
            {service.location?.state}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.preventDefault();
            setViewingImage(null);
          }}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.preventDefault();
                setViewingImage(null);
              }}
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
    </Link>
  );
};

export default ServiceCard;
