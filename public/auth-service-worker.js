// auth-service-worker.js
// Service worker to help with auth operations, especially complete logout

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'LOGOUT') {
    console.log('[Service Worker] Received logout request');
    
    // Clear all caches
    caches.keys().then(cacheNames => {
      console.log('[Service Worker] Clearing caches:', cacheNames);
      return Promise.all(
        cacheNames.map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[Service Worker] All caches cleared');
    }).catch(err => {
      console.error('[Service Worker] Error clearing caches:', err);
    });
    
    // Clear ALL indexedDB databases
    if (self.indexedDB && self.indexedDB.databases) {
      self.indexedDB.databases().then(databases => {
        console.log('[Service Worker] Found databases:', databases);
        databases.forEach(db => {
          try {
            console.log('[Service Worker] Deleting database:', db.name);
            self.indexedDB.deleteDatabase(db.name);
          } catch (e) {
            console.error('[Service Worker] Error deleting database:', e);
          }
        });
      }).catch(err => {
        console.error('[Service Worker] Error listing databases:', err);
      });
    } else {
      console.log('[Service Worker] indexedDB.databases not supported, using fallback method');
      // Fallback method: try to delete common Supabase databases
      const commonDBs = [
        'supabase', 'auth', 'sb-auth', 'sb-', 'wolzi', 'postgres', 
        'local-storage-sync'
      ];
      
      commonDBs.forEach(dbPrefix => {
        try {
          console.log('[Service Worker] Attempting to delete database with prefix:', dbPrefix);
          self.indexedDB.deleteDatabase(dbPrefix);
          self.indexedDB.deleteDatabase(dbPrefix + '-db');
        } catch (e) {
          console.error('[Service Worker] Error in fallback DB deletion:', e);
        }
      });
    }
    
    // Let the client know logout cleanup is complete
    self.clients.matchAll().then(clients => {
      console.log('[Service Worker] Notifying clients of logout completion');
      clients.forEach(client => {
        client.postMessage({ 
          type: 'LOGOUT_CLEANUP_COMPLETE',
          timestamp: new Date().toISOString()
        });
      });
    });
  }
});

// Service worker install handler
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  self.skipWaiting();
});

// Service worker activate handler
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(self.clients.claim());
}); 