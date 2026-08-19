'use client';

import { useState } from 'react';

import { authApi } from '@/lib/api/auth';

type AuthType = 'Sign In' | 'Sign Up';

interface AuthFormState {
  name: string;
  email: string;
  password: string;
}

export function useAuthForm(type: AuthType) {
  const [form, setForm] = useState<AuthFormState>({
    name: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /**
   * --------------------------------------------------
   * FIELD HANDLER
   * --------------------------------------------------
   */

  const setField = (field: keyof AuthFormState, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    /**
     * Jika user mulai memperbaiki input,
     * error lama dihapus.
     */

    if (error) {
      setError(null);
    }
  };

  /**
   * --------------------------------------------------
   * SUBMIT
   * --------------------------------------------------
   */

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    /**
     * Jangan kirim request kedua ketika
     * request sebelumnya masih berjalan.
     */

    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (type === 'Sign In') {
        const response = await authApi.login({
          email: form.email,
          password: form.password,
        });

        console.log('Login success:', response);

        return;
      }

      const response = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      console.log('Register success:', response);
    } catch (error) {
      /**
       * Error dari API
       */

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * --------------------------------------------------
   * RETURN
   * --------------------------------------------------
   */

  return {
    /**
     * Form state
     */

    name: form.name,
    email: form.email,
    password: form.password,

    /**
     * Field setters
     */

    setName: (value: string) => setField('name', value),

    setEmail: (value: string) => setField('email', value),

    setPassword: (value: string) => setField('password', value),

    /**
     * Request state
     */

    loading,
    error,

    /**
     * Submit
     */

    handleSubmit,
  };
}
