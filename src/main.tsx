import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Detect if we need to complete a logout
const urlParams = new URLSearchParams(window.location.search);
const isLogoutComplete = urlParams.get('logout') === 'complete';
const needsCacheClear = sessionStorage.getItem('wolziflix_complete_logout') === 'true' || isLogoutComplete;

if (needsCacheClear) {
  console.log('Detected logout flag, performing complete cleanup');
  
  // Clear all flags
  sessionStorage.removeItem('wolziflix_complete_logout');
  sessionStorage.removeItem('wolziflix_force_cache_clear');
  
  // AGGRESSIVE CLEANUP on page load after logout
  
  // 1. Clear ALL localStorage
  console.log('Clearing all localStorage');
  localStorage.clear();
  
  // 2. Clear ALL sessionStorage
  console.log('Clearing all sessionStorage');
  sessionStorage.clear();
  
  // 3. Use service worker if available
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    console.log('Asking service worker to clear caches and databases');
    navigator.serviceWorker.controller.postMessage({
      type: 'LOGOUT'
    });
  }
  
  // 4. Clear URL parameters to avoid re-triggering on refresh
  if (isLogoutComplete) {
    console.log('Cleaning URL after logout');
    window.history.replaceState(null, '', window.location.pathname);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
