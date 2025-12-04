import { useState, useEffect } from 'react';

// A simple hook to check if the screen is mobile-sized.
// This helps us make the layout responsive.
export default function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      const listener = () => setMatches(media.matches);
      // Listen for changes in the screen size
      media.addEventListener('change', listener);
      // Clean up the listener when the component unmounts
      return () => media.removeEventListener('change', listener);
    }
  }, [matches, query]);

  return matches;
}
