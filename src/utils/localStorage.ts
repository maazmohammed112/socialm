import localforage from 'localforage';

// Initialize localforage instances for different stores
const userStore = localforage.createInstance({
  name: 'socialchat',
  storeName: 'user'
});

const postsStore = localforage.createInstance({
  name: 'socialchat',
  storeName: 'posts'
});

const messagesStore = localforage.createInstance({
  name: 'socialchat',
  storeName: 'messages'
});

const notificationsStore = localforage.createInstance({
  name: 'socialchat',
  storeName: 'notifications'
});

const preferencesStore = localforage.createInstance({
  name: 'socialchat',
  storeName: 'preferences'
});

const viewedStoriesStore = localforage.createInstance({
  name: 'socialchat',
  storeName: 'viewedStories'
});

// User related functions
export const saveUserProfile = async (userId: string, profile: any) => {
  try {
    await userStore.setItem(`profile_${userId}`, profile);
    return true;
  } catch (error) {
    console.error('Error saving user profile to local storage:', error);
    return false;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    return await userStore.getItem(`profile_${userId}`);
  } catch (error) {
    console.error('Error getting user profile from local storage:', error);
    return null;
  }
};

export const removeUserProfile = async (userId: string) => {
  try {
    await userStore.removeItem(`profile_${userId}`);
    return true;
  } catch (error) {
    console.error('Error removing user profile from local storage:', error);
    return false;
  }
};

// Posts related functions
export const savePosts = async (userId: string, posts: any[]) => {
  try {
    await postsStore.setItem(`posts_${userId}`, posts);
    return true;
  } catch (error) {
    console.error('Error saving posts to local storage:', error);
    return false;
  }
};

export const getPosts = async (userId: string) => {
  try {
    return await postsStore.getItem(`posts_${userId}`);
  } catch (error) {
    console.error('Error getting posts from local storage:', error);
    return null;
  }
};

export const savePost = async (postId: string, post: any) => {
  try {
    await postsStore.setItem(`post_${postId}`, post);
    return true;
  } catch (error) {
    console.error('Error saving post to local storage:', error);
    return false;
  }
};

export const getPost = async (postId: string) => {
  try {
    return await postsStore.getItem(`post_${postId}`);
  } catch (error) {
    console.error('Error getting post from local storage:', error);
    return null;
  }
};

// Messages related functions
export const saveConversation = async (userId: string, friendId: string, messages: any[]) => {
  try {
    const conversationId = [userId, friendId].sort().join('_');
    await messagesStore.setItem(`conversation_${conversationId}`, messages);
    return true;
  } catch (error) {
    console.error('Error saving conversation to local storage:', error);
    return false;
  }
};

export const getConversation = async (userId: string, friendId: string) => {
  try {
    const conversationId = [userId, friendId].sort().join('_');
    return await messagesStore.getItem(`conversation_${conversationId}`);
  } catch (error) {
    console.error('Error getting conversation from local storage:', error);
    return null;
  }
};

export const saveFriendsList = async (userId: string, friends: any[]) => {
  try {
    await userStore.setItem(`friends_${userId}`, friends);
    return true;
  } catch (error) {
    console.error('Error saving friends list to local storage:', error);
    return false;
  }
};

export const getFriendsList = async (userId: string) => {
  try {
    return await userStore.getItem(`friends_${userId}`);
  } catch (error) {
    console.error('Error getting friends list from local storage:', error);
    return null;
  }
};

// Notifications related functions
export const saveNotifications = async (userId: string, notifications: any[]) => {
  try {
    await notificationsStore.setItem(`notifications_${userId}`, notifications);
    return true;
  } catch (error) {
    console.error('Error saving notifications to local storage:', error);
    return false;
  }
};

export const getNotifications = async (userId: string) => {
  try {
    return await notificationsStore.getItem(`notifications_${userId}`);
  } catch (error) {
    console.error('Error getting notifications from local storage:', error);
    return null;
  }
};

export const saveUnreadCount = async (userId: string, count: number) => {
  try {
    await notificationsStore.setItem(`unread_${userId}`, count);
    return true;
  } catch (error) {
    console.error('Error saving unread count to local storage:', error);
    return false;
  }
};

export const getUnreadCount = async (userId: string) => {
  try {
    return await notificationsStore.getItem(`unread_${userId}`);
  } catch (error) {
    console.error('Error getting unread count from local storage:', error);
    return null;
  }
};

// Preferences related functions
export const saveThemePreference = async (userId: string, theme: string) => {
  try {
    await preferencesStore.setItem(`theme_${userId}`, theme);
    return true;
  } catch (error) {
    console.error('Error saving theme preference to local storage:', error);
    return false;
  }
};

export const getThemePreference = async (userId: string) => {
  try {
    return await preferencesStore.getItem(`theme_${userId}`);
  } catch (error) {
    console.error('Error getting theme preference from local storage:', error);
    return null;
  }
};

export const saveColorThemePreference = async (userId: string, colorTheme: string) => {
  try {
    await preferencesStore.setItem(`colorTheme_${userId}`, colorTheme);
    return true;
  } catch (error) {
    console.error('Error saving color theme preference to local storage:', error);
    return false;
  }
};

export const getColorThemePreference = async (userId: string) => {
  try {
    return await preferencesStore.getItem(`colorTheme_${userId}`);
  } catch (error) {
    console.error('Error getting color theme preference from local storage:', error);
    return null;
  }
};

// Viewed stories related functions
export const saveViewedStories = async (userId: string, storyIds: string[]) => {
  try {
    await viewedStoriesStore.setItem(`viewedStories_${userId}`, storyIds);
    return true;
  } catch (error) {
    console.error('Error saving viewed stories to local storage:', error);
    return false;
  }
};

export const getViewedStories = async (userId: string) => {
  try {
    return await viewedStoriesStore.getItem(`viewedStories_${userId}`) || [];
  } catch (error) {
    console.error('Error getting viewed stories from local storage:', error);
    return [];
  }
};

export const addViewedStory = async (userId: string, storyId: string) => {
  try {
    const viewedStories = await getViewedStories(userId) as string[];
    if (!viewedStories.includes(storyId)) {
      viewedStories.push(storyId);
      await saveViewedStories(userId, viewedStories);
    }
    return true;
  } catch (error) {
    console.error('Error adding viewed story to local storage:', error);
    return false;
  }
};

// Clear all data for a user (used during logout)
export const clearUserData = async (userId: string) => {
  try {
    await userStore.removeItem(`profile_${userId}`);
    await userStore.removeItem(`friends_${userId}`);
    await postsStore.removeItem(`posts_${userId}`);
    await notificationsStore.removeItem(`notifications_${userId}`);
    await notificationsStore.removeItem(`unread_${userId}`);
    await preferencesStore.removeItem(`theme_${userId}`);
    await preferencesStore.removeItem(`colorTheme_${userId}`);
    await viewedStoriesStore.removeItem(`viewedStories_${userId}`);
    
    // Also clear any conversations
    const keys = await messagesStore.keys();
    for (const key of keys) {
      if (key.includes(userId)) {
        await messagesStore.removeItem(key);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing user data from local storage:', error);
    return false;
  }
};

// Clear all data (used during development or for troubleshooting)
export const clearAllData = async () => {
  try {
    await userStore.clear();
    await postsStore.clear();
    await messagesStore.clear();
    await notificationsStore.clear();
    await preferencesStore.clear();
    await viewedStoriesStore.clear();
    return true;
  } catch (error) {
    console.error('Error clearing all data from local storage:', error);
    return false;
  }
};