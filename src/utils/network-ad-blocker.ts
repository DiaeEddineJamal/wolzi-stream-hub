/**
 * Network-Level Ad Blocker
 * 
 * This utility blocks ad network requests at the page level by intercepting
 * fetch and XMLHttpRequest. This works as a fallback when service workers
 * are not available or for additional protection.
 */

// Comprehensive list of ad domains to block
const AD_DOMAINS = [
  // Google Ads (will be whitelisted for your own ads)
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
  
  // Content recommendation networks
  'taboola.com',
  'outbrain.com',
  'content.ad',
  'revcontent.com',
  
  // Video ad networks
  'imasdk.googleapis.com',
  'pubads.g.doubleclick.net',
  'securepubads.g.doubleclick.net',
  'tpc.googlesyndication.com',
];

// Whitelist for your own Google Ads publisher IDs
let ALLOWED_PUBLISHER_IDS: string[] = [];

// Streaming source domains
const STREAMING_SOURCE_DOMAINS = [
  'vidsrc.to',
  'vidking.net',
  'embed.su'
];

/**
 * Check if a URL is an ad domain
 */
function isAdDomain(url: string): boolean {
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
        if (ALLOWED_PUBLISHER_IDS.length > 0) {
          const publisherId = urlObj.searchParams.get('client') || 
                             urlObj.searchParams.get('ca-pub') ||
                             urlObj.pathname.match(/ca-pub-[\d]+/)?.[0];
          
          if (publisherId && ALLOWED_PUBLISHER_IDS.some(id => 
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
 * Block ad network requests using fetch override
 */
function blockFetchRequests(): void {
  if (typeof window === 'undefined') return;
  
  const originalFetch = window.fetch;
  
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    if (isAdDomain(url)) {
      console.log('[Network Ad Blocker] Blocked fetch request to ad domain:', url);
      // Return an empty response
      return Promise.resolve(new Response('', {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'text/plain',
          'X-Ad-Blocked': 'true'
        }
      }));
    }
    
    return originalFetch.call(this, input, init);
  };
}

/**
 * Block ad network requests using XMLHttpRequest override
 */
function blockXHRRequests(): void {
  if (typeof window === 'undefined' || !window.XMLHttpRequest) return;
  
  const originalOpen = XMLHttpRequest.prototype.open;
  
  XMLHttpRequest.prototype.open = function(
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ): void {
    const urlString = typeof url === 'string' ? url : url.href;
    
    if (isAdDomain(urlString)) {
      console.log('[Network Ad Blocker] Blocked XMLHttpRequest to ad domain:', urlString);
      // Abort the request
      this.abort();
      return;
    }
    
    return originalOpen.call(this, method, url, async ?? true, username, password);
  };
}

/**
 * Block ad-related script tags
 */
function blockAdScripts(): void {
  if (typeof document === 'undefined') return;
  
  const originalCreateElement = document.createElement;
  
  document.createElement = function(tagName: string, options?: ElementCreationOptions): HTMLElement {
    const element = originalCreateElement.call(document, tagName, options);
    
    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute.bind(element);
      
      element.setAttribute = function(name: string, value: string): void {
        if (name === 'src' && typeof value === 'string') {
          if (isAdDomain(value)) {
            console.log('[Network Ad Blocker] Blocked script with ad domain src:', value);
            return; // Don't set the src attribute
          }
        }
        return originalSetAttribute(name, value);
      };
    }
    
    return element;
  };
}

/**
 * Initialize network-level ad blocking
 */
export const initNetworkAdBlocker = (): void => {
  if (typeof window === 'undefined') return;
  
  console.log('[Network Ad Blocker] Initializing network-level ad blocking...');
  
  // Block fetch requests
  blockFetchRequests();
  
  // Block XMLHttpRequest
  blockXHRRequests();
  
  // Block ad scripts
  blockAdScripts();
  
  console.log('[Network Ad Blocker] Network-level ad blocking initialized');
};

/**
 * Update the whitelist of allowed publisher IDs
 */
export const updateAdWhitelist = (publisherIds: string[]): void => {
  ALLOWED_PUBLISHER_IDS = [...publisherIds];
  console.log('[Network Ad Blocker] Updated ad whitelist:', publisherIds);
};

export default {
  initNetworkAdBlocker,
  updateAdWhitelist
};

