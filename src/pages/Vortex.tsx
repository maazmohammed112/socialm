import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Zap, 
  Sparkles, 
  Star, 
  Shield, 
  Users, 
  Plus, 
  Search, 
  UserPlus, 
  Settings, 
  Send, 
  Image as ImageIcon,
  X,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SEO, seoConfig } from '@/utils/seo';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

export function Vortex() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    avatar: '',
    is_private: true
  });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch current user
  useEffect(() => {
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
    
    fetchCurrentUser();
  }, []);

  // Fetch user's groups
  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        const { data: memberships, error: membershipError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', currentUser.id);
          
        if (membershipError) throw membershipError;
        
        if (memberships && memberships.length > 0) {
          const groupIds = memberships.map(m => m.group_id);
          
          const { data: groups, error: groupsError } = await supabase
            .from('groups')
            .select('*')
            .in('id', groupIds)
            .order('updated_at', { ascending: false });
            
          if (groupsError) throw groupsError;
          
          setUserGroups(groups || []);
        } else {
          setUserGroups([]);
        }
        
        // Fetch suggested groups
        const { data: suggested } = await supabase.rpc('get_group_suggestions', {
          user_uuid: currentUser.id,
          limit_count: 5
        });
        
        setSuggestedGroups(suggested || []);
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load your groups'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchUserGroups();
    }
  }, [currentUser, toast]);

  // Fetch group details when a group is selected
  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!selectedGroup || !currentUser) return;
      
      try {
        // Fetch group members
        const { data: members } = await supabase.rpc('get_group_members_with_profiles', {
          group_uuid: selectedGroup.id
        });
        
        setGroupMembers(members || []);
        
        // Fetch group messages
        const { data: messages } = await supabase.rpc('get_group_messages_with_profiles', {
          group_uuid: selectedGroup.id,
          limit_count: 50,
          offset_count: 0
        });
        
        setGroupMessages(messages || []);
        
        // Fetch join requests if user is admin
        const isAdmin = members?.some(m => m.user_id === currentUser.id && m.role === 'admin');
        
        if (isAdmin) {
          const { data: requests } = await supabase.rpc('get_group_join_requests_with_profiles', {
            group_uuid: selectedGroup.id
          });
          
          setJoinRequests(requests || []);
        } else {
          setJoinRequests([]);
        }
      } catch (error) {
        console.error('Error fetching group details:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load group details'
        });
      }
    };
    
    fetchGroupDetails();
    
    // Set up real-time subscription for messages
    if (selectedGroup) {
      const messagesChannel = supabase
        .channel(`group-messages-${selectedGroup.id}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'group_messages',
            filter: `group_id=eq.${selectedGroup.id}`
          }, 
          async (payload) => {
            console.log('New group message:', payload);
            
            // Fetch the complete message with sender details
            const { data } = await supabase.rpc('get_group_messages_with_profiles', {
              group_uuid: selectedGroup.id,
              limit_count: 1,
              offset_count: 0
            });
            
            if (data && data.length > 0) {
              setGroupMessages(prev => [...prev, data[0]]);
              
              // Scroll to bottom
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [selectedGroup, currentUser, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages]);

  const handleCreateGroup = async () => {
    if (!currentUser) return;
    
    try {
      setCreatingGroup(true);
      
      if (!newGroupData.name.trim()) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Group name is required'
        });
        return;
      }
      
      // Create group using RPC function
      const { data: groupId, error } = await supabase.rpc('create_group_with_admin', {
        p_name: newGroupData.name.trim(),
        p_description: newGroupData.description.trim(),
        p_avatar: newGroupData.avatar.trim() || null,
        p_is_private: newGroupData.is_private,
        p_creator_id: currentUser.id
      });
      
      if (error) throw error;
      
      // Fetch the newly created group
      const { data: newGroup } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
        
      if (newGroup) {
        setUserGroups(prev => [newGroup, ...prev]);
        setSelectedGroup(newGroup);
        setShowCreateGroupDialog(false);
        setNewGroupData({
          name: '',
          description: '',
          avatar: '',
          is_private: true
        });
        
        toast({
          title: 'Group created',
          description: 'Your group has been created successfully'
        });
      }
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || !currentUser || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: selectedGroup.id,
          sender_id: currentUser.id,
          content: newMessage.trim(),
          message_type: 'text'
        });
        
      if (error) throw error;
      
      setNewMessage('');
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

  const handleJoinGroup = async (groupId: string) => {
    if (!currentUser) return;
    
    try {
      setProcessingRequest(groupId);
      
      const { error } = await supabase
        .from('group_join_requests')
        .insert({
          group_id: groupId,
          user_id: currentUser.id,
          status: 'pending',
          message: 'I would like to join this group'
        });
        
      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Request already sent',
            description: 'You have already requested to join this group'
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Request sent',
          description: 'Your request to join the group has been sent'
        });
        
        // Remove from suggested groups
        setSuggestedGroups(prev => prev.filter(g => g.id !== groupId));
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send join request'
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!currentUser) return;
    
    try {
      setProcessingRequest(requestId);
      
      const { data: success, error } = await supabase.rpc('approve_group_join_request', {
        request_uuid: requestId,
        admin_uuid: currentUser.id
      });
      
      if (error) throw error;
      
      if (success) {
        toast({
          title: 'Request approved',
          description: 'The user has been added to the group'
        });
        
        // Refresh join requests
        const { data: requests } = await supabase.rpc('get_group_join_requests_with_profiles', {
          group_uuid: selectedGroup!.id
        });
        
        setJoinRequests(requests || []);
        
        // Refresh group members
        const { data: members } = await supabase.rpc('get_group_members_with_profiles', {
          group_uuid: selectedGroup!.id
        });
        
        setGroupMembers(members || []);
        
        // Update group member count
        if (selectedGroup) {
          setSelectedGroup({
            ...selectedGroup,
            member_count: selectedGroup.member_count + 1
          });
          
          // Update in user groups list
          setUserGroups(prev => 
            prev.map(g => 
              g.id === selectedGroup.id 
                ? { ...g, member_count: g.member_count + 1 } 
                : g
            )
          );
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to approve request'
        });
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve request'
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!currentUser) return;
    
    try {
      setProcessingRequest(requestId);
      
      const { data: success, error } = await supabase.rpc('reject_group_join_request', {
        request_uuid: requestId,
        admin_uuid: currentUser.id
      });
      
      if (error) throw error;
      
      if (success) {
        toast({
          title: 'Request rejected',
          description: 'The join request has been rejected'
        });
        
        // Refresh join requests
        const { data: requests } = await supabase.rpc('get_group_join_requests_with_profiles', {
          group_uuid: selectedGroup!.id
        });
        
        setJoinRequests(requests || []);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to reject request'
        });
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject request'
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const filteredGroups = userGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isGroupAdmin = selectedGroup && groupMembers.some(
    member => member.user_id === currentUser?.id && member.role === 'admin'
  );

  return (
    <>
      <SEO {...seoConfig.vortex} />
      <DashboardLayout>
        <div className="max-w-6xl mx-auto h-[calc(100vh-60px)] bg-background rounded-lg shadow-lg overflow-hidden">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className={`w-full md:w-80 border-r flex flex-col ${selectedGroup ? 'hidden md:flex' : ''}`}>
              {/* Header */}
              <div className="p-3 border-b bg-muted/30 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-pixelated text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-social-green" />
                    Vortex Groups
                  </h2>
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0 bg-social-green hover:bg-social-light-green text-white"
                    onClick={() => setShowCreateGroupDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="font-pixelated text-xs h-8 pl-8"
                  />
                  <Search className="h-4 w-4 absolute left-2 top-2 text-muted-foreground" />
                </div>
              </div>

              {/* Groups List */}
              <Tabs defaultValue="mygroups" className="flex-1 flex flex-col">
                <TabsList className="grid grid-cols-2 mx-2 mt-2">
                  <TabsTrigger value="mygroups" className="font-pixelated text-xs">My Groups</TabsTrigger>
                  <TabsTrigger value="suggested" className="font-pixelated text-xs">Suggested</TabsTrigger>
                </TabsList>
                
                <TabsContent value="mygroups" className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    {loading ? (
                      <div className="p-3 space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                            <div className="h-10 w-10 rounded-full bg-muted" />
                            <div className="flex-1">
                              <div className="h-3 w-20 bg-muted rounded mb-1" />
                              <div className="h-2 w-24 bg-muted rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredGroups.length > 0 ? (
                      <div className="p-2">
                        {filteredGroups.map(group => (
                          <div
                            key={group.id}
                            onClick={() => setSelectedGroup(group)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                              selectedGroup?.id === group.id ? 'bg-accent shadow-md' : ''
                            }`}
                          >
                            <Avatar className="h-10 w-10 border-2 border-background flex-shrink-0">
                              {group.avatar ? (
                                <AvatarImage src={group.avatar} />
                              ) : (
                                <AvatarFallback className="bg-social-green text-white font-pixelated text-xs">
                                  {group.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm font-pixelated">
                                {group.name}
                              </p>
                              <p className="text-xs truncate font-pixelated text-muted-foreground">
                                {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                              </p>
                            </div>
                            
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4 font-pixelated text-sm">No groups yet</p>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreateGroupDialog(true)}
                          className="font-pixelated text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create Group
                        </Button>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="suggested" className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    {loading ? (
                      <div className="p-3 space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                            <div className="h-10 w-10 rounded-full bg-muted" />
                            <div className="flex-1">
                              <div className="h-3 w-20 bg-muted rounded mb-1" />
                              <div className="h-2 w-24 bg-muted rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : suggestedGroups.length > 0 ? (
                      <div className="p-2">
                        {suggestedGroups.map(group => (
                          <div
                            key={group.id}
                            className="flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-accent/50"
                          >
                            <Avatar className="h-10 w-10 border-2 border-background flex-shrink-0">
                              {group.avatar ? (
                                <AvatarImage src={group.avatar} />
                              ) : (
                                <AvatarFallback className="bg-social-blue text-white font-pixelated text-xs">
                                  {group.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm font-pixelated">
                                {group.name}
                              </p>
                              <div className="flex items-center gap-1">
                                <p className="text-xs truncate font-pixelated text-muted-foreground">
                                  {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                                </p>
                                {group.mutual_members > 0 && (
                                  <span className="text-xs font-pixelated text-social-green">
                                    • {group.mutual_members} mutual
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              className="h-8 bg-social-blue hover:bg-social-blue/90 text-white font-pixelated text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinGroup(group.id);
                              }}
                              disabled={processingRequest === group.id}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Join
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4 font-pixelated text-sm">No suggested groups</p>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreateGroupDialog(true)}
                          className="font-pixelated text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create Group
                        </Button>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col h-full ${!selectedGroup ? 'hidden md:flex' : ''}`}>
              {selectedGroup ? (
                <>
                  {/* Group Header */}
                  <div className="flex items-center gap-3 p-3 border-b bg-muted/30 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedGroup(null)}
                      className="md:hidden flex-shrink-0 h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {selectedGroup.avatar ? (
                        <AvatarImage src={selectedGroup.avatar} />
                      ) : (
                        <AvatarFallback className="bg-social-green text-white font-pixelated text-xs">
                          {selectedGroup.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm font-pixelated">{selectedGroup.name}</p>
                      <p className="text-xs text-muted-foreground truncate font-pixelated">
                        {selectedGroup.member_count} {selectedGroup.member_count === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="font-pixelated">Group Settings</DialogTitle>
                        </DialogHeader>
                        
                        <Tabs defaultValue="members">
                          <TabsList className="grid grid-cols-2">
                            <TabsTrigger value="members" className="font-pixelated text-xs">Members</TabsTrigger>
                            {isGroupAdmin && (
                              <TabsTrigger value="requests" className="font-pixelated text-xs">
                                Requests
                                {joinRequests.length > 0 && (
                                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs font-semibold text-white bg-social-green rounded-full">
                                    {joinRequests.length}
                                  </span>
                                )}
                              </TabsTrigger>
                            )}
                          </TabsList>
                          
                          <TabsContent value="members" className="max-h-[300px] overflow-y-auto">
                            <div className="space-y-2">
                              {groupMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      {member.avatar ? (
                                        <AvatarImage src={member.avatar} />
                                      ) : (
                                        <AvatarFallback className="bg-social-green text-white font-pixelated text-xs">
                                          {member.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    <div>
                                      <p className="font-pixelated text-xs font-medium">{member.name}</p>
                                      <p className="font-pixelated text-xs text-muted-foreground">
                                        {member.role === 'admin' ? 'Admin' : 'Member'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                          
                          {isGroupAdmin && (
                            <TabsContent value="requests" className="max-h-[300px] overflow-y-auto">
                              {joinRequests.length > 0 ? (
                                <div className="space-y-2">
                                  {joinRequests.map(request => (
                                    <div key={request.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                          {request.avatar ? (
                                            <AvatarImage src={request.avatar} />
                                          ) : (
                                            <AvatarFallback className="bg-social-blue text-white font-pixelated text-xs">
                                              {request.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                          )}
                                        </Avatar>
                                        <div>
                                          <p className="font-pixelated text-xs font-medium">{request.name}</p>
                                          <p className="font-pixelated text-xs text-muted-foreground">
                                            Requested {new Date(request.created_at).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 font-pixelated text-xs"
                                          onClick={() => handleRejectRequest(request.id)}
                                          disabled={processingRequest === request.id}
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Reject
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="h-7 bg-social-green hover:bg-social-light-green text-white font-pixelated text-xs"
                                          onClick={() => handleApproveRequest(request.id)}
                                          disabled={processingRequest === request.id}
                                        >
                                          <UserPlus className="h-3 w-3 mr-1" />
                                          Approve
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <p className="font-pixelated text-xs text-muted-foreground">
                                    No pending join requests
                                  </p>
                                </div>
                              )}
                            </TabsContent>
                          )}
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full p-3">
                      {groupMessages.length > 0 ? (
                        <div className="space-y-3">
                          {groupMessages.map(message => {
                            const isOwnMessage = message.sender_id === currentUser?.id;
                            
                            return (
                              <div 
                                key={message.id}
                                className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                              >
                                {!isOwnMessage && (
                                  <Avatar className="h-6 w-6 mt-1 flex-shrink-0">
                                    {message.sender_avatar ? (
                                      <AvatarImage src={message.sender_avatar} />
                                    ) : (
                                      <AvatarFallback className="bg-social-green text-white font-pixelated text-xs">
                                        {message.sender_name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                )}
                                
                                <div 
                                  className={`p-2 rounded-lg max-w-[75%] ${
                                    isOwnMessage 
                                      ? 'bg-social-green text-white' 
                                      : 'bg-muted'
                                  }`}
                                >
                                  {!isOwnMessage && (
                                    <p className="font-pixelated text-xs font-medium mb-1">
                                      {message.sender_name}
                                    </p>
                                  )}
                                  <p className="font-pixelated text-xs whitespace-pre-wrap break-words">
                                    {message.content}
                                  </p>
                                  <p className="text-xs opacity-70 font-pixelated mt-1 text-right">
                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                
                                {isOwnMessage && (
                                  <Avatar className="h-6 w-6 mt-1 flex-shrink-0">
                                    {currentUser.avatar ? (
                                      <AvatarImage src={currentUser.avatar} />
                                    ) : (
                                      <AvatarFallback className="bg-social-green text-white font-pixelated text-xs">
                                        {currentUser.name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                )}
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                          <h3 className="font-pixelated text-sm font-medium mb-2">No messages yet</h3>
                          <p className="font-pixelated text-xs text-muted-foreground max-w-xs">
                            Be the first to send a message in this group!
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-3 flex gap-2 items-end">
                    <Textarea 
                      placeholder="Type a message..." 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="min-h-[52px] max-h-[120px] resize-none flex-1 font-pixelated text-xs"
                      disabled={sendingMessage}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-social-green hover:bg-social-light-green flex-shrink-0 h-[52px] w-12"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <Zap className="h-16 w-16 text-social-green mb-4" />
                  <h2 className="text-lg font-semibold mb-2 font-pixelated">Vortex Groups</h2>
                  <p className="text-muted-foreground font-pixelated text-sm max-w-md mb-6">
                    Create or join groups to chat with multiple friends at once. Share ideas, plan events, and stay connected.
                  </p>
                  <Button 
                    onClick={() => setShowCreateGroupDialog(true)}
                    className="bg-social-green hover:bg-social-light-green text-white font-pixelated"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create a Group
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Create Group Dialog */}
        <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-pixelated">Create New Group</DialogTitle>
              <DialogDescription className="font-pixelated text-xs">
                Create a group to chat with multiple friends at once
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-pixelated text-xs">Group Name</label>
                <Input
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name"
                  className="font-pixelated text-xs"
                />
              </div>
              
              <div className="space-y-2">
                <label className="font-pixelated text-xs">Description</label>
                <Textarea
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter group description"
                  className="font-pixelated text-xs"
                />
              </div>
              
              <div className="space-y-2">
                <label className="font-pixelated text-xs">Avatar URL (optional)</label>
                <Input
                  value={newGroupData.avatar}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, avatar: e.target.value }))}
                  placeholder="Enter avatar URL"
                  className="font-pixelated text-xs"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_private"
                  checked={newGroupData.is_private}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, is_private: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_private" className="font-pixelated text-xs">
                  Private Group (invite only)
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateGroupDialog(false)}
                className="font-pixelated text-xs"
                disabled={creatingGroup}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGroup}
                className="bg-social-green hover:bg-social-light-green text-white font-pixelated text-xs"
                disabled={!newGroupData.name.trim() || creatingGroup}
              >
                {creatingGroup ? 'Creating...' : 'Create Group'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}

export default Vortex;