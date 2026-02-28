import { Link, useNavigate } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiLinkedin } from 'react-icons/fi';
import { SiX, SiTiktok } from 'react-icons/si';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Footer = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const handleBecomeProvider = () => {
    if (!isAuthenticated) {
      // Not logged in - redirect to register
      navigate('/register');
      return;
    }

    if (user?.role === 'provider') {
      // Already a provider
      toast.success('You are already a verified service provider!');
      return;
    }

    if (user?.role === 'customer') {
      // Customer - redirect to KYC page
      navigate('/kyc');
      return;
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">iH</span>
              </div>
              <span className="text-xl font-bold text-white">maket</span>
            </div>
            <p className="text-sm text-gray-400">
              Connect with trusted service providers in your area. Fast, reliable, and professional services at your fingertips.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/services" className="text-sm hover:text-primary-400 transition">
                  Browse Services
                </Link>
              </li>
              <li>
                <button
                  onClick={handleBecomeProvider}
                  className="text-sm hover:text-primary-400 transition cursor-pointer"
                >
                  Become a Provider
                </button>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:text-primary-400 transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-primary-400 transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">Popular Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/services?category=Plumbing" className="text-sm hover:text-primary-400 transition">
                  Plumbing
                </Link>
              </li>
              <li>
                <Link to="/services?category=Cleaning" className="text-sm hover:text-primary-400 transition">
                  Cleaning
                </Link>
              </li>
              <li>
                <Link to="/services?category=Beauty & Makeup" className="text-sm hover:text-primary-400 transition">
                  Beauty & Makeup
                </Link>
              </li>
              <li>
                <Link to="/services?category=IT & Tech Support" className="text-sm hover:text-primary-400 transition">
                  IT & Tech Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="hover:text-primary-400 transition">
                <FiFacebook size={20} />
              </a>
              <a href="https://x.com/ihmaket" className="hover:text-primary-400 transition">
                <SiX size={20} />
              </a>
              <a href="https://www.instagram.com/ihmaket?igsh=MXAyN2hwaWVxZnlreQ==" className="hover:text-primary-400 transition">
                <FiInstagram size={20} />
              </a>
              <a href="https://www.tiktok.com/@ihmaket2?_r=1&_t=ZS-94HXFGpQczN" className="hover:text-primary-400 transition">
                <SiTiktok size={20} />
              </a>
              <a href="#" className="hover:text-primary-400 transition">
                <FiLinkedin size={20} />
              </a>
            </div>
            <p className="text-sm text-gray-400">
              Email: ihmaket2026@gmail.com<br />
              Phone: +234 815 598 4660
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} iHmaket. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
