import React from 'react';
import RenjanaLogo from './logo';

interface NavbarProps {
  children: React.ReactNode;

  classes?: '';
}

export default function Navbar({ children }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <RenjanaLogo className="h-9 w-auto" />
          </div>
          {children}
        </div>
      </div>
    </nav>
  );
}
