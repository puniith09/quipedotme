import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/queries';

export async function GET() {
  // Check required environment variables
  const envChecks = {
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  };

  const missingEnvVars = Object.entries(envChecks)
    .filter(([key, exists]) => !exists)
    .map(([key]) => key);

  try {
    // Simple database health check using raw SQL
    const result = await db.execute(sql`SELECT 1 as health_check`);
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'unknown',
      environmentVariables: envChecks,
      missingEnvironmentVariables: missingEnvVars
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV || 'unknown'
      },
      { status: 503 }
    );
  }
}