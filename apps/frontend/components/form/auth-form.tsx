'use client';

import { motion, AnimatePresence } from 'motion/react';

import { useAuthForm } from '@/hooks/auth/use-auth-form';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import AuthCard from '@/components/auth/authCard';
import AuthFooter from '@/components/auth/auth-footer';
import { AuthTypes } from '@renjana/types';

export default function AuthForm({ type }: { type: AuthTypes }) {
  const {
    name,
    email,
    password,
    loading,
    error,

    setName,
    setEmail,
    setPassword,

    handleSubmit,
  } = useAuthForm(type);

  return (
    <>
      <AuthCard type={type}>
        <form
          method="post"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
        >
          <AnimatePresence>
            {type === 'Sign Up' && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                  y: -10,
                }}
                animate={{
                  opacity: 1,
                  height: 'auto',
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  y: -10,
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="overflow-hidden"
              >
                <Input
                  id="username"
                  name="name"
                  label="Username"
                  logoName="card"
                  type="text"
                  value={name}
                  required
                  autoComplete="username"
                  disabled={loading}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="john"
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

                    logo: `
                    absolute
                    left-4
                    top-8.5
                    -translate-y-1/2
                  `,

                    input: `
                    w-full
                    bg-[#eeeeed]
                    rounded-full
                    py-4
                    pl-12
                    pr-6
                    mt-1
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
                    disabled:opacity-60
                  `,
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            id="email"
            name="email"
            label="Email"
            logoName="mail"
            type="email"
            value={email}
            required
            autoComplete="email"
            disabled={loading}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="john@example.com"
            classes={{
              label: `
              font-[Outfit]
              text-[14px]
              leading-[1.2]
              font-semibold
              text-[#50453b]
              uppercase
              tracking-wider
              ml-4
            `,

              logo: `
              absolute
              left-4
              top-8.5
              -translate-y-1/2
            `,

              input: `
              w-full
              bg-[#eeeeed]
              rounded-full
              py-4
              pl-12
              pr-6
              mt-1
              font-[Outfit]
              text-[16px]
              leading-[1.6]
              font-normal
              text-[#1a1c1c]
              placeholder:text-[#d4c4b7]
              focus:outline-none
              focus:ring-2
              focus:ring-[#7d562d]/50
              transition-shadow
              disabled:cursor-not-allowed
              disabled:opacity-60
            `,
            }}
          />

          <Input
            id="password"
            name="password"
            label="Password"
            logoName="lock"
            type="password"
            value={password}
            required
            autoComplete={
              type === 'Sign In' ? 'current-password' : 'new-password'
            }
            disabled={loading}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            href={type === 'Sign Up' ? '' : '/forgot-password'}
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

              link: `
              font-[Outfit]
              text-[12px]
              leading-[1.2]
              font-medium
              text-[#7d562d]
              hover:text-[#5b3912]
              transition-colors
            `,

              logo: `
              absolute
              left-4
              top-8.5
              -translate-y-1/2
            `,

              input: `
              w-full
              bg-[#eeeeed]
              rounded-full
              py-4
              pl-12
              pr-12
              mt-1
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
              disabled:opacity-60
            `,

              icon: `
              text-[#82756a]
              hover:text-[#1a1c1c]
              transition-colors
            `,
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
              content={loading ? 'Please wait...' : type}
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

      <AuthFooter type={type} />
    </>
  );
}
