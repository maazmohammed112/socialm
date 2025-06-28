// Local storage utility functions for improved performance

// Generic type for storing and retrieving data
export function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error retrieving from localStorage:', error);
    return defaultValue;
  }
}

export function removeLocalData(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

// Specific functions for common data types
export const userStorage = {
  setUser: (user: any) => setLocalData('socialchat_user', user),
  getUser: () => getLocalData('socialchat_user', null),
  clearUser: () => removeLocalData('socialchat_user'),
};

export const feedStorage = {
  setPosts: (posts: any[]) => setLocalData('socialchat_posts', posts),
  getPosts: () => getLocalData<any[]>('socialchat_posts', []),
  setLastFetchTime: () => setLocalData('socialchat_posts_fetch_time', Date.now()),
  getLastFetchTime: () => getLocalData<number>('socialchat_posts_fetch_time', 0),
  shouldRefetch: (maxAgeMs = 60000) => {
    const lastFetch = getLocalData<number>('socialchat_posts_fetch_time', 0);
    return Date.now() - lastFetch > maxAgeMs;
  },
};

export const friendsStorage = {
  setFriends: (friends: any[]) => setLocalData('socialchat_friends', friends),
  getFriends: () => getLocalData<any[]>('socialchat_friends', []),
  setLastFetchTime: () => setLocalData('socialchat_friends_fetch_time', Date.now()),
  getLastFetchTime: () => getLocalData<number>('socialchat_friends_fetch_time', 0),
  shouldRefetch: (maxAgeMs = 300000) => {
    const lastFetch = getLocalData<number>('socialchat_friends_fetch_time', 0);
    return Date.now() - lastFetch > maxAgeMs;
  },
};

export const notificationsStorage = {
  setNotifications: (notifications: any[]) => setLocalData('socialchat_notifications', notifications),
  getNotifications: () => getLocalData<any[]>('socialchat_notifications', []),
  setUnreadCount: (count: number) => setLocalData('socialchat_unread_count', count),
  getUnreadCount: () => getLocalData<number>('socialchat_unread_count', 0),
  setLastFetchTime: () => setLocalData('socialchat_notifications_fetch_time', Date.now()),
  getLastFetchTime: () => getLocalData<number>('socialchat_notifications_fetch_time', 0),
  shouldRefetch: (maxAgeMs = 60000) => {
    const lastFetch = getLocalData<number>('socialchat_notifications_fetch_time', 0);
    return Date.now() - lastFetch > maxAgeMs;
  },
};

export const messagesStorage = {
  setConversations: (conversations: any[]) => setLocalData('socialchat_conversations', conversations),
  getConversations: () => getLocalData<any[]>('socialchat_conversations', []),
  setMessages: (friendId: string, messages: any[]) => 
    setLocalData(`socialchat_messages_${friendId}`, messages),
  getMessages: (friendId: string) => 
    getLocalData<any[]>(`socialchat_messages_${friendId}`, []),
  setLastFetchTime: (friendId: string) => 
    setLocalData(`socialchat_messages_fetch_time_${friendId}`, Date.now()),
  getLastFetchTime: (friendId: string) => 
    getLocalData<number>(`socialchat_messages_fetch_time_${friendId}`, 0),
  shouldRefetch: (friendId: string, maxAgeMs = 30000) => {
    const lastFetch = getLocalData<number>(`socialchat_messages_fetch_time_${friendId}`, 0);
    return Date.now() - lastFetch > maxAgeMs;
  },
};

export const themeStorage = {
  setTheme: (theme: string) => setLocalData('socialchat_theme', theme),
  getTheme: () => getLocalData<string>('socialchat_theme', 'light'),
  setColorTheme: (colorTheme: string) => setLocalData('socialchat_color_theme', colorTheme),
  getColorTheme: () => getLocalData<string>('socialchat_color_theme', 'green'),
};

// Cache expiration utility
export function isDataStale(lastFetchTime: number, maxAgeMs: number = 60000): boolean {
  return Date.now() - lastFetchTime > maxAgeMs;
}