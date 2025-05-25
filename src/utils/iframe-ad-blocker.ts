/**
 * Iframe Ad Blocker Content Script
 * 
 * This script is designed to be injected into iframe content documents
 * to block ads even when cross-origin restrictions apply.
 * 
 * It uses a self-executing function to create a closure and avoid conflicts.
 */

// Create a content script as a string to be injected into iframes
export const createIframeAdBlockerScript = (): string => {
  return `
    (function() {
      // Don't run this script multiple times
      if (window.__adBlockerInitialized) return;
      window.__adBlockerInitialized = true;
      
      console.log('[Ad Blocker] Initializing iframe content script');
      
      // Common ad selectors to target streaming site ads
      const AD_SELECTORS = [
        '.ad-container', '.ads-container', '.video-ads', '.player-ads',
        '[id*="ad-container"]', '[class*="ad-container"]', '[id*="ads-container"]', '[class*="ads-container"]',
        '.ad-overlay', '.overlay-ad', '.video-ad-overlay',
        '[id*="ad-overlay"]', '[class*="ad-overlay"]',
        '.popup-ad', '.banner-ad', '.sticky-ad', '.floating-ad',
        '.jwplayer-ad', '.vjs-ad', '.video-player-ad', '.player-ad-unit',
        '[id*="google_ad"]', '[class*="google_ad"]',
        '[id*="adsense"]', '[class*="adsense"]',
        '[id*="adform"]', '[class*="adform"]',
        '[id*="taboola"]', '[class*="taboola"]',
        '[id*="outbrain"]', '[class*="outbrain"]',
        'iframe[src*="ads"]', 'iframe[src*="ad."]', 'iframe[src*="adserv"]',
        'iframe[src*="doubleclick"]', 'iframe[src*="ad-"]',
        '.preroll-ad', '.midroll-ad', '.postroll-ad',
        '.vmap-ad-container', '.ima-ad-container', '.video-js-ad',
        '.vast-ad', '.vpaid-ad', '.vast-blocker',
        // Additional selectors for popup triggers
        'a[target="_blank"]', '[onclick*="window.open"]', '[data-popup]',
        '[class*="popup"]', '[id*="popup"]', '.play-button-overlay',
        '[class*="play-button"]', '[id*="play-button"]',
        '[class*="player"]', '.video-player'
      ];
      
      // Common ad-related domains to block
      const AD_DOMAINS = [
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
        // Additional ad domains commonly used for popups
        'popads.net',
        'popunder.net',
        'poptm.com',
        'adsterra.com',
        'exoclick.com',
        'juicyads.com',
        'propellerads.com',
        'trafficjunky.net',
        'clickaine.com',
        'popcash.net'
      ];
      
      // Inject CSS to hide ad elements
      function injectCSS() {
        try {
          const style = document.createElement('style');
          style.type = 'text/css';
          
          // Add CSS rules to hide ad elements
          style.textContent = AD_SELECTORS.map(selector => 
            \`\${selector} { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; height: 0 !important; width: 0 !important; }\`
          ).join('\\n');
          
          // Add CSS to maintain player visibility
          style.textContent += \`
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
            
            /* Fix for video container when ads are removed */
            div[class*="player"], div[id*="player"] {
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
            
            /* Block invisible clickable overlays that trigger popups */
            div[style*="position: absolute"][style*="z-index"],
            div[style*="position:absolute"][style*="z-index"],
            div[style*="cursor: pointer"],
            div[style*="cursor:pointer"] {
              pointer-events: none !important;
            }
            
            /* Ensure play button remains clickable */
            .vjs-big-play-button, 
            .jw-display-icon-container,
            [class*="play-button"]:not([class*="ad"]):not([class*="popup"]),
            [id*="play-button"]:not([id*="ad"]):not([id*="popup"]) {
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              pointer-events: auto !important;
              z-index: 2147483647 !important;
            }
          \`;
          
          // Append the style element to the head
          (document.head || document.documentElement).appendChild(style);
          console.log('[Ad Blocker] CSS injection complete');
        } catch (error) {
          console.error('[Ad Blocker] Error injecting CSS:', error);
        }
      }
      
      // Handle click events to prevent popups
      function setupClickInterception() {
        try {
          // Capture the original window.open method
          const originalWindowOpen = window.open;
          
          // Function to determine if a click is on a video player element
          const isVideoPlayerElement = (element) => {
            if (!element) return false;
            
            // Check if it's a play button or video element
            if (element.tagName === 'VIDEO') return true;
            
            // Check common player class names
            const className = (element.className || '').toLowerCase();
            const id = (element.id || '').toLowerCase();
            
            return (
              className.includes('player') || 
              className.includes('play') || 
              className.includes('video') ||
              id.includes('player') || 
              id.includes('play') || 
              id.includes('video')
            );
          };
          
          // Add click event listener to the document
          document.addEventListener('click', function(event) {
            // Check if click target is a play button or video element
            if (isVideoPlayerElement(event.target)) {
              console.log('[Ad Blocker] Detected click on video element');
              
              // Allow the click event to proceed, but intercept any popup attempts
              // in the next few seconds
              const interceptPopupsTimeout = setTimeout(() => {
                // Override window.open to block popups for a short period
                window.open = function() {
                  console.log('[Ad Blocker] Blocked popup triggered by video interaction');
                  return null;
                };
                
                // Restore original window.open after a delay
                setTimeout(() => {
                  window.open = originalWindowOpen;
                }, 1000);
              }, 0);
              
              // Cleanup timeout if needed
              setTimeout(() => clearTimeout(interceptPopupsTimeout), 1000);
            }
            
            // Check if the click is on an ad element or a popup trigger
            if (isAdElement(event.target)) {
              console.log('[Ad Blocker] Blocked click on ad element');
              event.preventDefault();
              event.stopPropagation();
              return false;
            }
          }, true);
          
          console.log('[Ad Blocker] Click interception setup complete');
        } catch (error) {
          console.error('[Ad Blocker] Error setting up click interception:', error);
        }
      }
      
      // Remove ad elements from document
      function removeAdElements() {
        try {
          AD_SELECTORS.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                if (el.parentNode) {
                  // Skip removing actual video players or play buttons
                  if (
                    (el.tagName === 'VIDEO') || 
                    (el.className && typeof el.className === 'string' && 
                      (el.className.includes('vjs-big-play-button') || 
                       el.className.includes('jw-display-icon')))
                  ) {
                    return;
                  }
                  
                  // Only remove ad-related elements
                  if (isAdElement(el) && !isVideoPlayerElement(el)) {
                    el.parentNode.removeChild(el);
                  }
                }
              });
            } catch (e) {
              // Ignore invalid selectors
            }
          });
          
          // Also remove any iframes that are likely to be ads
          const iframes = document.querySelectorAll('iframe');
          iframes.forEach(iframe => {
            if (iframe.src && AD_DOMAINS.some(domain => iframe.src.includes(domain))) {
              if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
              }
            }
          });
        } catch (error) {
          console.error('[Ad Blocker] Error removing ad elements:', error);
        }
      }
      
      // Check if an element is an ad element
      function isAdElement(element) {
        // Check if it's null or not an element
        if (!element || !element.nodeType) return false;
        
        // Skip video elements
        if (element.tagName === 'VIDEO') return false;
        
        // Skip main player buttons
        if (element.className && typeof element.className === 'string') {
          if (element.className.includes('vjs-big-play-button') || 
              element.className.includes('jw-display-icon')) {
            return false;
          }
        }
        
        // Check if it matches any ad selector
        for (const selector of AD_SELECTORS) {
          try {
            if (element.matches(selector)) return true;
          } catch (e) {
            // Skip invalid selectors
          }
        }
        
        // Check attributes
        if (!element.id && !element.className) return false;
        
        const id = (element.id || '').toLowerCase();
        const className = (element.className || '').toString().toLowerCase();
        
        const adIndicators = ['ad', 'ads', 'advert', 'banner', 'sponsor', 'promo', 'google_ad', 'adsense', 'popup', 'popunder'];
        
        for (const indicator of adIndicators) {
          if (id.includes(indicator) || className.includes(indicator)) {
            // Make sure it's not a video player element
            return !isVideoPlayerElement(element);
          }
        }
        
        return false;
      }
      
      // Check if element is a video player element
      function isVideoPlayerElement(element) {
        if (!element || !element.nodeType) return false;
        
        // Check if it's a video element
        if (element.tagName === 'VIDEO') return true;
        
        // Check for common player class names
        if (element.className && typeof element.className === 'string') {
          const className = element.className.toLowerCase();
          if (
            className.includes('vjs-big-play-button') || 
            className.includes('jw-display-icon') ||
            (className.includes('play') && !className.includes('ad') && !className.includes('popup'))
          ) {
            return true;
          }
        }
        
        // Check for player id
        if (element.id) {
          const id = element.id.toLowerCase();
          if (id === 'player' || id.includes('video-player')) {
            return true;
          }
        }
        
        return false;
      }
      
      // Block ad network requests
      function blockAdNetworkRequests() {
        try {
          // Override fetch
          const originalFetch = window.fetch;
          window.fetch = function(input, init) {
            const url = input.toString();
            if (AD_DOMAINS.some(domain => url.includes(domain))) {
              console.log('[Ad Blocker] Blocked fetch request to ad domain:', url);
              return Promise.resolve(new Response('', { status: 200 }));
            }
            return originalFetch.apply(this, arguments);
          };
          
          // Override XMLHttpRequest
          const originalOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url) {
            const urlString = url.toString();
            if (AD_DOMAINS.some(domain => urlString.includes(domain))) {
              console.log('[Ad Blocker] Blocked XMLHttpRequest to ad domain:', urlString);
              this.abort();
              return;
            }
            return originalOpen.apply(this, arguments);
          };
          
          // Attempt to block script tags with ad-related src
          const originalCreateElement = document.createElement;
          document.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);
            
            if (tagName.toLowerCase() === 'script') {
              // Watch for ad-related script src
              const originalSetAttribute = element.setAttribute;
              element.setAttribute = function(name, value) {
                if (name === 'src' && typeof value === 'string') {
                  if (AD_DOMAINS.some(domain => value.includes(domain))) {
                    console.log('[Ad Blocker] Blocked script with ad domain src:', value);
                    return;
                  }
                }
                return originalSetAttribute.call(this, name, value);
              };
            }
            
            return element;
          };
        } catch (error) {
          console.error('[Ad Blocker] Error blocking network requests:', error);
        }
      }
      
      // Set up observer for dynamic ad insertions
      function setupObserver() {
        try {
          const observer = new MutationObserver(mutations => {
            let removedAds = false;
            
            mutations.forEach(mutation => {
              if (mutation.type === 'childList' && mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                  if (node.nodeType === 1) { // Element node
                    // Check if the node itself is an ad
                    if (isAdElement(node) && !isVideoPlayerElement(node)) {
                      if (node.parentNode) {
                        node.parentNode.removeChild(node);
                        removedAds = true;
                      }
                    }
                    
                    // Check children if any
                    if (node.querySelectorAll) {
                      AD_SELECTORS.forEach(selector => {
                        try {
                          const adElements = node.querySelectorAll(selector);
                          if (adElements.length > 0) {
                            adElements.forEach(el => {
                              // Only remove if it's an ad and not a player element
                              if (isAdElement(el) && !isVideoPlayerElement(el)) {
                                if (el.parentNode) {
                                  el.parentNode.removeChild(el);
                                  removedAds = true;
                                }
                              }
                            });
                          }
                        } catch (e) {
                          // Skip invalid selectors
                        }
                      });
                    }
                  }
                });
              }
            });
            
            // If we removed ads, notify the parent
            if (removedAds) {
              try {
                window.parent.postMessage({
                  action: 'ads-removed',
                  count: 1,
                  source: window.location.href
                }, '*');
              } catch (e) {
                // Ignore cross-origin errors
              }
            }
          });
          
          // Start observing
          observer.observe(document.documentElement || document, {
            childList: true,
            subtree: true
          });
        } catch (error) {
          console.error('[Ad Blocker] Error setting up observer:', error);
        }
      }
      
      // Block pop-ups and new windows
      function blockPopups() {
        try {
          // Override window.open
          const originalOpen = window.open;
          window.open = function(url, name, specs) {
            // Block if URL is ad-related
            if (url && AD_DOMAINS.some(domain => url.includes(domain))) {
              console.log('[Ad Blocker] Blocked popup with ad domain:', url);
              return null;
            }
            
            // Block popups with blank URLs (common for malicious popups)
            if (!url || url === 'about:blank') {
              console.log('[Ad Blocker] Blocked empty URL popup');
              return null;
            }
            
            // If it's likely an ad or popup based on specs or size
            if (specs && (
              specs.includes('width=1') || 
              specs.includes('height=1') || 
              specs.includes('toolbar=no') ||
              specs.includes('location=no')
            )) {
              console.log('[Ad Blocker] Blocked likely ad popup:', url);
              return null;
            }
            
            // Allow legitimate popups
            return originalOpen.apply(this, arguments);
          };
          
          // Block popup attempts using window.open without user interaction
          let lastUserInteraction = 0;
          
          // Track user interactions
          document.addEventListener('mousedown', () => {
            lastUserInteraction = Date.now();
          });
          
          document.addEventListener('keydown', () => {
            lastUserInteraction = Date.now();
          });
          
          // Block popups that happen without recent user interaction
          const originalOpen2 = window.open;
          window.open = function() {
            const now = Date.now();
            const timeSinceInteraction = now - lastUserInteraction;
            
            // If no user interaction in the last 1000ms, likely an automatic popup
            if (timeSinceInteraction > 1000) {
              console.log('[Ad Blocker] Blocked automatic popup (no recent user interaction)');
              return null;
            }
            
            return originalOpen2.apply(this, arguments);
          };
        } catch (error) {
          console.error('[Ad Blocker] Error blocking popups:', error);
        }
      }
      
      // Clean up any existing popups
      function cleanExistingPopups() {
        try {
          // Check for any existing popups and remove them
          const possiblePopups = document.querySelectorAll('div[style*="position: fixed"][style*="z-index"]');
          possiblePopups.forEach(popup => {
            // Check if it's likely a popup
            const style = window.getComputedStyle(popup);
            const zIndex = parseInt(style.zIndex || '0');
            
            // High z-index elements are often popups
            if (zIndex > 1000 && !isVideoPlayerElement(popup)) {
              if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
                console.log('[Ad Blocker] Removed existing popup');
              }
            }
          });
        } catch (error) {
          console.error('[Ad Blocker] Error cleaning existing popups:', error);
        }
      }
      
      // Run ad blocking functions
      function runAdBlocker() {
        injectCSS();
        removeAdElements();
        blockAdNetworkRequests();
        setupObserver();
        blockPopups();
        setupClickInterception();
        cleanExistingPopups();
        
        // Rerun ad removal after a short delay (for dynamic content)
        setTimeout(removeAdElements, 1000);
        setTimeout(cleanExistingPopups, 1000);
        
        // Rerun periodically to catch delayed ads
        setInterval(removeAdElements, 5000);
        setInterval(cleanExistingPopups, 5000);
        
        // Notify parent that we're ready
        try {
          window.parent.postMessage({
            action: 'ad-blocker-initialized',
            source: window.location.href
          }, '*');
        } catch (e) {
          // Ignore cross-origin errors
        }
      }
      
      // Run immediately and on load
      runAdBlocker();
      window.addEventListener('load', runAdBlocker);
      
      // Listen for messages from parent
      window.addEventListener('message', event => {
        if (event.data === 'run-ad-blocker') {
          console.log('[Ad Blocker] Received run command from parent');
          runAdBlocker();
        }
      });
      
      // If this is an iframe within an iframe, tell parent we're ready
      try {
        if (window !== window.top) {
          window.parent.postMessage('iframe-loaded', '*');
        }
      } catch (e) {
        // Ignore cross-origin errors
      }
    })();
  `;
};

