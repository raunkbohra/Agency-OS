import { auth } from '@/lib/auth';
import { updateAgency, getAgencyById } from '@/lib/db-queries';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Agency ID is required' }, { status: 400 });
    }

    // Verify user can access this agency (must match their session agency)
    if (id !== session.user.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const agency = await getAgencyById(id);
    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    return NextResponse.json(agency);
  } catch (error) {
    console.error('Agency fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch agency' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const updated = await updateAgency(session.user.agencyId, {
      name: body.name,
      email: body.email,
      currency: body.currency,
      country: body.country,
      bank_name: body.bank_name,
      bank_account: body.bank_account,
      bank_routing: body.bank_routing,
      logo_url: body.logo_url,
      address: body.address,
      billing_address: body.billing_address,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Agency update error:', error);
    return NextResponse.json({ error: 'Failed to update agency' }, { status: 500 });
  }
}
