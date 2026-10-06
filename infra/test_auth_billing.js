const http = require('http');

const API_URL = 'http://localhost:4000';

function post(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const postData = JSON.stringify(data);
    
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(path, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- DMA Backend Verification Tests ---');

  const timestamp = Date.now();
  const testEmail = `test_${timestamp}@example.com`;
  const password = 'password123';

  // 1. Sign Up
  console.log('\n[1/7] Testing Sign Up...');
  const signupRes = await post('/api/auth/signup', { email: testEmail, password });
  console.log('Response Status:', signupRes.status);
  console.log('Response Data:', signupRes.data);
  if (signupRes.status !== 201 || !signupRes.data.token) {
    console.error('Sign Up failed!');
    process.exit(1);
  }
  
  const token = signupRes.data.token;
  const userId = signupRes.data.user.userId;

  // 2. Double Sign Up (should fail)
  console.log('\n[2/7] Testing Duplicate Sign Up (should fail)...');
  const dupSignupRes = await post('/api/auth/signup', { email: testEmail, password });
  console.log('Response Status:', dupSignupRes.status);
  console.log('Response Data:', dupSignupRes.data);
  if (dupSignupRes.status !== 400) {
    console.error('Duplicate Sign Up did not prevent registration!');
    process.exit(1);
  }

  // 3. Login
  console.log('\n[3/7] Testing Log In...');
  const loginRes = await post('/api/auth/login', { email: testEmail, password });
  console.log('Response Status:', loginRes.status);
  console.log('Response Data:', loginRes.data);
  if (loginRes.status !== 200 || !loginRes.data.token) {
    console.error('Log In failed!');
    process.exit(1);
  }

  // 4. Get Profile
  console.log('\n[4/7] Testing User Profile retrieval...');
  const meRes = await get('/api/auth/me', token);
  console.log('Response Status:', meRes.status);
  console.log('Response Data:', meRes.data);
  if (meRes.status !== 200 || meRes.data.generationCredits !== 9999) {
    console.error('Profile retrieval failed or credits mismatch!');
    process.exit(1);
  }

  // 5. Consume Credit (Phase 1)
  console.log('\n[5/7] Testing Credit Consumption (Phase 1)...');
  const consumeRes = await post('/api/billing/consume-credit', {}, token);
  console.log('Response Status:', consumeRes.status);
  console.log('Response Data:', consumeRes.data);
  if (consumeRes.status !== 200 || consumeRes.data.remainingCredits !== 9999) {
    console.error('Credit consumption failed or did not decrement!');
    process.exit(1);
  }

  // 6. Upgrade User (Mock Webhook)
  console.log('\n[6/7] Testing Mock Webhook Upgrade...');
  const upgradeRes = await post('/api/billing/mock-webhook', { userId, targetPhase: 'phase_3' });
  console.log('Response Status:', upgradeRes.status);
  console.log('Response Data:', upgradeRes.data);
  if (upgradeRes.status !== 200 || upgradeRes.data.phase !== 'phase_3') {
    console.error('Mock Webhook upgrade failed!');
    process.exit(1);
  }

  // 7. Get Profile & Consume Credit (Phase 2 - Unlimited)
  console.log('\n[7/7] Testing Credit Consumption (Phase 2)...');
  const meRes2 = await get('/api/auth/me', token);
  console.log('User Phase:', meRes2.data.phase);
  
  const consumeRes2 = await post('/api/billing/consume-credit', {}, token);
  console.log('Response Status:', consumeRes2.status);
  console.log('Response Data:', consumeRes2.data);
  if (consumeRes2.status !== 200 || !consumeRes2.data.unlimited) {
    console.error('Unlimited credit consumption test failed!');
    process.exit(1);
  }

  console.log('\n✅ All backend authorization and billing endpoints passed verification!');
}

runTests().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
