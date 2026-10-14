import Image from 'next/image';

interface RenjanaLogoProps {
  className?: string;
}

/** Single brand mark. Light-theme artwork for light surfaces. */
export default function RenjanaLogo({ className = 'h-8 w-auto' }: RenjanaLogoProps) {
  return (
    <Image
      src="/logo/Light_Theme_Logo.svg"
      alt="Renjana"
      width={404}
      height={334}
      className={className}
    />
  );
}
