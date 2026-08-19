import LeafBackground from '@/components/auth/leaf-background';
import AuthLogo from '@/components/auth/auth-logo';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main
      className="
        relative
        min-h-screen
        w-full
        overflow-hidden
        bg-[radial-gradient(circle,#E2C9AF_30%,#DFA66B_70%)]
      "
    >
      {/* Three.js background */}
      <LeafBackground />

      <AuthLogo />

      {/* Auth content */}
      <div
        className="
          relative
          z-10
          flex
          min-h-screen
          w-full
          items-center
          justify-center
          px-6
          py-10
        "
      >
        {children}
      </div>
    </main>
  );
}
