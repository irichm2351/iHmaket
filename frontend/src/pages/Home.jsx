import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiArrowRight } from 'react-icons/fi';
import { serviceAPI, getImageUrl } from '../utils/api';
import ServiceCard from '../components/ServiceCard';
import Loader from '../components/Loader';
import useAuthStore from '../store/authStore';

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
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedServices();
  }, []);

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
    if (searchQuery.trim()) {
      navigate(`/services?search=${searchQuery}`);
    }
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

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
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
            <Link
              to="/services"
              className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
              <FiArrowRight className="ml-2" />
            </Link>
          </div>

          {loading ? (
            <div className="py-20">
              <Loader size="lg" />
            </div>
          ) : featuredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredServices.map((service) => (
                <ServiceCard key={service._id} service={service} />
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
