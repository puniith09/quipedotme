import { geolocation } from '@vercel/functions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get IP-based location data from Vercel (no user consent required)
    const { longitude, latitude, city, country, region } = geolocation(request);
    
    // Get additional network info
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const userAgent = request.headers.get('user-agent') || '';
    
    const locationData = {
      latitude: latitude || null,
      longitude: longitude || null,
      city: city || null,
      country: country || null,
      region: region || null,
      source: 'ip_geolocation',
      provider: 'vercel',
      timestamp: Date.now(),
      accuracy: 'city_level', // IP-based accuracy is typically city-level
      clientIP: clientIP.split(',')[0].trim(), // First IP if multiple
      userAgent: userAgent,
      // Try to infer ISP/carrier from headers (limited info available)
      networkHints: {
        hasXForwardedFor: !!request.headers.get('x-forwarded-for'),
        hasCFRay: !!request.headers.get('cf-ray'), // Cloudflare
        hasXVercelIP: !!request.headers.get('x-vercel-ip-country'),
        serverRegion: process.env.VERCEL_REGION || 'unknown'
      }
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