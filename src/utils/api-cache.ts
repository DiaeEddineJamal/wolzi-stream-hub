/**
 * API Cache Utility
 * 
 * This utility provides caching for API responses to:
 * - Reduce duplicate API calls
 * - Improve loading times for frequently accessed data
 * - Reduce bandwidth usage
 */

// Cache storage
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

// Cache map
const cache = new Map<string, CacheEntry>();

// Default cache duration in milliseconds (5 minutes)
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Get cached data for a specific key
 */
export const getCachedData = <T>(key: string): T | null => {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  // Check if cache entry has expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
};

/**
 * Cache data with a specific key
 */
export const cacheData = <T>(
  key: string, 
  data: T, 
  duration: number = DEFAULT_CACHE_DURATION
): void => {
  const now = Date.now();
  
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + duration
  });
};

/**
 * Clear cache for a specific key
 */
export const clearCache = (key: string): void => {
  cache.delete(key);
};

/**
 * Clear all cache
 */
export const clearAllCache = (): void => {
  cache.clear();
};

/**
 * Get the size of the cache
 */
export const getCacheSize = (): number => {
  return cache.size;
};

/**
 * Get all cached keys
 */
export const getCachedKeys = (): string[] => {
  return Array.from(cache.keys());
};

/**
 * Wrapper function for fetch calls with caching
 */
export const cachedFetch = async <T>(
  url: string,
  options?: RequestInit,
  cacheDuration: number = DEFAULT_CACHE_DURATION
): Promise<T> => {
  // Create a cache key based on the URL and options
  const cacheKey = `${url}:${JSON.stringify(options || {})}`;
  
  // Check if we have a cached response
  const cachedData = getCachedData<T>(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for ${url}`);
    return cachedData;
  }
  
  // If no cached data, make the fetch request
  console.log(`Cache miss for ${url}, fetching...`);
  const response = await fetch(url, options);
  
  // Parse the JSON response
  const data = await response.json();
  
  // Cache the response
  cacheData<T>(cacheKey, data, cacheDuration);
  
  return data;
};

/**
 * Async function wrapper with caching
 */
export const cachedAsyncFunction = async <T>(
  fn: () => Promise<T>,
  cacheKey: string,
  cacheDuration: number = DEFAULT_CACHE_DURATION
): Promise<T> => {
  // Check if we have a cached result
  const cachedData = getCachedData<T>(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for function with key ${cacheKey}`);
    return cachedData;
  }
  
  // If no cached data, call the function
  console.log(`Cache miss for function with key ${cacheKey}, executing...`);
  const data = await fn();
  
  // Cache the result
  cacheData<T>(cacheKey, data, cacheDuration);
  
  return data;
};

export default {
  getCachedData,
  cacheData,
  clearCache,
  clearAllCache,
  getCacheSize,
  getCachedKeys,
  cachedFetch,
  cachedAsyncFunction
}; 