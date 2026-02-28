import { Link } from 'react-router-dom';
import { FiMapPin, FiStar, FiHeart } from 'react-icons/fi';
import { useState } from 'react';
import { userAPI, getImageUrl } from '../utils/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const ServiceCard = ({ service, showProvider = true }) => {
  const { isAuthenticated } = useAuthStore();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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
    <Link to={`/services/${service._id}`} className="card overflow-hidden group block">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img
          src={getImageUrl(service.images?.[0]?.url)}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        
        {/* Save Button */}
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

        {/* Featured Badge */}
        {service.isFeatured && (
          <span className="absolute top-3 left-3 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
            Featured
          </span>
        )}

        {/* Image Count */}
        {service.images?.length > 1 && (
          <span className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs font-semibold">
            {service.images.length} images
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full mb-2">
          {service.category}
        </span>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {service.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {service.description}
        </p>

        {/* Provider Info */}
        {showProvider && service.providerId && (
          <div className="flex items-center space-x-2 mb-3">
            <img
              src={service.providerId.profilePic || 'https://via.placeholder.com/32'}
              alt={service.providerId.name}
              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary-400 transition"
              onClick={(e) => {
                e.preventDefault();
                const imageUrl = getImageUrl(service.providerId.profilePic);
                if (imageUrl) {
                  window.open(imageUrl, '_self');
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
        <div className="flex items-center justify-between pt-3 border-t">
          {/* Price */}
          <div>
            <span className="text-2xl font-bold text-primary-600">
              ₦{service.price?.amount?.toLocaleString()}
            </span>
            {service.price?.negotiable && (
              <span className="text-xs text-gray-500 ml-1">(Negotiable)</span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-1">
            <FiStar className="text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium">
              {service.rating?.toFixed(1) || '0.0'}
            </span>
            <span className="text-xs text-gray-500">
              ({service.totalReviews || 0})
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-500 mt-2">
          <FiMapPin size={14} className="mr-1" />
          {service.location?.city}, {service.location?.state}
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard;
