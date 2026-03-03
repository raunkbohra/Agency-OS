// app/api/user-location/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { detectRegionByIP } from '@/lib/geolocation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               '0.0.0.0';

    const location = detectRegionByIP(ip);

    return NextResponse.json(location, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Geolocation error:', error);
    return NextResponse.json(
      { country: 'Unknown', region: 'global', currency: 'USD' },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // Cache error for 5 min
        },
      }
    );
  }
}
