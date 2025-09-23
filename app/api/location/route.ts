import { geolocation } from '@vercel/functions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get IP-based location data from Vercel (no user consent required)
    const { longitude, latitude, city, country, region } = geolocation(request);
    
    const locationData = {
      latitude: latitude || null,
      longitude: longitude || null,
      city: city || null,
      country: country || null,
      region: region || null,
      source: 'ip_geolocation',
      provider: 'vercel',
      timestamp: Date.now(),
      accuracy: 'city_level' // IP-based accuracy is typically city-level
    };

    return NextResponse.json(locationData);
  } catch (error) {
    console.error('Location API error:', error);
    return NextResponse.json(
      { error: 'Failed to get location data' },
      { status: 500 }
    );
  }
}