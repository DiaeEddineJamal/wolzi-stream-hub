# Step-by-Step Guide: Start Earning Money with Google Ads on WolziFlix

Follow these steps in order to start monetizing your website with Google AdSense.

---

## 📋 Prerequisites

Before you start, make sure you have:
- ✅ Your website is live and accessible (not just localhost)
- ✅ Your website has original content (movies, TV shows, anime listings)
- ✅ You're at least 18 years old
- ✅ You have a Google account

---

## Step 1: Apply for Google AdSense Account

**Time: 1-2 weeks (approval process)**

1. **Go to Google AdSense**
   - Visit: https://www.google.com/adsense/
   - Click "Get Started"

2. **Sign in with your Google account**
   - Use the Google account you want to receive payments with

3. **Enter your website URL**
   - Enter: `https://yourdomain.com` (your actual website URL)
   - Don't use `localhost` or `127.0.0.1`

4. **Choose your country**
   - Select the country where you'll receive payments

5. **Submit your application**
   - Google will review your site (usually takes 1-2 weeks)
   - They'll check:
     - Your site has original content
     - Your site follows AdSense policies
     - Your site gets some traffic

6. **Wait for approval email**
   - You'll receive an email when approved
   - This email contains your **Publisher ID** (looks like: `ca-pub-1234567890123456`)

---

## Step 2: Get Your Publisher ID

**Time: 5 minutes**

Once approved:

1. **Log into AdSense dashboard**
   - Go to: https://www.google.com/adsense/

2. **Find your Publisher ID**
   - Click on **Account** → **Account information**
   - Your Publisher ID is displayed (format: `ca-pub-XXXXXXXXXX`)
   - **Copy this ID** - you'll need it!

---

## Step 3: Create Your First Ad Unit

**Time: 10 minutes**

1. **Go to Ads section**
   - In AdSense dashboard, click **Ads** → **By ad unit**

2. **Click "Create new ad unit"**

3. **Choose ad type:**
   - **Display ads** (recommended for beginners)
   - Click "Create"

4. **Configure your ad:**
   - **Name**: Give it a name like "Homepage Banner" or "Footer Ad"
   - **Ad size**: Choose **Responsive** (recommended) or specific sizes
   - **Ad type**: Choose **Display ads**

5. **Click "Create ad unit"**

6. **Copy your Ad Slot ID**
   - You'll see something like: `1234567890`
   - **Copy this number** - you'll need it!

7. **Repeat for more ad units** (optional):
   - Create different ad units for different pages:
     - Homepage banner
     - Footer banner
     - Sidebar ad
     - In-content ad

---

## Step 4: Set Up Environment Variables

**Time: 5 minutes**

