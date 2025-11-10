# Google AdSense Setup Guide for WolziFlix

This guide will help you set up Google AdSense to monetize your website.

## Step 1: Get Your Google AdSense Account

1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Sign in with your Google account
3. Click "Get Started" and follow the application process
4. Once approved, you'll receive your **Publisher ID** (also called Client ID)
   - Format: `ca-pub-1234567890123456`

## Step 2: Create Ad Units

1. In your AdSense dashboard, go to **Ads** → **By ad unit**
2. Click **Create new ad unit**
3. Choose the ad format you want:
   - **Display ads**: Banner ads, responsive ads, etc.
   - **In-article ads**: Ads that appear within content
   - **In-feed ads**: Ads in content feeds
   - **Anchor ads**: Sticky ads at the bottom of the page
   - **Vignette ads**: Full-screen ads between pages

4. For each ad unit, you'll get:
   - **Ad unit ID** (e.g., `1234567890`)
   - **Ad format** (auto, rectangle, banner, etc.)

## Step 3: Configure Your Environment Variables

Create a `.env` file in your project root (if it doesn't exist) and add:

```env
VITE_GOOGLE_ADS_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

Replace `ca-pub-XXXXXXXXXXXXXXXX` with your actual AdSense Publisher ID.

**Important**: Add `.env` to your `.gitignore` file to keep your credentials secure!

## Step 4: Update index.html (Optional)

The Google AdSense script is automatically loaded by the `useGoogleAds` hook in `App.tsx`. However, you can also add it directly to `index.html` for faster initial load:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=YOUR_GOOGLE_ADS_CLIENT_ID"
 crossorigin="anonymous"></script>
```

Replace `YOUR_GOOGLE_ADS_CLIENT_ID` with your actual Publisher ID.

**Note**: If you use the environment variable approach (recommended), the hook will load the script automatically, so this step is optional.

## Step 5: Add Ads to Your Pages

### Option 1: Using the GoogleAd Component (Recommended)

```tsx
import { GoogleAd } from '@/components/ads';

<GoogleAd
  adClient="ca-pub-XXXXXXXXXXXXXXXX"
  adSlot="1234567890"
  format="auto"
/>
```

### Option 2: Using AdBanner Component

Perfect for header, footer, or sidebar:

```tsx
import { AdBanner } from '@/components/ads';

<AdBanner
  adClient="ca-pub-XXXXXXXXXXXXXXXX"
  adSlot="1234567890"
  position="top" // or "bottom" or "sidebar"
/>
```

### Option 3: Using AdUnit Component

Perfect for in-content placements:

```tsx
import { AdUnit } from '@/components/ads';

<AdUnit
  adClient="ca-pub-XXXXXXXXXXXXXXXX"
  adSlot="1234567890"
  size="rectangle" // or "square" or "skyscraper"
/>
```

## Step 6: Recommended Ad Placements

### Homepage (Index.tsx)
- **Top banner**: Above the hero section
- **Sidebar**: If you have a sidebar layout
- **Between content sections**: Between movie/TV show rows

### Media Detail Pages (MediaDetail.tsx)
- **Above the video player**: Before the trailer/player
- **Below the description**: After the synopsis
- **Sidebar**: Related content area

### Watch Pages (WatchNew.tsx)
- **Above the player**: Before video starts
- **Below the player**: After video ends
- **Sidebar**: Source selection area

### Footer (Footer.tsx)
- **Above footer links**: Banner ad

## Example: Adding Ads to Footer

```tsx
import { AdBanner } from '@/components/ads';

const Footer = () => {
  const adClient = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID;
  const footerAdSlot = 'YOUR_FOOTER_AD_SLOT_ID'; // Get this from AdSense

  return (
    <footer>
      {/* Add banner ad above footer */}
      {adClient && (
        <AdBanner
          adClient={adClient}
          adSlot={footerAdSlot}
          position="top"
        />
      )}
      
      {/* Your existing footer content */}
      {/* ... */}
    </footer>
  );
};
```

## Step 7: Best Practices

1. **Don't click your own ads** - This violates AdSense policies
2. **Follow AdSense policies**:
   - Don't place ads too close to clickable elements
   - Don't encourage users to click ads
   - Don't place more than 3 ad units per page initially
3. **Test in incognito mode** - To see ads as visitors would
4. **Use responsive ads** - They adapt to screen size automatically
5. **Monitor performance** - Check your AdSense dashboard regularly

## Step 8: Verify Ads Are Working

1. After deploying, wait 24-48 hours for AdSense to start serving ads
2. Check your AdSense dashboard for impressions
3. Use AdSense's "Ads preview" tool to see how ads appear
4. Test on different devices and screen sizes

## Troubleshooting

### Ads not showing?
- Check that your AdSense account is approved
- Verify your Publisher ID is correct
- Make sure you've created ad units in AdSense dashboard
- Check browser console for errors
- Wait 24-48 hours after setup for ads to start serving

### "AdSense script not loaded" error?
- Check your internet connection
- Verify the script URL in index.html is correct
- Check browser console for blocked scripts (ad blockers)

### Low earnings?
- Increase traffic to your site
- Optimize ad placements (above the fold performs best)
- Use responsive ad formats
- Consider adding more ad units (but don't overdo it)

## Support

- [Google AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Policies](https://support.google.com/adsense/answer/48182)
- [AdSense Community](https://support.google.com/adsense/community)

## Security Note

Never commit your `.env` file or expose your Publisher ID publicly in production code. Use environment variables and keep them secure.

