import React from 'react';
import { Helmet } from 'react-helmet';

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  ogImage = '/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
  ogUrl = 'https://socialchat.site',
  ogType = 'website',
  twitterCard = 'summary_large_image',
}) => {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={ogUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Mohammed Maaz A" />
      <link rel="canonical" href={ogUrl} />
    </Helmet>
  );
};

// Predefined SEO configurations for common pages
export const seoConfig = {
  home: {
    title: 'SocialChat - Real-time Social Messaging Platform | Connect with Friends',
    description: 'Join SocialChat - the ultimate real-time social messaging platform. Connect with friends, share posts and stories, chat instantly, build your social network.',
    keywords: ['social media', 'chat app', 'messaging platform', 'real-time chat', 'social network'],
  },
  login: {
    title: 'Login to SocialChat | Secure Access to Your Account',
    description: 'Sign in to your SocialChat account to connect with friends, send messages, and share updates in real-time.',
    keywords: ['login', 'sign in', 'account access', 'social media login'],
  },
  register: {
    title: 'Create a SocialChat Account | Join Our Community',
    description: 'Sign up for SocialChat to connect with friends, share moments, and join our growing community of users.',
    keywords: ['register', 'sign up', 'create account', 'join social network'],
  },
  dashboard: {
    title: 'SocialChat Dashboard | Your Social Feed',
    description: 'View your personalized feed, connect with friends, and share your thoughts on SocialChat.',
    keywords: ['social feed', 'dashboard', 'posts', 'social media timeline'],
  },
  friends: {
    title: 'SocialChat Friends | Manage Your Connections',
    description: 'Connect with friends, manage friend requests, and grow your social network on SocialChat.',
    keywords: ['friends', 'connections', 'friend requests', 'social network'],
  },
  messages: {
    title: 'SocialChat Messages | Real-time Conversations',
    description: 'Chat with your friends in real-time, share media, and stay connected on SocialChat.',
    keywords: ['messages', 'chat', 'conversations', 'instant messaging'],
  },
  vortex: {
    title: 'Vortex Group Chat | Private Group Messaging on SocialChat',
    description: 'Join private group chats with Vortex on SocialChat. Create groups, invite friends, and enjoy secure group messaging.',
    keywords: ['group chat', 'private groups', 'team messaging', 'chat rooms'],
  },
  profile: {
    title: 'Your SocialChat Profile | Manage Your Account',
    description: 'View and edit your SocialChat profile, customize your experience, and manage your account settings.',
    keywords: ['profile', 'account settings', 'user profile', 'social media profile'],
  },
  notifications: {
    title: 'SocialChat Notifications | Stay Updated',
    description: 'Stay updated with notifications about likes, comments, messages, and friend requests on SocialChat.',
    keywords: ['notifications', 'alerts', 'updates', 'social media notifications'],
  },
};