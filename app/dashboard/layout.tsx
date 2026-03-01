import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || !session.user || !session.user.agencyId) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile nav */}
      <MobileNav />

      {/* Main content */}
      <main className="lg:pl-sidebar bg-dot-grid min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
