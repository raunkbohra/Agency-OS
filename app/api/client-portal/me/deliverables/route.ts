import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '@/lib/client-auth';
import { getDeliverablesByClient } from '@/lib/db-queries';

export interface DeliverableResponse {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  itemCount: number;
  itemsCompleted: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getClientSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deliverables = await getDeliverablesByClient(session.clientId);

    const formattedDeliverables: DeliverableResponse[] = deliverables.map((d: any) => {
      // Use due_date as createdAt if available, otherwise use month_year, otherwise use current date
      let createdAt = new Date().toISOString();
      if (d.due_date) {
        createdAt = new Date(d.due_date).toISOString();
      } else if (d.month_year) {
        createdAt = new Date(d.month_year).toISOString();
      }

      return {
        id: d.id,
        title: d.title,
        status: d.status,
        dueDate: d.due_date ? new Date(d.due_date).toISOString() : null,
        createdAt,
        itemCount: parseInt(d.item_count) || 0,
        itemsCompleted: parseInt(d.items_completed) || 0,
      };
    });

    return NextResponse.json({ deliverables: formattedDeliverables });
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
