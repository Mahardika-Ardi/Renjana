'use client';

import { authApi } from '@/lib/api/auth';
import { useRouter } from 'next/router';
import { useState } from 'react';

export function useResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.reqCodeResetPassword({
        email,
      });

      return;
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);

        setError(error.message);
      } else setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.verifyPasswordResetCode({
        email,
        code,
      });

      setToken(res.data.resetToken);

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
        email,
        resetToken: token,
        newPassword: password,
      });

      router.push('/login');
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
    password,
    code,

    setPassword,
    setCode,
    setEmail,

    loading,
    error,

    handleVerifyCode,
    handleSendCode,
    handleResetPassword,
  };
}
