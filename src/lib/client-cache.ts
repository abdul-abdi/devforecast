// Client-side cache implementation for API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiryTime: number;
}

// Default cache durations in milliseconds
export const CACHE_DURATIONS = {
  WEATHER: 10 * 60 * 1000, // 10 minutes
  GITHUB: 30 * 60 * 1000,  // 30 minutes
  AI_INSIGHT: 60 * 60 * 1000, // 1 hour
  DEFAULT: 15 * 60 * 1000,  // 15 minutes
};

// Generic cache class for client-side data
export class ClientCache {
  private static isInitialized = false;
  private static cacheStore: { [key: string]: CacheEntry<unknown> } = {};

  // Initialize cache from localStorage on first use
  private static initialize() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    
    try {
      const storedCache = localStorage.getItem('devforecast_api_cache');
      if (storedCache) {
        this.cacheStore = JSON.parse(storedCache);
        // Clean expired entries on load
        this.cleanExpiredEntries();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing cache from localStorage:', error);
      this.cacheStore = {};
    }
  }

  // Save cache to localStorage
  private static persistCache() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('devforecast_api_cache', JSON.stringify(this.cacheStore));
    } catch (error) {
      console.error('Error persisting cache to localStorage:', error);
    }
  }

  // Remove expired entries from cache
  private static cleanExpiredEntries() {
    const now = Date.now();
    let hasRemovedEntries = false;
    
    Object.keys(this.cacheStore).forEach(key => {
      if (this.cacheStore[key].expiryTime < now) {
        delete this.cacheStore[key];
        hasRemovedEntries = true;
      }
    });
    
    if (hasRemovedEntries) {
      this.persistCache();
    }
  }
  
  // Public method to clean expired cache entries
  static cleanCache() {
    this.initialize();
    this.cleanExpiredEntries();
  }

  // Get cached data for a key
  static get<T = unknown>(key: string): T | null {
    this.initialize();
    this.cleanExpiredEntries();
    
    const entry = this.cacheStore[key];
    if (!entry) return null;
    
    return entry.data as T;
  }

  // Store data in cache with expiration
  static set<T>(key: string, data: T, duration: number = CACHE_DURATIONS.DEFAULT): void {
    this.initialize();
    
    const now = Date.now();
    this.cacheStore[key] = {
      data,
      timestamp: now,
      expiryTime: now + duration
    };
    
    this.persistCache();
  }

  // Check if a key exists in cache and is not expired
  static has(key: string): boolean {
    this.initialize();
    
    const entry = this.cacheStore[key];
    if (!entry) return false;
    
    return entry.expiryTime > Date.now();
  }

  // Clear specific cache entry
  static clear(key: string): void {
    this.initialize();
    
    if (this.cacheStore[key]) {
      delete this.cacheStore[key];
      this.persistCache();
    }
  }

  // Clear all cache
  static clearAll(): void {
    this.cacheStore = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem('devforecast_api_cache');
    }
  }
}

// Utility function to generate cache keys
// Allow string, number, or boolean values in params for key generation
export const generateCacheKey = (endpoint: string, params: Record<string, string | number | boolean> = {}): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${String(params[key])}`) // Explicitly convert to string
    .join('&');
  
  return `${endpoint}${sortedParams ? `?${sortedParams}` : ''}`;
}; 