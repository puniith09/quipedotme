'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { GoogleSignInButton } from '@/components/google-signin-button';
import { login, register, type LoginActionState, type RegisterActionState } from '@/app/(auth)/actions';

interface AuthFormDisplayProps {
  message: string;
  defaultMode: 'login' | 'signup';
}

export function AuthFormDisplay({ message, defaultMode }: AuthFormDisplayProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>(defaultMode === 'login' ? 'login' : 'register');
  const [loginState, loginAction] = useActionState<LoginActionState, FormData>(login, { status: 'idle' });
  const [registerState, registerAction] = useActionState<RegisterActionState, FormData>(register, { status: 'idle' });
  const router = useRouter();

  // Handle successful authentication
  useEffect(() => {
    if (loginState.status === 'success' || registerState.status === 'success') {
      // Trigger AI response by sending a message to the chat
      const event = new CustomEvent('authSuccess', { 
        detail: { 
          type: authMode === 'login' ? 'login' : 'registration' 
        } 
      });
      window.dispatchEvent(event);
      
      // Refresh page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1000);
    }
  }, [loginState.status, registerState.status, router, authMode]);

  return (
    <Card className="max-w-md mx-auto my-4">
      <CardHeader className="text-center">
        <CardTitle>
          {authMode === 'login' ? 'Sign In' : 'Create Account'}
        </CardTitle>
        <CardDescription>
          {message}
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
          {/* Show error messages */}
          {authMode === 'login' && loginState.status === 'failed' && (
            <div className="text-red-500 text-sm mb-2">
              Login failed. Please check your credentials and try again.
            </div>
          )}
          {authMode === 'login' && loginState.status === 'invalid_data' && (
            <div className="text-red-500 text-sm mb-2">
              Please enter a valid email and password.
            </div>
          )}
          {authMode === 'register' && registerState.status === 'failed' && (
            <div className="text-red-500 text-sm mb-2">
              Registration failed. Please try again.
            </div>
          )}
          {authMode === 'register' && registerState.status === 'invalid_data' && (
            <div className="text-red-500 text-sm mb-2">
              Please enter a valid email and password (minimum 6 characters).
            </div>
          )}
          
          <SubmitButton 
            isSuccessful={
              (authMode === 'login' ? loginState.status : registerState.status) === 'success'
            }
          >
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
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
      </CardContent>
    </Card>
  );
}