'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { authApi } from '@/lib/api/auth';
import { AuthTypes } from '@renjana/types';

interface AuthFormState {
  name: string;
  email: string;
  password: string;
}

export function useAuthForm(type: AuthTypes) {
  const router = useRouter();
  const [form, setForm] = useState<AuthFormState>({
    name: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const setField = (field: keyof AuthFormState, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (type === 'Sign In') {
        await authApi.login({
          email: form.email,
          password: form.password,
        });

        router.push('/home');

        return;
      }

      await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      router.push('/home');
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);

        setError(error.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    name: form.name,
    email: form.email,
    password: form.password,

    setName: (value: string) => setField('name', value),
    setEmail: (value: string) => setField('email', value),
    setPassword: (value: string) => setField('password', value),

    loading,
    error,

    handleSubmit,
  };
}
