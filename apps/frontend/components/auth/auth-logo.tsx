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
        <div
          className="
            hidden
            md:flex
            md:h-15
            md:w-15
            md: p-1.5
            md:items-center
            md:justify-center
            md:rounded-full
            md:bg-[#775530]
          "
        >
          <Image
            src="/logo/Dark_Theme_Logo.svg"
            alt="Renjana Logo"
            width={10}
            height={10}
            priority
            loading="eager"
            className="h-auto w-auto"
          />
        </div>

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
