'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { GoogleSignInButton } from '@/components/google-signin-button';
import { login, register, type LoginActionState, type RegisterActionState } from '@/app/(auth)/actions';
import { useActionState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AuthPromptProps {
  onSkip: () => void;
}

export function AuthPrompt({ onSkip }: AuthPromptProps) {
  const [showAuthCard, setShowAuthCard] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginState, loginAction] = useActionState<LoginActionState, FormData>(login, { status: 'idle' });
  const [registerState, registerAction] = useActionState<RegisterActionState, FormData>(register, { status: 'idle' });
  const router = useRouter();

  // Handle successful authentication
  useEffect(() => {
    if (loginState.status === 'success' || registerState.status === 'success') {
      // Refresh the page to get the new session
      router.refresh();
    }
  }, [loginState.status, registerState.status, router]);

  if (!showAuthCard) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Welcome to Quipe.me!</h2>
          <p className="text-muted-foreground text-sm">
            Sign in to save your conversations, access chat history, and get the full experience.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => setShowAuthCard(true)} className="min-w-32">
            Sign In / Sign Up
          </Button>
          <Button variant="outline" onClick={onSkip} className="min-w-32">
            Continue as Guest
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>
          {authMode === 'login' ? 'Sign In' : 'Sign Up'}
        </CardTitle>
        <CardDescription>
          {authMode === 'login' 
            ? 'Use your email and password to sign in'
            : 'Create an account with your email and password'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleSignInButton />
        
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        <AuthForm 
          action={authMode === 'login' ? loginAction : registerAction}
        >
          <SubmitButton 
            isSuccessful={
              (authMode === 'login' ? loginState.status : registerState.status) === 'success'
            }
          >
            {authMode === 'login' ? 'Sign In' : 'Sign Up'}
          </SubmitButton>
        </AuthForm>
        
        <div className="text-center text-sm">
          {authMode === 'login' ? (
            <p className="text-gray-600 dark:text-zinc-400">
              {"Don't have an account? "}
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              >
                Sign up
              </button>
              {' for free.'}
            </p>
          ) : (
            <p className="text-gray-600 dark:text-zinc-400">
              {'Already have an account? '}
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              >
                Sign in
              </button>
              {' instead.'}
            </p>
          )}
        </div>
        
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onSkip} className="text-sm">
            Continue as Guest
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}