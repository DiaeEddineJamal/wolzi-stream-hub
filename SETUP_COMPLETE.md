# ✅ Google AdSense Setup - Your Configuration

## Your Publisher ID
**Publisher ID**: `ca-pub-6329609540816457`

---

## ✅ What's Already Done

1. ✅ **index.html** - AdSense script added with your Publisher ID
2. ✅ **App.tsx** - Google Ads hook initialized
3. ✅ **Ad Components** - Ready to use

---

## 📝 What You Need to Do Next

### Step 1: Create `.env` File

Create a file named `.env` in your project root (same folder as `package.json`) and add:

```env
VITE_GOOGLE_ADS_CLIENT_ID=ca-pub-6329609540816457
```

**Important**: Make sure `.env` is in your `.gitignore` file (it should already be there).

### Step 2: Create Ad Units in AdSense

1. Go to: https://www.google.com/adsense/
2. Click **Ads** → **By ad unit** → **Create new ad unit**
3. Choose **Display ads**
4. Name it (e.g., "Homepage Banner")
5. Choose **Responsive** ad size
6. Click **Create**
7. **Copy the Ad Slot ID** (it's a number like `1234567890`)

Repeat this for different ad placements:
- Homepage Banner
- Footer Ad
- Sidebar Ad (if you have a sidebar)
- Content Ad (for detail pages)

### Step 3: Add Ads to Your Pages

#### Example: Add Banner to Homepage

1. Open `src/pages/Index.tsx`
2. Add at the top with other imports:
   ```tsx
   import { AdBanner } from '@/components/ads';
   ```
3. Inside your component, add:
   ```tsx
   const Index = () => {
     const adClientId = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID;
     const bannerSlot = 'YOUR_BANNER_AD_SLOT_ID'; // Replace with actual ID from Step 2
     
     return (
       <div>
         {/* Add banner ad at top */}
         {adClientId && (
           <AdBanner
             adClient={adClientId}
             adSlot={bannerSlot}
             position="top"
           />
         )}
         
         {/* Your existing homepage content */}
       </div>
     );
   };
   ```

#### Example: Footer Ad (Already Set Up!)

The footer already has ad code. Just add to your `.env` file:
```env
VITE_GOOGLE_ADS_CLIENT_ID=ca-pub-6329609540816457
VITE_GOOGLE_ADS_FOOTER_SLOT=YOUR_FOOTER_AD_SLOT_ID
```

### Step 4: Restart Your Development Server

```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Deploy Your Website

1. **Build your site:**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting** (Vercel, Netlify, etc.)

3. **Add environment variable in hosting dashboard:**
   - Go to your hosting platform → Settings → Environment Variables
   - Add: `VITE_GOOGLE_ADS_CLIENT_ID` = `ca-pub-6329609540816457`
   - Add: `VITE_GOOGLE_ADS_FOOTER_SLOT` = `YOUR_FOOTER_SLOT_ID` (if using)

4. **Redeploy** after adding environment variables

### Step 6: Wait and Test

1. **Wait 24-48 hours** after deployment
   - Google needs time to start serving ads

2. **Test your site:**
   - Open in **incognito/private browsing mode**
   - Disable ad blockers
   - You should see ads appearing

3. **Check AdSense dashboard:**
   - Go to: https://www.google.com/adsense/
   - Click **Reports** → **Overview**
   - You should see impressions starting to appear

---

## 🎯 Quick Reference

**Your Publisher ID**: `ca-pub-6329609540816457`

**Your Ad Slot IDs** (get these from AdSense dashboard):
- Homepage Banner: `_____________`
- Footer: `_____________`
- Sidebar: `_____________`
- Content: `_____________`

---

## 📚 Available Ad Components

### AdBanner
Perfect for header, footer, or sidebar:
```tsx
<AdBanner
  adClient="ca-pub-6329609540816457"
  adSlot="YOUR_SLOT_ID"
  position="top" // or "bottom" or "sidebar"
/>
```

### AdUnit
Perfect for in-content placements:
```tsx
<AdUnit
  adClient="ca-pub-6329609540816457"
  adSlot="YOUR_SLOT_ID"
  size="rectangle" // or "square" or "skyscraper"
/>
```

### GoogleAd
Base component (most flexible):
```tsx
<GoogleAd
  adClient="ca-pub-6329609540816457"
  adSlot="YOUR_SLOT_ID"
  format="auto"
/>
```

---

## ✅ Checklist

- [ ] Created `.env` file with Publisher ID
- [ ] Created at least one ad unit in AdSense dashboard
- [ ] Copied Ad Slot ID(s)
- [ ] Added ad components to your pages
- [ ] Restarted development server
- [ ] Deployed website with environment variables
- [ ] Waited 24-48 hours
- [ ] Tested ads in incognito mode
- [ ] Checked AdSense dashboard for impressions

---

## 🆘 Troubleshooting

**Ads not showing?**
- ✅ Check `.env` file exists and has correct Publisher ID
- ✅ Restart your dev server after creating `.env`
- ✅ Wait 24-48 hours after deployment
- ✅ Disable ad blockers when testing
- ✅ Check browser console for errors
- ✅ Verify ad units are created in AdSense dashboard

**Need help?**
- See `GET_STARTED_WITH_ADS.md` for detailed guide
- Visit: https://support.google.com/adsense/

---

## 🎉 You're Almost There!

Once you:
1. ✅ Create `.env` file
2. ✅ Create ad units in AdSense
3. ✅ Add ad components to pages
4. ✅ Deploy and wait 24-48 hours

**You'll start earning money!** 💰

Good luck! 🚀

