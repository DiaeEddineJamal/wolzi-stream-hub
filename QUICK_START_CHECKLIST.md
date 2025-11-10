# 🚀 Quick Start Checklist: Get Ads Running in 30 Minutes

Follow this checklist in order. Check off each item as you complete it.

---

## ✅ Phase 1: Get Google AdSense Account (1-2 weeks)

- [ ] **Step 1.1**: Go to https://www.google.com/adsense/
- [ ] **Step 1.2**: Click "Get Started" and sign in
- [ ] **Step 1.3**: Enter your website URL (must be live, not localhost)
- [ ] **Step 1.4**: Submit application
- [ ] **Step 1.5**: Wait for approval email (usually 1-2 weeks)
- [ ] **Step 1.6**: Once approved, log into AdSense dashboard

---

## ✅ Phase 2: Get Your IDs (5 minutes)

- [ ] **Step 2.1**: In AdSense, go to **Account** → **Account information**
- [ ] **Step 2.2**: Copy your **Publisher ID** (looks like: `ca-pub-1234567890123456`)
- [ ] **Step 2.3**: Go to **Ads** → **By ad unit** → **Create new ad unit**
- [ ] **Step 2.4**: Choose "Display ads" → Name it "Homepage Banner" → Create
- [ ] **Step 2.5**: Copy your **Ad Slot ID** (looks like: `1234567890`)
- [ ] **Step 2.6**: (Optional) Create more ad units for Footer, Sidebar, etc.

---

## ✅ Phase 3: Configure Your Code (10 minutes)

- [ ] **Step 3.1**: Create `.env` file in project root
- [ ] **Step 3.2**: Add this line (replace with YOUR Publisher ID):
  ```
  VITE_GOOGLE_ADS_CLIENT_ID=ca-pub-1234567890123456
  ```
- [ ] **Step 3.3**: (Optional) Add ad slot IDs:
  ```
  VITE_GOOGLE_ADS_FOOTER_SLOT=1234567890
  ```
- [ ] **Step 3.4**: Open `index.html`
- [ ] **Step 3.5**: Find line with `YOUR_GOOGLE_ADS_CLIENT_ID`
- [ ] **Step 3.6**: Replace with your actual Publisher ID
- [ ] **Step 3.7**: Save all files
- [ ] **Step 3.8**: Restart your dev server (`npm run dev`)

---

## ✅ Phase 4: Add Ads to Your Pages (15 minutes)

### Homepage Banner (Recommended)

- [ ] **Step 4.1**: Open `src/pages/Index.tsx`
- [ ] **Step 4.2**: Add at the top:
  ```tsx
  import { AdBanner } from '@/components/ads';
  ```
- [ ] **Step 4.3**: Inside component, add:
  ```tsx
  const adClientId = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID;
  const bannerSlot = 'YOUR_BANNER_AD_SLOT_ID'; // From Step 2.5
  
  {adClientId && (
    <AdBanner adClient={adClientId} adSlot={bannerSlot} position="top" />
  )}
  ```
- [ ] **Step 4.4**: Replace `YOUR_BANNER_AD_SLOT_ID` with your actual slot ID
- [ ] **Step 4.5**: Save file

### Footer Ad (Already Added!)

- [ ] **Step 4.6**: Footer already has ad code! Just make sure:
  - `VITE_GOOGLE_ADS_CLIENT_ID` is set
  - `VITE_GOOGLE_ADS_FOOTER_SLOT` is set (optional)

---

## ✅ Phase 5: Deploy & Test (15 minutes)

- [ ] **Step 5.1**: Build your site: `npm run build`
- [ ] **Step 5.2**: Deploy to hosting (Vercel/Netlify/etc.)
- [ ] **Step 5.3**: Add environment variables in hosting dashboard:
  - `VITE_GOOGLE_ADS_CLIENT_ID` = `ca-pub-XXXXXXXXXX`
- [ ] **Step 5.4**: Wait for deployment to complete
- [ ] **Step 5.5**: Open your site in **incognito mode**
- [ ] **Step 5.6**: Check if ads appear (may take 24-48 hours)
- [ ] **Step 5.7**: Check AdSense dashboard → Reports → Overview

---

## ✅ Phase 6: Set Up Payments (10 minutes)

- [ ] **Step 6.1**: Go to AdSense → **Payments** → **Payment settings**
- [ ] **Step 6.2**: Add bank account or payment method
- [ ] **Step 6.3**: Set payment threshold ($100 minimum)
- [ ] **Step 6.4**: Verify your address (Google will send PIN)

---

## 🎯 You're Done!

- [ ] ✅ Ads are showing on your website
- [ ] ✅ You're earning money from clicks
- [ ] ✅ You'll get paid when you reach $100

---

## 📝 Quick Reference

**Your Publisher ID**: `ca-pub-_________________`

**Your Ad Slot IDs**:
- Homepage Banner: `_____________`
- Footer: `_____________`
- Sidebar: `_____________`

**Your Website URL**: `https://_________________`

---

## 🆘 Troubleshooting

**Ads not showing?**
- Wait 24-48 hours after setup
- Check Publisher ID is correct
- Disable ad blockers
- Check browser console for errors

**Need help?**
- See `GET_STARTED_WITH_ADS.md` for detailed guide
- Visit: https://support.google.com/adsense/

---

**Time Estimate**: 
- Phase 1: 1-2 weeks (waiting for approval)
- Phase 2-6: ~30 minutes of actual work

**Total Time**: 1-2 weeks + 30 minutes

