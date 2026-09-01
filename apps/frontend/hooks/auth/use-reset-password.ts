'use client';

import { authApi } from '@/lib/api/auth';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface PasswordFormState {
  token: string;
  newPassword: string;
}

export function useResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    token: '',
    newPassword: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const setField = (field: keyof PasswordFormState, value: string) => {
    setPasswordForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSendLink = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.sendTokenResetPassword({
        email,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);

        setError(error.message);
      } else setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.resetPassword({
        token: passwordForm.token,
        newPassword: passwordForm.newPassword,
      });

      router.push('/login');

      return;
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
    email,
    token: passwordForm.token,
    newPassword: passwordForm,

    setEmail,
    setToken: (value: string) => setField('token', value),
    setNewPassword: (value: string) => setField('newPassword', value),

    loading,
    error,

    handleSendLink,
    handleResetPassword,
  };
}
