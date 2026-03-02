import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Download, CheckCircle2, Clock } from 'lucide-react';

export default async function ContractDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Fetch contract details
  const contractResult = await db.query(
    `SELECT c.*, cl.name as client_name, cl.email as client_email
     FROM contracts c
     JOIN clients cl ON c.client_id = cl.id
     WHERE c.id = $1 AND c.agency_id = $2`,
    [id, session.user.agencyId]
  );

  if (contractResult.rows.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-secondary border border-border-default rounded-xl p-6">
          <h1 className="text-xl font-bold text-accent-red mb-2">Contract Not Found</h1>
          <p className="text-sm text-text-secondary mb-4">The contract you're looking for doesn't exist.</p>
          <Link href="/dashboard/contracts" className="text-sm text-accent-blue hover:text-accent-blue/80 font-medium">
            Back to Contracts
          </Link>
        </div>
      </div>
    );
  }

  const contract = contractResult.rows[0];

  // Fetch signatures for this contract
  const signaturesResult = await db.query(
    `SELECT * FROM contract_signatures WHERE contract_id = $1 ORDER BY created_at DESC`,
    [id]
  );

  const signatures = signaturesResult.rows;

  return (
    <div className="min-h-screen bg-bg-primary p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/dashboard/contracts"
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Contracts
        </Link>

        {/* Header */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">{contract.file_name}</h1>
              <p className="text-text-secondary">Contract with {contract.client_name}</p>
            </div>
            {contract.file_url && (
              <a
                href={contract.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 rounded-lg text-sm font-semibold transition-colors"
              >
                <Download className="h-4 w-4" />
                View PDF
              </a>
            )}
          </div>

          {/* Status section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-bg-tertiary rounded-lg border border-border-default">
              <div className="text-xs text-text-tertiary uppercase tracking-wide mb-2">Status</div>
              <div className="flex items-center gap-2">
                {contract.signed ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-accent-green" />
                    <span className="text-lg font-semibold text-accent-green">Signed</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-accent-amber" />
                    <span className="text-lg font-semibold text-accent-amber">Pending</span>
                  </>
                )}
              </div>
            </div>

            {contract.signed_at && (
              <div className="p-4 bg-bg-tertiary rounded-lg border border-border-default">
                <div className="text-xs text-text-tertiary uppercase tracking-wide mb-2">Signed Date</div>
                <div className="text-lg font-semibold text-text-primary">
                  {new Date(contract.signed_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            )}

            <div className="p-4 bg-bg-tertiary rounded-lg border border-border-default">
              <div className="text-xs text-text-tertiary uppercase tracking-wide mb-2">Uploaded</div>
              <div className="text-lg font-semibold text-text-primary">
                {new Date(contract.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Signatures section */}
        {signatures.length > 0 && (
          <div className="bg-bg-secondary border border-border-default rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-text-primary mb-6">Signatures ({signatures.length})</h2>

            <div className="space-y-4">
              {signatures.map((sig: any) => (
                <div key={sig.id} className="p-4 border border-border-default rounded-lg">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-text-primary">{sig.signer_name}</h3>
                      <p className="text-sm text-text-secondary">
                        Signed on {new Date(sig.signed_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {sig.signature_url && (
                      <a
                        href={sig.signature_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent-blue hover:text-accent-blue/80 font-medium"
                      >
                        View Signature
                      </a>
                    )}
                  </div>

                  {/* Signature preview if available */}
                  {sig.signature_url && (
                    <div className="border-t border-border-default pt-4">
                      <img
                        src={sig.signature_url}
                        alt={`${sig.signer_name} signature`}
                        className="h-24 object-contain bg-bg-tertiary rounded p-2"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!signatures.length && (
          <div className="bg-bg-secondary border border-border-default rounded-xl p-6 md:p-8 text-center">
            <Clock className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Signatures Yet</h3>
            <p className="text-text-secondary">This contract is waiting to be signed by the client.</p>
          </div>
        )}
      </div>
    </div>
  );
}
