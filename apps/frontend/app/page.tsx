import { MotionConfig } from 'motion/react';
import LandingNavbar from '@/components/landing/landing-navbar';
import LandingHero from '@/components/landing/landing-hero';
import LandingHowItWorks from '@/components/landing/landing-how-it-works';
import LandingFeatures from '@/components/landing/landing-features';
import LandingComingSoon from '@/components/landing/landing-coming-soon';
import LandingPrivacy from '@/components/landing/landing-privacy';
import LandingClosing from '@/components/landing/landing-closing';

export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="grain min-h-screen bg-[#f7f3ee] text-[#2c2523] antialiased">
        <LandingNavbar />
        <main>
          <LandingHero />
          <LandingHowItWorks />
          <LandingFeatures />
          <LandingComingSoon />
          <LandingPrivacy />
        </main>
        <LandingClosing />
      </div>
    </MotionConfig>
  );
}
