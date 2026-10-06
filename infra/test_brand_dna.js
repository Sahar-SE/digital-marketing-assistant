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

function put(path, data, token = null) {
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
      method: 'PUT',
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
  console.log('--- DMA Brand DNA & Harvesting Verification Tests ---');

  const timestamp = Date.now();
  const testEmail = `test_dna_${timestamp}@example.com`;
  const password = 'password123';

  // 1. Register & Login
  console.log('\n[1/6] Registering test user...');
  const signupRes = await post('/api/auth/signup', { email: testEmail, password });
  if (signupRes.status !== 201) {
    console.error('Sign Up failed!');
    process.exit(1);
  }
  const token = signupRes.data.token;
  console.log('Token generated:', token.slice(0, 15) + '...');

  // 2. Query Brand DNA before completion (should return 404)
  console.log('\n[2/6] Checking Brand DNA status before onboarding...');
  const checkEmpty = await get('/api/brand-dna', token);
  console.log('Status (expect 404):', checkEmpty.status);
  console.log('Data:', checkEmpty.data);
  if (checkEmpty.status !== 404 || checkEmpty.data.error !== 'BRAND_DNA_NOT_FOUND') {
    console.error('Expected BRAND_DNA_NOT_FOUND error!');
    process.exit(1);
  }

  // 3. Submit Guided Questionnaire
  console.log('\n[3/6] Submitting Onboarding Brand DNA questionnaire...');
  const onboardingBody = {
    brandName: 'ApexLabs',
    productCategory: 'Fitness Tracker App',
    toneDescriptors: ['supportive', 'energetic'],
    audienceDescription: 'Busy developers wanting to lose weight',
    styleReferences: ['Nike', 'Apple'],
    ethicalPositioning: 'Honest pricing, no shortcuts'
  };
  
  const createRes = await post('/api/brand-dna', onboardingBody, token);
  console.log('Response Status:', createRes.status);
  console.log('Created Brand DNA Status:', createRes.data.status);
  console.log('Created Brand DNA Questionnaire Complete:', createRes.data.questionnaireComplete);
  
  if (createRes.status !== 201 || createRes.data.status !== 'incomplete' || !createRes.data.questionnaireComplete) {
    console.error('Create Brand DNA questionnaire failed!');
    process.exit(1);
  }

  // 4. Trigger Resource Harvesting
  console.log('\n[4/6] Triggering resource harvest...');
  const harvestRes = await post('/api/brand-dna/harvest', {
    websiteUrl: 'https://apexlabs.com',
    socialUrls: ['https://instagram.com/apexlabs'],
    competitorLinks: ['https://strava.com']
  }, token);

  console.log('Response Status:', harvestRes.status);
  console.log('Harvest Result Message:', harvestRes.data.message);
  console.log('Harvest Status:', harvestRes.data.harvestStatus);

  if (harvestRes.status !== 200 || harvestRes.data.harvestStatus !== 'processing') {
    console.error('Trigger harvest failed!');
    process.exit(1);
  }

  // Poll harvest completion (simulate 5 seconds delay)
  console.log('Waiting for background harvest scraper to complete...');
  let completed = false;
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const checkDna = await get('/api/brand-dna', token);
    console.log(`Polling Brand DNA (Attempt ${i+1}): status=${checkDna.data.status}, harvestStatus=${checkDna.data.harvestStatus}`);
    if (checkDna.data.harvestStatus === 'completed' && checkDna.data.status === 'complete') {
      completed = true;
      break;
    }
  }

  if (!completed) {
    console.error('Background URL harvest job timed out or failed to set status to complete!');
    process.exit(1);
  }

  // 5. Update field (inline edit)
  console.log('\n[5/6] Testing inline edit of field (ethicalPositioning)...');
  const updatedBody = {
    brandName: 'ApexLabs',
    productCategory: 'Fitness Tracker App',
    toneDescriptors: ['supportive', 'energetic'],
    audienceDescription: 'Busy developers wanting to lose weight',
    styleReferences: ['Nike', 'Apple'],
    ethicalPositioning: '100% money back guarantee, scientific support'
  };

  const updateRes = await put('/api/brand-dna', updatedBody, token);
  console.log('Response Status:', updateRes.status);
  console.log('Updated Ethical Positioning:', updateRes.data.ethicalPositioning);
  
  if (updateRes.status !== 200 || updateRes.data.ethicalPositioning !== updatedBody.ethicalPositioning) {
    console.error('Update inline field failed!');
    process.exit(1);
  }

  // 6. Fetch Version History
  console.log('\n[6/6] Retrieving Brand DNA Version History...');
  const historyRes = await get('/api/brand-dna/versions', token);
  console.log('Response Status:', historyRes.status);
  console.log('Number of Versions (expect 2):', historyRes.data.length);
  
  if (historyRes.status !== 200 || historyRes.data.length < 2) {
    console.error('Fetch version history failed or missing versions!');
    process.exit(1);
  }

  console.log('\n✅ All Epic 1 Brand DNA and Harvesting functionality passed validation!');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
