// Simple SEO utility for managing page metadata
export const pageSEO = {
  home: {
    title: 'SocialChat - Real-time Social Messaging Platform | Connect with Friends',
    description: 'Join SocialChat - the ultimate real-time social messaging platform. Connect with friends, share posts and stories, chat instantly, and build your social network.',
    keywords: ['social media', 'chat app', 'messaging platform', 'real-time chat', 'social network'],
    ogImage: 'https://socialchat.site/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
    canonicalUrl: 'https://socialchat.site/'
  },
  
  login: {
    title: 'Login to SocialChat | Secure Access to Your Account',
    description: 'Sign in to your SocialChat account to connect with friends, send messages, and share updates in real-time.',
    keywords: ['login', 'sign in', 'account access', 'social media login'],
    ogImage: 'https://socialchat.site/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
    canonicalUrl: 'https://socialchat.site/login'
  },
  
  register: {
    title: 'Create a SocialChat Account | Join Our Community',
    description: 'Sign up for SocialChat to connect with friends, share moments, and join our growing community of users.',
    keywords: ['register', 'sign up', 'create account', 'join social network'],
    ogImage: 'https://socialchat.site/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
    canonicalUrl: 'https://socialchat.site/register'
  },
  
  dashboard: {
    title: 'Dashboard | SocialChat',
    description: 'Your SocialChat dashboard - view posts, stories, and connect with friends in real-time.',
    keywords: ['dashboard', 'social feed', 'posts', 'stories'],
    ogImage: 'https://socialchat.site/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
    canonicalUrl: 'https://socialchat.site/dashboard'
  },
  
  profile: {
    title: 'Profile | SocialChat',
    description: 'Manage your SocialChat profile, customize themes, and view your posts and activities.',
    keywords: ['profile', 'user profile', 'settings', 'customization'],
    ogImage: 'https://socialchat.site/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
    canonicalUrl: 'https://socialchat.site/profile'
  },
  
  messages: {
    title: 'Messages | SocialChat',
    description: 'Send and receive real-time messages with your friends on SocialChat.',
    keywords: ['messages', 'chat', 'real-time messaging', 'direct messages'],
    ogImage: 'https://socialchat.site/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
    canonicalUrl: 'https://socialchat.site/messages'
  },
  
  friends: {
    title: 'Friends | SocialChat',
    description: 'Manage your friends, send friend requests, and discover new connections on SocialChat.',
    keywords: ['friends', 'friend requests', 'social connections', 'networking'],
    ogImage: 'https://socialchat.site/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
    canonicalUrl: 'https://socialchat.site/friends'
  },
  
  notifications: {
    title: 'Notifications | SocialChat',
    description: 'View your notifications, friend requests, likes, comments, and messages on SocialChat.',
    keywords: ['notifications', 'alerts', 'friend requests', 'messages'],
    ogImage: 'https://socialchat.site/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
    canonicalUrl: 'https://socialchat.site/notifications'
  },
  
  vortex: {
    title: 'Vortex Group Chat | Private Group Messaging on SocialChat',
    description: 'Join private group chats with Vortex on SocialChat. Create groups, invite friends, and enjoy secure group messaging.',
    keywords: ['group chat', 'private groups', 'team messaging', 'chat rooms', 'vortex'],
    ogImage: 'https://socialchat.site/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
    canonicalUrl: 'https://socialchat.site/vortex'
  },
  
  notFound: {
    title: '404 - Page Not Found | SocialChat',
    description: 'The page you are looking for does not exist. Return to SocialChat to continue connecting with friends.',
    keywords: ['404', 'page not found', 'error'],
    ogImage: 'https://socialchat.site/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
    canonicalUrl: 'https://socialchat.site/404'
  }
};

// Simple function to set document title
export function setPageTitle(title: string) {
  document.title = title;
}