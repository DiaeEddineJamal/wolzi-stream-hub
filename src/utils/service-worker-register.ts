/**
 * Service Worker Registration Utility
 * 
 * Registers and manages the ad-blocking service worker
 */

const SW_URL = '/ad-blocker-service-worker.js';
const SW_SCOPE = '/';

/**
 * Register the ad-blocking service worker
 */
export const registerAdBlockerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('[SW Register] Registering ad blocker service worker...');
      
      const registration = await navigator.serviceWorker.register(SW_URL, {
        scope: SW_SCOPE
      });
      
      console.log('[SW Register] Service worker registered:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW Register] New service worker available');
              // Optionally notify user or auto-update
            }
          });
        }
      });
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'LOGOUT_CLEANUP_COMPLETE') {
          console.log('[SW Register] Logout cleanup complete');
        }
      });
      
      return registration;
    } catch (error) {
      console.error('[SW Register] Service worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('[SW Register] Service workers are not supported in this browser');
    return null;
  }
};

/**
 * Update the ad whitelist in the service worker
 */
export const updateAdWhitelist = async (publisherIds: string[]): Promise<void> => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_WHITELIST',
        publisherIds: publisherIds
      });
      console.log('[SW Register] Updated ad whitelist:', publisherIds);
    } catch (error) {
      console.error('[SW Register] Failed to update whitelist:', error);
    }
  }
};

/**
 * Check if service worker is active
 */
export const isServiceWorkerActive = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
      return registration !== undefined && registration.active !== null;
    } catch (error) {
      console.error('[SW Register] Error checking service worker status:', error);
      return false;
    }
  }
  return false;
};

/**
 * Unregister the service worker (for testing/debugging)
 */
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
      if (registration) {
        const unregistered = await registration.unregister();
        console.log('[SW Register] Service worker unregistered:', unregistered);
        return unregistered;
      }
    } catch (error) {
      console.error('[SW Register] Failed to unregister service worker:', error);
    }
  }
  return false;
};

export default {
  registerAdBlockerServiceWorker,
  updateAdWhitelist,
  isServiceWorkerActive,
  unregisterServiceWorker
};

