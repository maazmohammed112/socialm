import React from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { Helmet } from 'react-helmet';

export function Login() {
  return (
    <>
      <Helmet>
        <title>Login to SocialChat | Secure Access to Your Account</title>
        <meta name="description" content="Sign in to your SocialChat account to connect with friends, send messages, and share updates in real-time." />
        <meta name="keywords" content="login, sign in, account access, social media login" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://socialchat.site/login" />
        <meta property="og:title" content="Login to SocialChat | Secure Access to Your Account" />
        <meta property="og:description" content="Sign in to your SocialChat account to connect with friends, send messages, and share updates in real-time." />
        <meta property="og:image" content="/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://socialchat.site/login" />
        <meta property="twitter:title" content="Login to SocialChat | Secure Access to Your Account" />
        <meta property="twitter:description" content="Sign in to your SocialChat account to connect with friends, send messages, and share updates in real-time." />
        <meta property="twitter:image" content="/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png" />
      </Helmet>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </>
  );
}

export default Login;