import { Outfit } from 'next/font/google';

export const outfit = Outfit({
  weight: ['300', '400', '500', '600'],
  variable: '--font-outfit',
  display: 'swap',
  preload: true,
});
