# Google Ads Components

Ready-to-use React components for Google AdSense integration.

## Quick Start

1. **Set up your environment variable**:
   ```env
   VITE_GOOGLE_ADS_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
   ```

2. **Import and use**:
   ```tsx
   import { GoogleAd } from '@/components/ads';

   const adClientId = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID;
   const adSlot = 'YOUR_AD_SLOT_ID'; // Get from AdSense dashboard

   <GoogleAd
     adClient={adClientId}
     adSlot={adSlot}
     format="auto"
   />
   ```

## Components

### GoogleAd
The base component for displaying Google AdSense ads.

**Props:**
- `adClient` (string, required): Your AdSense Publisher ID
- `adSlot` (string, required): Your ad unit slot ID
- `format` (string, optional): 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical'
- `style` (object, optional): Custom CSS styles
- `className` (string, optional): Additional CSS classes
- `showPlaceholder` (boolean, optional): Show loading placeholder

**Example:**
```tsx
<GoogleAd
  adClient="ca-pub-1234567890123456"
  adSlot="1234567890"
  format="auto"
  showPlaceholder={true}
/>
```

### AdBanner
Perfect for header, footer, or sidebar placements.

**Props:**
- `adClient` (string, required): Your AdSense Publisher ID
- `adSlot` (string, required): Your banner ad slot ID
- `position` (string, optional): 'top' | 'bottom' | 'sidebar'

**Example:**
```tsx
<AdBanner
  adClient={adClientId}
  adSlot={bannerAdSlot}
  position="top"
/>
```

### AdUnit
Standard ad units for in-content placements.

**Props:**
- `adClient` (string, required): Your AdSense Publisher ID
- `adSlot` (string, required): Your ad unit slot ID
- `size` (string, optional): 'rectangle' | 'square' | 'skyscraper'

**Example:**
```tsx
<AdUnit
  adClient={adClientId}
  adSlot={adUnitSlot}
  size="rectangle"
/>
```

## Common Use Cases

### Homepage Banner
```tsx
import { AdBanner } from '@/components/ads';

const adClientId = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID;
const topBannerSlot = 'YOUR_TOP_BANNER_SLOT';

{adClientId && (
  <AdBanner
    adClient={adClientId}
    adSlot={topBannerSlot}
    position="top"
  />
)}
```

### Sidebar Ad
```tsx
import { AdUnit } from '@/components/ads';

const adClientId = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID;
const sidebarSlot = 'YOUR_SIDEBAR_SLOT';

<aside>
  {adClientId && (
    <AdUnit
      adClient={adClientId}
      adSlot={sidebarSlot}
      size="rectangle"
    />
  )}
</aside>
```

### In-Content Ad
```tsx
import { GoogleAd } from '@/components/ads';

const adClientId = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID;
const contentAdSlot = 'YOUR_CONTENT_AD_SLOT';

<div className="content">
  <p>Your content here...</p>
  
  {adClientId && (
    <GoogleAd
      adClient={adClientId}
      adSlot={contentAdSlot}
      format="auto"
      style={{ margin: '40px 0' }}
    />
  )}
  
  <p>More content...</p>
</div>
```

## Best Practices

1. **Don't overdo it**: Start with 1-3 ads per page
2. **Above the fold**: Place ads where users can see them without scrolling
3. **Responsive**: Use `format="auto"` for responsive ads
4. **Test**: Always test ads in incognito mode
5. **Monitor**: Check AdSense dashboard for performance

## Troubleshooting

- **Ads not showing?**: Wait 24-48 hours after setup
- **TypeScript errors?**: Make sure `window.adsbygoogle` is declared (already done in components)
- **Script errors?**: Check that your Publisher ID is correct in `.env` file

