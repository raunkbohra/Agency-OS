// lib/geolocation.ts

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
  try {
    // Dynamic import to avoid loading geoip-lite at build time
    const geoip = require('geoip-lite');
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
  } catch (error) {
    // Fallback if geoip-lite is not available
    return {
      country: 'Unknown',
      region: 'global',
      currency: 'USD',
    };
  }
}
