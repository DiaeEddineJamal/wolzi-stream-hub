// useAdBlocker.ts
// React hook for ad blocking functionality

import { useEffect, useRef } from 'react';
import { injectAdBlockerIntoIframe, registerAdBlockerServiceWorker, blockAdsInDocument } from '@/utils/adBlocker';

/**
 * Hook to block ads in an iframe
 */
export function useAdBlocker(iframeRef: React.RefObject<HTMLIFrameElement>, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !iframeRef.current) return;
    
    const iframe = iframeRef.current;
    
    const handleLoad = () => {
      // Small delay to ensure iframe content is loaded
      setTimeout(() => {
        injectAdBlockerIntoIframe(iframe);
      }, 500);
    };
    
    iframe.addEventListener('load', handleLoad);
    
    // Also try immediately if already loaded
    if (iframe.contentDocument || iframe.contentWindow?.document) {
      handleLoad();
    }
    
    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [iframeRef, enabled]);
}

/**
 * Hook to initialize ad blocking for the entire app
 */
export function useAppAdBlocker() {
  useEffect(() => {
    // Register service worker
    registerAdBlockerServiceWorker();
    
    // Block ads in main document
    blockAdsInDocument();
  }, []);
}

