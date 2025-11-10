import { useEffect } from 'react';

// Declare adsbygoogle on window
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

/**
 * Hook to initialize Google AdSense
 * Call this once in your App component
 */
export const useGoogleAds = (adClientId?: string) => {
  useEffect(() => {
    if (!adClientId) {
      console.warn('Google AdSense client ID not provided. Set VITE_GOOGLE_ADS_CLIENT_ID in your .env file');
      return;
    }

    // Initialize adsbygoogle array if it doesn't exist
    if (!window.adsbygoogle) {
      window.adsbygoogle = [];
    }

    // Load Google AdSense script if not already loaded
    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClientId}`;
      script.onerror = () => {
        console.error('Failed to load Google AdSense script');
      };
      document.head.appendChild(script);
    }
  }, [adClientId]);
};

export default useGoogleAds;

