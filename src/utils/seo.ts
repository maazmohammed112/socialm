import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  noIndex?: boolean;
}

export const defaultSEO: SEOProps = {
  title: 'SocialChat - Real-time Social Messaging Platform',
  description: 'Connect with friends on SocialChat - a modern real-time social messaging platform. Share posts, stories, chat with friends, and build your social network.',
  keywords: ['social media', 'chat', 'messaging', 'friends', 'posts', 'stories', 'social network', 'real-time chat'],
  ogImage: '/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png',
  ogUrl: 'https://socialchat.site/',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  canonicalUrl: 'https://socialchat.site/',
  noIndex: false,
};

export const pageSEO: Record<string, SEOProps> = {
  home: {
    ...defaultSEO,
    title: 'SocialChat - Connect with Friends | Real-time Social Messaging',
    description: 'Join SocialChat - the ultimate real-time social messaging platform. Connect with friends, share posts and stories, chat instantly, build your social network.',
    canonicalUrl: 'https://socialchat.site/',
  },
  login: {
    ...defaultSEO,
    title: 'Login to SocialChat | Secure Access to Your Account',
    description: 'Sign in to your SocialChat account to connect with friends, send messages, and share updates in real-time.',
    canonicalUrl: 'https://socialchat.site/login',
  },
  register: {
    ...defaultSEO,
    title: 'Create a SocialChat Account | Join Our Community',
    description: 'Sign up for SocialChat to connect with friends, share moments, and join our growing community of users.',
    canonicalUrl: 'https://socialchat.site/register',
  },
  dashboard: {
    ...defaultSEO,
    title: 'SocialChat Dashboard | Your Social Feed',
    description: 'View your personalized social feed, connect with friends, and share your thoughts on SocialChat.',
    canonicalUrl: 'https://socialchat.site/dashboard',
  },
  friends: {
    ...defaultSEO,
    title: 'SocialChat Friends | Manage Your Connections',
    description: 'Connect with friends, manage friend requests, and grow your social network on SocialChat.',
    canonicalUrl: 'https://socialchat.site/friends',
  },
  messages: {
    ...defaultSEO,
    title: 'SocialChat Messages | Real-time Conversations',
    description: 'Chat with your friends in real-time using SocialChat\'s messaging platform.',
    canonicalUrl: 'https://socialchat.site/messages',
  },
  vortex: {
    ...defaultSEO,
    title: 'Vortex Group Chat | Private Group Messaging on SocialChat',
    description: 'Join private group chats with Vortex on SocialChat. Create groups, invite friends, and enjoy secure group messaging.',
    canonicalUrl: 'https://socialchat.site/vortex',
  },
  profile: {
    ...defaultSEO,
    title: 'Your SocialChat Profile | Manage Your Account',
    description: 'View and edit your SocialChat profile, customize your experience, and manage your account settings.',
    canonicalUrl: 'https://socialchat.site/profile',
  },
  notifications: {
    ...defaultSEO,
    title: 'SocialChat Notifications | Stay Updated',
    description: 'Stay updated with notifications about friend requests, messages, likes, and comments on SocialChat.',
    canonicalUrl: 'https://socialchat.site/notifications',
  },
  settings: {
    ...defaultSEO,
    title: 'SocialChat Settings | Customize Your Experience',
    description: 'Customize your SocialChat experience with personalized settings and preferences.',
    canonicalUrl: 'https://socialchat.site/settings',
  },
  notFound: {
    ...defaultSEO,
    title: 'Page Not Found | SocialChat',
    description: 'The page you are looking for does not exist or has been moved.',
    canonicalUrl: 'https://socialchat.site/404',
    noIndex: true,
  },
};

export const SEO = ({ 
  title = defaultSEO.title,
  description = defaultSEO.description,
  keywords = defaultSEO.keywords,
  ogImage = defaultSEO.ogImage,
  ogUrl = defaultSEO.ogUrl,
  ogType = defaultSEO.ogType,
  twitterCard = defaultSEO.twitterCard,
  canonicalUrl = defaultSEO.canonicalUrl,
  noIndex = defaultSEO.noIndex,
}: SEOProps) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords.join(', ')} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="SocialChat" />
      
      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={ogUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@socialchat" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* No index if specified */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
};