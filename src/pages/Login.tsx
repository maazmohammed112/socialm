import React from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { SEO, pageSEO } from '@/utils/seo';

export function Login() {
  return (
    <>
      <SEO {...pageSEO.login} />
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </>
  );
}

export default Login;