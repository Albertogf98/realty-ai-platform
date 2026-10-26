'use client';

import { ReactNode } from 'react';

interface GuestLayoutProps {
  children: ReactNode;
}

export default function GhuestLayout({ children }: GuestLayoutProps) {
  return (
    <div id="agent" className="min-h-screen w-full flex justify-center items-center bg-white">
      <div className="flex flex-1 w-full h-full overflow-hidden">{children}</div>
    </div>
  );
}
