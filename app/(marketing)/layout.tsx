import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
