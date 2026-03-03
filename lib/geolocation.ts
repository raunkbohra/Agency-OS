// lib/geolocation.ts

import * as geoip from 'geoip-lite';

export type Region = 'global' | 'india' | 'nepal';

export interface UserLocation {
  country: string;
  region: Region;
  currency: string;
}

const regionMap: Record<string, Region> = {
  IN: 'india',
  NP: 'nepal',
};

export function detectRegionByIP(ip: string): UserLocation {
  const geo = geoip.lookup(ip);

  if (!geo) {
    return {
      country: 'Unknown',
      region: 'global',
      currency: 'USD',
    };
  }

  const country = geo.country;
  const region = regionMap[country] || 'global';
  const currency = region === 'india' ? 'INR' : region === 'nepal' ? 'NPR' : 'USD';

  return {
    country: country,
    region,
    currency,
  };
}
