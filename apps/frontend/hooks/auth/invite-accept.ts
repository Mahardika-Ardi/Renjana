'use client';

import { useState } from 'react';
import { useGetUserProfile } from './get-user-profile';

export function InviteOrAccept() {
  const [hasCouple, setHasCouple] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

    const { user } = useGetUserProfile();
    
    
}
