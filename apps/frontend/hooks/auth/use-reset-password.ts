'use client';

import { authApi } from '@/lib/api/auth';
import {
  setStorageItem,
  getStorageItem,
  removeStorageItem,
} from '@renjana/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  RESET_TOKEN_KEY,
  RESET_EMAIL_KEY,
} from '@/lib/constants/reset-password';

export function useResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
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

      const resetToken = res.data.resetToken;

      setStorageItem(RESET_TOKEN_KEY, resetToken, 'session');
      setStorageItem(RESET_EMAIL_KEY, email, 'session');

      router.push('/reset-password');
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

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      setLoading(false);
      return;
    }

    try {
      const token = getStorageItem(RESET_TOKEN_KEY, 'session');
      const email = getStorageItem(RESET_EMAIL_KEY, 'session');

      if (!token || !email) {
        throw new Error('Reset session expired. Please request a new code.');
      }
      await authApi.resetPassword({
        email,
        resetToken: token,
        newPassword: confirmPassword,
      });

      removeStorageItem(RESET_TOKEN_KEY, 'session');
      removeStorageItem(RESET_EMAIL_KEY, 'session');

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
    confirmPassword,

    setPassword,
    setCode,
    setEmail,
    setConfirmPassword,

    loading,
    error,

    handleVerifyCode,
    handleSendCode,
    handleResetPassword,
  };
}
