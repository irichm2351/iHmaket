import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { serviceAPI } from '../utils/api';
import { nigeriaData } from '../utils/nigeriaData';
import toast from 'react-hot-toast';
import { FiUpload, FiX } from 'react-icons/fi';

const categories = [
  'Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting',
  'Beauty & Makeup', 'Catering', 'Photography', 'Tutoring',
  'IT & Tech Support', 'Home Repair', 'Gardening',
  'Moving & Delivery', 'Event Planning', 'Health & Fitness', 'Other'
];

const EditService = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
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

  // Fetch service data on mount
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await serviceAPI.getServiceById(id);
        const service = response.data.service;

        setFormData({
          title: service.title,
          description: service.description,
          category: service.category,
          price: service.price,
          location: service.location,
          availability: service.availability,
        });

        setExistingImages(service.images || []);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to load service');
        navigate('/dashboard');
      }
    };

    fetchService();
  }, [id, navigate]);

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
    const totalImages = existingImages.length - imagesToRemove.length + newImages.length + files.length;
    
    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setNewImages([...newImages, ...files]);
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    if (!imagesToRemove.includes(index)) {
      setImagesToRemove([...imagesToRemove, index]);
    }
  };

  const restoreExistingImage = (index) => {
    setImagesToRemove(imagesToRemove.filter(i => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalImages = existingImages.length - imagesToRemove.length + newImages.length;
    if (totalImages === 0) {
      toast.error('Service must have at least one image');
      return;
    }

    setSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('price', JSON.stringify(formData.price));
      formDataToSend.append('location', JSON.stringify(formData.location));
      formDataToSend.append('availability', formData.availability);
      
      if (imagesToRemove.length > 0) {
        formDataToSend.append('imagesToRemove', JSON.stringify(imagesToRemove));
      }

      newImages.forEach((image) => {
        formDataToSend.append('images', image);
      });

      await serviceAPI.updateService(id, formDataToSend);
      toast.success('Service updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 402) {
        toast.error(error.response?.data?.message || 'Subscription required');
        navigate('/subscription');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update service');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    try {
      await serviceAPI.deleteService(id);
      toast.success('Service deleted successfully!');
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 402) {
        toast.error(error.response?.data?.message || 'Subscription required');
        navigate('/subscription');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete service');
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Loading service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Service</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Service Title *</label>
          <input
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
          <label className="block text-sm font-medium mb-2">Description *</label>
          <textarea
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
          <label className="block text-sm font-medium mb-2">Category *</label>
          <select
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
            <label className="block text-sm font-medium mb-2">Price (₦) *</label>
            <input
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
            <label className="flex items-center cursor-pointer">
              <input
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
            <label className="block text-sm font-medium mb-2">State *</label>
            <select
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
            <label className="block text-sm font-medium mb-2">City *</label>
            <select
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
          <label className="block text-sm font-medium mb-2">Local Government Area (LGA)</label>
          <select
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
          <label className="block text-sm font-medium mb-2">Address (Optional)</label>
          <input
            type="text"
            name="location.address"
            value={formData.location.address}
            onChange={handleChange}
            className="input"
            placeholder="Full address"
          />
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium mb-2">Availability</label>
          <select
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

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Current Images</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {existingImages.map((image, index) => (
                <div 
                  key={index} 
                  className={`relative ${imagesToRemove.includes(index) ? 'opacity-50' : ''}`}
                >
                  <img
                    src={image.url}
                    alt={`Current ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  {!imagesToRemove.includes(index) ? (
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      title="Remove image"
                    >
                      <FiX size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => restoreExistingImage(index)}
                      className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 hover:bg-green-600"
                      title="Restore image"
                    >
                      <span className="text-sm font-bold">✓</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Add More Images (Maximum 5 total)
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <FiUpload className="text-gray-400 mb-2" size={32} />
              <span className="text-sm text-gray-600">
                Click to add more images
              </span>
            </label>
          </div>

          {/* New Image Previews */}
          {newImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {newImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`New ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 btn btn-primary"
          >
            {submitting ? 'Updating...' : 'Update Service'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 btn btn-secondary"
          >
            Cancel
          </button>
        </div>

        {/* Delete Button */}
        <div className="pt-4 border-t">
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="w-full btn bg-red-600 hover:bg-red-700 text-white"
          >
            {submitting ? 'Deleting...' : 'Delete Service'}
          </button>
          <p className="text-xs text-gray-500 mt-2">This action cannot be undone.</p>
        </div>
      </form>
    </div>
  );
};

export default EditService;
