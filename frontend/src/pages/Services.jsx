import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX, FiGrid, FiList } from 'react-icons/fi';
import { serviceAPI } from '../utils/api';
import ServiceCard from '../components/ServiceCard';
import Loader from '../components/Loader';

const categories = [
  'All',
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Carpentry',
  'Painting',
  'Beauty & Makeup',
  'Catering',
  'Photography',
  'Tutoring',
  'IT & Tech Support',
  'Home Repair',
  'Gardening',
  'Moving & Delivery',
  'Event Planning',
  'Health & Fitness',
  'Other'
];

const Services = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    // Load view mode from localStorage or default to 'grid'
    return localStorage.getItem('serviceViewMode') || 'grid';
  });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'All',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1,
  });

  useEffect(() => {
    fetchServices();
  }, [filters]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        category: filters.category === 'All' ? '' : filters.category,
      };
      
      const response = await serviceAPI.getServices(params);
      setServices(response.data.services);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value, page: 1 };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) params.set(key, newFilters[key]);
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    const resetFilters = {
      search: '',
      category: 'All',
      city: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      page: 1,
    };
    setFilters(resetFilters);
    setSearchParams({});
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('serviceViewMode', mode);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Browse Services</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewModeChange('grid')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'grid'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Grid view"
            aria-label="Grid view"
          >
            <FiGrid size={20} />
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'list'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="List view"
            aria-label="List view"
          >
            <FiList size={20} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden btn btn-secondary flex items-center"
          >
            <FiFilter className="mr-2" />
            Filters
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className={`md:w-64 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="card p-4 sticky top-20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Clear All
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Keywords..."
                className="input text-sm"
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Enter city..."
                className="input text-sm"
              />
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="Min"
                  className="input text-sm"
                />
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="Max"
                  className="input text-sm"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="input text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="py-20">
              <Loader size="lg" />
            </div>
          ) : services.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Showing {services.length} of {pagination.total} services
              </div>

              <div className={
                viewMode === 'list'
                  ? 'space-y-2'
                  : 'grid grid-cols-2 lg:grid-cols-4 gap-2'
              }>
                {services.map((service) => (
                  <div key={service._id} className={viewMode === 'list' ? 'h-32' : ''}>
                    <ServiceCard service={service} viewMode={viewMode} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handleFilterChange('page', page)}
                      className={`px-4 py-2 rounded-lg ${
                        filters.page === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-gray-500">No services found</p>
              <button
                onClick={clearFilters}
                className="mt-4 btn btn-primary"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;
