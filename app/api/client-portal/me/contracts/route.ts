import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '@/lib/client-auth';
import { getContractsByClient, getSigningTokenByContractId } from '@/lib/db-queries';

export interface ContractResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  signed: boolean;
  signingUrl: string | null;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getClientSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contracts = await getContractsByClient(session.clientId, session.agencyId);

    const formattedContracts: ContractResponse[] = await Promise.all(
      contracts.map(async (c: any) => {
        const signingToken = await getSigningTokenByContractId(c.id);
        return {
          id: c.id,
          fileName: c.file_name,
          fileUrl: c.file_url,
          signed: c.signed,
          signingUrl: signingToken ? `/sign/contracts/${signingToken}` : null,
          createdAt: new Date(c.created_at).toISOString(),
        };
      })
    );

    return NextResponse.json({ contracts: formattedContracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
