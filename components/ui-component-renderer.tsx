'use client';

import { GoogleSignInButton } from '@/components/google-signin-button';

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
        return <GoogleSignInButton {...props} />;
      case 'username-input':
        return (
          <div className="p-4 border rounded-lg">
            <input 
              type="text" 
              placeholder="Enter username..." 
              className="w-full p-2 border rounded"
              {...props}
            />
          </div>
        );
      case 'profile-form':
        return (
          <div className="p-4 border rounded-lg">
            <textarea 
              placeholder="Tell us about yourself..." 
              className="w-full p-2 border rounded"
              {...props}
            />
          </div>
        );
      case 'success-card':
        return (
          <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-800">🎉 Profile setup complete!</p>
          </div>
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