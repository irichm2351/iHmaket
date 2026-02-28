import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceAPI } from '../utils/api';
import useAuthStore from '../store/authStore';
import { nigeriaData } from '../utils/nigeriaData';
import toast from 'react-hot-toast';
import { FiUpload, FiX } from 'react-icons/fi';

const categories = [
  'Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting',
  'Beauty & Makeup', 'Catering', 'Photography', 'Tutoring',
  'IT & Tech Support', 'Home Repair', 'Gardening',
  'Moving & Delivery', 'Event Planning', 'Health & Fitness', 'Other'
];

const PostService = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: {
      amount: '',
      negotiable: false,
    },
    location: {
      city: '',
      state: '',
      lga: '',
      address: '',
    },
    availability: 'Available',
  });

  // Check if user is allowed to post services
  useEffect(() => {
    if (user?.role !== 'provider' || !user?.isVerified) {
      toast.error('Only verified service providers can post services');
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('price.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        price: {
          ...formData.price,
          [field]: type === 'checkbox' ? checked : value,
        },
      });
    } else if (name.includes('location.')) {
      const field = name.split('.')[1];
      const updatedLocation = {
        ...formData.location,
        [field]: value,
      };
      
      // Reset dependent fields when state changes
      if (field === 'state') {
        updatedLocation.city = '';
        updatedLocation.lga = '';
      }
      // Reset LGA when city changes
      if (field === 'city') {
        updatedLocation.lga = '';
      }
      
      setFormData({
        ...formData,
        location: updatedLocation,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Get available cities for selected state
  const getAvailableCities = () => {
    const state = formData.location.state;
    if (!state || !nigeriaData[state]) return [];
    return nigeriaData[state].cities || [];
  };

  // Get available LGAs for selected state
  const getAvailableLGAs = () => {
    const state = formData.location.state;
    if (!state || !nigeriaData[state]) return [];
    return nigeriaData[state].lgas || [];
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!images.length) {
      toast.error('Please add at least one image');
      return;
    }

    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('price', JSON.stringify(formData.price));
      formDataToSend.append('location', JSON.stringify(formData.location));
      formDataToSend.append('availability', formData.availability);
      
      images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      await serviceAPI.createService(formDataToSend);
      toast.success('Service posted successfully!');
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 402) {
        toast.error(error.response?.data?.message || 'Subscription required');
        navigate('/subscription');
      } else {
        toast.error(error.response?.data?.message || 'Failed to post service');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Post a New Service</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="service-title" className="block text-sm font-medium mb-2">Service Title *</label>
          <input
            id="service-title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength="100"
            className="input"
            placeholder="e.g., Professional Home Cleaning Service"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="service-description" className="block text-sm font-medium mb-2">Description *</label>
          <textarea
            id="service-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="6"
            maxLength="2000"
            className="input"
            placeholder="Describe your service in detail..."
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="service-category" className="block text-sm font-medium mb-2">Category *</label>
          <select
            id="service-category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="input"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="service-price" className="block text-sm font-medium mb-2">Price (₦) *</label>
            <input
              id="service-price"
              type="number"
              name="price.amount"
              value={formData.price.amount}
              onChange={handleChange}
              required
              min="0"
              className="input"
              placeholder="0"
            />
          </div>
          <div className="flex items-center">
            <label htmlFor="price-negotiable" className="flex items-center cursor-pointer">
              <input
                id="price-negotiable"
                type="checkbox"
                name="price.negotiable"
                checked={formData.price.negotiable}
                onChange={handleChange}
                className="mr-2 w-4 h-4"
              />
              <span className="text-sm font-medium">Price is negotiable</span>
            </label>
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* State */}
          <div>
            <label htmlFor="service-state" className="block text-sm font-medium mb-2">State *</label>
            <select
              id="service-state"
              name="location.state"
              value={formData.location.state}
              onChange={handleChange}
              required
              className="input"
            >
              <option value="">Select a state</option>
              {Object.keys(nigeriaData).sort().map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label htmlFor="service-city" className="block text-sm font-medium mb-2">City *</label>
            <select
              id="service-city"
              name="location.city"
              value={formData.location.city}
              onChange={handleChange}
              disabled={!formData.location.state}
              required
              className="input"
            >
              <option value="">
                {formData.location.state ? 'Select a city' : 'Select a state first'}
              </option>
              {getAvailableCities().map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* LGA / Local Government Area */}
        <div>
          <label htmlFor="service-lga" className="block text-sm font-medium mb-2">Local Government Area (LGA)</label>
          <select
            id="service-lga"
            name="location.lga"
            value={formData.location.lga || ''}
            onChange={handleChange}
            disabled={!formData.location.state}
            className="input"
          >
            <option value="">
              {formData.location.state ? 'Select LGA (Optional)' : 'Select a state first'}
            </option>
            {getAvailableLGAs().map((lga) => (
              <option key={lga} value={lga}>{lga}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="service-address" className="block text-sm font-medium mb-2">Address (Optional)</label>
          <input
            id="service-address"
            type="text"
            name="location.address"
            value={formData.location.address}
            onChange={handleChange}
            autoComplete="street-address"
            className="input"
            placeholder="Full address"
          />
        </div>

        {/* Availability */}
        <div>
          <label htmlFor="service-availability" className="block text-sm font-medium mb-2">Availability</label>
          <select
            id="service-availability"
            name="availability"
            value={formData.availability}
            onChange={handleChange}
            className="input"
          >
            <option value="Available">Available</option>
            <option value="Busy">Busy</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Images * (Maximum 5)
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              aria-label="Upload images"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer flex flex-col items-center w-full"
            >
              <FiUpload className="text-gray-400 mb-2" size={32} />
              <span className="text-sm text-gray-600">
                Click to upload images
              </span>
            </button>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn btn-primary"
          >
            {loading ? 'Posting...' : 'Post Service'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostService;
