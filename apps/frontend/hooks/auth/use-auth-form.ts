'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { authApi } from '@/lib/api/auth';
import { cacheClearAll } from '@/lib/api/cache';
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

    // Honor the proxy's ?redirect= (e.g. /home?invite=…) so invite tokens
    // survive login/register. Same-origin paths only — never open redirects.
    const redirectTo = (() => {
      try {
        const params = new URLSearchParams(window.location.search);
        const target = params.get('redirect');
        if (target && target.startsWith('/') && !target.startsWith('//')) {
          return target;
        }
      } catch {
        // ignore, fall through to default
      }
      return '/home';
    })();

    try {
      if (type === 'Sign In') {
        await authApi.login({
          email: form.email,
          password: form.password,
        });

        // New session: never show the previous account's cached data.
        cacheClearAll();
        router.push(redirectTo);

        return;
      }

      await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      cacheClearAll();
      router.push(redirectTo);
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
