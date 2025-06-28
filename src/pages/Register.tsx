import React from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { SEO, seoConfig } from '@/utils/seo';

export function Register() {
  return (
    <>
      <SEO {...seoConfig.register} />
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </>
  );
}

export default Register;