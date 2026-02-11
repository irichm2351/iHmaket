import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiCheckCircle, FiAlertCircle, FiClock, FiCamera, FiX } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const KYC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [formData, setFormData] = useState({
    idType: 'national_id',
    idNumber: '',
    idDocument: null,
    idDocumentPreview: null,
    selfie: null,
    selfiePreview: null
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role === 'provider') {
      navigate('/dashboard');
      toast.success('You are already a verified service provider!');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    // Cleanup camera stream on unmount
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera is not supported in your browser');
        return;
      }

      setShowCamera(true);
      
      // Wait for next tick to ensure video element is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
            toast.error('Error starting video preview');
          });
        };
      }
    } catch (error) {
      setShowCamera(false);
      console.error('Camera error:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No camera found on your device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('Camera is already in use by another application.');
      } else {
        toast.error('Unable to access camera. Please check permissions and try again.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current frame from video to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        const preview = canvas.toDataURL('image/jpeg');
        
        setFormData(prev => ({
          ...prev,
          selfie: file,
          selfiePreview: preview
        }));
        
        stopCamera();
        toast.success('Selfie captured successfully!');
      }
    }, 'image/jpeg', 0.9);
  };

  const retakeSelfie = () => {
    setFormData(prev => ({
      ...prev,
      selfie: null,
      selfiePreview: null
    }));
    startCamera();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: file,
        [`${fieldName}Preview`]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.idNumber.trim()) {
      toast.error('Please enter your ID number');
      return;
    }

    if (!formData.idDocument) {
      toast.error('Please upload your ID document');
      return;
    }

    if (!formData.selfie) {
      toast.error('Please upload your selfie');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('idType', formData.idType);
      data.append('idNumber', formData.idNumber);
      data.append('idDocument', formData.idDocument);
      data.append('selfie', formData.selfie);

      // Make API call to submit KYC
      const response = await fetch('/api/users/submit-kyc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit KYC');
      }

      toast.success('KYC submitted successfully! Awaiting admin approval.');
      navigate('/profile');
    } catch (error) {
      toast.error(error.message || 'Error submitting KYC');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Become a Service Provider</h1>
          <p className="text-gray-600">
            Complete your KYC (Know Your Customer) verification to start offering services on Ihmaket.
          </p>
        </div>

        {/* KYC Status Info */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-blue-600 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Verification Required</h3>
              <p className="text-sm text-blue-800">
                Your KYC documents will be reviewed by our admin team. This typically takes 1-2 business days.
                Once approved, you'll be able to list and offer your services.
              </p>
            </div>
          </div>
        </div>

        {/* KYC Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ID Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ID Type
            </label>
            <select
              name="idType"
              value={formData.idType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's License</option>
              <option value="bvn">BVN (Bank Verification Number)</option>
            </select>
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ID Number
            </label>
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleInputChange}
              placeholder="Enter your ID number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {/* ID Document Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ID Document Photo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                id="idDocument"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'idDocument')}
                className="hidden"
              />
              {formData.idDocumentPreview ? (
                <div className="space-y-4">
                  <img
                    src={formData.idDocumentPreview}
                    alt="ID Preview"
                    className="max-h-48 mx-auto rounded"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('idDocument').click()}
                    className="w-full btn btn-outline btn-sm"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <label htmlFor="idDocument" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <FiUpload size={32} className="text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload ID document photo</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Selfie Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selfie (Face Verification)
            </label>
            
            {!showCamera && !formData.selfiePreview && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full flex flex-col items-center gap-3 hover:bg-gray-50 transition-colors py-4 rounded"
                >
                  <FiCamera size={40} className="text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Take a Selfie</p>
                    <p className="text-xs text-gray-500">Click to open camera</p>
                  </div>
                </button>
              </div>
            )}

            {showCamera && (
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="relative bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full"
                    style={{ maxHeight: '400px', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                <div className="p-4 bg-gray-50 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="btn btn-primary px-8"
                  >
                    <FiCamera className="inline mr-2" />
                    Capture Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="btn btn-outline px-8"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {formData.selfiePreview && !showCamera && (
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={formData.selfiePreview}
                  alt="Selfie Preview"
                  className="w-full"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
                <div className="p-4 bg-gray-50 flex justify-center">
                  <button
                    type="button"
                    onClick={retakeSelfie}
                    className="btn btn-outline"
                  >
                    <FiCamera className="inline mr-2" />
                    Retake Selfie
                  </button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <p className="text-xs text-gray-500 mt-2">
              Please position your face clearly in the camera frame for verification
            </p>
          </div>

          {/* Guidelines */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Document Guidelines</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">✓</span>
                <span>Document must be clear and legible</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">✓</span>
                <span>All text and numbers must be visible</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">✓</span>
                <span>Document must not be expired</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">✓</span>
                <span>Selfie must show your face clearly without glasses/hat</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">✓</span>
                <span>Look directly at the camera when taking selfie</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">✓</span>
                <span>Good lighting is important for both images</span>
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Your information is secure and will only be used for verification purposes
        </p>
      </div>
    </div>
  );
};

export default KYC;
