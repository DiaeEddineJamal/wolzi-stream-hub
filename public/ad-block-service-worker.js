// ad-block-service-worker.js
// Service worker to block ads from streaming sources

// Comprehensive list of ad domains to block
const AD_DOMAINS = [
  // Common ad networks
  'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
  'google-analytics.com', 'googletagmanager.com', 'googleadservices.com',
  'adsafeprotected.com', 'advertising.com', 'adnxs.com', 'adsrvr.org',
  'adtechus.com', 'advertising.com', 'adform.net', 'adnxs.com',
  'adsrvr.org', 'adtechus.com', 'advertising.com', 'adform.net',
  'advertising.com', 'adnxs.com', 'adsrvr.org', 'adtechus.com',
  
  // Video ad networks
  'vidoomy.com', 'vidazoo.com', 'videoadex.com', 'videoads.com',
  'videoadex.com', 'videoads.com', 'vidoomy.com', 'vidazoo.com',
  
  // Popup/ad redirect domains
  'popads.net', 'popcash.net', 'propellerads.com', 'popunder.com',
  'popads.net', 'popcash.net', 'propellerads.com', 'popunder.com',
  
  // Streaming site specific ads
  'vidsrc.to', 'embed.su', 'vidking.net', // These are the streaming sources themselves, but we'll block their ad subdomains
  'ads.vidsrc.to', 'ad.vidsrc.to', 'ads.embed.su', 'ad.embed.su',
  'ads.vidking.net', 'ad.vidking.net',
  
  // Common ad patterns
  'adserver', 'adserver-', 'ads.', 'ad.', 'advertising', 'banner',
  'promo', 'sponsor', 'tracking', 'analytics', 'pixel', 'beacon',
  
  // Additional ad networks
  'amazon-adsystem.com', 'media.net', 'outbrain.com', 'taboola.com',
  'criteo.com', 'rubiconproject.com', 'pubmatic.com', 'openx.net',
  'indexexchange.com', '33across.com', 'advertising.com', 'adform.net',
  'adtechus.com', 'adnxs.com', 'adsrvr.org', 'advertising.com',
  
  // Malicious/ad redirect domains
  'clickfunnels.com', 'redirect', 'track', 'affiliate', 'partner'
];

// Function to check if URL is an ad
function isAdUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check against ad domains list
    for (const adDomain of AD_DOMAINS) {
      if (hostname.includes(adDomain)) {
        return true;
      }
    }
    
    // Check for common ad patterns in path
    const path = urlObj.pathname.toLowerCase();
    const adPatterns = ['/ad', '/ads', '/advertisement', '/banner', '/promo', '/sponsor', '/tracking', '/analytics', '/pixel', '/beacon'];
    for (const pattern of adPatterns) {
      if (path.includes(pattern)) {
        return true;
      }
    }
    
    // Check query parameters for ad indicators
    const searchParams = urlObj.searchParams;
    const adParams = ['ad', 'ads', 'advertisement', 'banner', 'promo', 'sponsor', 'tracking', 'analytics'];
    for (const param of adParams) {
      if (searchParams.has(param)) {
        return true;
      }
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

// Intercept fetch requests and block ads
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Block ad URLs
  if (isAdUrl(url)) {
    console.log('[Ad Blocker] Blocked ad request:', url);
    event.respondWith(
      new Response('', {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'text/plain',
          'X-Ad-Blocked': 'true'
        }
      })
    );
    return;
  }
  
  // Allow non-ad requests to proceed normally
  event.respondWith(fetch(event.request));
});

// Service worker install handler
self.addEventListener('install', (event) => {
  console.log('[Ad Blocker] Service worker installed');
  self.skipWaiting();
});

// Service worker activate handler
self.addEventListener('activate', (event) => {
  console.log('[Ad Blocker] Service worker activated');
  event.waitUntil(self.clients.claim());
});

