import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { openDB } from 'idb';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Initialize IndexedDB with better performance
export const initDB = async () => {
  return openDB('socialchat-db', 1, {
    upgrade(db) {
      // Create object stores with indexes for faster queries
      if (!db.objectStoreNames.contains('posts')) {
        const postsStore = db.createObjectStore('posts', { keyPath: 'id' });
        postsStore.createIndex('user_id', 'user_id', { unique: false });
        postsStore.createIndex('created_at', 'created_at', { unique: false });
      }
      if (!db.objectStoreNames.contains('profiles')) {
        const profilesStore = db.createObjectStore('profiles', { keyPath: 'id' });
        profilesStore.createIndex('username', 'username', { unique: true });
      }
      if (!db.objectStoreNames.contains('messages')) {
        const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
        messagesStore.createIndex('conversation', ['sender_id', 'receiver_id'], { unique: false });
        messagesStore.createIndex('created_at', 'created_at', { unique: false });
      }
      if (!db.objectStoreNames.contains('notifications')) {
        const notificationsStore = db.createObjectStore('notifications', { keyPath: 'id' });
        notificationsStore.createIndex('user_id', 'user_id', { unique: false });
        notificationsStore.createIndex('read', 'read', { unique: false });
      }
    },
  });
};

// Optimized cache data function with transaction batching
export const cacheData = async (storeName: string, data: any[]) => {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  // Use Promise.all for parallel operations
  await Promise.all(
    Array.isArray(data) 
      ? data.map(item => store.put(item))
      : [store.put(data)]
  );
  
  await tx.done;
};

// Get cached data with improved error handling
export const getCachedData = async (storeName: string, id: string) => {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return await store.get(id);
  } catch (error) {
    console.error(`Error getting cached data from ${storeName}:`, error);
    return null;
  }
};

// Optimized image loading with timeout
export const loadImage = (src: string, timeout = 10000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      reject(new Error('Image load timed out'));
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(src);
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to load image'));
    };
    
    img.src = src;
  });
};

// Optimized debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Memory-efficient memoize function
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxCacheSize = 100
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, { value: ReturnType<T>, timestamp: number }>();
  
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached) {
      // Update timestamp to mark as recently used
      cached.timestamp = Date.now();
      return cached.value;
    }
    
    // Compute new value
    const result = fn(...args);
    
    // Manage cache size
    if (cache.size >= maxCacheSize) {
      // Find and remove oldest entry
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      
      for (const [k, entry] of cache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = k;
        }
      }
      
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    
    // Add new entry
    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  };
}