import { useState, useEffect } from 'react';
import { userAPI } from '../utils/api';
import ServiceCard from '../components/ServiceCard';
import Loader from '../components/Loader';

const SavedServices = () => {
  const [savedServices, setSavedServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedServices();
  }, []);

  const fetchSavedServices = async () => {
    try {
      const response = await userAPI.getSavedServices();
      setSavedServices(response.data.services);
    } catch (error) {
      console.error('Error fetching saved services:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Saved Services</h1>

      {loading ? (
        <div className="py-20">
          <Loader size="lg" />
        </div>
      ) : savedServices.length > 0 ? (
        <div className="masonry-flow cols-4-lg">
          {savedServices.map((service) => (
            <div key={service._id} className="masonry-flow-item">
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl text-gray-500">No saved services yet</p>
        </div>
      )}
    </div>
  );
};

export default SavedServices;
