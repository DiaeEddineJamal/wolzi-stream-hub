import React, { useEffect, useRef } from 'react';

// Declare adsbygoogle on window
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface GoogleAdProps {
  /**
   * Your Google AdSense client ID (e.g., 'ca-pub-1234567890123456')
   */
  adClient: string;
  /**
   * Your ad slot ID from Google AdSense
   */
  adSlot: string;
  /**
   * Ad format: 'auto', 'fluid', 'rectangle', 'horizontal', 'vertical'
   */
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  /**
   * Ad size (only used for non-auto formats)
   */
  style?: React.CSSProperties;
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Whether to show a placeholder while ad loads
   */
  showPlaceholder?: boolean;
}

/**
 * Google AdSense Ad Component
 * 
 * Usage:
 * <GoogleAd 
 *   adClient="ca-pub-XXXXXXXXXXXXXXXX"
 *   adSlot="1234567890"
 *   format="auto"
 * />
 */
export const GoogleAd: React.FC<GoogleAdProps> = ({
  adClient,
  adSlot,
  format = 'auto',
  style,
  className = '',
  showPlaceholder = false,
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    try {
      // Ensure Google AdSense script is loaded
      if (typeof window !== 'undefined') {
        if (!window.adsbygoogle) {
          window.adsbygoogle = [];
        }

        // Only push the ad once, with a delay to allow script to load
        if (!isLoaded.current && adRef.current) {
          timer = setTimeout(() => {
            try {
              if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
                window.adsbygoogle.push({});
                isLoaded.current = true;
              }
            } catch (error) {
              // Silently handle - ad blockers will prevent this
            }
          }, 100);
        }
      }
    } catch (error) {
      // Silently handle any errors
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [adClient, adSlot]);

  // Load Google AdSense script if not already loaded
  useEffect(() => {
    try {
      if (!document.querySelector('script[src*="adsbygoogle"]')) {
        const script = document.createElement('script');
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
        script.onerror = () => {
          // Silently handle - ad blockers will block this
        };
        try {
          document.head.appendChild(script);
        } catch (error) {
          // Silently handle append errors
        }
      }
    } catch (error) {
      // Silently handle any errors
    }
  }, [adClient]);

  const defaultStyle: React.CSSProperties = {
    display: 'block',
    minHeight: format === 'auto' ? '100px' : '250px',
    ...style,
  };

  return (
    <div 
      ref={adRef} 
      className={`google-ad-container ${className}`}
      style={{ 
        margin: '20px auto',
        textAlign: 'center',
        ...defaultStyle
      }}
    >
      {showPlaceholder && !isLoaded.current && (
        <div 
          style={{
            width: '100%',
            minHeight: '250px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '14px',
          }}
        >
          Loading ad...
        </div>
      )}
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...(format !== 'auto' && { width: '100%', height: 'auto' }),
        }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={format === 'auto' ? 'true' : 'false'}
      />
    </div>
  );
};

export default GoogleAd;

