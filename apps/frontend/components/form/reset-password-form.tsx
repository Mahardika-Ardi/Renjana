'use client';

import { motion, AnimatePresence } from 'motion/react';

import { useResetPassword } from '@/hooks/auth/use-reset-password';
import AuthCard from '@/components/auth/authCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useRequireResetSession } from '@/hooks/auth/use-require-reset-session';

export default function ResetPasswordForm() {
  const { isValid } = useRequireResetSession();
  const {
    password,
    confirmPassword,
    loading,
    error,
    setPassword,
    setConfirmPassword,
    handleResetPassword,
  } = useResetPassword();

  if (!isValid) {
    return null;
  }

  return (
    <AuthCard type="Reset Password">
      <form
        method="post"
        onSubmit={handleResetPassword}
        className="flex flex-col gap-6"
      >
        <Input
          id="password"
          name="password"
          label="New Password"
          logoName="lock"
          type="password"
          value={password}
          required
          status={loading}
          autoComplete="new-password"
          disabled={loading}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your new password"
          classes={{
            label: `
                    font-[Outfit]
                    text-[14px]
                    leading-[1.2]
                    font-semibold
                    text-[#50453b]
                    uppercase
                    tracking-wider
                  `,

            icon: `
                    bg-[#eeeeed]
                    text-[12px]
                    text-[#82756a]
                    hover:text-[#1a1c1c]
                    transition-colors
                  `,

            logo: `
                    absolute
                    left-4
                    top-7.5
                    -translate-y-1/2
                  `,

            input: `w-full
                    bg-[#eeeeed]
                    rounded-full
                    py-4
                    pl-12
                    pr-6
                    font-[Outfit]
                    text-[16px]
                    leading-[1.6]
                    text-[#1a1c1c]
                    placeholder:text-[#d4c4b7]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#7d562d]/50
                    transition-shadow
                    disabled:cursor-not-allowed
                    disabled:opacity-60`,
          }}
        />
        <Input
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm New Password"
          logoName="lock"
          type="password"
          value={confirmPassword}
          required
          status={loading}
          autoComplete="new-password"
          disabled={loading}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm your new password"
          classes={{
            label: `
                    font-[Outfit]
                    text-[14px]
                    leading-[1.2]
                    font-semibold
                    text-[#50453b]
                    uppercase
                    tracking-wider
                  `,

            icon: `
                    bg-[#eeeeed]
                    text-[12px]
                    text-[#82756a]
                    hover:text-[#1a1c1c]
                    transition-colors
                  `,

            logo: `
                    absolute
                    left-4
                    top-7.5
                    -translate-y-1/2
                  `,

            input: `w-full
                    bg-[#eeeeed]
                    rounded-full
                    py-4
                    pl-12
                    pr-6
                    font-[Outfit]
                    text-[16px]
                    leading-[1.6]
                    text-[#1a1c1c]
                    placeholder:text-[#d4c4b7]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#7d562d]/50
                    transition-shadow
                    disabled:cursor-not-allowed
                    disabled:opacity-60`,
          }}
        />
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                height: 'auto',
                y: 0,
              }}
              exit={{
                opacity: 0,
                height: 0,
                y: -8,
              }}
              transition={{
                duration: 0.25,
                ease: 'easeOut',
              }}
              role="alert"
              className="
                overflow-hidden
                rounded-2xl
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                font-[Outfit]
                text-[14px]
                leading-normal
                text-red-700
                text-center
              "
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          whileTap={{
            scale: 0.98,
          }}
          className="mt-2"
        >
          <Button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            content={loading ? 'Please wait...' : 'Reset Password'}
            logoName={loading ? 'progress_activity' : 'arrow_forward'}
            classes={{
              button: `
                        w-full
                        bg-[#7d562d]
                        hover:bg-[#7d562d]/90
                        disabled:bg-[#7d562d]/60
                        disabled:cursor-not-allowed
                        text-[#ffffff]
                        font-[Plus_Jakarta_Sans]
                        text-[18px]
                        leading-[1.6]
                        font-normal
                        rounded-full
                        py-4
                        shadow-lg
                        shadow-[#7d562d]/20
                        transition-all
                        flex
                        items-center
                        justify-center
                        gap-2
                      `,

              logo: `
                        ${loading ? 'animate-spin' : ''}
                      `,
            }}
          />
        </motion.div>
      </form>
    </AuthCard>
  );
}
