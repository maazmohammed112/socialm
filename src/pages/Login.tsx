import React, { useEffect } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { pageSEO, setPageTitle } from '@/utils/seo';

export function Login() {
  useEffect(() => {
    setPageTitle(pageSEO.login.title);
  }, []);

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}

export default Login;