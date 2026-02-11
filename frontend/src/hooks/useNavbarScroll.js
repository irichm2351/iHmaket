import { useState, useEffect, useRef } from 'react';

const useNavbarScroll = () => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Show navbar when at top
          if (currentScrollY < 50) {
            setIsVisible(true);
          }
          // Hide navbar when scrolling down
          else if (currentScrollY > lastScrollY.current) {
            setIsVisible(false);
          }
          // Show navbar when scrolling up
          else {
            setIsVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return isVisible;
};

export default useNavbarScroll;
