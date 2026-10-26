// components/HeaderSkeleton.tsx
'use client';

export default function HeaderSkeleton() {
  return (
    <header className="bg-gradient-to-r from-yellow-200 via-white to-gray-200 shadow-md py-4 px-6 flex justify-between items-center border-b border-gray-300 sticky top-0 z-50 animate-pulse">
      <div className="h-8 w-32 bg-yellow-300 rounded"></div>
      <nav className="flex gap-4 items-center">
        <div className="h-6 w-12 bg-gray-300 rounded"></div>
        <div className="h-6 w-12 bg-gray-300 rounded"></div>
        <div className="h-6 w-12 bg-gray-300 rounded"></div>
        <div className="h-6 w-12 bg-gray-300 rounded"></div>
      </nav>
    </header>
  );
}
