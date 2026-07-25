import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <nav style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--line)',
        padding: '12px 22px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="rt-mono"
              style={{
                background: 'var(--tag)',
                color: 'var(--tag-ink)',
                fontWeight: 700,
                fontSize: 12,
                padding: '4px 7px',
                borderRadius: 2,
              }}
            >
              ↩
            </div>
            <span style={{ fontWeight: 600 }}>Doorstep Admin</span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 14 }}>
            <Link href="/admin" style={{ color: 'var(--ink70)', textDecoration: 'none' }}>Orders</Link>
            <Link href="/" style={{ color: 'var(--ink70)', textDecoration: 'none' }}>← Back to site</Link>
          </div>
        </div>
      </nav>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 22px' }}>
        {children}
      </main>
    </div>
  );
}
