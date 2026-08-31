'use client';

import { useRouter } from 'next/router';
import { useState } from 'react';

export function useResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    
    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.
    }
}
