import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { authAPI, getImageUrl } from '../utils/api';
import { nigeriaData } from '../utils/nigeriaData';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCamera } from 'react-icons/fi';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showKycForm, setShowKycForm] = useState(false);
  const [kycStep, setKycStep] = useState(1); // 1: ID upload, 2: Selfie capture
  const [reviews, setReviews] = useState([]);
  const [kycData, setKycData] = useState({
    idType: '',
    idNumber: '',
    imageFile: null,
    selfieFile: null
  });
  const [kycPreview, setKycPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: {
      city: user?.location?.city || '',
      state: user?.location?.state || '',
      lga: user?.location?.lga || '',
      address: user?.location?.address || '',
    },
  });

  // Fetch provider reviews
  const fetchProviderReviews = async () => {
    if (user?.role !== 'provider') return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/reviews/provider/${user._id}`
      );
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // Fetch reviews when user role changes to provider
  useEffect(() => {
    if (user?.role === 'provider') {
      fetchProviderReviews();
    }
  }, [user?.role, user?._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('location.')) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePic', file);

    setLoading(true);
    try {
      const response = await authAPI.uploadProfilePic(formData);
      updateUser({ profilePic: response.data.profilePic });
      toast.success('Profile picture updated');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload image';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKycImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setKycData({ ...kycData, imageFile: file });
      setKycPreview(URL.createObjectURL(file));
    }
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error('Camera not supported on this device');
        return;
      }
      
      setCameraReady(false);
      setCameraOn(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Use multiple events to ensure video is ready
        const checkReady = () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            setCameraReady(true);
          }
        };
        
        videoRef.current.onloadeddata = checkReady;
        videoRef.current.oncanplay = checkReady;
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            // Check immediately after play
            setTimeout(checkReady, 100);
            // Backup check after 1 second
            setTimeout(() => {
              if (!cameraReady && videoRef.current) {
                setCameraReady(true);
              }
            }, 1000);
          } catch (err) {
            console.error('Error playing video:', err);
            toast.error('Failed to start video playback');
          }
        };
        
        // Force play if metadata doesn't trigger
        setTimeout(async () => {
          if (videoRef.current && videoRef.current.paused) {
            try {
              await videoRef.current.play();
              setCameraReady(true);
            } catch (err) {
              console.error('Delayed play error:', err);
            }
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Unable to access camera. Please allow camera permissions.');
      setCameraOn(false);
      setCameraReady(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
    setCameraReady(false);
  };

  const captureSelfie = () => {
    if (!videoRef.current) {
      toast.error('Video element not found');
      return;
    }

    const video = videoRef.current;
    
    if (!cameraReady || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Camera not ready yet. Please wait a moment.');
      return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Failed to capture image');
        return;
      }
      // Create a File object from the blob
      try {
        const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setKycData((prev) => ({ ...prev, selfieFile: file }));
      } catch (error) {
        // Fallback for browsers that don't support File constructor
        const file = blob;
        file.name = `selfie_${Date.now()}.jpg`;
        setKycData((prev) => ({ ...prev, selfieFile: file }));
      }
      setSelfiePreview(URL.createObjectURL(blob));
      stopCamera();
      toast.success('Selfie captured successfully!');
    }, 'image/jpeg', 0.9);
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    
    if (!kycData.idType || !kycData.idNumber || !kycData.imageFile || !kycData.selfieFile) {
      toast.error('Please complete all KYC steps including selfie');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('idType', kycData.idType);
      formData.append('idNumber', kycData.idNumber);
      formData.append('kycImage', kycData.imageFile);
      formData.append('selfieImage', kycData.selfieFile);

      console.log('Submitting KYC with files:', {
        idType: kycData.idType,
        idNumber: kycData.idNumber,
        kycImageSize: kycData.imageFile?.size,
        selfieSize: kycData.selfieFile?.size,
        kycImageType: kycData.imageFile?.type,
        selfieType: kycData.selfieFile?.type
      });

      const response = await authAPI.submitKyc(formData);
      console.log('KYC submission response:', response.data);
      updateUser(response.data.user);
      toast.success(response.data.message);
      closeKycForm();
    } catch (error) {
      console.error('KYC submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit KYC. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeKycForm = () => {
    stopCamera();
    setShowKycForm(false);
    setKycStep(1);
    setKycData({ idType: '', idNumber: '', imageFile: null, selfieFile: null });
    setKycPreview(null);
    setSelfiePreview(null);
    setCameraReady(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Section */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <div className="relative inline-block mb-4">
              <img
                src={getImageUrl(user?.profilePic) || 'https://via.placeholder.com/150'}
                alt={user?.name}
                className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gray-200"
              />
              <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition">
                <FiUser size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <h2 className="text-xl font-semibold mb-1">{user?.name}</h2>
            <p className="text-gray-600 text-sm mb-2">{user?.email}</p>
            <span className="badge bg-primary-100 text-primary-700 capitalize">
              {user?.role}
            </span>

            {user?.kycStatus === 'rejected' && user.kycRejectionReason && (
              <div className="mt-2 bg-red-50 border-2 border-red-300 rounded-lg p-4 text-sm shadow-sm">
                <p className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  Rejection Reason:
                </p>
                <p className="text-red-800 leading-relaxed">{user.kycRejectionReason}</p>
                <p className="text-red-600 mt-3 text-xs">You can resubmit your KYC with correct documents.</p>
              </div>
            )}

            {user?.kycStatus === 'pending' && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <p className="text-yellow-700">Your KYC submission is under review. Please wait for admin approval.</p>
              </div>
            )}

            {user?.role === 'customer' && user?.kycStatus !== 'pending' && user?.kycStatus !== 'verified' && (
              <div className="mt-4">
                <button
                  onClick={() => setShowKycForm(true)}
                  className="w-full btn btn-primary text-sm mt-2"
                >
                  Become Service Provider
                </button>
              </div>
            )}

            {user?.role === 'provider' && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-2xl font-bold text-primary-600">
                        {user?.rating?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-gray-500 ml-1">/ 5</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {user?.totalReviews || 0} reviews
                    </p>
                  </div>
                  {user?.isVerified && (
                    <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-xs font-semibold text-green-700">Verified</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-6">Personal Information</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium mb-2">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="profile-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile-email" className="block text-sm font-medium mb-2">Email (Read-only)</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="profile-email"
                    type="email"
                    value={user?.email}
                    disabled
                    className="input pl-10 bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile-phone" className="block text-sm font-medium mb-2">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="profile-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    className="input pl-10"
                  />
                </div>
              </div>

              {user?.role === 'provider' && (
                <div>
                  <label htmlFor="profile-bio" className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    id="profile-bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    className="input"
                    placeholder="Tell customers about yourself..."
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* State */}
                <div>
                  <label htmlFor="profile-state" className="block text-sm font-medium mb-2">State</label>
                  <select
                    id="profile-state"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleChange}
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
                  <label htmlFor="profile-city" className="block text-sm font-medium mb-2">City</label>
                  <select
                    id="profile-city"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    disabled={!formData.location.state}
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
                <label htmlFor="profile-lga" className="block text-sm font-medium mb-2">Local Government Area (LGA)</label>
                <select
                  id="profile-lga"
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
                <label htmlFor="profile-address" className="block text-sm font-medium mb-2">Address</label>
                <input
                  id="profile-address"
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  autoComplete="street-address"
                  className="input"
                  placeholder="Full address"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* KYC Verification Modal */}
      {showKycForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">KYC Verification</h2>
            <p className="text-gray-600 mb-4">
              Step {kycStep} of 2: {kycStep === 1 ? 'Upload ID Document' : 'Capture Selfie'}
            </p>

            <form onSubmit={handleKycSubmit} className="space-y-4">
              {kycStep === 1 && (
                <>
                  <div>
                    <label htmlFor="kyc-idtype" className="block text-sm font-medium mb-2">ID Type</label>
                    <select
                      id="kyc-idtype"
                      value={kycData.idType}
                      onChange={(e) => setKycData({ ...kycData, idType: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Select ID Type</option>
                      <option value="nationalId">National ID</option>
                      <option value="passport">Passport</option>
                      <option value="driverLicense">Driver's License</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="kyc-idnumber" className="block text-sm font-medium mb-2">ID Number</label>
                    <input
                      id="kyc-idnumber"
                      type="text"
                      value={kycData.idNumber}
                      onChange={(e) => setKycData({ ...kycData, idNumber: e.target.value })}
                      className="input"
                      placeholder="Enter your ID number"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="kyc-image" className="block text-sm font-medium mb-2">Upload ID Image</label>
                    <input
                      id="kyc-image"
                      type="file"
                      accept="image/*"
                      onChange={handleKycImageChange}
                      className="input"
                      required
                    />
                    {kycPreview && (
                      <img
                        src={kycPreview}
                        alt="ID Preview"
                        className="mt-2 w-full h-40 object-cover rounded"
                      />
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!kycData.idType || !kycData.idNumber || !kycData.imageFile) {
                          toast.error('Please complete all ID fields');
                          return;
                        }
                        setKycStep(2);
                      }}
                      className="flex-1 btn btn-primary"
                    >
                      Next: Take Selfie
                    </button>
                    <button
                      type="button"
                      onClick={closeKycForm}
                      className="flex-1 btn bg-gray-200 text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {kycStep === 2 && (
                <>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Take a selfie to verify your identity matches your ID
                    </p>

                    {!selfiePreview && (
                      <div className="space-y-4">
                        {cameraOn ? (
                          <div className="relative">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full rounded-lg bg-gray-900"
                            />
                            {!cameraReady && (
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded">
                                Initializing camera...
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={captureSelfie}
                              disabled={!cameraReady}
                              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FiCamera size={20} />
                              {cameraReady ? 'Capture Selfie' : 'Please wait...'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={startCamera}
                            className="w-full btn btn-primary flex items-center justify-center gap-2"
                          >
                            <FiCamera size={20} />
                            Start Camera
                          </button>
                        )}
                      </div>
                    )}

                    {selfiePreview && (
                      <div className="space-y-4">
                        <img
                          src={selfiePreview}
                          alt="Selfie Preview"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelfiePreview(null);
                            setKycData({ ...kycData, selfieFile: null });
                            startCamera();
                          }}
                          className="btn bg-gray-200 text-gray-800 text-sm"
                        >
                          Retake Selfie
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setKycStep(1);
                      }}
                      className="flex-1 btn bg-gray-200 text-gray-800"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !selfiePreview}
                      className="flex-1 btn btn-primary"
                    >
                      {loading ? 'Submitting...' : 'Submit KYC'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Provider Reviews Section */}
      {user?.role === 'provider' && reviews.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="border-b pb-6 last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{review.customerId?.name || 'Anonymous'}</h3>
                    <div className="flex items-center mt-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mt-2">{review.comment}</p>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt="Review"
                        className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80"
                        onClick={() => window.open(img.url, '_blank')}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {user?.role === 'provider' && reviews.length === 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">No reviews yet. Complete your first service and get reviewed by customers!</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
