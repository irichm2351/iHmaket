import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Loader from '../components/Loader';

const Subscription = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reference, setReference] = useState('');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscription/status');
      if (response.data.success) {
        setStatus(response.data.status);
      }
    } catch (error) {
      toast.error('Error fetching subscription status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubscribe = async () => {
    try {
      setProcessing(true);
      const response = await api.post('/subscription/initialize');
      if (!response.data.success) {
        toast.error(response.data.message || 'Unable to start subscription');
        return;
      }

      const { authorizationUrl, reference: ref } = response.data;
      setReference(ref);

      if (authorizationUrl) {
        window.open(authorizationUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      toast.error('Unable to start subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (!reference) {
      toast.error('Please start a subscription first');
      return;
    }

    try {
      setProcessing(true);
      const response = await api.get(`/subscription/verify/${reference}`);
      if (response.data.success) {
        toast.success('Subscription activated');
        fetchStatus();
      } else {
        toast.error(response.data.message || 'Verification failed');
      }
    } catch (error) {
      toast.error('Unable to verify payment');
    } finally {
      setProcessing(false);
    }
  };

  const renderStatus = () => {
    if (!status) return '';
    if (!status.enabled) return 'Subscription is currently disabled by admin.';
    if (status.isActive) {
      return `Active until ${new Date(status.expiresAt).toLocaleDateString()}`;
    }
    return 'Inactive - subscription required to use provider features.';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Back
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Provider Subscription</h1>
        <p className="text-gray-600 mb-6">Monthly subscription to keep your services visible.</p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">Monthly Amount</p>
          <p className="text-3xl font-bold text-primary-600">NGN {status?.amount || 2000}</p>
          <p className="text-sm text-gray-600 mt-2">{renderStatus()}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSubscribe}
            disabled={processing || !status?.enabled}
            className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
          >
            {processing ? 'Processing...' : 'Subscribe with Paystack'}
          </button>
          <button
            onClick={handleVerify}
            disabled={processing || !reference}
            className="px-5 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 disabled:border-gray-300 disabled:text-gray-400"
          >
            Verify Payment
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          After payment, return here and click "Verify Payment".
        </p>
      </div>
    </div>
  );
};

export default Subscription;
