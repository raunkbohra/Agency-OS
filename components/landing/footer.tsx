import Link from 'next/link';

const productLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Dashboard', href: '/dashboard' },
];

const companyLinks = [
  { label: 'About', href: '#' },
  { label: 'GitHub', href: 'https://github.com' },
  { label: 'Contact', href: '#' },
];

export function Footer() {
  return (
    <footer className="border-t border-border-default bg-bg-primary">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-md bg-accent-blue flex items-center justify-center">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span className="font-semibold text-text-primary tracking-tight">Agency OS</span>
            </div>
            <p className="text-sm text-text-tertiary">Run your marketing agency from one system.</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-4">Product</h4>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-tertiary hover:text-text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-4">Company</h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-tertiary hover:text-text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border-default">
          <p className="text-xs text-text-quaternary">&copy; 2026 Agency OS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
