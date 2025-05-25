/**
 * Server Ad Blocker Utility
 * 
 * This utility specifically targets and blocks ads from streaming servers embedded in iframes,
 * while still allowing for custom Google Ads implementation in the main app.
 */

import { isWhitelistedDomain, isWhitelistedAdElement } from '@/utils/ad-whitelist';

// Common ad-related elements found in streaming service iframes
const SERVER_AD_SELECTORS = [
  // General ad containers
  '.ad-container', '.ads-container', '.video-ads', '.player-ads',
  '[id*="ad-container"]', '[class*="ad-container"]', '[id*="ads-container"]', '[class*="ads-container"]',
  
  // Ad overlays
  '.ad-overlay', '.overlay-ad', '.video-ad-overlay',
  '[id*="ad-overlay"]', '[class*="ad-overlay"]',
  
  // Pop-up and banner ads
  '.popup-ad', '.banner-ad', '.sticky-ad', '.floating-ad',
  
  // Player-specific ad elements
  '.jwplayer-ad', '.vjs-ad', '.video-player-ad', '.player-ad-unit',
  
  // Common ad provider containers
  '[id*="google_ad"]', '[class*="google_ad"]',
  '[id*="adsense"]', '[class*="adsense"]',
  '[id*="adform"]', '[class*="adform"]',
  '[id*="taboola"]', '[class*="taboola"]',
  '[id*="outbrain"]', '[class*="outbrain"]',
  
  // Iframe-specific ad elements
  'iframe[src*="ads"]', 'iframe[src*="ad."]', 'iframe[src*="adserv"]',
  'iframe[src*="doubleclick"]', 'iframe[src*="ad-"]',
  
  // Ad scripts
  'script[src*="ads"]', 'script[src*="ad."]', 'script[src*="adserv"]',
  'script[src*="doubleclick"]', 'script[src*="pagead"]',
  
  // Common streaming site ad elements
  '.preroll-ad', '.midroll-ad', '.postroll-ad',
  '.vmap-ad-container', '.ima-ad-container', '.video-js-ad',
  '.vast-ad', '.vpaid-ad', '.vast-blocker'
];

/**
 * Block ads in all iframes on the page, targeting streaming service ads
 */
export const blockServerAds = (): void => {
  // Find all iframes
  const processIframes = () => {
    try {
      const iframes = document.querySelectorAll('iframe');
      
      iframes.forEach(iframe => {
        // Skip processing if iframe has no source
        if (!iframe.src) return;
        
        // Skip processing if iframe is from allowed sources (like your own Google Ads)
        if (isAllowedAdSource(iframe.src)) return;
        
        // Try to access iframe content (this may fail due to same-origin policy)
        try {
          // Apply CSS to hide ad elements in the iframe
          injectAdBlockingCSS(iframe);
          
          // Process the iframe's content document if accessible
          if (iframe.contentDocument && iframe.contentWindow) {
            // Remove ad elements
            removeAdElements(iframe.contentDocument);
            
            // Set up a mutation observer to remove dynamically added ads
            setupAdMutationObserver(iframe.contentDocument);
            
            // Override ad-related APIs in the iframe
            overrideAdAPIs(iframe.contentWindow);
          }
        } catch (error) {
          // If we can't access the iframe directly due to same-origin policy,
          // we'll use message passing to communicate with a content script
          // injected into the page (requires more complex setup)
          console.log(`Cannot directly access iframe (${iframe.src}). Using alternative blocking methods.`);
          
          // Alternative method: use sandbox attribute if not already set
          if (!iframe.hasAttribute('sandbox')) {
            // Add sandbox attribute but allow necessary permissions
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation allow-popups allow-fullscreen');
          }
          
          // We can inject a special attribute to mark this iframe for processing
          iframe.setAttribute('data-ad-blocked', 'true');
        }
      });
    } catch (error) {
      console.error('Error in blockServerAds:', error);
    }
  };
  
  // Initial processing
  processIframes();
  
  // Set up a mutation observer to process new iframes
  const documentObserver = new MutationObserver(mutations => {
    let shouldProcess = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (node.nodeName === 'IFRAME' || (node.nodeType === Node.ELEMENT_NODE && 'querySelectorAll' in node)) {
            shouldProcess = true;
            break;
          }
        }
      }
    });
    
    if (shouldProcess) {
      processIframes();
    }
  });
  
  // Start observing the document
  documentObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  // Handle iframe load events to process iframes after they load
  window.addEventListener('message', event => {
    if (event.data === 'iframe-loaded') {
      processIframes();
    }
  });
};

/**
 * Check if the source is an allowed ad source (e.g., your own Google Ads)
 */
const isAllowedAdSource = (src: string): boolean => {
  // Use the whitelist utility to check if this is an allowed ad domain
  return isWhitelistedDomain(src);
};

/**
 * Inject CSS into iframe to hide ad elements
 */
