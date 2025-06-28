import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOneSignalNotifications } from '@/hooks/use-onesignal-notifications';
import { getCachedData, setCachedData, STORAGE_KEYS, CachedNotification } from '@/lib/local-storage';

interface NotificationData {
  id: string;
  type: string;
  content: string;
  reference_id?: string;
  read: boolean;
  created_at: string;
  user_id: string;
}

export function useEnhancedNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isGranted, setIsGranted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasShownSystemNotification, setHasShownSystemNotification] = useState(false);
  const [hasShownFollowNotification, setHasShownFollowNotification] = useState(false);
  const { toast } = useToast();
  const { oneSignalUser, sendNotificationToUser } = useOneSignalNotifications();

  // Initialize user and permissions
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          
          // Check notification permission (both browser and OneSignal)
          if ('Notification' in window) {
            setIsGranted(Notification.permission === 'granted' || oneSignalUser.subscribed);
          }
          
          // Load initial notifications
          await fetchNotifications(user.id);

          // Show system notification about theme customization (only once per session)
          const hasShownKey = `system_notification_shown_${user.id}`;
          const hasShown = sessionStorage.getItem(hasShownKey);
          
          if (!hasShown && !hasShownSystemNotification) {
            setTimeout(() => {
              createSystemNotification(user.id);
              setHasShownSystemNotification(true);
              sessionStorage.setItem(hasShownKey, 'true');
            }, 3000); // Show after 3 seconds
          }
          
          // Show follow notification (only once per session)
          const hasShownFollowKey = `follow_notification_shown_${user.id}`;
          const hasShownFollow = sessionStorage.getItem(hasShownFollowKey);
          
          if (!hasShownFollow && !hasShownFollowNotification) {
            setTimeout(() => {
              createFollowNotification(user.id);
              setHasShownFollowNotification(true);
              sessionStorage.setItem(hasShownFollowKey, 'true');
            }, 10000); // Show after 10 seconds
          }
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [oneSignalUser.subscribed, hasShownSystemNotification, hasShownFollowNotification]);

  // Update permission status when OneSignal status changes
  useEffect(() => {
    if ('Notification' in window) {
      setIsGranted(Notification.permission === 'granted' || oneSignalUser.subscribed);
    }
  }, [oneSignalUser.subscribed]);

  // Create system notification about theme customization
  const createSystemNotification = useCallback(async (userId: string) => {
    try {
      // Check if notifications table exists
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.log('Notifications table does not exist yet, skipping system notification');
        return;
      }
      
      const systemNotification = {
        user_id: userId,
        type: 'system',
        content: "💡 Don't like the pixel font? No problem! Visit your Profile section to change themes and customize fonts & colors to your preference.",
        read: false
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(systemNotification)
        .select()
        .single();

      if (error) {
        console.error('Error creating system notification:', error);
        return;
      }

      // Add to local state
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast notification with highlight
      toast({
        title: '🎨 Customize Your Experience',
        description: "Don't like the pixel font? Change themes in your Profile section!",
        duration: 8000,
        className: 'border-l-4 border-l-blue-500 bg-blue-50 text-blue-900 shadow-lg animate-pulse',
      });

    } catch (error) {
      console.error('Error creating system notification:', error);
    }
  }, [toast]);

  // Create follow notification for LinkedIn
  const createFollowNotification = useCallback(async (userId: string) => {
    try {
      // Check if notifications table exists
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.log('Notifications table does not exist yet, skipping follow notification');
        return;
      }
      
      const followNotification = {
        user_id: userId,
        type: 'system',
        content: "🔗 Follow SocialChat on LinkedIn for updates and announcements! Connect with us at linkedin.com/company/socialchatmz",
        read: false
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(followNotification)
        .select()
        .single();

      if (error) {
        console.error('Error creating follow notification:', error);
        return;
      }

      // Add to local state
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast notification with highlight
      toast({
        title: '🔗 Connect with SocialChat',
        description: "Follow our LinkedIn page for updates and announcements!",
        duration: 8000,
        className: 'border-l-4 border-l-blue-700 bg-blue-50 text-blue-900 shadow-lg',
      });

    } catch (error) {
      console.error('Error creating follow notification:', error);
    }
  }, [toast]);

  // Fetch notifications from database with cache support
  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      // Try to get from cache first
      const cachedNotifications = getCachedData<CachedNotification>(STORAGE_KEYS.NOTIFICATIONS);
      if (cachedNotifications.length > 0) {
        setNotifications(cachedNotifications);
        setUnreadCount(cachedNotifications.filter(n => !n.read).length);
        return;
      }
      
      // Check if notifications table exists
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.log('Notifications table does not exist yet, using empty array');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // Cache the results
      if (data && data.length > 0) {
        setCachedData(STORAGE_KEYS.NOTIFICATIONS, data, 2 * 60 * 1000); // 2 minutes cache
      }
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  // Create notification in database
  const createNotification = useCallback(async (
    userId: string, 
    type: string, 
    content: string, 
    referenceId?: string
  ) => {
    try {
      // Check if notifications table exists
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.log('Notifications table does not exist yet, skipping notification creation');
        return null;
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          content,
          reference_id: referenceId,
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Send OneSignal notification if user is subscribed
      if (oneSignalUser.subscribed) {
        await sendNotificationToUser(userId, getNotificationTitle(type), content, {
          type,
          reference_id: referenceId
        });
      }

      // Update local cache
      const cachedNotifications = getCachedData<CachedNotification>(STORAGE_KEYS.NOTIFICATIONS);
      if (data) {
        const updatedCache = [data, ...cachedNotifications];
        setCachedData(STORAGE_KEYS.NOTIFICATIONS, updatedCache, 2 * 60 * 1000); // 2 minutes cache
      }

      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }, [oneSignalUser.subscribed, sendNotificationToUser]);

  // Send browser notification (fallback)
  const sendBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    // If OneSignal is handling notifications, don't send browser notifications
    if (oneSignalUser.subscribed) return null;

    if (!isGranted || !('Notification' in window)) return null;

    try {
      const notification = new Notification(title, {
        ...options,
        icon: '/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
        badge: '/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
        requireInteraction: false,
        silent: false,
        tag: options?.tag || 'socialchat'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [isGranted, oneSignalUser.subscribed]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Check if notifications table exists
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.log('Notifications table does not exist yet, skipping mark as read');
        return;
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update cache
      const cachedNotifications = getCachedData<CachedNotification>(STORAGE_KEYS.NOTIFICATIONS);
      const updatedCache = cachedNotifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      setCachedData(STORAGE_KEYS.NOTIFICATIONS, updatedCache, 2 * 60 * 1000);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Check if notifications table exists
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.log('Notifications table does not exist yet, skipping mark all as read');
        return;
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Update cache
      const cachedNotifications = getCachedData<CachedNotification>(STORAGE_KEYS.NOTIFICATIONS);
      const updatedCache = cachedNotifications.map(n => ({ ...n, read: true }));
      setCachedData(STORAGE_KEYS.NOTIFICATIONS, updatedCache, 2 * 60 * 1000);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [currentUser]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Check if notifications table exists
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.log('Notifications table does not exist yet, skipping delete notification');
        return;
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if needed
      const wasUnread = notificationToDelete?.read === false;
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Update cache
      const cachedNotifications = getCachedData<CachedNotification>(STORAGE_KEYS.NOTIFICATIONS);
      const updatedCache = cachedNotifications.filter(n => n.id !== notificationId);
      setCachedData(STORAGE_KEYS.NOTIFICATIONS, updatedCache, 2 * 60 * 1000);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Check if notifications table exists
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.log('Notifications table does not exist yet, skipping clear all notifications');
        return;
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', currentUser.id)
        .is('deleted_at', null);

      if (error) throw error;

      // Update local state
      setNotifications([]);
      setUnreadCount(0);
      
      // Clear cache
      setCachedData(STORAGE_KEYS.NOTIFICATIONS, [], 2 * 60 * 1000);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, [currentUser]);

  // Request notification permission (browser fallback)
  const requestPermission = useCallback(async () => {
    try {
      const permission = await Notification.requestPermission();
      setIsGranted(permission === 'granted');
      
      if (permission === 'granted') {
        toast({
          title: 'Browser notifications enabled',
          description: 'You will now receive browser notifications',
          duration: 3000
        });

        // Send test notification
        sendBrowserNotification('Notifications Enabled!', {
          body: 'You will now receive browser notifications',
          tag: 'test'
        });
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }, [sendBrowserNotification, toast]);

  return {
    notifications,
    unreadCount,
    isGranted: isGranted || oneSignalUser.subscribed,
    isOnline,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    requestPermission,
    createNotification,
    fetchNotifications: () => currentUser && fetchNotifications(currentUser.id),
    oneSignalEnabled: oneSignalUser.subscribed
  };
}

// Helper function to get notification titles
function getNotificationTitle(type: string): string {
  switch (type) {
    case 'message':
      return 'New Message';
    case 'friend_request':
      return 'Friend Request';
    case 'friend_accepted':
      return 'Friend Request Accepted';
    case 'like':
      return 'New Like';
    case 'comment':
      return 'New Comment';
    case 'system':
      return '🎨 Customize Your Experience';
    case 'group_join_approved':
      return 'Group Request Approved';
    case 'group_join_rejected':
      return 'Group Request Rejected';
    case 'group_message':
      return 'New Group Message';
    default:
      return 'Notification';
  }
}