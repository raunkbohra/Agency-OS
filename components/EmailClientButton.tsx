'use client';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import EmailClientModal from './EmailClientModal';

export default function EmailClientButton({ clientId, clientName, clientEmail }: { clientId: string; clientName: string; clientEmail: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-bg-secondary border border-border-default text-text-primary rounded-lg font-medium hover:bg-bg-hover transition-colors">
        <Mail className="h-3.5 w-3.5" />
        Email
      </button>
      <EmailClientModal clientId={clientId} clientName={clientName} clientEmail={clientEmail} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
