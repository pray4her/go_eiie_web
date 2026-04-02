'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PROTECTED_NAV_ITEMS } from '@/lib/protected-nav-items';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

function navLinkClassName(active: boolean) {
  return cn(
    'transition-colors',
    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
  );
}

export function ProtectedAppNav() {
  const pathname = usePathname();

  return (
    <>
      <nav
        className="hidden min-w-0 flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
        aria-label="主导航"
      >
        {PROTECTED_NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={navLinkClassName(active)}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 md:hidden">
        <Drawer direction="left" shouldScaleBackground={false}>
          <DrawerTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label="打开导航菜单">
              <Menu className="h-5 w-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full max-h-screen rounded-none border-r p-0">
            <DrawerHeader className="border-b px-4 py-4 text-left">
              <DrawerTitle>导航</DrawerTitle>
            </DrawerHeader>
            <nav className="flex max-h-[calc(100vh-5rem)] flex-col gap-1 overflow-y-auto p-4 pb-8" aria-label="主导航">
              {PROTECTED_NAV_ITEMS.map((item) => {
                const active = item.isActive(pathname);
                return (
                  <DrawerClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      {item.label}
                    </Link>
                  </DrawerClose>
                );
              })}
            </nav>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
