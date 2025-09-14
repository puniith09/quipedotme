// Test New Relic Events API with Node.js
const https = require('https');

const config = {
  licenseKey: '60c45774c4a25f32ca29ae52adffd4520289NRAL',
  accountId: '7120052',
  applicationId: '601584297'
};

function sendEvent(eventData) {
  const data = JSON.stringify(eventData);
  
  const options = {
    hostname: 'insights-collector.newrelic.com',
    port: 443,
    path: `/v1/accounts/${config.accountId}/events`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Insert-Key': config.licenseKey,
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`✅ Headers:`, res.headers);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Response:', responseData);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error);
  });

  req.write(data);
  req.end();
  
  console.log('📤 Sent event:', JSON.stringify(eventData, null, 2));
}

// Test events
console.log('🚀 Testing New Relic Events API with Node.js...\n');

// 1. Simple test event
sendEvent({
  eventType: 'NodeJSTest',
  appName: 'quipedotme',
  appId: parseInt(config.applicationId),
  timestamp: Math.floor(Date.now() / 1000),
  message: 'Testing from Node.js script',
  testId: 'nodejs_test_001',
  environment: 'development'
});

// 2. Browser simulation event
setTimeout(() => {
  sendEvent({
    eventType: 'BrowserSimulation',
    appName: 'quipedotme',
    appId: parseInt(config.applicationId),
    timestamp: Math.floor(Date.now() / 1000),
    pageUrl: 'http://localhost:3000/chat',
    userAgent: 'Mozilla/5.0 (Test Browser)',
    sessionId: 'nodejs_session_123',
    userId: 'nodejs_user_456'
  });
}, 1000);

// 3. Chat interaction event
setTimeout(() => {
  sendEvent({
    eventType: 'ChatInteraction',
    appName: 'quipedotme',
    appId: parseInt(config.applicationId),
    timestamp: Math.floor(Date.now() / 1000),
    messageType: 'user',
    message: 'What are the advantages of using Next.js?',
    conversationId: 'nodejs_conv_789',
    userId: 'nodejs_user_456'
  });
}, 2000);

// 4. Performance metric event
setTimeout(() => {
  sendEvent({
    eventType: 'PerformanceMetric',
    appName: 'quipedotme',
    appId: parseInt(config.applicationId),
    timestamp: Math.floor(Date.now() / 1000),
    metricName: 'page_load_time',
    value: 1250,
    page: '/chat',
    browser: 'Chrome',
    device: 'desktop'
  });
}, 3000);

console.log('\n⏳ Sending 4 test events... Check results above ⬆️');