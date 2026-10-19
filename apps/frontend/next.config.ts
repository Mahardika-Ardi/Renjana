import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL('https://images.unsplash.com/**'),
      // Avatar photos (backend uploads land on Cloudinary's CDN).
      new URL('https://res.cloudinary.com/**'),
    ],
  },
};

export default nextConfig;
