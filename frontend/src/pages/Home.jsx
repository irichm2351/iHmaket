import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiGrid, FiList } from 'react-icons/fi';
import { serviceAPI } from '../utils/api';
import ServiceCard from '../components/ServiceCard';
import Loader from '../components/Loader';
import useAuthStore from '../store/authStore';
import { nigeriaData } from '../utils/nigeriaData';

const categories = [
  { name: 'Plumbing', icon: '🔧' },
  { name: 'Cleaning', icon: '🧹' },
  { name: 'Beauty & Makeup', icon: '💄' },
  { name: 'IT & Tech Support', icon: '💻' },
  { name: 'Photography', icon: '📷' },
  { name: 'Catering', icon: '🍳' },
  { name: 'Tutoring', icon: '📚' },
  { name: 'Home Repair', icon: '🔨' },
];

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('homeViewMode') || 'grid';
  });

  useEffect(() => {
    fetchFeaturedServices();
  }, []);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('homeViewMode', mode);
  };

  const fetchFeaturedServices = async () => {
    try {
      const response = await serviceAPI.getFeaturedServices();
      setFeaturedServices(response.data.services);
    } catch (error) {
      console.error('Error fetching featured services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (selectedState) {
      params.append('state', selectedState);
    }
    if (searchQuery.trim()) {
      params.append('search', searchQuery);
    }
    
    navigate(`/services?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Trusted Service Providers Near You
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Connect with professionals for all your service needs
            </p>

            {/* State Filter Bar */}
            <div className="max-w-4xl mx-auto mb-4">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
              >
                <option value="">All States</option>
                {Object.keys(nigeriaData).sort().map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search for services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-4"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Categories</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/services?category=${category.name}`}
                className="card p-6 text-center hover:shadow-xl transition-all group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <h3 className="text-sm font-medium text-gray-900">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Featured Services</h2>
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
            </div>
          </div>

          {loading ? (
            <div className="py-20">
              <Loader size="lg" />
            </div>
          ) : featuredServices.length > 0 ? (
            <div className={
              viewMode === 'list'
                ? 'space-y-2'
                : 'grid grid-cols-2 lg:grid-cols-4 gap-2'
            }>
              {featuredServices.map((service) => (
                <div key={service._id} className={viewMode === 'list' ? 'h-32' : ''}>
                  <ServiceCard service={service} viewMode={viewMode} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">No featured services available</p>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Search Services</h3>
              <p className="text-gray-600">
                Browse through our wide range of professional services in your area
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect & Book</h3>
              <p className="text-gray-600">
                Chat with providers and book services that fit your schedule
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get It Done</h3>
              <p className="text-gray-600">
                Enjoy quality service and leave a review to help others
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Only show when not authenticated */}
      {!isAuthenticated && (
        <section className="py-16 bg-primary-600 text-white">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Are You a Service Provider?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Join our platform and connect with thousands of customers looking for your services
            </p>
            <Link
              to="/register"
              className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3 inline-block"
            >
              Get Started Today
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
