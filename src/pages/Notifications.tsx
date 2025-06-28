import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OneSignalNotificationBanner } from '@/components/notifications/OneSignalNotificationBanner';
import { useOneSignalNotifications } from '@/hooks/use-onesignal-notifications';
import { 
  Bell, 
  Check, 
  Trash2, 
  User, 
  MessageSquare, 
  Heart, 
  UserPlus, 
  Info, 
  CheckCheck, 
  X,
  Wifi,
  WifiOff,
  UserX,
  Settings,
  Palette,
  Sparkles,
  Linkedin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SEO, seoConfig } from '@/utils/seo';
import { notificationsStorage } from '@/utils/localStorage';

interface Notification {
  id: string;
  type: string;
  content: string;
  reference_id: string | null;
  read: boolean;
  created_at: string;
  user_id: string;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();
  const { oneSignalUser, requestPermission, unsubscribe } = useOneSignalNotifications();

  const fetchNotifications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // Check if we have cached notifications and they're not stale
      const cachedNotifications = notificationsStorage.getNotifications();
      const shouldRefetch = notificationsStorage.shouldRefetch(30000); // 30 seconds cache
      
      if (cachedNotifications.length > 0 && !shouldRefetch && !showLoading) {
        console.log('Using cached notifications data');
        setNotifications(cachedNotifications);
        setUnreadCount(cachedNotifications.filter(n => !n.read).length);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUser(user);

      // Fetch notifications from database
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        // Create some sample notifications if none exist
        await createSampleNotifications(user.id);
        // Try fetching again
        const { data: retryData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(50);
        
        setNotifications(retryData || []);
        setUnreadCount(retryData?.filter(n => !n.read).length || 0);
        
        // Cache the notifications
        notificationsStorage.setNotifications(retryData || []);
        notificationsStorage.setUnreadCount(retryData?.filter(n => !n.read).length || 0);
        notificationsStorage.setLastFetchTime();
      } else {
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);
        
        // Cache the notifications
        notificationsStorage.setNotifications(data || []);
        notificationsStorage.setUnreadCount(data?.filter(n => !n.read).length || 0);
        notificationsStorage.setLastFetchTime();
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const createSampleNotifications = async (userId: string) => {
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
      
      const sampleNotifications = [
        {
          user_id: userId,
          type: 'system',
          content: "💡 Don't like the pixel font? No problem! Visit your Profile section to change themes and customize fonts & colors to your preference.",
          read: false
        },
        {
          user_id: userId,
          type: 'system',
          content: "Follow SocialChat on LinkedIn for the latest updates and features!",
          read: false
        },
        {
          user_id: userId,
          type: 'like',
          content: 'Owais liked your post',
          read: false
        },
        {
          user_id: userId,
          type: 'comment',
          content: 'raafi jamal commented on your post',
          read: false
        },
        {
          user_id: userId,
          type: 'like',
          content: 'Roohi Fida liked your post',
          read: false
        }
      ];

      for (const notification of sampleNotifications) {
        await supabase
          .from('notifications')
          .insert(notification);
      }
    } catch (error) {
      console.log('Sample notifications creation handled');
    }
  };

  const [unreadCount, setUnreadCount] = useState(0);

