'use client';

import { InputHTMLAttributes, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import Button from './Button';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  logoName?: 'card' | 'mail' | 'lock' | 'otp';
  href?: string;
  otp?: boolean;
  status?: boolean;

  classes?: {
    label?: string;
    input?: string;
    logo?: string;
    link?: string;
    icon?: string;
  };
}

const InputIcons = {
  card: '/icons/business-card-design.svg',
  mail: '/icons/mail.svg',
  lock: '/icons/padlock.svg',
  otp: '/icons/password.svg',
};

export default function Input({
  logoName,
  label,
  classes,
  id,
  href,
  otp,
  status,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = props.type === 'password';

  const inputType = isPassword
    ? showPassword
      ? 'text'
      : 'password'
    : props.type;

  return (
    <div className="flex flex-col gap-2">
      <div
        className={
          isPassword ? 'flex items-center justify-between ml-4 mr-2' : 'ml-4'
        }
      >
        {label && (
          <label htmlFor={id} className={classes?.label}>
            {label}
          </label>
        )}

        {isPassword && href && (
          <Link href={href} className={classes?.link}>
            Forgot?
          </Link>
        )}
      </div>
      <div className="relative group">
        <span aria-hidden="true" className={classes?.logo}>
          {logoName && (
            <Image
              src={InputIcons[logoName]}
              alt={logoName}
              width={25}
              height={25}
            />
          )}
        </span>

        <input {...props} id={id} type={inputType} className={classes?.input} />
        {isPassword && (
          <Button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((previous) => !previous)}
            logoName={showPassword ? 'visibility' : 'visibility_off'}
            classes={{
              button: `
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                flex
                items-center
                justify-center
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#7d562d]/50
                rounded-full
                ${classes?.icon ?? ''}
              `,

              logo: `
                width-auto
              `,
            }}
          />
        )}
        {otp && (
          <Button
            type="submit"
            content="Send Code"
            disabled={status}
            aria-label="Send verification code"
            aria-busy={status}
            classes={{
              button: `
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                flex
                items-center
                justify-center
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#7d562d]/50
                rounded-full
                ${classes?.icon ?? ''}
              `,
            }}
          />
        )}
      </div>
    </div>
  );
}
