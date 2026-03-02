'use client';
import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

export default function CopyOnboardingLink({ agencyId }: { agencyId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/onboard/${agencyId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-bg-secondary border border-border-default text-text-secondary rounded-lg font-medium hover:bg-bg-hover transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-accent-green" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Client Signup Link'}
    </button>
  );
}
