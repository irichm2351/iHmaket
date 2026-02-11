import { Link } from 'react-router-dom';
import { FiCheckCircle, FiUsers, FiShield, FiClock, FiDollarSign, FiStar, FiMessageCircle, FiSearch } from 'react-icons/fi';

const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">About Ihmaket</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your trusted marketplace connecting customers with verified service providers across Nigeria
        </p>
      </div>

      {/* What is Ihmaket */}
      <section className="mb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">What is Ihmaket?</h2>
            <p className="text-gray-600 mb-4">
              Ihmaket is a comprehensive online service marketplace that brings together customers seeking quality services 
              and skilled professionals ready to deliver. Whether you need a plumber, electrician, beautician, cleaner, 
              or any professional service, we make it easy to find, book, and pay for services all in one place.
            </p>
            <p className="text-gray-600 mb-4">
              Our platform ensures trust and quality by verifying all service providers through our KYC (Know Your Customer) 
              process. This means you can book with confidence, knowing that every provider on our platform has been vetted 
              and approved.
            </p>
            <p className="text-gray-600">
              We're committed to making service discovery and booking as simple as possible while maintaining the highest 
              standards of safety and professionalism.
            </p>
          </div>
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <FiUsers size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold">1000+</div>
                  <div className="text-sm opacity-90">Verified Providers</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <FiCheckCircle size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold">5000+</div>
                  <div className="text-sm opacity-90">Services Completed</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <FiStar size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold">4.8/5</div>
                  <div className="text-sm opacity-90">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - For Customers */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works for Customers</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSearch size={32} className="text-primary-600" />
            </div>
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              1
            </div>
            <h3 className="font-semibold mb-2">Search Services</h3>
            <p className="text-sm text-gray-600">
              Browse through our wide range of services or use filters to find exactly what you need by category, location, or price
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUsers size={32} className="text-primary-600" />
            </div>
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              2
            </div>
            <h3 className="font-semibold mb-2">Choose a Provider</h3>
            <p className="text-sm text-gray-600">
              Compare providers based on their ratings, reviews, prices, and portfolios. View their profiles to make an informed decision
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle size={32} className="text-primary-600" />
            </div>
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              3
            </div>
            <h3 className="font-semibold mb-2">Book & Communicate</h3>
            <p className="text-sm text-gray-600">
              Select your preferred date and time, then book the service. Chat with the provider in real-time to discuss details
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiStar size={32} className="text-primary-600" />
            </div>
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              4
            </div>
            <h3 className="font-semibold mb-2">Rate & Review</h3>
            <p className="text-sm text-gray-600">
              After service completion, leave a rating and review to help other customers and support quality providers
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - For Providers */}
      <section className="mb-20 bg-gray-50 rounded-2xl p-8 md:p-12">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works for Service Providers</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle size={32} className="text-green-600" />
            </div>
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              1
            </div>
            <h3 className="font-semibold mb-2">Register & Verify</h3>
            <p className="text-sm text-gray-600">
              Create your account, complete the KYC verification by submitting your ID and selfie. We verify all providers for customer safety
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUsers size={32} className="text-green-600" />
            </div>
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              2
            </div>
            <h3 className="font-semibold mb-2">Create Your Profile</h3>
            <p className="text-sm text-gray-600">
              Build your professional profile, add your services with descriptions, prices, and showcase your work with photos
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageCircle size={32} className="text-green-600" />
            </div>
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              3
            </div>
            <h3 className="font-semibold mb-2">Receive Bookings</h3>
            <p className="text-sm text-gray-600">
              Get notified when customers book your services. Chat with them to confirm details and manage your schedule
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiDollarSign size={32} className="text-green-600" />
            </div>
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              4
            </div>
            <h3 className="font-semibold mb-2">Deliver & Earn</h3>
            <p className="text-sm text-gray-600">
              Complete the service professionally, receive payment, and build your reputation through positive reviews
            </p>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Ihmaket?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card p-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <FiShield size={24} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Verified Providers</h3>
            <p className="text-gray-600">
              Every service provider goes through our rigorous KYC verification process. We verify their identity documents 
              to ensure your safety and peace of mind.
            </p>
          </div>
          
          <div className="card p-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <FiMessageCircle size={24} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real-Time Chat</h3>
            <p className="text-gray-600">
              Communicate directly with service providers through our built-in messaging system. Discuss requirements, 
              ask questions, and get instant responses.
            </p>
          </div>
          
          <div className="card p-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <FiStar size={24} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Ratings & Reviews</h3>
            <p className="text-gray-600">
              Make informed decisions based on genuine reviews from real customers. Our transparent rating system 
              helps you choose the best providers.
            </p>
          </div>
          
          <div className="card p-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <FiClock size={24} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Flexible Scheduling</h3>
            <p className="text-gray-600">
              Book services at your convenience. Choose your preferred date and time, and providers will confirm 
              based on their availability.
            </p>
          </div>
          
          <div className="card p-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <FiSearch size={24} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Easy Search & Filter</h3>
            <p className="text-gray-600">
              Find exactly what you need with our powerful search and filtering options. Filter by location, category, 
              price range, and ratings.
            </p>
          </div>
          
          <div className="card p-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <FiDollarSign size={24} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Transparent Pricing</h3>
            <p className="text-gray-600">
              See clear pricing upfront with no hidden fees. Compare prices from different providers and choose 
              what fits your budget.
            </p>
          </div>
        </div>
      </section>

      {/* Getting Started Guide */}
      <section className="mb-20">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 md:p-12 text-white">
          <h2 className="text-3xl font-bold text-center mb-8">Getting Started is Easy!</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FiCheckCircle /> For Customers
              </h3>
              <ol className="space-y-3 text-white/90">
                <li className="flex gap-3">
                  <span className="font-bold">1.</span>
                  <span>Click "Register" in the top right corner and create your account</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">2.</span>
                  <span>Browse services or use search to find what you need</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">3.</span>
                  <span>Click on a service to view details and provider profile</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">4.</span>
                  <span>Click "Book Now", select your date and time, then submit</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">5.</span>
                  <span>Wait for provider confirmation and chat with them if needed</span>
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FiCheckCircle /> For Service Providers
              </h3>
              <ol className="space-y-3 text-white/90">
                <li className="flex gap-3">
                  <span className="font-bold">1.</span>
                  <span>Register and complete your profile information</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">2.</span>
                  <span>Click "Become a Provider" in the footer or go to KYC page</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">3.</span>
                  <span>Submit your ID document and take a selfie for verification</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">4.</span>
                  <span>Wait for admin approval (usually 1-2 business days)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">5.</span>
                  <span>Once approved, go to "Post Service" and create your service listings</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of satisfied customers and professional service providers on Ihmaket today
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/services" className="btn btn-primary btn-lg">
            Browse Services
          </Link>
          <Link to="/register" className="btn btn-outline btn-lg">
            Create Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
