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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedServices.map((service) => (
            <ServiceCard key={service._id} service={service} />
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
