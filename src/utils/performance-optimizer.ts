/**
 * Performance Optimizer Utility
 * 
 * This utility improves site performance by:
 * 1. Blocking common ad-related scripts and trackers
 * 2. Implementing content caching strategies
 * 3. Optimizing resource loading
 */

/**
 * Block common ad domains and trackers
 */
export const blockAds = (): void => {
  // Create a MutationObserver to watch for new nodes being added to the DOM
  const adObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === 1) { // Only process Element nodes
            // Check if the element is an iframe, script, or div that might contain ads
            if (
              node.nodeName === 'IFRAME' || 
              node.nodeName === 'SCRIPT' || 
              (node.nodeName === 'DIV' && 
                ((node as Element).id?.includes('ad') || 
                 (node as Element).className?.includes('ad')))
            ) {
              // Check if it's from an ad provider
              if (isAdElement(node as Element)) {
                console.log('Ad element blocked:', node);
                // Fix for TypeScript error: Use parentNode.removeChild instead of remove()
                if (node.parentNode) {
                  node.parentNode.removeChild(node);
                }
              }
            }
          }
        }
      }
    });
  });

  // Start observing the document
  adObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Block ad-related fetch requests
  blockAdNetworkRequests();
};

/**
 * Check if an element is likely an advertisement
 */
const isAdElement = (element: Element): boolean => {
  const adIndicators = [
    'ad-', 'ad_', 'advert', 'banner', 'sponsor', 'promo',
    'googlead', 'adsense', 'adserv', 'doubleclick', 'analytics',
    'tracker', 'pixel', 'impression'
  ];

  // Check attributes like src, id, class for ad indicators
  const src = element.getAttribute('src') || '';
  const id = element.id || '';
  const className = element.className || '';
  const dataAttrs = Array.from(element.attributes)
    .filter(attr => attr.name.startsWith('data-'))
    .map(attr => attr.value)
    .join(' ');

  const allText = `${src} ${id} ${className} ${dataAttrs}`.toLowerCase();
  
  return adIndicators.some(indicator => allText.includes(indicator));
};

/**
 * Block network requests to common ad providers
 */
const blockAdNetworkRequests = (): void => {
  // Create a list of ad domains to block
  const adDomains = [
    'googlesyndication.com',
    'googleadservices.com',
    'doubleclick.net',
    'adnxs.com',
    'rubiconproject.com',
    'criteo.com',
    'casalemedia.com',
    'amazon-adsystem.com',
    'advertising.com',
    'adform.net',
    'adzerk.net',
    'pubmatic.com',
    'serving-sys.com',
    'taboola.com',
    'outbrain.com',
    'quantserve.com',
    'scorecardresearch.com',
    'moatads.com',
    'yieldmo.com'
  ];

  // Override fetch to block ad network requests
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = input.toString();
    if (adDomains.some(domain => url.includes(domain))) {
      console.log('Blocked fetch request to ad domain:', url);
      return Promise.resolve(new Response('', { status: 200 }));
    }
    return originalFetch.apply(this, [input, init]);
  };

  // Override XMLHttpRequest to block ad network requests
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]): void {
    const urlString = url.toString();
    if (adDomains.some(domain => urlString.includes(domain))) {
      console.log('Blocked XMLHttpRequest to ad domain:', urlString);
      this.abort();
      return;
    }
    originalOpen.apply(this, [method, url, ...rest]);
  };
};

/**
 * Implement lazy loading for images and iframes
 */
export const enableLazyLoading = (): void => {
  // Find all images and iframes without loading="lazy"
  const mediaElements = document.querySelectorAll<HTMLElement>('img:not([loading]), iframe:not([loading])');
  
  mediaElements.forEach(element => {
    // Add loading="lazy" attribute
    element.setAttribute('loading', 'lazy');
  });
};

/**
 * Preload critical resources
 */
export const preloadCriticalResources = (): void => {
  const criticalResources = [
    // Add critical CSS, fonts, or JS files here
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.endsWith('.css') ? 'style' : 
              resource.endsWith('.js') ? 'script' : 
              resource.endsWith('.woff2') || resource.endsWith('.woff') ? 'font' : 'fetch';
    document.head.appendChild(link);
  });
};

/**
 * Initialize all performance optimizations
 */
export const initPerformanceOptimizer = (): void => {
  if (typeof window !== 'undefined') {
    console.log('Initializing performance optimizer...');
    
    // Block ads and trackers
    blockAds();
    
    // Enable lazy loading after the page has loaded
    window.addEventListener('load', () => {
      enableLazyLoading();
    });
    
    // Preload critical resources
    preloadCriticalResources();
  }
};

export default {
  initPerformanceOptimizer,
  blockAds,
  enableLazyLoading,
  preloadCriticalResources
}; 