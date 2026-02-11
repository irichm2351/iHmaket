import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getImageUrl } from '../utils/api';

const ImageCarousel = ({ images, title }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">No images available</span>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  const currentImage = images[currentImageIndex];

  return (
    <div className="mb-6">
      {/* Main Image with Navigation */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden group">
        <img
          src={getImageUrl(currentImage?.url)}
          alt={`${title} ${currentImageIndex + 1}`}
          className="w-full h-96 object-cover"
        />

        {/* Image Counter */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {currentImageIndex + 1} / {images.length}
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-black rounded-full p-2 transition opacity-0 group-hover:opacity-100 z-10"
              title="Previous image"
            >
              <FiChevronLeft size={24} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-black rounded-full p-2 transition opacity-0 group-hover:opacity-100 z-10"
              title="Next image"
            >
              <FiChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 mt-3">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`relative h-20 rounded-lg overflow-hidden transition-all border-2 ${
                index === currentImageIndex
                  ? 'border-primary-600 scale-105'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
              title={`View image ${index + 1}`}
            >
              <img
                src={getImageUrl(img.url)}
                alt={`${title} ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
