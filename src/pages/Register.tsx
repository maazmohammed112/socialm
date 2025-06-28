import React from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Helmet } from 'react-helmet';

export function Register() {
  return (
    <>
      <Helmet>
        <title>Create a SocialChat Account | Join Our Community</title>
        <meta name="description" content="Sign up for SocialChat to connect with friends, share moments, and join our growing community of users." />
        <meta name="keywords" content="register, sign up, create account, join social network" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://socialchat.site/register" />
        <meta property="og:title" content="Create a SocialChat Account | Join Our Community" />
        <meta property="og:description" content="Sign up for SocialChat to connect with friends, share moments, and join our growing community of users." />
        <meta property="og:image" content="/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://socialchat.site/register" />
        <meta property="twitter:title" content="Create a SocialChat Account | Join Our Community" />
        <meta property="twitter:description" content="Sign up for SocialChat to connect with friends, share moments, and join our growing community of users." />
        <meta property="twitter:image" content="/lovable-uploads/d215e62c-d97d-4600-a98e-68acbeba47d0.png" />
      </Helmet>
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </>
  );
}

export default Register;