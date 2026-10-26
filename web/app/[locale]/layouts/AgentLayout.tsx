'use client';

import { ReactNode } from 'react';

interface AgentLayoutProps {
  children: ReactNode;
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  return (
    <div id="agent" className="min-h-screen w-full flex justify-center items-center bg-white">
      <div className="flex flex-1 w-full h-full overflow-hidden">{children}</div>
    </div>
  );
}
