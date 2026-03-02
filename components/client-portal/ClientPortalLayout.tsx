'use client';

import ClientPortalNav from './ClientPortalNav';
import React from 'react';

interface ClientPortalLayoutProps {
  children: React.ReactNode;
  clientName: string;
  title?: string;
  subtitle?: string;
}

export default function ClientPortalLayout({
  children,
  clientName,
  title,
  subtitle,
}: ClientPortalLayoutProps) {
  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {/* Navigation */}
      <ClientPortalNav clientName={clientName} />

      {/* Main Content */}
      <main
        className="pt-16 md:pt-20 pb-12"
        style={{
          background: 'var(--bg-primary)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          {title && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{ color: 'var(--text-secondary)' }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Page Content */}
          {children}
        </div>
      </main>
    </div>
  );
}