  const markAsRead = async (notificationId: string) => {
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
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update cache
      notificationsStorage.setNotifications(updatedNotifications);
      notificationsStorage.setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
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
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      // Update cache
      notificationsStorage.setNotifications(updatedNotifications);
      notificationsStorage.setUnreadCount(0);

      toast({
        title: 'All notifications marked as read',
        description: 'Your notifications have been updated',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark all notifications as read'
      });
    }
  };

  const clearAllNotifications = async () => {
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

      setNotifications([]);
      setUnreadCount(0);
      setShowClearDialog(false);
      
      // Update cache
      notificationsStorage.setNotifications([]);
      notificationsStorage.setUnreadCount(0);

      toast({
        title: 'All notifications cleared',
        description: 'Your notifications have been cleared',
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear notifications'
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
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
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      
      // Update unread count if needed
      const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Update cache
      notificationsStorage.setNotifications(updatedNotifications);
      notificationsStorage.setUnreadCount(wasUnread ? Math.max(0, unreadCount - 1) : unreadCount);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationToggle = async () => {
    if (oneSignalUser.subscribed) {
      await unsubscribe();
    } else {
      await requestPermission();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="h-4 w-4 text-social-blue" />;
      case 'friend_accepted':
        return <User className="h-4 w-4 text-social-green" />;
      case 'friend_rejected':
        return <UserX className="h-4 w-4 text-destructive" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-social-green" />;
      case 'like':
        return <Heart className="h-4 w-4 text-social-magenta" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-social-purple" />;
      case 'system':
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'friend_request':
        return 'border-l-social-blue bg-social-blue/5';
      case 'friend_accepted':
        return 'border-l-social-green bg-social-green/5';
      case 'friend_rejected':
        return 'border-l-destructive bg-destructive/5';
      case 'message':
        return 'border-l-social-green bg-social-green/5';
      case 'like':
        return 'border-l-social-magenta bg-social-magenta/5';
      case 'comment':
        return 'border-l-social-purple bg-social-purple/5';
      case 'system':
        return 'border-l-blue-500 bg-blue-50 animate-pulse';
      default:
        return 'border-l-muted-foreground bg-muted/5';
    }
  };

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial fetch
    fetchNotifications();

    // Silent background sync every 30 seconds
    const syncInterval = setInterval(() => {
      if (isOnline) {
        fetchNotifications(false);
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [isOnline]);

  useEffect(() => {
    if (currentUser) {
      // Set up real-time subscription for notifications
      const notificationsChannel = supabase
        .channel('notifications-realtime')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${currentUser.id}`
          }, 
          (payload) => {
            console.log('Notification change detected:', payload);
            if (payload.eventType === 'INSERT') {
              const newNotification = payload.new as Notification;
              
              // Update local state
              setNotifications(prev => [newNotification, ...prev]);
              if (!newNotification.read) {
                setUnreadCount(prev => prev + 1);
              }
              
              // Update cache
              const updatedNotifications = [newNotification, ...notifications];
              notificationsStorage.setNotifications(updatedNotifications);
              notificationsStorage.setUnreadCount(unreadCount + (newNotification.read ? 0 : 1));
              
              // Show browser notification if permission granted
              if (notificationPermission === 'granted') {
                new Notification('New Notification', {
                  body: newNotification.content,
                  icon: '/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png'
                });
              }
            } else {
              // Use background fetch to avoid loading indicators
              fetchNotifications(false);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsChannel);
      };
    }
  }, [currentUser, notificationPermission]);

  return (
    <>
      <SEO {...seoConfig.notifications} />
      <DashboardLayout>
        <div className="max-w-2xl mx-auto relative h-[calc(100vh-60px)] animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-6 w-6 text-primary" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center animate-pulse"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
                {/* Connection status indicator */}
                <div className="absolute -bottom-1 -right-1">
                  {isOnline ? (
                    <Wifi className="w-3 h-3 text-social-green" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-destructive" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="font-pixelated text-lg font-medium">Notifications</h1>
                <p className="font-pixelated text-xs text-muted-foreground">
                  {notifications.length} total • {unreadCount} unread • {isOnline ? 'Online' : 'Offline'}
                  {oneSignalUser.subscribed && ' • Push enabled'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowInfo(true)}
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full hover-scale"
              >
                <Info className="h-4 w-4" />
              </Button>
              
              {notifications.length > 0 && (
                <>
                  {unreadCount > 0 && (
                    <Button
                      onClick={markAllAsRead}
                      size="sm"
                      className="bg-social-green hover:bg-social-light-green text-white font-pixelated text-xs h-8 hover-scale"
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark All Read
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowClearDialog(true)}
                    size="sm"
                    variant="destructive"
                    className="font-pixelated text-xs h-8 hover-scale"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* OneSignal Notification Banner */}
          {showNotificationBanner && !oneSignalUser.subscribed && (
            <OneSignalNotificationBanner onDismiss={() => setShowNotificationBanner(false)} />
          )}

          {/* Push Notification Status */}
          {oneSignalUser.subscribed && (
            <div className="mx-4 mt-4 p-3 bg-social-green/10 border border-social-green/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-social-green" />
                  <div>
                    <p className="font-pixelated text-xs font-medium text-social-green">Push Notifications Active</p>
                    <p className="font-pixelated text-xs text-muted-foreground">You'll receive notifications even when SocialChat is closed</p>
                  </div>
                </div>
                <Button
                  onClick={handleNotificationToggle}
                  size="sm"
                  variant="outline"
                  className="font-pixelated text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Manage
                </Button>
              </div>
            </div>
          )}

          {/* Theme Customization Highlight */}
          <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-400 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <Palette className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-pixelated text-sm font-medium text-blue-800">
                  Customize Your Experience
                </p>
                <p className="font-pixelated text-xs text-blue-700 mt-1 leading-relaxed">
                  Don't like the pixel font? Visit your Profile section to change themes and customize fonts & colors to your preference!
                </p>
                <Button
                  onClick={() => window.location.href = '/profile'}
                  size="sm"
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-pixelated text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Change Theme
                </Button>
              </div>
            </div>
          </div>
          
          {/* LinkedIn Follow Notification */}
          <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <Linkedin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-pixelated text-sm font-medium text-blue-800">
                  Follow SocialChat
                </p>
                <p className="font-pixelated text-xs text-blue-700 mt-1 leading-relaxed">
                  Stay updated with the latest features and announcements by following SocialChat on LinkedIn!
                </p>
                <a 
                  href="https://www.linkedin.com/company/socialchatmz/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-pixelated"
                >
                  <Linkedin className="h-3 w-3" />
                  Follow on LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="h-[calc(100vh-240px)] p-4 scroll-container scroll-smooth">
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md hover-scale border-l-4 ${
                      !notification.read 
                        ? `${getNotificationColor(notification.type)} shadow-sm` 
                        : 'border-l-muted bg-background'
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-pixelated text-sm leading-relaxed ${
                            !notification.read ? 'font-medium text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.content}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="font-pixelated text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                            {!notification.read && (
                              <Badge variant="secondary" className="h-4 px-1 text-xs font-pixelated">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 hover:bg-social-green/10"
                            >
                              <Check className="h-3 w-3 text-social-green" />
                            </Button>
                          )}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 hover:bg-destructive/10"
                          >
                            <X className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="relative mb-6">
                  <Bell className="h-20 w-20 text-muted-foreground opacity-50" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-social-green rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
                <h2 className="font-pixelated text-lg font-medium mb-2">All caught up!</h2>
                <p className="font-pixelated text-sm text-muted-foreground max-w-sm leading-relaxed">
                  You don't have any notifications right now. When you receive friend requests, messages, likes, or comments, they'll appear here.
                </p>
                {!oneSignalUser.subscribed && (
                  <Button
                    onClick={requestPermission}
                    className="mt-4 bg-social-green hover:bg-social-light-green text-white font-pixelated text-xs"
                  >
                    Enable Push Notifications
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Info Dialog */}
          <Dialog open={showInfo} onOpenChange={setShowInfo}>
            <DialogContent className="max-w-md mx-auto animate-in zoom-in-95 duration-200">
              <DialogHeader>
                <DialogTitle className="font-pixelated text-lg social-gradient bg-clip-text text-transparent flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Push Notifications
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-social-green/10 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-social-green" />
                    <div>
                      <p className="font-pixelated text-xs font-medium">Messages</p>
                      <p className="font-pixelated text-xs text-muted-foreground">New direct messages from friends</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-social-blue/10 rounded-lg">
                    <UserPlus className="h-4 w-4 text-social-blue" />
                    <div>
                      <p className="font-pixelated text-xs font-medium">Friend Requests</p>
                      <p className="font-pixelated text-xs text-muted-foreground">New friend requests and responses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-social-magenta/10 rounded-lg">
                    <Heart className="h-4 w-4 text-social-magenta" />
                    <div>
                      <p className="font-pixelated text-xs font-medium">Likes & Comments</p>
                      <p className="font-pixelated text-xs text-muted-foreground">Interactions on your posts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-pixelated text-xs font-medium">Theme Customization</p>
                      <p className="font-pixelated text-xs text-muted-foreground">Change fonts, colors, and visual style in Profile</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Linkedin className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-pixelated text-xs font-medium">Social Updates</p>
                      <p className="font-pixelated text-xs text-muted-foreground">Follow SocialChat on LinkedIn for the latest news</p>
                      <a 
                        href="https://www.linkedin.com/company/socialchatmz/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-pixelated text-xs text-blue-600 hover:underline mt-1"
                      >
                        <Linkedin className="h-3 w-3" />
                        Follow SocialChat
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="font-pixelated text-xs text-muted-foreground leading-relaxed">
                    <strong>OneSignal Push Notifications:</strong> Get instant alerts on all devices and browsers, including macOS Safari!
                  </p>
                </div>
                
                <Button 
                  onClick={() => setShowInfo(false)}
                  className="w-full bg-social-green hover:bg-social-light-green text-white font-pixelated text-xs hover-scale"
                >
                  Got it!
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Clear All Confirmation Dialog */}
          <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <AlertDialogContent className="max-w-md mx-auto animate-in zoom-in-95 duration-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-pixelated text-sm flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  Clear All Notifications
                </AlertDialogTitle>
                <AlertDialogDescription className="font-pixelated text-xs">
                  Are you sure you want to clear all notifications? This action cannot be undone and will remove all {notifications.length} notifications from your list.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-pixelated text-xs">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearAllNotifications}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-pixelated text-xs"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </>
  );
}

export default Notifications;