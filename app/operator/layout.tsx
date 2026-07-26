'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/operator/inbox', label: 'Inbox', icon: '📥' },
    { href: '/operator/run', label: 'Run', icon: '🚗' },
    { href: '/operator/dropoff', label: 'Drop', icon: '📦' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/operator/inbox" style={{
            fontWeight: 700,
            fontSize: 18,
            color: '#0f5c48',
            textDecoration: 'none',
          }}>
            Doorstep
          </Link>
          <div style={{ display: 'flex', gap: 8 }}>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  background: pathname.startsWith(item.href) ? '#0f5c48' : 'transparent',
                  color: pathname.startsWith(item.href) ? 'white' : '#4b5563',
                }}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}
