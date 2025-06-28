import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOneSignalNotifications } from '@/hooks/use-onesignal-notifications';
import { saveNotifications, getNotifications, saveUnreadCount, getUnreadCount } from '@/utils/localStorage';

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
  const [isLoading, setIsLoading] = useState(true);
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
          
          // Try to load notifications from local storage first
          const cachedNotifications = await getNotifications(user.id);
          const cachedUnreadCount = await getUnreadCount(user.id);
          
          if (cachedNotifications) {
            setNotifications(cachedNotifications);
            setUnreadCount(cachedUnreadCount || 0);
            setIsLoading(false);
          }
          
          // Then load from database
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
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
        setIsLoading(false);
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
  }, [oneSignalUser.subscribed, hasShownSystemNotification]);

  // Update permission status when OneSignal status changes
  useEffect(() => {
    if ('Notification' in window) {
      setIsGranted(Notification.permission === 'granted' || oneSignalUser.subscribed);
    }
  }, [oneSignalUser.subscribed]);

  // Create system notification about theme customization
  const createSystemNotification = useCallback(async (userId: string) => {
    try {
      // Create a mock notification if the table doesn't exist yet
      const mockNotification = {
        id: `mock-${Date.now()}`,
        user_id: userId,
        type: 'system',
        content: "💡 Don't like the pixel font? No problem! Visit your Profile section to change themes and customize fonts & colors to your preference.",
        read: false,
        created_at: new Date().toISOString()
      };

      // Add to local state
      setNotifications(prev => [mockNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Save to local storage
      const updatedNotifications = [mockNotification, ...notifications];
      await saveNotifications(userId, updatedNotifications);
      await saveUnreadCount(userId, unreadCount + 1);

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
  }, [toast, notifications, unreadCount]);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Check if notifications table exists
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.log('Notifications table does not exist yet, using empty array');
        // Create mock notifications for testing
        const mockNotifications = [
          {
            id: `mock-system-${Date.now()}`,
            user_id: userId,
            type: 'system',
            content: "💡 Don't like the pixel font? No problem! Visit your Profile section to change themes and customize fonts & colors to your preference.",
            read: false,
            created_at: new Date().toISOString()
          },
          {
            id: `mock-like-${Date.now()}`,
            user_id: userId,
            type: 'like',
            content: "Someone liked your post",
            read: false,
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ];
        
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.length);
        
        // Save to local storage for offline access
        await saveNotifications(userId, mockNotifications);
        await saveUnreadCount(userId, mockNotifications.length);
        
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        setIsLoading(false);
        return;
      }

      setNotifications(data || []);
      const newUnreadCount = data?.filter(n => !n.read).length || 0;
      setUnreadCount(newUnreadCount);
      
      // Save to local storage for offline access
      await saveNotifications(userId, data || []);
      await saveUnreadCount(userId, newUnreadCount);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setIsLoading(false);
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
      // Create a mock notification if the table doesn't exist yet
      const mockNotification = {
        id: `mock-${Date.now()}`,
        user_id: userId,
        type,
        content,
        reference_id: referenceId,
        read: false,
        created_at: new Date().toISOString()
      };

      // Update local state
      setNotifications(prev => [mockNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Save to local storage
      const updatedNotifications = [mockNotification, ...notifications];
      await saveNotifications(userId, updatedNotifications);
      await saveUnreadCount(userId, unreadCount + 1);

      // Try to create in database if it exists
      try {
        const { error: tableCheckError } = await supabase
          .from('notifications')
          .select('id')
          .limit(1);
        
        if (!tableCheckError) {
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              type,
              content,
              reference_id: referenceId,
              read: false
            });
        }
      } catch (dbError) {
        console.log('Database notification creation handled:', dbError);
      }

      // Send OneSignal notification if user is subscribed
      if (oneSignalUser.subscribed) {
        await sendNotificationToUser(userId, getNotificationTitle(type), content, {
          type,
          reference_id: referenceId
        });
      }

      return mockNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }, [oneSignalUser.subscribed, sendNotificationToUser, notifications, unreadCount]);

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
      // Update local state
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      const newUnreadCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newUnreadCount);
      
      // Save to local storage
      if (currentUser) {
        await saveNotifications(currentUser.id, updatedNotifications);
        await saveUnreadCount(currentUser.id, newUnreadCount);
      }

      // Try to update in database if it exists
      try {
        const { error: tableCheckError } = await supabase
          .from('notifications')
          .select('id')
          .limit(1);
        
        if (!tableCheckError) {
          await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
        }
      } catch (dbError) {
        console.log('Database notification update handled:', dbError);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [notifications, unreadCount, currentUser]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Update local state
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      // Save to local storage
      await saveNotifications(currentUser.id, updatedNotifications);
      await saveUnreadCount(currentUser.id, 0);

      // Try to update in database if it exists
      try {
        const { error: tableCheckError } = await supabase
          .from('notifications')
          .select('id')
          .limit(1);
        
        if (!tableCheckError) {
          await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', currentUser.id)
            .eq('read', false);
        }
      } catch (dbError) {
        console.log('Database notification update handled:', dbError);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [currentUser, notifications]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Update local state
      const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      
      // Update unread count if needed
      if (wasUnread) {
        const newUnreadCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newUnreadCount);
        
        // Save to local storage
        if (currentUser) {
          await saveUnreadCount(currentUser.id, newUnreadCount);
        }
      }
      
      // Save to local storage
      if (currentUser) {
        await saveNotifications(currentUser.id, updatedNotifications);
      }

      // Try to update in database if it exists
      try {
        const { error: tableCheckError } = await supabase
          .from('notifications')
          .select('id')
          .limit(1);
        
        if (!tableCheckError) {
          await supabase
            .from('notifications')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', notificationId);
        }
      } catch (dbError) {
        console.log('Database notification update handled:', dbError);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications, unreadCount, currentUser]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
      
      // Save to local storage
      await saveNotifications(currentUser.id, []);
      await saveUnreadCount(currentUser.id, 0);

      // Try to update in database if it exists
      try {
        const { error: tableCheckError } = await supabase
          .from('notifications')
          .select('id')
          .limit(1);
        
        if (!tableCheckError) {
          await supabase
            .from('notifications')
            .update({ deleted_at: new Date().toISOString() })
            .eq('user_id', currentUser.id)
            .is('deleted_at', null);
        }
      } catch (dbError) {
        console.log('Database notification update handled:', dbError);
      }
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
    isLoading,
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
    default:
      return 'Notification';
  }
}