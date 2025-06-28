import React, { useEffect } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { pageSEO, setPageTitle } from '@/utils/seo';

export function Register() {
  useEffect(() => {
    setPageTitle(pageSEO.register.title);
  }, []);

  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}

export default Register;