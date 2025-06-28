import React from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { SEO, pageSEO } from '@/utils/seo';

export function Register() {
  return (
    <>
      <SEO {...pageSEO.register} />
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </>
  );
}

export default Register;