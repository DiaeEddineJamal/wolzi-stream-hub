/**
 * Utility functions for authentication-related operations
 */

/**
 * Performs a clean, aggressive logout by clearing all storage and forcing a page reload
 * This bypasses any promise-based issues that might happen with the regular logout flow
 */
export const forceLogout = () => {
  try {
    console.log("Force logout initiated");
    
    // 1. Try to clean up YouTube iframes that might cause errors
    cleanupYouTubeIframes();
    
    // 2. Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // 3. Set the flag for complete logout
    sessionStorage.setItem('wolziflix_complete_logout', 'true');
    
    // 4. Clear cookies 
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // 5. Force page reload to root with cache busting
    console.log("Forcing page reload");
    window.location.href = '/?logout=forced&t=' + new Date().getTime();
  } catch (error) {
    console.error("Critical error during force logout:", error);
    // Last resort - direct assignment
    window.location.href = '/';
  }
};

/**
 * Clean up any YouTube iframes to prevent errors during logout
 */
const cleanupYouTubeIframes = () => {
  try {
    // Find all iframes
    const iframes = document.querySelectorAll('iframe');
    
    // Remove any YouTube iframes
    iframes.forEach(iframe => {
      if (iframe.src.includes('youtube.com') || iframe.src.includes('youtu.be')) {
        console.log("Removing YouTube iframe to prevent logout errors");
        iframe.remove();
      }
    });
    
    // Also try to clean up any YouTube API instances
    if (window.YT) {
      console.log("Attempting to clean up YouTube API");
      // @ts-ignore - YT might not be properly typed
      window.YT = null;
    }
  } catch (e) {
    console.error("Error cleaning up YouTube iframes:", e);
  }
};

/**
 * Check if the user is currently logged in based on storage items
 */
export const isUserLoggedIn = () => {
  try {
    // Check for Supabase auth token
    const hasSupabaseSession = !!localStorage.getItem('sb-session');
    
    // Check for our custom user profile
    const hasUserProfile = !!localStorage.getItem('wolziflix_user_profile');
    
    return hasSupabaseSession && hasUserProfile;
  } catch (e) {
    console.error("Error checking login status:", e);
    return false;
  }
}; 