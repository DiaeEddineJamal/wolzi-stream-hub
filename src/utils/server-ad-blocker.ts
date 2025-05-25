/**
 * Server Ad Blocker
 * 
 * This utility provides server-side ad blocking functionality.
 * It blocks ad network requests, removes ad containers, and prevents
 * popups from displaying when interacting with the player.
 */

import { isWhitelistedDomain, isWhitelistedAdElement } from './ad-whitelist';

// A list of known ad domains to block
export const AD_DOMAINS = [
  'googleads.', 'doubleclick.net', 'adnxs.com', 'adsystem.com',
  'adtech.', 'advertising.com', 'adform.', 'admob.', 'adlooxtracking',
  'adlightning.', 'admedia.', 'admeridianads.', 'adrta.', 'adsafeprotected',
  'adsrvr.', 'adsymptotic.', 'adtechus.', 'bidswitch.', 'buysellads',
  'clmbtech.', 'criteo.', 'districtm.', 'doubleclick.', 'effectivemeasure',
  'exelator.', 'gemius.', 'gumgum.', 'iasds01.', 'improvedigital',
  'kargo.', 'mediaplex.', 'mgid.', 'moatads.', 'mookie1.',
  'optimhub.', 'outbrain.', 'pubmatic.', 'quantserve.', 'revcontent',
  'rubiconproject.', 'scorecardresearch.', 'smartadserver.', 'taboola',
  'teads.', 'tribalfusion.', 'vi.ai', 'virool.', 'yahoo.com/ads',
  'yieldmo.', 'zedo.', 'zeustechnology.', 
  // Common popup ad domains
  'popads.', 'popunder.', 'popcash.', 'poptm.', 'propellerads.', 
  'adsterra.', 'clickaine.', 'juicyads.', 'exoclick.', 'trafficjunky.',
  'adcash.', 'clicksor.', 'popmyads.', 'adbooth.', 'adclerks.'
];

// A list of ad selectors to target ad elements on pages
export const AD_SELECTORS = [
  // Common ad containers
  '.ad', '.ads', '.advertisement', '.advertising', '.ad-container',
  '#ad', '#ads', '#advertisement', '#advertising', '#ad-container',
  '[id*="ad-"]', '[class*="ad-"]', '[id*="ad_"]', '[class*="ad_"]',
  
  // Video player ads
  '.video-ads', '.videoAd', '.player-ads', '.player-ad',
  '.jwplayer-ad', '.vjs-ad', '.vjs-ad-overlay', '.ima-ad-container',
  '.pre-roll-ad', '.post-roll-ad', '.ad-overlay',
  
  // Common ad services
  '[id*="google_ads"]', '[class*="google_ads"]',
  '[id*="div-gpt-ad"]', '[class*="adform"]',
  '[class*="taboola"]', '[id*="taboola"]',
  '[id*="outbrain"]', '[class*="outbrain"]',
  
  // Popups and overlays
  '.popup-ad', '.popup_ad', '.popupAd', 
  '.overlay-ad', '.overlay_ad', '.overlayAd',
  '.modal-ad', '.modal_ad', '.modalAd',
  '[id*="popup"]', '[class*="popup"]',
  '[id*="overlay"]', '[class*="overlay"]',
  '[id*="modal"]', '[class*="modal"]',
  
  // Iframe-based ads
  'iframe[src*="ads"]', 'iframe[src*="ad."]', 'iframe[src*="adserv"]',
  'iframe[src*="doubleclick"]', 'iframe[src*="ad-"]'
];

// Legitimate UI elements that should not be blocked
export const EXCLUDED_SELECTORS = [
  '.hero-banner',
  '.banner-content',
  '.hero-banner-content',
  '.hero-banner-overlay'
];

/**
 * Initialize the ad blocker by setting up interceptors for ad requests
 * and observers for dynamically inserted ad elements.
 */
export const initAdBlocker = (): void => {
  if (typeof window === 'undefined') return;
  
  console.log('[Ad Blocker] Initializing server-side ad blocker');
  
  // Set up network request interception
  setupNetworkIntercept();
  
  // Set up observer for dynamically inserted ad elements
  setupAdElementObserver();
  
  // Set up popup and overlay blocker
  setupPopupBlocker();
  
  // Set up click interceptor for play buttons
  setupClickInterceptor();
  
  // Clean up existing ads
  removeAdElements();
  
  // Periodically check for and remove ad elements
  setInterval(removeAdElements, 5000);
};

/**
 * Intercept network requests to block ads
 */
