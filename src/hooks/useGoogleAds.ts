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
      return; // Silently return if no client ID
    }

    try {
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
          // Silently handle error - ad blockers will block this
          console.log('AdSense script blocked or failed to load (this is normal with ad blockers)');
        };
        script.onload = () => {
          console.log('AdSense script loaded successfully');
        };
        
        try {
          document.head.appendChild(script);
        } catch (error) {
          // Silently handle append errors
          console.log('Could not append AdSense script (may be blocked by ad blocker)');
        }
      }
    } catch (error) {
      // Silently handle any errors - don't break the app
      console.log('AdSense initialization error (may be blocked by ad blocker)');
    }
  }, [adClientId]);
};

export default useGoogleAds;

