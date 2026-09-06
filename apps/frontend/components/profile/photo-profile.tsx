import { useGetUserProfile } from '@/hooks/account/get-user-profile';
import Image from 'next/image';

export default function Profile() {
  const { loading, error, user } = useGetUserProfile();

  return (
    <div className="relative z-20 flex flex-col items-center">
      <div className="h-16.5 w-16.5 overflow-hidden rounded-full border-[3px] border-[#eee9e0] bg-[#ddd] shadow-sm md:h-18 md:w-18">
        <Image
          src={user?.avatarUrl == null ? '/icons/user.svg' : user?.avatarUrl}
          alt={'User Image'}
          className="h-full w-full object-cover"
          height={100}
          width={100}
        />
      </div>

      <span className="mt-3 text-sm text-[#4f4b43]">{user?.name}</span>
    </div>
  );
}
