'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/contexts/auth-store';
import { Button } from '@/components/ui/button';
import { AppShellLoading } from '@/components/ui/page-loading';
import { ProtectedAppNav } from '@/components/layout/protected-app-nav';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
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
    return <AppShellLoading />;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:gap-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <ProtectedAppNav />
        </div>
        <div className="ml-auto shrink-0">
          <Button
            aria-label="登出"
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            登出
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
