import Link from 'next/link';

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/operator/inbox" className="font-bold">Doorstep</Link>
          <div className="flex gap-4 text-sm">
            <Link href="/operator/inbox" className="hover:text-blue-600">Inbox</Link>
            <Link href="/operator/run" className="hover:text-blue-600">Run</Link>
            <Link href="/operator/dropoff" className="hover:text-blue-600">Drop</Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
