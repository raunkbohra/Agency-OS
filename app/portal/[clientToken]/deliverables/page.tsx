import { getClientByToken, getDeliverablesByClient } from '@/lib/db-queries';
import ClientDeliverablesList from '@/components/ClientDeliverablesList';

export default async function ClientDeliverablesPage({
  params,
}: {
  params: { clientToken: string };
}) {
  const client = await getClientByToken(params.clientToken);

  if (!client) {
    return <div className="p-8">Access denied</div>;
  }

  const deliverables = await getDeliverablesByClient(client.id, client.agency_id);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Deliverables for {client.name}</h1>
      <p className="text-text-secondary mb-6">Review and approve your deliverables</p>

      {deliverables.length === 0 ? (
        <p className="text-text-tertiary">No deliverables yet</p>
      ) : (
        <ClientDeliverablesList deliverables={deliverables} clientToken={params.clientToken} />
      )}
    </div>
  );
}
