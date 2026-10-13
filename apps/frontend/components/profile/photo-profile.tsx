import { useGetUserProfile } from '@/hooks/auth/get-user-profile';
import { AuthUser } from '@renjana/types';
import Image from 'next/image';

interface ProfileProps {
  /** 'me' shows the logged-in user, 'partner' shows their couple. */
  who?: 'me' | 'partner';
  /** Pass the user down to share one GET /auth/me across slots. */
  user?: AuthUser | null;
  loading?: boolean;
}

export default function Profile({ who = 'me', user: userProp, loading: loadingProp }: ProfileProps) {
  const skipFetch = userProp !== undefined;
  const { loading: loadingHook, user: userHook } = useGetUserProfile({
    enabled: !skipFetch,
  });

  // Prefer an explicitly passed user (single shared request); fall back to
  // the hook so standalone <Profile /> keeps working on its own.
  const user = userProp !== undefined ? userProp : userHook;
  const loading = loadingProp ?? loadingHook;

  const isPartner = who === 'partner';
  const couple = user?.couple ?? null;

  const avatarUrl = isPartner ? (couple?.partnerAvatarUrl ?? null) : user?.avatarUrl;
  const name = isPartner ? (couple?.partnerName ?? null) : user?.name;

  return (
    <div className="relative z-20 flex flex-col items-center">
      <div className="h-16.5 w-16.5 overflow-hidden rounded-full border-[3px] border-[#b1a082] bg-[#ddd] shadow-sm md:h-18 md:w-18">
        <Image
          src={avatarUrl == null ? '/icons/user.svg' : avatarUrl}
          alt={isPartner ? 'Partner Image' : 'User Image'}
          className={`h-full w-full object-cover ${loading && 'animate-pulse'}`}
          height={100}
          width={100}
        />
      </div>

      <span className="mt-3 text-sm text-[#4f4b43]">
        {name ?? (loading ? '…' : isPartner ? 'Belum terhubung' : '')}
      </span>
    </div>
  );
}
