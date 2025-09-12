'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <WifiOff className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          You're Offline
        </h1>
        
        <p className="mb-8 text-muted-foreground">
          It looks like you've lost your internet connection. Some features may not be available until you're back online.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Link href="/">
            <Button variant="outline" className="w-full">
              Go to Home
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-muted-foreground">
          <p>You can still use some features while offline:</p>
          <ul className="mt-2 space-y-1">
            <li>• View recent conversations</li>
            <li>• Access cached content</li>
            <li>• Use basic app features</li>
          </ul>
        </div>
      </div>
    </div>
  );
}