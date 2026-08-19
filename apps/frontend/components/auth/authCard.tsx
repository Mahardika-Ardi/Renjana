'use client';
import Image from 'next/image';

import { ReactNode } from 'react';
import { motion } from 'motion/react';

import Card from '@/components/ui/Card';

type AuthCardProps = {
  type: 'Sign In' | 'Sign Up';
  children?: ReactNode;
};

export default function AuthCard({ type, children }: AuthCardProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -4,
      }}
      className="w-full max-w-110"
    >
      <Card
        className="
          w-full

          rounded-[50px]

          bg-[#FAFAF9]/70

          backdrop-blur-[20px]

          border
          border-white/55

          shadow-2xl
          shadow-black/10

          p-8
          md:p-12

          flex
          flex-col
          gap-8
        "
      >
        {/* Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.15,
            ease: 'easeOut',
          }}
          className="flex flex-col gap-2 text-center items-center"
        >
          {/* Mobile decorative icon */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.7,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.45,
              delay: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              w-12
              h-12
              rounded-full
              bg-[#ad8254]
              flex
              items-center
              justify-center
              mb-4
              md:hidden
              shadow-sm
            "
          >
            <Image
              src="/logo/Dark_Theme_Logo.svg"
              alt="Renjana Logo"
              width={200}
              height={200}
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,
              delay: 0.2,
              ease: 'easeOut',
            }}
            className="
              font-[Plus_Jakarta_Sans]
              text-[32px]
              leading-[1.3]
              font-semibold
              text-[#1a1c1c]
            "
          >
            {type}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,
              delay: 0.3,
              ease: 'easeOut',
            }}
            className="
              font-[Outfit]
              text-[16px]
              leading-[1.6]
              font-normal
              text-[#50453b]
            "
          >
            Welcome to Renjana
          </motion.p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
            delay: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {children}
        </motion.div>
      </Card>
    </motion.div>
  );
}
