'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/contexts/auth-store';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait until Zustand store is hydrated
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace('/login');
    }
  }, [token, isHydrated, router]);

  if (!isHydrated || !token) {
    // You can replace this with a proper loading spinner component
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div>Loading...</div>
        </div>
    );
  }

  return <>{children}</>;
}