const setupNetworkIntercept = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Override fetch to intercept ad requests
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' 
        ? input 
        : input instanceof URL 
          ? input.href 
          : input instanceof Request 
            ? input.url 
            : '';
      
      // Check if this is a whitelisted domain (our own ads)
      if (isWhitelistedDomain(url)) {
        return originalFetch.apply(this, [input, init]);
      }
      
      // Check if URL contains known ad domains
      if (isAdUrl(url)) {
        console.log(`[Ad Blocker] Blocked fetch request to: ${url}`);
        // Return an empty response to avoid errors
        return Promise.resolve(new Response('', { status: 200 }));
      }
      
      // Allow other requests to proceed
      return originalFetch.apply(this, [input, init]);
    };
    
    // Override XMLHttpRequest to intercept ad requests
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(
      method: string, 
      url: string | URL, 
      async: boolean = true, 
      username?: string | null, 
      password?: string | null
    ): void {
      const urlString = url.toString();
      
      // Check if this is a whitelisted domain (our own ads)
      if (isWhitelistedDomain(urlString)) {
        originalOpen.apply(this, [method, url, async, username, password]);
        return;
      }
      
      // Check if URL contains known ad domains
      if (isAdUrl(urlString)) {
        console.log(`[Ad Blocker] Blocked XMLHttpRequest to: ${urlString}`);
        // Make this a no-op request
        originalOpen.apply(this, [method, 'about:blank', async, username, password]);
        this.abort();
        return;
      }
      
      // Allow other requests to proceed
      originalOpen.apply(this, [method, url, async, username, password]);
    };
    
    console.log('[Ad Blocker] Network interception set up');
  } catch (error) {
    console.error('[Ad Blocker] Error setting up network interception:', error);
  }
};

/**
 * Set up a MutationObserver to detect and remove dynamically inserted ad elements
 */
const setupAdElementObserver = (): void => {
  if (typeof window === 'undefined' || !window.MutationObserver) return;
  
  try {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            // Check if the added node is an Element
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Skip if this is a whitelisted ad element (our own ads)
              if (isWhitelistedAdElement(element)) {
                return;
              }
              
              // Check if this element matches any ad selectors
              if (isAdElement(element)) {
                if (element.parentNode) {
                  element.parentNode.removeChild(element);
                  console.log('[Ad Blocker] Removed dynamically inserted ad element');
                }
              }
              
              // Also check for ad elements inside this node
              removeAdElementsInNode(element);
            }
          });
        }
      });
    });
    
    // Start observing the document for changes
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    
    console.log('[Ad Blocker] Ad element observer set up');
  } catch (error) {
    console.error('[Ad Blocker] Error setting up ad element observer:', error);
  }
};

/**
 * Set up popup and overlay blocker
 */
const setupPopupBlocker = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Block window.open calls
    const originalOpen = window.open;
    window.open = function(url?: string | URL, target?: string, features?: string): Window | null {
      if (!url) {
        console.log('[Ad Blocker] Blocked empty URL popup');
        return null;
      }
      
      const urlString = url.toString();
      
      // Allow whitelisted domains (our own URLs)
      if (isWhitelistedDomain(urlString)) {
        return originalOpen.call(this, url, target, features);
      }
      
      // Block known ad URLs
      if (isAdUrl(urlString)) {
        console.log(`[Ad Blocker] Blocked popup to ad URL: ${urlString}`);
        return null;
      }
      
      // Block common popup patterns
      if (
        features && (
          features.includes('width=1') || 
          features.includes('height=1') ||
          features.includes('toolbar=no,location=no,directories=no,status=no,menubar=no')
        )
      ) {
        console.log(`[Ad Blocker] Blocked likely ad popup to: ${urlString}`);
        return null;
      }
      
      // Let other window.open calls through
      return originalOpen.call(this, url, target, features);
    };
    
    // Keep track of when last user interaction happened
    let lastInteraction = Date.now();
    
    // Track user interactions
    document.addEventListener('mousedown', () => {
      lastInteraction = Date.now();
    });
    
    document.addEventListener('keydown', () => {
      lastInteraction = Date.now();
    });
    
    // Block automatic popups (that happen without user interaction)
    const originalWindowOpen = window.open;
    window.open = function(url?: string | URL, target?: string, features?: string): Window | null {
      const timeSinceInteraction = Date.now() - lastInteraction;
      
      // If no user interaction in the last second, likely an automatic popup
      if (timeSinceInteraction > 1000) {
        console.log('[Ad Blocker] Blocked automatic popup (no recent user interaction)');
        return null;
      }
      
      return originalWindowOpen.call(this, url, target, features);
    };
    
    console.log('[Ad Blocker] Popup blocker set up');
  } catch (error) {
    console.error('[Ad Blocker] Error setting up popup blocker:', error);
  }
};

/**
 * Setup click interceptor to block popups from play buttons
 */
