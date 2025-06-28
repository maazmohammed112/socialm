import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Zap, 
  Sparkles, 
  Star, 
  Shield, 
  Users, 
  UserPlus, 
  Settings, 
  Plus, 
  Send, 
  Image as ImageIcon,
  X,
  Info,
  Search,
  UserCheck,
  Clock,
  Lock,
  Unlock,
  Edit,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getCachedData, setCachedData, STORAGE_KEYS, CachedGroup } from '@/lib/local-storage';

interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  max_members: number;
}

interface GroupMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  name: string;
  username: string;
  avatar: string | null;
}

interface GroupMessage {
  id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender_name: string;
  sender_username: string;
  sender_avatar: string | null;
}

interface GroupJoinRequest {
  id: string;
  user_id: string;
  status: string;
  message: string;
  created_at: string;
  name: string;
  username: string;
  avatar: string | null;
}

export function Vortex() {
  const [loading, setLoading] = useState(true);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    avatar: '',
    is_private: true
  });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinRequestDialog, setShowJoinRequestDialog] = useState(false);
  const [joinRequestMessage, setJoinRequestMessage] = useState('');
  const [sendingJoinRequest, setSendingJoinRequest] = useState(false);
  const [selectedGroupForJoin, setSelectedGroupForJoin] = useState<Group | null>(null);
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMyGroups();
      fetchSuggestedGroups();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers(selectedGroup.id);
      fetchGroupMessages(selectedGroup.id);
      fetchJoinRequests(selectedGroup.id);
      
      // Set up real-time subscription for messages
      const messagesChannel = supabase
        .channel(`group-messages-${selectedGroup.id}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'group_messages',
            filter: `group_id=eq.${selectedGroup.id}`
          }, 
          (payload) => {
            console.log('New group message:', payload);
            fetchGroupMessages(selectedGroup.id);
          }
        )
        .subscribe();
        
      // Set up real-time subscription for join requests
      const requestsChannel = supabase
        .channel(`group-requests-${selectedGroup.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'group_join_requests',
            filter: `group_id=eq.${selectedGroup.id}`
          }, 
          (payload) => {
            console.log('Group join request change:', payload);
            fetchJoinRequests(selectedGroup.id);
          }
        )
        .subscribe();
        
      // Set up real-time subscription for members
      const membersChannel = supabase
        .channel(`group-members-${selectedGroup.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'group_members',
            filter: `group_id=eq.${selectedGroup.id}`
          }, 
          (payload) => {
            console.log('Group members change:', payload);
            fetchGroupMembers(selectedGroup.id);
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(requestsChannel);
        supabase.removeChannel(membersChannel);
      };
    }
  }, [selectedGroup]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [groupMessages]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        setCurrentUser({ ...user, ...profile });
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      
      // Try to get from cache first
      const cachedGroups = getCachedData<CachedGroup>(STORAGE_KEYS.GROUPS);
      if (cachedGroups.length > 0) {
        // Filter to only include groups the user is a member of
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', currentUser.id);
          
        if (memberships) {
          const myGroupIds = new Set(memberships.map(m => m.group_id));
          const filteredGroups = cachedGroups.filter(group => myGroupIds.has(group.id));
          
          if (filteredGroups.length > 0) {
            setMyGroups(filteredGroups);
            setLoading(false);
            return;
          }
        }
      }
      
      // If cache miss or empty, fetch from database
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        // Cache all groups
        setCachedData(STORAGE_KEYS.GROUPS, data, 10 * 60 * 1000); // 10 minutes
        
        // Filter to only include groups the user is a member of
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', currentUser.id);
          
        if (memberships) {
          const myGroupIds = new Set(memberships.map(m => m.group_id));
          const filteredGroups = data.filter(group => myGroupIds.has(group.id));
          setMyGroups(filteredGroups);
        } else {
          setMyGroups([]);
        }
      }
    } catch (error) {
      console.error('Error fetching my groups:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load your groups'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedGroups = async () => {
    try {
      const { data, error } = await supabase.rpc('get_group_suggestions', {
        user_uuid: currentUser.id,
        limit_count: 10
      });
      
      if (error) throw error;
      
      setSuggestedGroups(data || []);
    } catch (error) {
      console.error('Error fetching suggested groups:', error);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_group_members_with_profiles', {
        group_uuid: groupId
      });
      
      if (error) throw error;
      
      setGroupMembers(data || []);
      
      // Check if current user is an admin
      const isUserAdmin = data?.some(member => 
        member.user_id === currentUser.id && member.role === 'admin'
      );
      
      setIsAdmin(isUserAdmin || false);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const fetchGroupMessages = async (groupId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_group_messages_with_profiles', {
        group_uuid: groupId,
        limit_count: 100,
        offset_count: 0
      });
      
      if (error) throw error;
      
      setGroupMessages(data || []);
    } catch (error) {
      console.error('Error fetching group messages:', error);
    }
  };

  const fetchJoinRequests = async (groupId: string) => {
    try {
      // Only fetch if user is an admin
      const { data: memberData } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id)
        .single();
        
      if (memberData?.role !== 'admin') {
        setJoinRequests([]);
        return;
      }
      
      const { data, error } = await supabase.rpc('get_group_join_requests_with_profiles', {
        group_uuid: groupId
      });
      
      if (error) throw error;
      
      setJoinRequests(data || []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      setJoinRequests([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      
      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: selectedGroup.id,
          sender_id: currentUser.id,
          content: newMessage.trim(),
          message_type: 'text'
        })
        .select();
        
      if (error) throw error;
      
      setNewMessage('');
      
      // Optimistically add message to UI
      if (data && data[0]) {
        const newMsg = {
          ...data[0],
          sender_name: currentUser.name,
          sender_username: currentUser.username,
          sender_avatar: currentUser.avatar
        };
        
        setGroupMessages(prev => [...prev, newMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message'
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.name.trim() || creatingGroup) return;
    
    try {
      setCreatingGroup(true);
      
      const { data, error } = await supabase.rpc('create_group_with_admin', {
        p_name: newGroupData.name.trim(),
        p_description: newGroupData.description.trim(),
        p_avatar: newGroupData.avatar.trim(),
        p_is_private: newGroupData.is_private,
        p_creator_id: currentUser.id
      });
      
      if (error) throw error;
      
      toast({
        title: 'Group created!',
        description: 'Your new group has been created successfully'
      });
      
      setShowCreateGroupDialog(false);
      setNewGroupData({
        name: '',
        description: '',
        avatar: '',
        is_private: true
      });
      
      // Refresh groups
      fetchMyGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create group'
      });
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!selectedGroupForJoin || sendingJoinRequest) return;
    
    try {
      setSendingJoinRequest(true);
      
      const { error } = await supabase
        .from('group_join_requests')
        .insert({
          group_id: selectedGroupForJoin.id,
          user_id: currentUser.id,
          message: joinRequestMessage.trim(),
          status: 'pending'
        });
        
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            variant: 'destructive',
            title: 'Request already sent',
            description: 'You have already requested to join this group'
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Request sent!',
          description: 'Your request to join the group has been sent'
        });
        
        setShowJoinRequestDialog(false);
        setJoinRequestMessage('');
        setSelectedGroupForJoin(null);
        
        // Refresh suggested groups
        fetchSuggestedGroups();
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send join request'
      });
    } finally {
      setSendingJoinRequest(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc('approve_group_join_request', {
        request_uuid: requestId,
        admin_uuid: currentUser.id
      });
      
      if (error) throw error;
      
      if (data) {
        toast({
          title: 'Request approved',
          description: 'The user has been added to the group'
        });
        
        // Refresh join requests and members
        if (selectedGroup) {
          fetchJoinRequests(selectedGroup.id);
          fetchGroupMembers(selectedGroup.id);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to approve request'
        });
      }
    } catch (error) {
      console.error('Error approving join request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve request'
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc('reject_group_join_request', {
        request_uuid: requestId,
        admin_uuid: currentUser.id
      });
      
      if (error) throw error;
      
      if (data) {
        toast({
          title: 'Request rejected',
          description: 'The join request has been rejected'
        });
        
        // Refresh join requests
        if (selectedGroup) {
          fetchJoinRequests(selectedGroup.id);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to reject request'
        });
      }
    } catch (error) {
      console.error('Error rejecting join request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject request'
      });
    }
  };

  const filteredMyGroups = myGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggestedGroups = suggestedGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto h-[calc(100vh-60px)] bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex h-full">
          {/* Groups List */}
          <div className={`w-full md:w-80 border-r flex flex-col ${selectedGroup ? 'hidden md:flex' : ''}`}>
            {/* Header */}
            <div className="p-3 border-b bg-muted/30 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-pixelated text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-social-green" />
                  Vortex Groups
                </h2>
                <Button
                  onClick={() => setShowCreateGroupDialog(true)}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full bg-social-green hover:bg-social-light-green text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 font-pixelated text-xs"
                />
              </div>
            </div>

            {/* Groups List */}
            <Tabs defaultValue="my-groups" className="flex-1 flex flex-col">
              <TabsList className="mx-3 mt-3 grid grid-cols-2">
                <TabsTrigger value="my-groups" className="font-pixelated text-xs">
                  My Groups
                </TabsTrigger>
                <TabsTrigger value="suggested" className="font-pixelated text-xs">
                  Suggested
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="my-groups" className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2">
                    {loading ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="p-3 border rounded-lg animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted"></div>
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-24 bg-muted rounded"></div>
                              <div className="h-3 w-32 bg-muted rounded"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : filteredMyGroups.length > 0 ? (
                      filteredMyGroups.map(group => (
                        <div 
                          key={group.id}
                          onClick={() => setSelectedGroup(group)}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors hover-scale"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              {group.avatar ? (
                                <AvatarImage src={group.avatar} alt={group.name} />
                              ) : (
                                <AvatarFallback className="bg-social-green text-white font-pixelated">
                                  {group.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <h3 className="font-pixelated text-sm font-medium truncate">{group.name}</h3>
                                {group.is_private && (
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                              <p className="font-pixelated text-xs text-muted-foreground truncate">
                                {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="font-pixelated text-sm font-medium">No groups yet</p>
                        <p className="font-pixelated text-xs text-muted-foreground mt-1 mb-4">
                          Create a new group or join existing ones
                        </p>
                        <Button
                          onClick={() => setShowCreateGroupDialog(true)}
                          size="sm"
                          className="bg-social-green hover:bg-social-light-green text-white font-pixelated text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create Group
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="suggested" className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2">
                    {loading ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="p-3 border rounded-lg animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted"></div>
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-24 bg-muted rounded"></div>
                              <div className="h-3 w-32 bg-muted rounded"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : filteredSuggestedGroups.length > 0 ? (
                      filteredSuggestedGroups.map(group => (
                        <div 
                          key={group.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors hover-scale"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              {group.avatar ? (
                                <AvatarImage src={group.avatar} alt={group.name} />
                              ) : (
                                <AvatarFallback className="bg-social-blue text-white font-pixelated">
                                  {group.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <h3 className="font-pixelated text-sm font-medium truncate">{group.name}</h3>
                                {group.is_private && (
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <p className="font-pixelated text-xs text-muted-foreground truncate">
                                  {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                                </p>
                                {group.mutual_members > 0 && (
                                  <Badge variant="outline" className="h-4 px-1 text-xs font-pixelated">
                                    {group.mutual_members} mutual
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={() => {
                                setSelectedGroupForJoin(group);
                                setShowJoinRequestDialog(true);
                              }}
                              size="sm"
                              className="bg-social-blue hover:bg-social-blue/90 text-white font-pixelated text-xs h-7"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Join
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="font-pixelated text-sm font-medium">No suggested groups</p>
                        <p className="font-pixelated text-xs text-muted-foreground mt-1">
                          Connect with more friends to see group suggestions
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Group Chat Area */}
          <div className={`flex-1 flex flex-col h-full ${!selectedGroup ? 'hidden md:flex' : ''}`}>
            {selectedGroup ? (
              <>
                {/* Group Header */}
                <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedGroup(null)}
                      className="md:hidden h-8 w-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-8 w-8">
                      {selectedGroup.avatar ? (
                        <AvatarImage src={selectedGroup.avatar} alt={selectedGroup.name} />
                      ) : (
                        <AvatarFallback className="bg-social-green text-white font-pixelated">
                          {selectedGroup.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <h3 className="font-pixelated text-sm font-medium">{selectedGroup.name}</h3>
                        {selectedGroup.is_private && (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="font-pixelated text-xs text-muted-foreground">
                        {selectedGroup.member_count} {selectedGroup.member_count === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isAdmin && joinRequests.length > 0 && (
                      <Badge variant="destructive" className="h-5 px-2 text-xs font-pixelated">
                        {joinRequests.length} {joinRequests.length === 1 ? 'request' : 'requests'}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        // Toggle members view
                      }}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Group Content */}
                <div className="flex-1 flex">
                  {/* Messages Area */}
                  <div className="flex-1 flex flex-col">
                    <ScrollArea className="flex-1 p-3">
                      {groupMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                          <h3 className="font-pixelated text-sm font-medium mb-2">No messages yet</h3>
                          <p className="font-pixelated text-xs text-muted-foreground max-w-xs">
                            Be the first to send a message in this group!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {groupMessages.map(message => {
                            const isCurrentUser = message.sender_id === currentUser.id;
                            
                            return (
                              <div 
                                key={message.id}
                                className={`flex gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                              >
                                {!isCurrentUser && (
                                  <Avatar className="h-6 w-6 mt-1">
                                    {message.sender_avatar ? (
                                      <AvatarImage src={message.sender_avatar} alt={message.sender_name} />
                                    ) : (
                                      <AvatarFallback className="bg-social-green text-white font-pixelated text-xs">
                                        {message.sender_name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                )}
                                
                                <div className={`max-w-[75%] ${isCurrentUser ? 'bg-social-green text-white' : 'bg-muted'} p-2 rounded-lg`}>
                                  {!isCurrentUser && (
                                    <p className="font-pixelated text-xs font-medium mb-1">
                                      {message.sender_name}
                                    </p>
                                  )}
                                  <p className="font-pixelated text-xs break-words">
                                    {message.content}
                                  </p>
                                  <p className="font-pixelated text-xs opacity-70 mt-1 text-right">
                                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                    
                    {/* Message Input */}
                    <div className="p-3 border-t">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 min-h-[60px] max-h-[120px] font-pixelated text-xs resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sendingMessage}
                          className="self-end bg-social-green hover:bg-social-light-green text-white"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-pixelated text-xs text-muted-foreground mt-1">
                        Press Enter to send, Shift + Enter for new line
                      </p>
                    </div>
                  </div>
                  
                  {/* Members Sidebar - Hidden on mobile */}
                  <div className="w-64 border-l hidden lg:block">
                    <div className="p-3 border-b">
                      <h3 className="font-pixelated text-sm font-medium">Members ({groupMembers.length})</h3>
                    </div>
                    
                    <ScrollArea className="h-[calc(100%-49px)]">
                      <div className="p-3 space-y-3">
                        {/* Admin Section */}
                        <div>
                          <h4 className="font-pixelated text-xs text-muted-foreground mb-2">Admins</h4>
                          {groupMembers
                            .filter(member => member.role === 'admin')
                            .map(admin => (
                              <div key={admin.id} className="flex items-center gap-2 mb-2">
                                <Avatar className="h-6 w-6">
                                  {admin.avatar ? (
                                    <AvatarImage src={admin.avatar} alt={admin.name} />
                                  ) : (
                                    <AvatarFallback className="bg-social-green text-white font-pixelated text-xs">
                                      {admin.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-pixelated text-xs font-medium truncate">{admin.name}</p>
                                  <p className="font-pixelated text-xs text-muted-foreground truncate">@{admin.username}</p>
                                </div>
                                <Shield className="h-3 w-3 text-social-green" />
                              </div>
                            ))}
                        </div>
                        
                        {/* Members Section */}
                        <div>
                          <h4 className="font-pixelated text-xs text-muted-foreground mb-2">Members</h4>
                          {groupMembers
                            .filter(member => member.role === 'member')
                            .map(member => (
                              <div key={member.id} className="flex items-center gap-2 mb-2">
                                <Avatar className="h-6 w-6">
                                  {member.avatar ? (
                                    <AvatarImage src={member.avatar} alt={member.name} />
                                  ) : (
                                    <AvatarFallback className="bg-muted-foreground text-white font-pixelated text-xs">
                                      {member.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-pixelated text-xs font-medium truncate">{member.name}</p>
                                  <p className="font-pixelated text-xs text-muted-foreground truncate">@{member.username}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                        
                        {/* Join Requests Section - Only visible to admins */}
                        {isAdmin && joinRequests.length > 0 && (
                          <div>
                            <h4 className="font-pixelated text-xs text-muted-foreground mb-2">
                              Join Requests ({joinRequests.length})
                            </h4>
                            {joinRequests.map(request => (
                              <div key={request.id} className="border rounded-lg p-2 mb-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="h-6 w-6">
                                    {request.avatar ? (
                                      <AvatarImage src={request.avatar} alt={request.name} />
                                    ) : (
                                      <AvatarFallback className="bg-muted-foreground text-white font-pixelated text-xs">
                                        {request.name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-pixelated text-xs font-medium truncate">{request.name}</p>
                                    <p className="font-pixelated text-xs text-muted-foreground truncate">@{request.username}</p>
                                  </div>
                                </div>
                                
                                {request.message && (
                                  <p className="font-pixelated text-xs mb-2 bg-muted/50 p-1 rounded">
                                    "{request.message}"
                                  </p>
                                )}
                                
                                <div className="flex gap-1">
                                  <Button
                                    onClick={() => handleApproveRequest(request.id)}
                                    size="sm"
                                    className="h-6 w-full bg-social-green hover:bg-social-light-green text-white font-pixelated text-xs"
                                  >
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    onClick={() => handleRejectRequest(request.id)}
                                    size="sm"
                                    variant="outline"
                                    className="h-6 w-full font-pixelated text-xs"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Zap className="h-16 w-16 text-social-green mb-4" />
                <h2 className="text-lg font-semibold mb-2 font-pixelated">Vortex Group Chat</h2>
                <p className="text-muted-foreground font-pixelated text-sm max-w-md mb-6">
                  Create private groups, share media, and collaborate with friends in real-time.
                  Select a group to start chatting or create a new one!
                </p>
                <Button
                  onClick={() => setShowCreateGroupDialog(true)}
                  className="bg-social-green hover:bg-social-light-green text-white font-pixelated"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Group
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-pixelated text-lg">Create New Group</DialogTitle>
            <DialogDescription className="font-pixelated text-sm">
              Create a group to chat with friends and collaborate in real-time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="font-pixelated text-sm">Group Name</label>
              <Input
                placeholder="Enter group name"
                value={newGroupData.name}
                onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                className="font-pixelated text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-pixelated text-sm">Description</label>
              <Textarea
                placeholder="Enter group description"
                value={newGroupData.description}
                onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                className="font-pixelated text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-pixelated text-sm">Avatar URL (optional)</label>
              <Input
                placeholder="Enter avatar URL"
                value={newGroupData.avatar}
                onChange={(e) => setNewGroupData({ ...newGroupData, avatar: e.target.value })}
                className="font-pixelated text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={newGroupData.is_private ? "default" : "outline"}
                size="sm"
                className="flex-1 font-pixelated text-xs"
                onClick={() => setNewGroupData({ ...newGroupData, is_private: true })}
              >
                <Lock className="h-3 w-3 mr-1" />
                Private
              </Button>
              <Button
                type="button"
                variant={!newGroupData.is_private ? "default" : "outline"}
                size="sm"
                className="flex-1 font-pixelated text-xs"
                onClick={() => setNewGroupData({ ...newGroupData, is_private: false })}
              >
                <Unlock className="h-3 w-3 mr-1" />
                Public
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateGroupDialog(false)}
              className="font-pixelated text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupData.name.trim() || creatingGroup}
              className="bg-social-green hover:bg-social-light-green text-white font-pixelated text-sm"
            >
              {creatingGroup ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Request Dialog */}
      <Dialog open={showJoinRequestDialog} onOpenChange={setShowJoinRequestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-pixelated text-lg">Join Group</DialogTitle>
            <DialogDescription className="font-pixelated text-sm">
              Send a request to join {selectedGroupForJoin?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {selectedGroupForJoin?.avatar ? (
                  <AvatarImage src={selectedGroupForJoin.avatar} alt={selectedGroupForJoin.name} />
                ) : (
                  <AvatarFallback className="bg-social-blue text-white font-pixelated">
                    {selectedGroupForJoin?.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-pixelated text-sm font-medium">{selectedGroupForJoin?.name}</h3>
                <p className="font-pixelated text-xs text-muted-foreground">
                  {selectedGroupForJoin?.member_count} {selectedGroupForJoin?.member_count === 1 ? 'member' : 'members'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="font-pixelated text-sm">Message (optional)</label>
              <Textarea
                placeholder="Why do you want to join this group?"
                value={joinRequestMessage}
                onChange={(e) => setJoinRequestMessage(e.target.value)}
                className="font-pixelated text-sm"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowJoinRequestDialog(false);
                setJoinRequestMessage('');
                setSelectedGroupForJoin(null);
              }}
              className="font-pixelated text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinRequest}
              disabled={sendingJoinRequest}
              className="bg-social-blue hover:bg-social-blue/90 text-white font-pixelated text-sm"
            >
              {sendingJoinRequest ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default Vortex;