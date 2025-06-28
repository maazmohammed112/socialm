
import React from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export function Login() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}

export default Login;
