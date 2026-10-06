const http = require('http');

const API_URL = 'http://localhost:4000';
let authToken = '';
let contentPieceId = '';
let customPersonaIds = [];
const testUserEmail = `persona_test_${Date.now()}@example.com`;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- DMA Segment Personas E2E Verification Tests ---\n');

  try {
    // 1. Sign Up & Upgrade to Phase 2 (Pro)
    console.log('[1/7] Registering test user...');
    const signupRes = await makeRequest('POST', '/api/auth/signup', {
      email: testUserEmail,
      password: 'TestPassword123'
    });
    if (signupRes.status !== 201) throw new Error('Sign up failed');
    authToken = signupRes.data.token;
    console.log('User registered successfully.');

    const authHeader = { 'Authorization': `Bearer ${authToken}` };

    console.log('Upgrading user to Phase 2 (Pro) to enable premium Personas feature...');
    const upgradeRes = await makeRequest('POST', '/api/billing/upgrade', null, authHeader);
    if (upgradeRes.status !== 200) throw new Error('Upgrade failed');
    console.log('User upgraded to Phase 2.\n');

    // 2. Onboarding Brand DNA (required to create content drafts later)
    console.log('[2/7] Submitting Brand DNA onboarding...');
    const onboardingRes = await makeRequest('POST', '/api/brand-dna', {
      brandName: 'EcoWear',
      productCategory: 'eco apparel',
      toneDescriptors: ['ethical', 'clean'],
      audienceDescription: 'eco buyers',
      styleReferences: ['minimalist'],
      ethicalPositioning: '100% circular recycled organic cotton program'
    }, authHeader);
    if (onboardingRes.status !== 201) throw new Error('Onboarding submit failed');
    console.log('Brand DNA onboarded. Triggering harvest...');

    const harvestRes = await makeRequest('POST', '/api/brand-dna/harvest', {
      websiteUrl: 'https://ecowear.com',
      socialUrls: ['https://instagram.com/ecowear'],
      competitorLinks: []
    }, authHeader);
    if (harvestRes.status !== 200) throw new Error('Harvest trigger failed');

    // Poll completion
    let completed = false;
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const checkDna = await makeRequest('GET', '/api/brand-dna', null, authHeader);
      if (checkDna.data.status === 'complete') {
        completed = true;
        break;
      }
    }
    if (!completed) throw new Error('Brand DNA status did not become complete');
    console.log('Brand DNA successfully completed harvest.\n');

    // 3. Create Custom Personas (CRUD)
    console.log('[3/7] Creating custom personas...');
    // Persona 1: Eco Conscious Segment (should generate "Eco Emma" or dynamic sandbox alliteration equivalent)
    const p1Res = await makeRequest('POST', '/api/content/personas', {
      name: 'Eco Conscious Buyers',
      description: 'Environmentally aware shoppers seeking clean alternatives',
      values: 'Sustainability, Transparency',
      ageRange: '20-30',
      platformPreference: 'Instagram'
    }, authHeader);
    if (p1Res.status !== 201) throw new Error('Persona 1 creation failed');
    customPersonaIds.push(p1Res.data.id);
    console.log('Persona 1 created successfully:');
    console.log(` - Generated Avatar Name: "${p1Res.data.name}"`);
    console.log(` - Description: "${p1Res.data.description}"`);
    console.log(` - Values: ${JSON.stringify(p1Res.data.values)}\n`);

    // Create 4 more personas to reach the limit of 5
    const segmentProfiles = [
      { name: 'Corporate Business Professionals', description: 'Enterprise users focused on ROI', values: 'ROI, Quality' },
      { name: 'Tech Developer Advocates', description: 'Developers looking for clear documentation', values: 'Documentation, Simplicity' },
      { name: 'Creative Visual Designers', description: 'Designers focusing on premium aesthetic', values: 'Aesthetic, Elegance' },
      { name: 'Athletic Sports Trainers', description: 'Athletes focused on high performance durability', values: 'Durability, Performance' }
    ];

    for (let i = 0; i < segmentProfiles.length; i++) {
      const p = segmentProfiles[i];
      const res = await makeRequest('POST', '/api/content/personas', {
        name: p.name,
        description: p.description,
        values: p.values
      }, authHeader);
      if (res.status !== 201) throw new Error(`Persona creation failed for profile ${i + 2}`);
      customPersonaIds.push(res.data.id);
      console.log(`Persona ${i + 2} created: "${res.data.name}"`);
    }
    console.log(`Successfully created ${customPersonaIds.length} custom personas.\n`);

    // 4. Assert 5-Persona limit blocks 6th creation
    console.log('[4/7] Verifying 6th persona limit block...');
    const p6Res = await makeRequest('POST', '/api/content/personas', {
      name: 'Limit Breaker Segment',
      description: 'Attempting to breach limit',
      values: 'Testing'
    }, authHeader);
    console.log('Status of 6th persona request:', p6Res.status);
    console.log('Error of 6th persona request:', p6Res.data.error);
    if (p6Res.status !== 400 || p6Res.data.error !== 'PERSONA_LIMIT_EXCEEDED') {
      throw new Error('Expected 400 PERSONA_LIMIT_EXCEEDED limit breach block');
    }
    console.log('Successfully blocked 6th persona definition.\n');

    // 5. Edit custom persona
    console.log('[5/7] Editing custom persona...');
    const editId = customPersonaIds[0];
    const editRes = await makeRequest('PUT', `/api/content/personas/${editId}`, {
      name: 'Sustainable Enthusiasts',
      description: 'Upgraded eco shoppers looking for absolute transparency',
      values: 'Transparency, Sustainability, Durability',
      ageRange: '25-35',
      platformPreference: 'Instagram'
    }, authHeader);
    if (editRes.status !== 200) throw new Error('Edit persona failed');
    console.log('Persona edited successfully:');
    console.log(` - Updated Avatar Name: "${editRes.data.name}"`);
    console.log(` - Updated Description: "${editRes.data.description}"`);
    console.log(` - Updated Values: ${JSON.stringify(editRes.data.values)}\n`);

    // 6. Delete custom persona
    console.log('[6/7] Deleting custom persona...');
    const deleteId = customPersonaIds.pop();
    const deleteRes = await makeRequest('DELETE', `/api/content/personas/${deleteId}`, null, authHeader);
    if (deleteRes.status !== 200) throw new Error('Delete persona failed');
    console.log('Persona deleted successfully. Count remains:', customPersonaIds.length, '\n');

    // 7. Request Simulated Reaction on Content Piece draft
    console.log('[7/7] Generating content draft and requesting simulated persona feedback reaction...');
    
    // Fetch matched prompt templates
    const matchTemplates = await makeRequest('GET', '/api/content/templates?platform=Instagram', null, authHeader);
    const templateId = matchTemplates.data[0].id;

    // Create Draft content piece
    const draftRes = await makeRequest('POST', '/api/content/pieces', {
      platform: 'Instagram',
      contentType: 'product launch',
      templateId
    }, authHeader);
    if (draftRes.status !== 201) {
      console.error('Draft creation failed. Status:', draftRes.status, 'Response:', draftRes.data);
      throw new Error('Draft creation failed');
    }
    contentPieceId = draftRes.data.contentPieceId;

    // Trigger simulated reaction
    const reactPersonaId = customPersonaIds[0];
    const reactRes = await makeRequest('POST', `/api/content/pieces/${contentPieceId}/personas/${reactPersonaId}/react`, null, authHeader);
    if (reactRes.status !== 200) throw new Error('Simulated reaction request failed');
    console.log('Reaction reaction returned successfully:');
    console.log('--------------------------------------------------');
    console.log(reactRes.data.reaction);
    console.log('--------------------------------------------------\n');

    if (!reactRes.data.reaction || !reactRes.data.reaction.includes('As')) {
      throw new Error('Simulated reaction did not return a valid grounding persona string');
    }

    console.log('✅ All Epic 5 Segment Personas E2E verification tests passed!');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

runTests();
