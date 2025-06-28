import { supabase } from '@/integrations/supabase/client';

// Types for stored data
export interface CachedPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string;
  user_username: string;
  user_avatar: string | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  expires: number; // Timestamp when this cache expires
}

export interface CachedProfile {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  expires: number;
}

export interface CachedNotification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  created_at: string;
  expires: number;
}

export interface CachedMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  expires: number;
}

export interface CachedGroup {
  id: string;
  name: string;
  description: string;
  avatar: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  expires: number;
}

// Cache durations in milliseconds
const CACHE_DURATIONS = {
  POSTS: 5 * 60 * 1000, // 5 minutes
  PROFILES: 30 * 60 * 1000, // 30 minutes
  NOTIFICATIONS: 2 * 60 * 1000, // 2 minutes
  MESSAGES: 1 * 60 * 1000, // 1 minute
  GROUPS: 10 * 60 * 1000, // 10 minutes
};

// Local storage keys
export const STORAGE_KEYS = {
  POSTS: 'socialchat_posts',
  PROFILES: 'socialchat_profiles',
  NOTIFICATIONS: 'socialchat_notifications',
  MESSAGES: 'socialchat_messages',
  GROUPS: 'socialchat_groups',
  THEME: 'theme-storage',
  VIEWED_STORIES: 'viewed_stories',
  USER_SETTINGS: 'user_settings',
};

// Generic function to get cached data
export function getCachedData<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const parsedData = JSON.parse(data) as T[];
    
    // Filter out expired items
    const now = Date.now();
    return parsedData.filter((item: any) => item.expires > now);
  } catch (error) {
    console.error(`Error getting cached data for ${key}:`, error);
    return [];
  }
}

// Generic function to set cached data
export function setCachedData<T>(key: string, data: T[], duration: number): void {
  try {
    // Add expiration timestamp to each item
    const now = Date.now();
    const dataWithExpiry = data.map((item: any) => ({
      ...item,
      expires: now + duration,
    }));
    
    localStorage.setItem(key, JSON.stringify(dataWithExpiry));
  } catch (error) {
    console.error(`Error setting cached data for ${key}:`, error);
  }
}

// Function to add a single item to cache
export function addItemToCache<T>(key: string, item: T, duration: number): void {
  try {
    const existingData = getCachedData<T>(key);
    const itemWithId = item as any;
    
    // Check if item already exists in cache
    const index = existingData.findIndex((existing: any) => existing.id === itemWithId.id);
    
    if (index !== -1) {
      // Update existing item
      existingData[index] = {
        ...itemWithId,
        expires: Date.now() + duration,
      };
    } else {
      // Add new item
      existingData.push({
        ...itemWithId,
        expires: Date.now() + duration,
      });
    }
    
    localStorage.setItem(key, JSON.stringify(existingData));
  } catch (error) {
    console.error(`Error adding item to cache for ${key}:`, error);
  }
}

// Function to remove an item from cache
export function removeItemFromCache(key: string, id: string): void {
  try {
    const existingData = getCachedData<any>(key);
    const filteredData = existingData.filter(item => item.id !== id);
    localStorage.setItem(key, JSON.stringify(filteredData));
  } catch (error) {
    console.error(`Error removing item from cache for ${key}:`, error);
  }
}

// Function to clear all cache
export function clearAllCache(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}

// Function to clear specific cache
export function clearCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing cache for ${key}:`, error);
  }
}

// Posts specific functions
export async function fetchAndCachePosts(): Promise<CachedPost[]> {
  try {
    // Check cache first
    const cachedPosts = getCachedData<CachedPost>(STORAGE_KEYS.POSTS);
    if (cachedPosts.length > 0) {
      return cachedPosts;
    }
    
    // If no cache, fetch from API
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc('get_user_feed', {
      user_uuid: user.id,
      feed_limit: 20,
      feed_offset: 0
    });

    if (error) throw error;
    
    // Cache the results
    if (data && data.length > 0) {
      setCachedData<CachedPost>(STORAGE_KEYS.POSTS, data, CACHE_DURATIONS.POSTS);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching and caching posts:', error);
    return [];
  }
}

// Profiles specific functions
export async function fetchAndCacheProfile(userId: string): Promise<CachedProfile | null> {
  try {
    // Check cache first
    const cachedProfiles = getCachedData<CachedProfile>(STORAGE_KEYS.PROFILES);
    const cachedProfile = cachedProfiles.find(profile => profile.id === userId);
    
    if (cachedProfile) {
      return cachedProfile;
    }
    
    // If no cache, fetch from API
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, avatar')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    if (data) {
      const profileWithExpiry = {
        ...data,
        expires: Date.now() + CACHE_DURATIONS.PROFILES,
      };
      
      // Add to cache
      addItemToCache<CachedProfile>(STORAGE_KEYS.PROFILES, profileWithExpiry, CACHE_DURATIONS.PROFILES);
      
      return profileWithExpiry;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching and caching profile for ${userId}:`, error);
    return null;
  }
}

// Notifications specific functions
export async function fetchAndCacheNotifications(): Promise<CachedNotification[]> {
  try {
    // Check cache first
    const cachedNotifications = getCachedData<CachedNotification>(STORAGE_KEYS.NOTIFICATIONS);
    if (cachedNotifications.length > 0) {
      return cachedNotifications;
    }
    
    // If no cache, fetch from API
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Cache the results
    if (data && data.length > 0) {
      setCachedData<CachedNotification>(STORAGE_KEYS.NOTIFICATIONS, data, CACHE_DURATIONS.NOTIFICATIONS);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching and caching notifications:', error);
    return [];
  }
}

// Groups specific functions
export async function fetchAndCacheGroups(): Promise<CachedGroup[]> {
  try {
    // Check cache first
    const cachedGroups = getCachedData<CachedGroup>(STORAGE_KEYS.GROUPS);
    if (cachedGroups.length > 0) {
      return cachedGroups;
    }
    
    // If no cache, fetch from API
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    
    // Cache the results
    if (data && data.length > 0) {
      setCachedData<CachedGroup>(STORAGE_KEYS.GROUPS, data, CACHE_DURATIONS.GROUPS);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching and caching groups:', error);
    return [];
  }
}

// Function to sync local changes with server
export async function syncLocalChanges(): Promise<void> {
  try {
    // This function would handle syncing any offline changes
    // when the user comes back online
    const isOnline = navigator.onLine;
    
    if (!isOnline) {
      console.log('Device is offline, will sync when online');
      return;
    }
    
    // Implement sync logic here
    
  } catch (error) {
    console.error('Error syncing local changes:', error);
  }
}

// Initialize online/offline listeners
export function initializeOfflineSupport(): void {
  window.addEventListener('online', () => {
    console.log('Device is online, syncing changes...');
    syncLocalChanges();
  });
  
  window.addEventListener('offline', () => {
    console.log('Device is offline, changes will be cached');
  });
}