/**
 * Create and return a data URI for the ad blocker script
 */
export const getAdBlockerScriptDataUri = (): string => {
  const script = createIframeAdBlockerScript();
  return `data:text/javascript;base64,${btoa(script)}`;
};

/**
 * Add a preload link for the ad blocker script to the document head
 */
export const preloadAdBlockerScript = (): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'script';
  link.href = getAdBlockerScriptDataUri();
  document.head.appendChild(link);
};

/**
 * Add script attribute to all iframes to load the ad blocker
 */
export const applyAdBlockerToIframes = (): void => {
  // Set up mutation observer to watch for new iframes
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName === 'IFRAME') {
            injectScriptToIframe(node as HTMLIFrameElement);
          }
        });
      }
    });
  });
  
  // Start observing
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  // Process existing iframes
  document.querySelectorAll('iframe').forEach(iframe => {
    injectScriptToIframe(iframe);
  });
};

/**
 * Inject the ad blocker script into an iframe
 */
const injectScriptToIframe = (iframe: HTMLIFrameElement): void => {
  // Skip if already processed
  if (iframe.hasAttribute('data-ad-blocker-applied')) return;
  
  // Mark as processed
  iframe.setAttribute('data-ad-blocker-applied', 'true');
  
  // Try direct script injection if possible
  try {
    if (iframe.contentDocument && iframe.contentWindow) {
      const script = iframe.contentDocument.createElement('script');
      script.textContent = createIframeAdBlockerScript();
      iframe.contentDocument.head.appendChild(script);
      return;
    }
  } catch (error) {
    // Cannot access iframe content due to cross-origin restrictions
    console.log('Cannot directly inject script into iframe due to cross-origin policy');
  }
  
  // For cross-origin iframes, add a content script via srcdoc attribute
  try {
    // If srcdoc is not already set, we can't do much
    if (!iframe.hasAttribute('srcdoc') && iframe.src) {
      // One option is to use the sandbox attribute correctly
      if (!iframe.hasAttribute('sandbox')) {
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation allow-popups allow-fullscreen');
      }
      
      // Another option is to set an onload handler
      iframe.onload = () => {
        // Try to communicate with the iframe
        iframe.contentWindow?.postMessage('run-ad-blocker', '*');
      };
    }
  } catch (error) {
    console.error('Error preparing iframe for ad blocking:', error);
  }
};

export default {
  createIframeAdBlockerScript,
  getAdBlockerScriptDataUri,
  preloadAdBlockerScript,
  applyAdBlockerToIframes
}; 