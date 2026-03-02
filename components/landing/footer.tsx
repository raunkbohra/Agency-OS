import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#workflow' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Client Portal', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

const socialLinks = [
  { icon: Github, label: 'GitHub', href: 'https://github.com' },
  { icon: Twitter, label: 'Twitter', href: 'https://twitter.com' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
];

export function Footer() {
  return (
    <footer
      className="relative"
      style={{
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--landing-divider)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Top: brand + links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)' }}
              >
                <span className="text-white font-bold text-[11px] tracking-tight">A</span>
              </div>
              <span className="font-semibold tracking-tight text-sm" style={{ color: 'var(--text-primary)' }}>Agency OS</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              Run your marketing agency from one system. Plans, clients, invoices, and deliverables — all connected.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2 mt-6">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: 'var(--landing-badge-bg)',
                    border: '1px solid var(--landing-badge-border)',
                    color: 'var(--text-secondary)',
                  }}
                  aria-label={social.label}
                >
                  <social.icon size={14} />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-200 hover:text-text-primary"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-7 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--landing-divider)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            &copy; 2026 Agency OS. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Built for agencies that ship.
          </p>
        </div>
      </div>
    </footer>
  );
}
