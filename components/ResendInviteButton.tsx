'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';

interface ResendInviteButtonProps {
  clientId: string;
  clientName: string;
}

export default function ResendInviteButton({ clientId, clientName }: ResendInviteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResendInvite = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/dashboard/clients/${clientId}/resend-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend invite');
      }

      setMessage({
        type: 'success',
        text: `Invite sent to ${clientName}`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to resend invite',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleResendInvite}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-secondary border border-border-default hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-text-primary"
      >
        <Mail className="h-4 w-4" />
        {isLoading ? 'Sending...' : 'Resend Invite'}
      </button>
      {message && (
        <div
          className={`text-xs px-3 py-1.5 rounded-lg ${
            message.type === 'success'
              ? 'bg-accent-green/10 text-accent-green'
              : 'bg-accent-red/10 text-accent-red'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
