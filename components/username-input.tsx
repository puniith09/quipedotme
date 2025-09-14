'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Card, CardBody } from '@heroui/card';

interface UsernameInputProps {
  initialValue?: string;
  targetUsername?: string;
  onSuccess?: () => void;
}

export function UsernameInput({ 
  initialValue, 
  targetUsername,
  onSuccess 
}: UsernameInputProps) {
  const [username, setUsername] = useState(initialValue || targetUsername || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClaim = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/claim-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim username');
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
      
      // Refresh the page to update the URL
      setTimeout(() => {
        window.location.href = `/${username}`;
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim username');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-sm">
        <CardBody className="p-4 text-center bg-green-50">
          <div className="text-green-800">
            <p className="text-lg font-semibold">🎉 Success!</p>
            <p className="text-sm">Username @{username} is now yours!</p>
            <p className="text-xs mt-2">Redirecting to your profile...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="max-w-sm">
      <CardBody className="p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Choose your username:
          </label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            startContent="@"
            variant="bordered"
            className="mt-1"
            color={error ? 'danger' : 'default'}
            disabled={isLoading}
          />
          {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
          )}
        </div>
        <Button 
          color="primary" 
          size="sm" 
          className="w-full"
          onClick={handleClaim}
          isLoading={isLoading}
          disabled={!username.trim() || isLoading}
        >
          {isLoading ? 'Claiming...' : 'Claim Username'}
        </Button>
      </CardBody>
    </Card>
  );
}