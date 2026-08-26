'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

type AuthFooterProps = {
  type: 'Sign In' | 'Sign Up';
};

export default function AuthFooter({ type }: AuthFooterProps) {
  if (type !== 'Sign In') {
    return null;
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
        delay: 0.6,
        ease: 'easeOut',
      }}
      className="
        absolute
        bottom-8
        left-0
        z-20
        w-full

        text-center

        font-[Outfit]
        text-[13 px]
        leading-normal

        text-[#50453b]
      "
    >
      <span>Don&apos;t have an account? </span>

      <Link
        href="/register"
        className="
          font-medium
          text-[#7d562d]

          transition-colors
          duration-200

          hover:text-[#5b3912]

          underline
          underline-offset-2
        "
      >
        Sign up here
      </Link>
    </motion.div>
  );
}
