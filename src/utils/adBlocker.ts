// adBlocker.ts
// Utility functions for blocking ads in iframes and the main page

// Comprehensive list of ad domains and patterns
export const AD_DOMAINS = [
  'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
  'google-analytics.com', 'googletagmanager.com', 'adsafeprotected.com',
  'advertising.com', 'adnxs.com', 'adsrvr.org', 'adtechus.com',
  'adform.net', 'vidoomy.com', 'vidazoo.com', 'videoadex.com',
  'videoads.com', 'popads.net', 'popcash.net', 'propellerads.com',
  'popunder.com', 'amazon-adsystem.com', 'media.net', 'outbrain.com',
  'taboola.com', 'criteo.com', 'rubiconproject.com', 'pubmatic.com',
  'openx.net', 'indexexchange.com', '33across.com'
];

// Ad-related CSS selectors to hide
export const AD_SELECTORS = [
  '[class*="ad"]', '[class*="ads"]', '[class*="advertisement"]',
  '[class*="banner"]', '[class*="promo"]', '[class*="sponsor"]',
  '[id*="ad"]', '[id*="ads"]', '[id*="advertisement"]',
  '[id*="banner"]', '[id*="promo"]', '[id*="sponsor"]',
  'iframe[src*="ad"]', 'iframe[src*="ads"]', 'iframe[src*="advertisement"]',
  'div[data-ad]', 'div[data-ads]', 'ins.adsbygoogle'
];

/**
 * Check if a URL is an ad
 */
export function isAdUrl(url: string): boolean {
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
    const adPatterns = ['/ad', '/ads', '/advertisement', '/banner', '/promo', '/sponsor'];
    for (const pattern of adPatterns) {
      if (path.includes(pattern)) {
        return true;
      }
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Inject ad-blocking script into an iframe
 * Note: This only works if the iframe is same-origin or has proper CORS headers
 */
export function injectAdBlockerIntoIframe(iframe: HTMLIFrameElement): void {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc) {
      // Cross-origin iframe - can't access content
      console.log('[Ad Blocker] Cannot access iframe content (cross-origin)');
      return;
    }
    
    // Create and inject ad-blocking script
    const script = iframeDoc.createElement('script');
    script.textContent = `
      (function() {
        // Block ad-related network requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          const url = args[0];
          if (typeof url === 'string' && (
            url.includes('ad') || url.includes('ads') || 
            url.includes('advertisement') || url.includes('banner') ||
            url.includes('promo') || url.includes('sponsor') ||
            url.includes('tracking') || url.includes('analytics')
          )) {
            console.log('[Ad Blocker] Blocked fetch:', url);
            return Promise.resolve(new Response('', { status: 200 }));
          }
          return originalFetch.apply(this, args);
        };
        
        // Hide ad elements
        const hideAds = () => {
          const selectors = [
            '[class*="ad"]', '[class*="ads"]', '[class*="advertisement"]',
            '[class*="banner"]', '[class*="promo"]', '[class*="sponsor"]',
            '[id*="ad"]', '[id*="ads"]', '[id*="advertisement"]',
            '[id*="banner"]', '[id*="promo"]', '[id*="sponsor"]',
            'iframe[src*="ad"]', 'iframe[src*="ads"]',
            'div[data-ad]', 'div[data-ads]', 'ins.adsbygoogle'
          ];
          
          selectors.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                if (el && el.parentNode) {
                  el.style.display = 'none';
                  el.style.visibility = 'hidden';
                  el.style.opacity = '0';
                  el.style.height = '0';
                  el.style.width = '0';
                  el.style.overflow = 'hidden';
                }
              });
            } catch (e) {}
          });
        };
        
        // Run immediately and on DOM changes
        hideAds();
        setInterval(hideAds, 1000);
        
        // Use MutationObserver to hide new ad elements
        const observer = new MutationObserver(hideAds);
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      })();
    `;
    
    iframeDoc.head.appendChild(script);
    console.log('[Ad Blocker] Injected ad-blocking script into iframe');
  } catch (error) {
    console.log('[Ad Blocker] Could not inject script into iframe (likely cross-origin):', error);
  }
}

/**
 * Block ads in the main document
 */
export function blockAdsInDocument(): void {
  // Hide ad elements
  const hideAds = () => {
    AD_SELECTORS.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el && el.parentNode) {
            const elText = el.textContent?.toLowerCase() || '';
            const elClass = el.className?.toLowerCase() || '';
            const elId = el.id?.toLowerCase() || '';
            
            // Only hide if it's actually an ad (not false positives)
            if (el instanceof HTMLElement && (elText.includes('ad') || elClass.includes('ad') || elId.includes('ad'))) {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.style.opacity = '0';
            }
          }
        });
      } catch (e) {}
    });
  };
  
  // Run immediately
  hideAds();
  
  // Run periodically
  setInterval(hideAds, 2000);
  
  // Use MutationObserver to hide new ad elements
  if (typeof window !== 'undefined' && window.MutationObserver) {
    const observer = new MutationObserver(hideAds);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

/**
 * Register ad-blocking service worker
 */
export async function registerAdBlockerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/ad-block-service-worker.js', {
        scope: '/'
      });
      console.log('[Ad Blocker] Service worker registered:', registration.scope);
    } catch (error) {
      console.error('[Ad Blocker] Service worker registration failed:', error);
    }
  }
}

