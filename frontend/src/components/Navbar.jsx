import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiSearch, FiMenu, FiX, FiUser, FiHeart, FiMessageSquare, FiCalendar, FiLogOut } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import useMessageStore from '../store/messageStore';
import useNavbarScroll from '../hooks/useNavbarScroll';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { unreadCount } = useMessageStore();
  const isNavbarVisible = useNavbarScroll();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Close profile menu when authentication state changes or user changes
  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [isAuthenticated, user?._id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`bg-white shadow-md sticky top-0 z-50 transition-transform duration-300 ease-in-out ${
      isNavbarVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/iHlogo1.jpg" 
              alt="iHmaket Logo" 
              className="w-16 h-16 rounded-lg object-cover"
            />
            <span className="text-xl font-bold text-gray-900 -ml-3">maket</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/services"
              className="text-gray-700 hover:text-primary-600 font-medium transition"
            >
              Browse Services
            </Link>
            
            {isAuthenticated ? (
              <>
                {user?.role === 'provider' && (
                  <Link
                    to="/post-service"
                    className="btn btn-primary"
                  >
                    Post Service
                  </Link>
                )}
                
                <Link to="/messages" className="relative text-gray-700 hover:text-primary-600">
                  <FiMessageSquare size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <img
                      src={user?.profilePic || 'https://via.placeholder.com/40'}
                      alt={user?.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border">
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FiUser className="mr-2" />
                        Dashboard
                      </Link>
                      <Link
                        to="/bookings"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FiCalendar className="mr-2" />
                        My Bookings
                      </Link>
                      <Link
                        to="/saved"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FiHeart className="mr-2" />
                        Saved Services
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FiUser className="mr-2" />
                        Profile Settings
                      </Link>
                      {user?.role === 'admin' && (
                        <>
                          <hr className="my-2" />
                          <Link
                            to="/admin"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <FiUser className="mr-2" />
                            Admin Dashboard
                          </Link>
                        </>
                      )}
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-100"
                      >
                        <FiLogOut className="mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <Link
              to="/services"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Browse Services
            </Link>
            
            {isAuthenticated ? (
              <>
                {user?.role === 'provider' && (
                  <Link
                    to="/post-service"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Post Service
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/messages"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  to="/bookings"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Bookings
                </Link>
                <Link
                  to="/saved"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Saved Services
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
