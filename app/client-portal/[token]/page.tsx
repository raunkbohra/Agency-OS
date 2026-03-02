import { notFound } from 'next/navigation';
import { getClientByPortalToken, getDeliverablesByClient } from '@/lib/db-queries';
import ClientPortalView from '@/components/ClientPortalView';

interface ClientPortalPageProps {
  params: {
    token: string;
  };
}

export default async function ClientPortalPage({ params }: ClientPortalPageProps) {
  try {
    // Get client by portal token
    const client = await getClientByPortalToken(params.token);

    if (!client) {
      return notFound();
    }

    // Get deliverables for this client
    const deliverables = await getDeliverablesByClient(client.id);

    return (
      <ClientPortalView
        clientName={client.name}
        deliverables={deliverables}
      />
    );
  } catch (error) {
    console.error('Error loading client portal:', error);
    return notFound();
  }
}
