'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function OnboardingHandler() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Check if user just returned from authentication
    const isOnboarding = searchParams.get('onboarding') === 'true';
    const conversationState = sessionStorage.getItem('conversationState');
    
    if (isOnboarding && session?.user && conversationState) {
      try {
        const state = JSON.parse(conversationState);
        
        // Clear the stored state
        sessionStorage.removeItem('conversationState');
        
        // Remove the onboarding parameter from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('onboarding');
        router.replace(url.pathname + url.hash, { scroll: false });
        
        // Trigger continuation of onboarding flow
        // We can dispatch a custom event that the chat component can listen to
        window.dispatchEvent(new CustomEvent('continueOnboarding', {
          detail: { 
            user: session.user,
            previousState: state
          }
        }));
        
      } catch (error) {
        console.error('Failed to restore conversation state:', error);
      }
    }
  }, [session, searchParams, router, status]);

  return null; // This component doesn't render anything
}