const setupClickInterceptor = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Identify video player elements
    const isVideoPlayerElement = (element: Element | null): boolean => {
      if (!element) return false;
      
      // Check if it's a video element
      if (element.tagName === 'VIDEO') return true;
      
      // Check for common player class names and IDs
      const className = element.className ? element.className.toString().toLowerCase() : '';
      const id = (element.id || '').toLowerCase();
      
      // Common video player selectors
      return (
        className.includes('player') || 
        className.includes('video') || 
        className.includes('play-button') ||
        id.includes('player') || 
        id.includes('video') ||
        // Common video player frameworks
        className.includes('vjs-') || // Video.js
        className.includes('jw-') ||  // JW Player
        className.includes('plyr') || // Plyr
        className.includes('mejs-') || // MediaElement.js
        // Check for iframe video embeds
        (element.tagName === 'IFRAME' && (
          element.getAttribute('src')?.includes('embed') ||
          element.getAttribute('src')?.includes('player') ||
          element.getAttribute('src')?.includes('video')
        ))
      );
    };
    
    // Save original window.open function
    const originalWindowOpen = window.open;
    
    // Add capture phase click event listener to catch clicks before they reach elements
    document.addEventListener('click', (event) => {
      // Walk up the DOM tree to check if the click is on or inside a video player
      let target = event.target as Element | null;
      let isVideoPlayer = false;
      
      // Check if the click target or any of its parents is a video player element
      while (target && !isVideoPlayer) {
        isVideoPlayer = isVideoPlayerElement(target);
        target = target.parentElement;
      }
      
      if (isVideoPlayer) {
        console.log('[Ad Blocker] Detected click on video player element');
        
        // For video player clicks, allow the click but prepare to block resulting popups
        setTimeout(() => {
          // Temporarily override window.open to block popups
          window.open = function() {
            console.log('[Ad Blocker] Blocked popup after video player click');
            return null;
          };
          
          // Restore original window.open after a short delay
          setTimeout(() => {
            window.open = originalWindowOpen;
          }, 1000);
        }, 0);
      }
    }, true);
    
    console.log('[Ad Blocker] Click interceptor set up');
  } catch (error) {
    console.error('[Ad Blocker] Error setting up click interceptor:', error);
  }
};

/**
 * Remove ad elements from the document
 */
const removeAdElements = (): void => {
  if (typeof window === 'undefined' || !document.documentElement) return;
  
  try {
    removeAdElementsInNode(document.documentElement);
    removePopupOverlays();
  } catch (error) {
    console.error('[Ad Blocker] Error removing ad elements:', error);
  }
};

/**
 * Remove popup overlays that might be present
 */
const removePopupOverlays = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Target elements that are likely popup overlays
    const overlaySelectors = [
      // Fixed position elements with high z-index are often overlays/popups
      'div[style*="position: fixed"][style*="z-index"]',
      'div[style*="position:fixed"][style*="z-index"]',
      
      // Common overlay/modal classes
      '.modal', '.overlay', '.popup', '.lightbox',
      '[class*="modal"]', '[class*="overlay"]', '[class*="popup"]', '[class*="lightbox"]',
      
      // Full-screen overlays
      'div[style*="width: 100%"][style*="height: 100%"][style*="position: fixed"]',
      'div[style*="width:100%"][style*="height:100%"][style*="position:fixed"]',
      
      // Common interstitial ads
      '.interstitial', '.interstitial-ad', '[class*="interstitial"]',
      
      // Obscuring elements
      'div[style*="opacity"][style*="background"][style*="fixed"]'
    ];
    
    // Query all potential overlay elements
    const potentialOverlays = document.querySelectorAll(overlaySelectors.join(','));
    
    potentialOverlays.forEach((element) => {
      // Skip whitelisted elements (our own popups/modals)
      if (isWhitelistedAdElement(element)) {
        return;
      }
      
      // Check if this is an ad-related overlay
      const computedStyle = window.getComputedStyle(element);
      const zIndex = parseInt(computedStyle.zIndex || '0');
      const position = computedStyle.position;
      
      // High z-index fixed elements are likely overlays/popups
      if (position === 'fixed' && zIndex > 1000) {
        // Don't remove legitimate UI elements like video controls
        if (isVideoPlayerElement(element)) return;
        
        // Check for ad indicators
        const innerHTML = element.innerHTML.toLowerCase();
        const hasAdContent = 
          innerHTML.includes('ad') || 
          innerHTML.includes('sponsor') || 
          innerHTML.includes('promotion') ||
          innerHTML.includes('close') || 
          innerHTML.includes('skip');
        
        if (hasAdContent || isAdElement(element)) {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
            console.log('[Ad Blocker] Removed popup/overlay element');
          }
        }
      }
    });
  } catch (error) {
    console.error('[Ad Blocker] Error removing popup overlays:', error);
  }
};

