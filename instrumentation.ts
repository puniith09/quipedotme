import { registerOTel } from '@vercel/otel';

export function register() {
  // Initialize New Relic first (if license key is provided)
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    try {
      require('newrelic');
      console.log('New Relic instrumentation initialized');
    } catch (error) {
      console.error('Failed to initialize New Relic:', error);
    }
  }
  
  // Keep existing Vercel OpenTelemetry instrumentation
  registerOTel({ serviceName: 'quipe-ai-chatbot' });
}
