import React from 'react';
import { GoogleAd } from './GoogleAd';

interface AdUnitProps {
  /**
   * Your Google AdSense client ID
   */
  adClient: string;
  /**
   * Your ad slot ID
   */
  adSlot: string;
  /**
   * Ad unit size: 'rectangle', 'square', 'skyscraper'
   */
  size?: 'rectangle' | 'square' | 'skyscraper';
}

/**
 * Standard Ad Unit Component - Perfect for in-content placements
 */
export const AdUnit: React.FC<AdUnitProps> = ({
  adClient,
  adSlot,
  size = 'rectangle',
}) => {
  const getDimensions = (): { width: number; height: number } => {
    switch (size) {
      case 'rectangle':
        return { width: 300, height: 250 };
      case 'square':
        return { width: 250, height: 250 };
      case 'skyscraper':
        return { width: 160, height: 600 };
      default:
        return { width: 300, height: 250 };
    }
  };

  const dimensions = getDimensions();

  return (
    <div className={`ad-unit ad-unit-${size}`}>
      <GoogleAd
        adClient={adClient}
        adSlot={adSlot}
        format="rectangle"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
        showPlaceholder={true}
      />
    </div>
  );
};

export default AdUnit;

