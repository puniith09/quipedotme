'use client';

import { GoogleSignInButton } from '@/components/google-signin-button';
import { IframeGoogleSignInButton } from '@/components/iframe-google-signin';
import { InlineGoogleSignIn } from '@/components/inline-google-signin';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Card, CardBody } from '@heroui/card';

interface UIComponentRendererProps {
  component: {
    type: string;
    props: Record<string, any>;
    message: string;
  };
}

export function UIComponentRenderer({ component }: UIComponentRendererProps) {
  const { type, props, message } = component;

  const renderComponent = () => {
    switch (type) {
      case 'google-signin-button':
        return (
          <Card className="max-w-sm">
            <CardBody className="p-4 text-center">
              <IframeGoogleSignInButton {...props} />
            </CardBody>
          </Card>
        );
      case 'username-input':
        return (
          <Card className="max-w-sm">
            <CardBody className="p-4 space-y-3">
              <Input
                placeholder="Enter username..."
                startContent="@"
                variant="bordered"
                {...props}
              />
              <Button color="primary" size="sm" className="w-full">
                Continue
              </Button>
            </CardBody>
          </Card>
        );
      case 'profile-form':
        return (
          <Card className="max-w-sm">
            <CardBody className="p-4 space-y-3">
              <Input
                placeholder="Tell us about yourself..."
                variant="bordered"
                {...props}
              />
              <Button color="primary" size="sm" className="w-full">
                Save Profile
              </Button>
            </CardBody>
          </Card>
        );
      case 'success-card':
        return (
          <Card className="max-w-sm">
            <CardBody className="p-4 text-center bg-green-50">
              <p className="text-green-800">🎉 Profile setup complete!</p>
              <Button color="success" size="sm" className="mt-2">
                View Profile
              </Button>
            </CardBody>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="my-4">
      {message && (
        <p className="mb-3 text-sm text-gray-600">{message}</p>
      )}
      {renderComponent()}
    </div>
  );
}