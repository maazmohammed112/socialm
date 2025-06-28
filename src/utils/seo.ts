import React from 'react';
import { Helmet } from 'react-helmet-async';

// SEO utility functions for dynamic meta tags and structured data
export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

// SEO Component for React Helmet
export function SEO(props: SEOData) {
  const {
    title,
    description,
    keywords,
    ogImage,
    canonicalUrl,
    type = 'website',
    author,
    publishedTime,
    modifiedTime
  } = props;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {keywords && <meta name="keywords" content={keywords.join(', ')} />}
      
      {/* Open Graph tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      
      {ogImage && <meta property="og:image" content={ogImage} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {/* Article specific tags */}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'SocialChat',
          description: description,
          url: canonicalUrl || 'https://socialchat.site',
          applicationCategory: 'SocialNetworkingApplication',
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          },
          author: {
            '@type': 'Person',
            name: 'Mohammed Maaz A',
            url: 'https://www.linkedin.com/in/mohammed-maaz-a-0aa730217/'
          }
        })}
      </script>
    </Helmet>
  );
}

// Update document title and meta tags
export function updateSEO(data: SEOData) {
  // Update title
  document.title = data.title;

  // Update or create meta tags
  updateMetaTag('description', data.description);
  
  if (data.keywords) {
    updateMetaTag('keywords', data.keywords.join(', '));
  }

  // Open Graph tags
  updateMetaTag('og:title', data.title, 'property');
  updateMetaTag('og:description', data.description, 'property');
  updateMetaTag('og:type', data.type || 'website', 'property');
  
  if (data.ogImage) {
    updateMetaTag('og:image', data.ogImage, 'property');
  }
  
  if (data.canonicalUrl) {
    updateMetaTag('og:url', data.canonicalUrl, 'property');
    updateCanonicalLink(data.canonicalUrl);
  }

  // Twitter Card tags
  updateMetaTag('twitter:card', 'summary_large_image', 'name');
  updateMetaTag('twitter:title', data.title, 'name');
  updateMetaTag('twitter:description', data.description, 'name');
  
  if (data.ogImage) {
    updateMetaTag('twitter:image', data.ogImage, 'name');
  }

  // Article specific tags
  if (data.type === 'article') {
    if (data.author) {
      updateMetaTag('article:author', data.author, 'property');
    }
    if (data.publishedTime) {
      updateMetaTag('article:published_time', data.publishedTime, 'property');
    }
    if (data.modifiedTime) {
      updateMetaTag('article:modified_time', data.modifiedTime, 'property');
    }
  }
}

function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (element) {
    element.content = content;
  } else {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    element.content = content;
    document.head.appendChild(element);
  }
}

function updateCanonicalLink(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  
  if (link) {
    link.href = url;
  } else {
    link = document.createElement('link');
    link.rel = 'canonical';
    link.href = url;
    document.head.appendChild(link);
  }
}

// Generate structured data for different page types
export function generateStructuredData(type: 'WebApplication' | 'Person' | 'Article', data: any) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type
  };

  let structuredData;

  switch (type) {
    case 'WebApplication':
      structuredData = {
        ...baseData,
        name: data.name || 'SocialChat',
        description: data.description || 'Real-time social messaging platform',
        url: data.url || 'https://socialchat.site',
        applicationCategory: 'SocialNetworkingApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        author: {
          '@type': 'Person',
          name: 'Mohammed Maaz A',
          url: 'https://www.linkedin.com/in/mohammed-maaz-a-0aa730217/'
        }
      };
      break;

    case 'Person':
      structuredData = {
        ...baseData,
        name: data.name,
        description: data.description,
        image: data.image,
        url: data.url,
        sameAs: data.socialLinks || []
      };
      break;

    case 'Article':
      structuredData = {
        ...baseData,
        headline: data.title,
        description: data.description,
        image: data.image,
        author: {
          '@type': 'Person',
          name: data.author
        },
        publisher: {
          '@type': 'Organization',
          name: 'SocialChat',
          logo: {
            '@type': 'ImageObject',
            url: 'https://socialchat.site/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png'
          }
        },
        datePublished: data.publishedTime,
        dateModified: data.modifiedTime || data.publishedTime
      };
      break;

    default:
      structuredData = baseData;
  }

  updateStructuredData(structuredData);
}

function updateStructuredData(data: any) {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

// Page-specific SEO configurations
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

// Apply SEO for specific pages
export function applySEO(page: keyof typeof pageSEO, customData?: Partial<SEOData>) {
  const seoData = { ...pageSEO[page], ...customData };
  updateSEO(seoData);
  
  // Generate structured data for the application
  generateStructuredData('WebApplication', {
    name: 'SocialChat',
    description: seoData.description,
    url: seoData.canonicalUrl
  });
}