const injectAdBlockingCSS = (iframe: HTMLIFrameElement): void => {
  try {
    if (!iframe.contentDocument || !iframe.contentDocument.head) return;
    
    // Create a style element
    const style = document.createElement('style');
    style.type = 'text/css';
    
    // Add CSS rules to hide ad elements
    style.textContent = SERVER_AD_SELECTORS.map(selector => 
      `${selector} { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; height: 0 !important; width: 0 !important; }`
    ).join('\n');
    
    // Add CSS to fix player layout after removing ads
    style.textContent += `
      .player-container:has(.ad-container), .video-js:has(.vjs-ad-container) {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      /* Fix for common player distortions after ad removal */
      video {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    `;
    
    // Append the style element to the iframe's head
    iframe.contentDocument.head.appendChild(style);
  } catch (error) {
    console.log('Error injecting CSS into iframe:', error);
  }
};

/**
 * Remove ad elements from document
 */
const removeAdElements = (doc: Document): void => {
  try {
    // Find and remove ad elements
    SERVER_AD_SELECTORS.forEach(selector => {
      try {
        const elements = doc.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
      } catch (e) {
        // Ignore invalid selectors
      }
    });
  } catch (error) {
    console.error('Error removing ad elements:', error);
  }
};

/**
 * Set up a mutation observer to remove dynamically added ad elements
 */
const setupAdMutationObserver = (doc: Document): void => {
  try {
    const observer = new MutationObserver(mutations => {
      let hasAdNodes = false;
      
      // First pass - check if we have any ad elements to remove
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          // Convert NodeList to Array and filter to only include Element nodes
          const elementNodes = Array.from(mutation.addedNodes)
            .filter(node => node.nodeType === Node.ELEMENT_NODE) as Element[];
          
          // Check if any nodes are ad elements
          elementNodes.forEach(element => {
            if (isAdElement(element)) {
              if (element.parentNode) {
                element.parentNode.removeChild(element);
              }
              hasAdNodes = true;
            }
          });
        }
      });
      
      // If we found ad nodes, do a full scan of the document to catch any nested elements
      if (hasAdNodes) {
        removeAdElements(doc);
      }
    });
    
    // Start observing the document
    observer.observe(doc.documentElement || doc, {
      childList: true,
      subtree: true
    });
  } catch (error) {
    console.error('Error setting up mutation observer:', error);
  }
};

/**
 * Check if an element is an ad element
 */
const isAdElement = (element: Element): boolean => {
  // First check if it's a whitelisted ad element (user's own ads)
  if (isWhitelistedAdElement(element)) {
    return false; // Don't remove whitelisted ad elements
  }
  
  // Check if the element matches any ad selector
  for (const selector of SERVER_AD_SELECTORS) {
    try {
      if (element.matches(selector)) {
        return true;
      }
    } catch (e) {
      // Skip invalid selectors
    }
  }
  
  // Check for common ad attributes
  const id = element.id?.toLowerCase() || '';
  const className = (element.className as string)?.toLowerCase() || '';
  
  const adIndicators = ['ad', 'ads', 'advert', 'banner', 'sponsor', 'promo', 'google_ad', 'adsense'];
  
  for (const indicator of adIndicators) {
    if (id.includes(indicator) || className.includes(indicator)) {
      // Make sure it's not a whitelisted element before returning true
      return !isWhitelistedAdElement(element);
    }
  }
  
  return false;
};

/**
 * Override ad-related APIs in the iframe
 */
const overrideAdAPIs = (window: Window): void => {
  try {
    // Override ad-related APIs
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(handler: TimerHandler, timeout?: number, ...args: any[]): number {
      // Analyze the handler if it's a string
      if (typeof handler === 'string' && isAdRelatedCode(handler)) {
        // Skip ad-related timeouts
        return 0;
      }
      return originalSetTimeout.call(this, handler, timeout, ...args);
    };
    
    // Override other ad-related APIs as needed
    // This is just an example, and would need to be expanded based on specific ad techniques
  } catch (error) {
    console.error('Error overriding ad APIs:', error);
  }
};

/**
 * Check if code is ad-related
 */
const isAdRelatedCode = (code: string): boolean => {
  const adCodeIndicators = [
    'ads', 'advert', 'banner', 'sponsor', 'promo',
    'googlead', 'adsense', 'adserv', 'doubleclick', 'pagead'
  ];
  
  return adCodeIndicators.some(indicator => code.toLowerCase().includes(indicator));
};

/**
 * Initialize the server ad blocker
 */
export const initServerAdBlocker = (): void => {
  if (typeof window !== 'undefined') {
    console.log('Initializing server ad blocker...');
    
    // Block server ads
    blockServerAds();
    
    // Listen for iframe navigation events
    window.addEventListener('message', event => {
      if (event.data === 'iframe-navigated') {
        // Re-apply ad blocking when iframe navigates
        setTimeout(blockServerAds, 500);
      }
    });
  }
};

export default {
  initServerAdBlocker,
  blockServerAds
}; 