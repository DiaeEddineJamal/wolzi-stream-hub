/**
 * Ad Blocker Service Worker
 * 
 * This service worker intercepts network requests and blocks ads from streaming sources
 * while allowing your own Google Ads to function properly.
 * 
 * Service workers operate at the network level, so they can block requests
 * from cross-origin iframes (like streaming sources).
 */

// Comprehensive list of ad domains to block
const AD_DOMAINS = [
  // Google Ads (block third-party, but we'll whitelist your own)
  'googlesyndication.com',
  'googleadservices.com',
  'doubleclick.net',
  'googleads.g.doubleclick.net',
  'pagead2.googlesyndication.com',
  'adservice.google.com',
  
  // Common ad networks
  'adnxs.com',
  'adsrvr.org',
  'adtechus.com',
  'rubiconproject.com',
  'criteo.com',
  'casalemedia.com',
  'amazon-adsystem.com',
  'advertising.com',
  'adform.net',
  'adzerk.net',
  'pubmatic.com',
  'serving-sys.com',
  'openx.net',
  'adserver.adtechus.com',
  'adserver.adtech.de',
  
  // Content recommendation networks
  'taboola.com',
  'outbrain.com',
  'content.ad',
  'revcontent.com',
  
  // Video ad networks
  'imasdk.googleapis.com',
  'googleads.g.doubleclick.net',
  'pubads.g.doubleclick.net',
  'securepubads.g.doubleclick.net',
  'tpc.googlesyndication.com',
  
  // Other common ad domains
  'advertising.com',
  'advertising.yahoo.com',
  'ads.yahoo.com',
  'advertising.microsoft.com',
  'ads.microsoft.com',
  'adsafeprotected.com',
  'adsystem.walmart.com',
  
  // Streaming site specific ad domains
  'adserver.vidsrc.to',
  'ads.vidsrc.to',
  'adserver.vidking.net',
  'ads.vidking.net',
  'adserver.embed.su',
  'ads.embed.su',
  
  // Generic ad patterns
  'adserver',
  'adserv',
  'advertising',
  'adsystem',
  'adnetwork',
  'adtech',
  'advertising',
  'advert',
  'banner',
  'promo',
  'sponsor'
];

// Whitelist for your own Google Ads (add your AdSense publisher ID here)
// Example: 'ca-pub-1234567890123456'
const ALLOWED_ADS_PUBLISHER_IDS = [
  // Add your Google AdSense publisher IDs here when ready
  // 'ca-pub-XXXXXXXXXX',
];

// Streaming source domains that we want to block ads from
const STREAMING_SOURCE_DOMAINS = [
  'vidsrc.to',
  'vidking.net',
  'embed.su'
];

/**
 * Check if a URL is an ad domain
 */
function isAdDomain(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if it's from a streaming source domain
    const isStreamingSource = STREAMING_SOURCE_DOMAINS.some(domain => 
      hostname.includes(domain)
    );
    
    // If it's from a streaming source, check if it's an ad request
    if (isStreamingSource) {
      const pathname = urlObj.pathname.toLowerCase();
      const search = urlObj.search.toLowerCase();
      
      // Block ad-related paths and parameters
      const adIndicators = ['/ad', '/ads', '/advert', '/adserver', '/advertising', 'ad='];
      if (adIndicators.some(indicator => pathname.includes(indicator) || search.includes(indicator))) {
        return true;
      }
    }
    
    // Check against ad domain list
    for (const adDomain of AD_DOMAINS) {
      if (hostname.includes(adDomain.toLowerCase())) {
        // Check if it's a whitelisted Google Ads publisher
        if (ALLOWED_ADS_PUBLISHER_IDS.length > 0) {
          const publisherId = urlObj.searchParams.get('client') || 
                             urlObj.searchParams.get('ca-pub') ||
                             urlObj.pathname.match(/ca-pub-[\d]+/);
          
          if (publisherId && ALLOWED_ADS_PUBLISHER_IDS.some(id => 
            publisherId.includes(id) || id.includes(publisherId)
          )) {
            return false; // Allow whitelisted ads
          }
        }
        return true; // Block ad domain
      }
    }
    
    return false;
  } catch (e) {
    // If URL parsing fails, check if the string contains ad indicators
    const urlLower = url.toLowerCase();
    return AD_DOMAINS.some(domain => urlLower.includes(domain.toLowerCase()));
  }
}

/**
 * Check if a request should be blocked
 */
function shouldBlockRequest(request) {
  const url = request.url;
  
  // Always allow same-origin requests (your own site)
  try {
    const requestUrl = new URL(url);
    const currentOrigin = self.location.origin;
    
    // Allow same-origin requests
    if (requestUrl.origin === currentOrigin) {
      return false;
    }
  } catch (e) {
    // If we can't parse the URL, be conservative and don't block
    return false;
  }
  
  // Block ad domains
  if (isAdDomain(url)) {
    console.log('[Ad Blocker SW] Blocking ad request:', url);
    return true;
  }
  
  // Block requests with ad-related headers
  const referer = request.headers.get('referer');
  if (referer && isAdDomain(referer)) {
    console.log('[Ad Blocker SW] Blocking request with ad referer:', url);
    return true;
  }
  
  return false;
}

/**
 * Intercept fetch requests
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Only intercept HTTP/HTTPS requests
  if (request.url.startsWith('http://') || request.url.startsWith('https://')) {
    // Skip same-origin requests to avoid blocking your own resources
    try {
      const requestUrl = new URL(request.url);
      const currentOrigin = self.location.origin;
      
      if (requestUrl.origin === currentOrigin) {
        // Allow same-origin requests
        return;
      }
    } catch (e) {
      // If we can't parse, allow it
      return;
    }
    
    // Check if this is an ad request
    if (shouldBlockRequest(request)) {
      // Block the request by returning an empty response
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
  }
  
  // For non-ad requests, let them proceed normally
  // Don't call event.respondWith() to allow the request to proceed
});

/**
 * Service worker install handler
 */
self.addEventListener('install', (event) => {
  console.log('[Ad Blocker SW] Service worker installed');
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

/**
 * Service worker activate handler
 */
self.addEventListener('activate', (event) => {
  console.log('[Ad Blocker SW] Service worker activated');
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

/**
 * Handle messages from the main thread
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_WHITELIST') {
    // Update the whitelist with new publisher IDs
    if (Array.isArray(event.data.publisherIds)) {
      ALLOWED_ADS_PUBLISHER_IDS.length = 0;
      ALLOWED_ADS_PUBLISHER_IDS.push(...event.data.publisherIds);
      console.log('[Ad Blocker SW] Updated whitelist:', ALLOWED_ADS_PUBLISHER_IDS);
    }
  }
  
  if (event.data && event.data.type === 'PING') {
    // Respond to ping to confirm service worker is active
    event.ports[0].postMessage({ type: 'PONG', active: true });
  }
});

console.log('[Ad Blocker SW] Ad blocker service worker loaded');

