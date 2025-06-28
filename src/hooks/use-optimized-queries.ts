import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCachedData, setCachedData, STORAGE_KEYS } from '@/lib/local-storage';

export function useOptimizedQueries() {
  // Optimized feed fetching with reduced database load and local caching
  const fetchOptimizedFeed = useCallback(async (limit = 20, offset = 0) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Try to get from cache first
      const cachedPosts = getCachedData(STORAGE_KEYS.POSTS);
      if (cachedPosts.length > 0 && offset === 0) {
        // Only use cache for first page
        return cachedPosts;
      }

      const { data, error } = await supabase.rpc('get_user_feed', {
        user_uuid: user.id,
        feed_limit: limit,
        feed_offset: offset
      });

      if (error) throw error;
      
      // Cache the results if it's the first page
      if (data && data.length > 0 && offset === 0) {
        setCachedData(STORAGE_KEYS.POSTS, data, 5 * 60 * 1000); // 5 minutes cache
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching optimized feed:', error);
      return [];
    }
  }, []);

  // Optimized like toggle with batch operations
  const toggleLikeOptimized = useCallback(async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc('toggle_post_like', {
        post_uuid: postId,
        user_uuid: user.id
      });

      if (error) throw error;
      
      // Update cache
      const cachedPosts = getCachedData(STORAGE_KEYS.POSTS);
      if (cachedPosts.length > 0) {
        const updatedCache = cachedPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked: data?.[0]?.liked || false,
              likes_count: data?.[0]?.likes_count || post.likes_count
            };
          }
          return post;
        });
        
        setCachedData(STORAGE_KEYS.POSTS, updatedCache, 5 * 60 * 1000);
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error toggling like:', error);
      return null;
    }
  }, []);

  // Optimized friend suggestions with caching
  const getFriendSuggestions = useCallback(async (limit = 10) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_friend_suggestions', {
        user_uuid: user.id,
        suggestion_limit: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
      return [];
    }
  }, []);

  // Batch notification creation
  const createNotificationsBatch = useCallback(async (notifications: any[]) => {
    try {
      const { error } = await supabase.rpc('create_notification_batch', {
        notifications_data: notifications
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating notifications batch:', error);
      return false;
    }
  }, []);

  // Optimized story fetching with view tracking and caching
  const fetchStoriesOptimized = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          id,
          user_id,
          image_url,
          photo_urls,
          created_at,
          expires_at,
          views_count,
          profiles:user_id (
            name,
            username,
            avatar
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching optimized stories:', error);
      return [];
    }
  }, []);

  // Optimized message fetching with pagination and caching
  const fetchMessagesOptimized = useCallback(async (friendId: string, limit = 50, offset = 0) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Try to get from cache first for initial load
      if (offset === 0) {
        const cachedMessages = getCachedData(STORAGE_KEYS.MESSAGES);
        const filteredMessages = cachedMessages.filter(msg => 
          (msg.sender_id === user.id && msg.receiver_id === friendId) || 
          (msg.sender_id === friendId && msg.receiver_id === user.id)
        );
        
        if (filteredMessages.length > 0) {
          return filteredMessages;
        }
      }

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read,
          profiles!messages_sender_id_fkey(name, avatar)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      // Cache messages if it's the initial load
      if (data && data.length > 0 && offset === 0) {
        setCachedData(STORAGE_KEYS.MESSAGES, data, 1 * 60 * 1000); // 1 minute cache
      }
      
      return (data || []).reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error fetching optimized messages:', error);
      return [];
    }
  }, []);

  // Optimized group messages fetching
  const fetchGroupMessagesOptimized = useCallback(async (groupId: string, limit = 50, offset = 0) => {
    try {
      const { data, error } = await supabase.rpc('get_group_messages_with_profiles', {
        group_uuid: groupId,
        limit_count: limit,
        offset_count: offset
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching optimized group messages:', error);
      return [];
    }
  }, []);

  // Optimized group members fetching
  const fetchGroupMembersOptimized = useCallback(async (groupId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_group_members_with_profiles', {
        group_uuid: groupId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching optimized group members:', error);
      return [];
    }
  }, []);

  return {
    fetchOptimizedFeed,
    toggleLikeOptimized,
    getFriendSuggestions,
    createNotificationsBatch,
    fetchStoriesOptimized,
    fetchMessagesOptimized,
    fetchGroupMessagesOptimized,
    fetchGroupMembersOptimized
  };
}