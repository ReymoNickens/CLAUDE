'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, Home, Store, Car } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/newsfeed', label: 'Newsfeed', Icon: Newspaper },
  { href: '/accommodation', label: 'Housing', Icon: Home },
  { href: '/services', label: 'Services', Icon: Store },
  { href: '/transport', label: 'Transport', Icon: Car },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-safe">
      <div className="flex h-16 items-stretch">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                isActive ? 'text-[#003087]' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`}
                aria-hidden="true"
              />
              <span className={isActive ? 'font-semibold' : ''}>{label}</span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-10 rounded-full bg-[#003087]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