/**
 * Remove ad elements from a specific node and its children
 */
const removeAdElementsInNode = (node: Element): void => {
  try {
    // Check each ad selector
    for (const selector of AD_SELECTORS) {
      try {
        // Find elements matching this selector
        const elements = node.querySelectorAll(selector);
        
        // Check each matching element
        elements.forEach((element) => {
          // Skip whitelisted elements (our own ads)
          if (isWhitelistedAdElement(element)) {
            return;
          }
          
          // Skip video players
          if (isVideoPlayerElement(element)) return;
          
          // Skip excluded UI elements
          for (const excludedSelector of EXCLUDED_SELECTORS) {
            try {
              if (element.matches(excludedSelector)) {
                return;
              }
              
              // Also check if element has a class that matches excluded selectors
              const className = element.className ? element.className.toString().toLowerCase() : '';
              const selectorName = excludedSelector.replace(/^\./, ''); // Remove leading dot
              if (className.includes(selectorName)) {
                return;
              }
            } catch (error) {
              // Skip invalid selectors
            }
          }
          
          // Remove the ad element
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      } catch (error) {
        // Skip invalid selectors
      }
    }
    
    // Also check for iframe ads
    const iframes = node.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      // Skip if it's a whitelisted domain (our own content)
      if (iframe.src && isWhitelistedDomain(iframe.src)) {
        return;
      }
      
      // Check if the iframe source is an ad URL
      if (iframe.src && isAdUrl(iframe.src)) {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
          console.log('[Ad Blocker] Removed ad iframe');
        }
      }
    });
  } catch (error) {
    console.error('[Ad Blocker] Error removing ad elements in node:', error);
  }
};

/**
 * Check if an element is a video player element
 */
const isVideoPlayerElement = (element: Element): boolean => {
  if (!element) return false;
  
  // Check tag name
  if (element.tagName === 'VIDEO') return true;
  
  // Check for common video player classes/IDs
  const className = element.className ? element.className.toString().toLowerCase() : '';
  const id = (element.id || '').toLowerCase();
  
  // Common video player frameworks
  return (
    // Video.js
    className.includes('vjs-big-play-button') || 
    className.includes('video-js') ||
    
    // JW Player
    className.includes('jwplayer') ||
    className.includes('jw-display-icon') ||
    
    // HTML5 video controls
    className.includes('play-button') ||
    className.includes('video-controls') ||
    
    // Common player containers
    (className.includes('player') && !className.includes('ad')) ||
    (id.includes('player') && !id.includes('ad'))
  );
};

/**
 * Check if an element is an ad element
 */
const isAdElement = (element: Element): boolean => {
  if (!element) return false;
  
  // Skip whitelisted elements (our own ads)
  if (isWhitelistedAdElement(element)) {
    return false;
  }
  
  // Skip video player elements
  if (isVideoPlayerElement(element)) {
    return false;
  }
  
  // Check if this element matches any excluded selectors (legitimate UI elements)
  for (const selector of EXCLUDED_SELECTORS) {
    try {
      if (element.matches(selector)) {
        return false;
      }
    } catch (error) {
      // Skip invalid selectors
    }
  }
  
  // Check if this element matches any ad selectors
  for (const selector of AD_SELECTORS) {
    try {
      if (element.matches(selector)) {
        return true;
      }
    } catch (error) {
      // Skip invalid selectors
    }
  }
  
  // Check element ID and class for ad indicators
  const id = (element.id || '').toLowerCase();
  const className = element.className ? element.className.toString().toLowerCase() : '';
  
  // Check if class contains any excluded names
  if (EXCLUDED_SELECTORS.some(selector => {
    const selectorName = selector.replace(/^\./, ''); // Remove leading dot
    return className.includes(selectorName);
  })) {
    return false;
  }
  
  // Common ad indicators in IDs and classes
  const adIndicators = ['ad', 'ads', 'advert', 'advertisement', 'banner', 'sponsor', 'promo', 'google_ad', 'adsense', 'popup'];
  
  for (const indicator of adIndicators) {
    if (id.includes(indicator) || className.includes(indicator)) {
      // Skip legitimate UI elements that might contain ad indicators
      if (className.includes('hero-banner') || className.includes('banner-content')) {
        return false;
      }
      return true;
    }
  }
  
  return false;
};

/**
 * Check if a URL is an ad URL
 */
const isAdUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Skip whitelisted domains (our own ads)
  if (isWhitelistedDomain(url)) {
    return false;
  }
  
  // Check if the URL contains any known ad domains
  return AD_DOMAINS.some(domain => url.includes(domain));
};

export default {
  initAdBlocker,
  AD_DOMAINS,
  AD_SELECTORS,
  EXCLUDED_SELECTORS
}; 