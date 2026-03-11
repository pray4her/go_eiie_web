'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/contexts/auth-store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
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
    // You can replace this with a proper loading spinner component
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div>Loading...</div>
        </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/dashboard"
            aria-current={pathname === '/dashboard' ? 'page' : undefined}
            className={cn(
              'transition-colors',
              pathname === '/dashboard'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            信息提取
          </Link>
          <Link
            href="/generate-text"
            aria-current={pathname === '/generate-text' ? 'page' : undefined}
            className={cn(
              'transition-colors',
              pathname === '/generate-text'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            200字生成
          </Link>
          <Link
            href="/generate-image"
            aria-current={pathname === '/generate-image' ? 'page' : undefined}
            className={cn(
              'transition-colors',
              pathname === '/generate-image'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            提取签名
          </Link>
          <Link
            href="/generate-resume"
            aria-current={pathname === '/generate-resume' ? 'page' : undefined}
            className={cn(
              'transition-colors',
              pathname === '/generate-resume'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            外发简历
          </Link>
          <Link
            href="/resume-process"
            aria-current={pathname.startsWith('/resume-process') ? 'page' : undefined}
            className={cn(
              'transition-colors',
              pathname.startsWith('/resume-process')
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            简历处理
          </Link>
          <Link
            href="/annotation"
            aria-current={pathname === '/annotation' ? 'page' : undefined}
            className={cn(
              'transition-colors',
              pathname === '/annotation'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            PDF 标注
          </Link>
          <Link
            href="/auto-annotations"
            aria-current={pathname === '/auto-annotations' ? 'page' : undefined}
            className={cn(
              'transition-colors',
              pathname === '/auto-annotations'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            自动标注历史
          </Link>
          <Link
            href="/research-papers"
            aria-current={pathname === '/research-papers' ? 'page' : undefined}
            className={cn(
              'transition-colors',
              pathname === '/research-papers'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            论文自动标注
          </Link>
        </nav>
        <div className="ml-auto">
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