1. **Create `.env` file** in your project root (if it doesn't exist)

2. **Add your Publisher ID:**
   ```env
   VITE_GOOGLE_ADS_CLIENT_ID=ca-pub-1234567890123456
   ```
   Replace `ca-pub-1234567890123456` with YOUR actual Publisher ID

3. **Add your Ad Slot IDs** (optional but recommended):
   ```env
   VITE_GOOGLE_ADS_CLIENT_ID=ca-pub-1234567890123456
   VITE_GOOGLE_ADS_FOOTER_SLOT=1234567890
   VITE_GOOGLE_ADS_BANNER_SLOT=0987654321
   VITE_GOOGLE_ADS_SIDEBAR_SLOT=1122334455
   ```
   Replace with YOUR actual Ad Slot IDs from Step 3

4. **Save the file**

5. **Restart your development server** (if running):
   ```bash
   # Stop your server (Ctrl+C)
   # Then start it again
   npm run dev
   ```

---

## Step 5: Update Your Code

**Time: 10 minutes**

### 5.1 Update index.html (Optional but Recommended)

1. **Open `index.html`**

2. **Find this line** (around line 29):
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=YOUR_GOOGLE_ADS_CLIENT_ID"
    crossorigin="anonymous"></script>
   ```

3. **Replace `YOUR_GOOGLE_ADS_CLIENT_ID`** with your actual Publisher ID:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456"
    crossorigin="anonymous"></script>
   ```

### 5.2 Add Ads to Your Pages

The code is already set up! You just need to add ad components where you want ads to appear.

**Example 1: Add banner to Homepage**

1. **Open `src/pages/Index.tsx`**

2. **Add at the top of the component:**
   ```tsx
   import { AdBanner } from '@/components/ads';

   const Index = () => {
     const adClientId = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID;
     const bannerSlot = import.meta.env.VITE_GOOGLE_ADS_BANNER_SLOT || 'YOUR_BANNER_SLOT_ID';
     
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
         
         {/* Rest of your homepage content */}
       </div>
     );
   };
   ```

**Example 2: Add ad to Media Detail Page**

1. **Open `src/pages/MediaDetail.tsx`**

2. **Add ad above the video player:**
   ```tsx
   import { GoogleAd } from '@/components/ads';

   // Inside your component:
   const adClientId = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID;
   const contentAdSlot = 'YOUR_CONTENT_AD_SLOT_ID';

   {adClientId && (
     <GoogleAd
       adClient={adClientId}
       adSlot={contentAdSlot}
       format="auto"
       style={{ margin: '20px 0' }}
     />
   )}
   ```

**Example 3: Footer ad (Already added!)**

The footer already has an example ad. Just make sure you have:
- `VITE_GOOGLE_ADS_CLIENT_ID` set
- `VITE_GOOGLE_ADS_FOOTER_SLOT` set (optional)

---

## Step 6: Deploy Your Website

**Time: 15-30 minutes**

1. **Build your website:**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting** (Vercel, Netlify, etc.):
   - Make sure to add your environment variables in your hosting platform
   - Go to your hosting dashboard → Settings → Environment Variables
   - Add: `VITE_GOOGLE_ADS_CLIENT_ID` = `ca-pub-XXXXXXXXXX`
   - Add other ad slot IDs if you're using them

3. **Verify your site is live**

---

## Step 7: Verify Ads Are Working

**Time: 5 minutes**

1. **Wait 24-48 hours** after deployment
   - Google needs time to start serving ads

2. **Check your site in incognito mode**
   - Open your website in incognito/private browsing
   - You should see ads appearing

3. **Check AdSense dashboard**
   - Go to: https://www.google.com/adsense/
   - Click **Reports** → **Overview**
   - You should see impressions starting to appear

4. **Use AdSense preview tool**
   - In AdSense dashboard → **Ads** → **By ad unit**
   - Click on an ad unit → **Preview**
   - This shows you how ads appear on your site

---

## Step 8: Optimize Your Earnings

**Time: Ongoing**

### Best Practices:

1. **Place ads above the fold** (visible without scrolling)
   - Top of homepage
   - Above video players
   - Top of content pages

2. **Use responsive ads** (`format="auto"`)
   - They adapt to screen size automatically
   - Better user experience = more clicks

3. **Don't overdo it**
   - Start with 1-3 ads per page
   - Too many ads = bad user experience = lower earnings

4. **Monitor performance**
   - Check AdSense dashboard weekly
   - See which ad placements perform best
   - Adjust based on data

5. **Follow AdSense policies**
   - ✅ Don't click your own ads
   - ✅ Don't ask others to click ads
   - ✅ Don't place ads too close to clickable elements
   - ✅ Don't use misleading labels like "Click here"

---

## Step 9: Set Up Payment

**Time: 10 minutes**

1. **Go to AdSense dashboard**
   - Click **Payments** → **Payment settings**

2. **Add payment method**
   - Choose: Bank account or check
   - Enter your bank details

3. **Set payment threshold**
   - Minimum: $100 (default)
   - You'll receive payment when you reach this amount

4. **Add tax information** (if required)
   - Fill out tax forms if needed

5. **Verify your address**
   - Google will send a PIN to verify your address

---

## 📊 Understanding Your Earnings

### How You Get Paid:

1. **Impressions**: Every time an ad is shown = 1 impression
2. **Clicks**: When someone clicks an ad = 1 click
3. **Revenue**: You earn money from clicks (CPC - Cost Per Click)
4. **Payment**: When you reach $100, Google pays you

### Typical Earnings:

- **Small website** (100-1000 visitors/day): $1-10/month
- **Medium website** (1000-10,000 visitors/day): $10-100/month
- **Large website** (10,000+ visitors/day): $100+/month

**Note**: Earnings vary greatly based on:
- Your traffic
- Your niche (entertainment sites can earn well)
- Ad placement
- User engagement

---

## 🚨 Common Issues & Solutions

### Ads Not Showing?

1. **Check your Publisher ID** is correct
2. **Wait 24-48 hours** after setup
3. **Check browser console** for errors
4. **Verify your site is approved** in AdSense
5. **Check ad blockers** - disable them to test

### Low Earnings?

1. **Increase traffic** to your site
2. **Optimize ad placement** (above the fold)
3. **Use responsive ads** (`format="auto"`)
4. **Add more ad units** (but don't overdo it)
5. **Improve content quality** = more visitors = more earnings

### Account Suspended?

- Read the email from Google carefully
- Fix policy violations
- Submit an appeal if you believe it's a mistake
- Common violations:
  - Clicking your own ads
  - Invalid traffic
  - Policy violations

---

## ✅ Checklist

Before you start earning, make sure:

- [ ] Google AdSense account approved
- [ ] Publisher ID copied (`ca-pub-XXXXXXXXXX`)
- [ ] At least one ad unit created
- [ ] Ad Slot ID copied
- [ ] `.env` file created with Publisher ID
- [ ] Code updated with ad components
- [ ] Website deployed with environment variables
- [ ] Ads visible on website (check in incognito)
- [ ] Payment method added in AdSense
- [ ] Monitoring AdSense dashboard

---

## 📞 Need Help?

- **AdSense Help**: https://support.google.com/adsense/
- **AdSense Community**: https://support.google.com/adsense/community
- **AdSense Policies**: https://support.google.com/adsense/answer/48182

---

## 🎉 You're Done!

Once you complete these steps:
1. ✅ Your ads will start showing
2. ✅ You'll earn money from clicks
3. ✅ You'll get paid when you reach $100

**Remember**: Be patient! It takes time to build traffic and earnings. Focus on creating great content and getting visitors to your site.

Good luck! 🚀💰

