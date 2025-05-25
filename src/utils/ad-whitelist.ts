/**
 * Ad Whitelist Utility
 * 
 * This utility manages whitelisting of Google Ads domains and containers
 * that should be allowed to display on the website.
 * 
 * This enables the site owner to block unwanted third-party ads from streaming servers
 * while still being able to monetize their site with their own Google Ads.
 */

// Add declaration for the adsbygoogle property on Window
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// List of allowed Google Ads domains
export const ALLOWED_AD_DOMAINS = [
  // Google Ads core domains
  'googleads.g.doubleclick.net',
  'pagead2.googlesyndication.com',
  'tpc.googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'www.googletagservices.com',
  
  // Google Analytics (often needed for ad performance tracking)
  'www.google-analytics.com',
  'analytics.google.com',
  'ssl.google-analytics.com',
  
  // Additional Google services that might be needed for ads
  'www.gstatic.com',
  'adx.g.doubleclick.net',
  'securepubads.g.doubleclick.net',
  'pubads.g.doubleclick.net',
  'partner.googleadservices.com',
  
  // Add any other ad network domains you want to allow here
];

// CSS selectors for your own ad containers that should be allowed
export const ALLOWED_AD_SELECTORS = [
  // Your Google AdSense containers - update these with your own
  '#google-ad-container',
  '.google-ad-unit',
  '.google-ad-banner',
  '.wolziflix-ad-container',
  '[id^="wolziflix-ad-"]',
  '[class^="wolziflix-ad-"]',
  
  // Common Google ad elements (replace with your specific implementations)
  'ins.adsbygoogle',
  '.adsbygoogle',
  'div[id^="div-gpt-ad"]',
  'div[data-ad-client]',
  
  // Add any other ad container selectors you want to allow here
];

/**
 * Check if a domain is in the whitelist
 */
export const isWhitelistedDomain = (url: string): boolean => {
  if (!url) return false;
  
  try {
    // Try to create a URL object to extract the domain
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Check if the domain is in the whitelist
    return ALLOWED_AD_DOMAINS.some(allowedDomain => 
      domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
    );
  } catch (e) {
    // If URL parsing fails, check if the string contains any whitelisted domains
    return ALLOWED_AD_DOMAINS.some(allowedDomain => url.includes(allowedDomain));
  }
};

/**
 * Check if an element matches a whitelisted ad selector
 */
export const isWhitelistedAdElement = (element: Element): boolean => {
  if (!element) return false;
  
  // Check if the element matches any of the allowed selectors
  for (const selector of ALLOWED_AD_SELECTORS) {
    try {
      if (element.matches(selector)) {
        return true;
      }
    } catch (e) {
      // Skip invalid selectors
    }
  }
  
  // Also check for Google Ad attributes
  const id = (element.id || '').toLowerCase();
  const className = element.className ? element.className.toString().toLowerCase() : '';
  
  // Fix for dataset property by casting to HTMLElement when applicable
  let datasetString = '';
  if (element instanceof HTMLElement && element.dataset) {
    datasetString = Object.values(element.dataset).join(' ').toLowerCase();
  }
  
  // Google ad specific attributes
  const hasGoogleAdAttribute = 
    element.hasAttribute('data-ad-client') || 
    element.hasAttribute('data-ad-slot') || 
    datasetString.includes('adsbygoogle') ||
    datasetString.includes('wolziflix');
  
  // Check for common Google ad class/id patterns
  const hasGoogleAdClass = 
    className.includes('adsbygoogle') || 
    className.includes('wolziflix-ad') ||
    id.includes('div-gpt-ad') ||
    id.includes('wolziflix-ad');
  
  return hasGoogleAdAttribute || hasGoogleAdClass;
};

/**
 * Adds custom Google Ads script to the page
 */
export const setupGoogleAds = (googleAdClientId: string): void => {
  if (!googleAdClientId) {
    console.warn('No Google Ad Client ID provided');
    return;
  }
  
  // Add Google AdSense script
  const adScript = document.createElement('script');
  adScript.async = true;
  adScript.crossOrigin = 'anonymous';
  adScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${googleAdClientId}`;
  document.head.appendChild(adScript);
  
  console.log('Google AdSense script added to page');
};

/**
 * Creates a container for a Google Ad
 */
export const createAdContainer = (
  id: string, 
  adSlot: string, 
  width: number = 300, 
  height: number = 250,
  format: 'auto' | 'fluid' | 'rectangle' = 'auto'
): HTMLElement => {
  // Create container div
  const container = document.createElement('div');
  container.id = id;
  container.className = 'wolziflix-ad-container';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.margin = '20px auto';
  container.style.overflow = 'hidden';
  container.style.backgroundColor = '#1a1a1a';
  container.style.borderRadius = '8px';
  
  // Create AdSense ins element
  const adElement = document.createElement('ins');
  adElement.className = 'adsbygoogle';
  adElement.style.display = 'block';
  adElement.style.width = format === 'auto' ? '100%' : `${width}px`;
  adElement.style.height = format === 'auto' ? '100%' : `${height}px`;
  adElement.setAttribute('data-ad-client', 'ca-pub-XXXXXXXXXXXXXXXX'); // Replace with your actual client ID
  adElement.setAttribute('data-ad-slot', adSlot);
  adElement.setAttribute('data-ad-format', format);
  
  // Append to container
  container.appendChild(adElement);
  
  // Push the ad to AdSense after a short delay
  setTimeout(() => {
    try {
      // Initialize adsbygoogle array if it doesn't exist
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('Error initializing Google ad:', e);
    }
  }, 100);
  
  return container;
};

export default {
  ALLOWED_AD_DOMAINS,
  ALLOWED_AD_SELECTORS,
  isWhitelistedDomain,
  isWhitelistedAdElement,
  setupGoogleAds,
  createAdContainer
}; 