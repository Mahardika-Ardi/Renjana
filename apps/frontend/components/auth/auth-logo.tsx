import Image from 'next/image';

export default function AuthLogo() {
  return (
    <div
      className="
        absolute
        left-6
        top-6
        z-20

        md:left-10
        md:top-8
      "
    >
      <div className="flex items-center gap-5">
        {/* Logo */}
        <div
          className="
            hidden
            md:flex
            h-15
            w-15
            items-center
            justify-center
            rounded-full
            bg-[#775530]
          "
        >
          <Image
            src="/logo/Dark_Theme_Logo.svg"
            alt="Renjana Logo"
            width={40}
            height={40}
            priority
            loading="eager"
          />
        </div>

        {/* Text */}
        <h1
          className="
            font-[Plus_Jakarta_Sans]
            text-[25px]
            font-semibold
            leading-none
            text-[#1a1c1c]
          "
        >
          Renjana
        </h1>
      </div>
    </div>
  );
}
