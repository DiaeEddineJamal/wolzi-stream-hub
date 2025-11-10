import React from 'react';
import { GoogleAd } from './GoogleAd';

interface AdBannerProps {
  /**
   * Your Google AdSense client ID
   */
  adClient: string;
  /**
   * Your ad slot ID for banner ads
   */
  adSlot: string;
  /**
   * Banner position: 'top', 'bottom', 'sidebar'
   */
  position?: 'top' | 'bottom' | 'sidebar';
}

/**
 * Banner Ad Component - Perfect for header, footer, or sidebar placements
 */
export const AdBanner: React.FC<AdBannerProps> = ({
  adClient,
  adSlot,
  position = 'top',
}) => {
  const getStyle = (): React.CSSProperties => {
    switch (position) {
      case 'top':
        return {
          width: '100%',
          maxWidth: '728px',
          margin: '0 auto 20px',
        };
      case 'bottom':
        return {
          width: '100%',
          maxWidth: '728px',
          margin: '20px auto 0',
        };
      case 'sidebar':
        return {
          width: '100%',
          maxWidth: '300px',
          margin: '0 auto',
        };
      default:
        return {};
    }
  };

  return (
    <div className={`ad-banner ad-banner-${position}`} style={getStyle()}>
      <GoogleAd
        adClient={adClient}
        adSlot={adSlot}
        format="auto"
        style={getStyle()}
        showPlaceholder={true}
      />
    </div>
  );
};

export default AdBanner;

