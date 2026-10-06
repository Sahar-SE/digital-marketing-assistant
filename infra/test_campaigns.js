const http = require('http');

const API_URL = 'http://localhost:4000';
let authToken = '';
let campaignId = '';
let contentPieceId = '';
let personaId = '';
const testUserEmail = `campaign_test_${Date.now()}@example.com`;

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
  console.log('--- DMA Campaigns E2E Verification Tests ---\n');

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

    console.log('Upgrading user to Phase 2 (Pro) to enable premium Campaigns Simulator...');
    const upgradeRes = await makeRequest('POST', '/api/billing/upgrade', null, authHeader);
    if (upgradeRes.status !== 200) throw new Error('Upgrade failed');
    console.log('User upgraded to Phase 2.\n');

    // 2. Onboarding Brand DNA
    console.log('[2/7] Submitting Brand DNA onboarding...');
    const onboardingRes = await makeRequest('POST', '/api/brand-dna', {
      brandName: 'CleanWear',
      productCategory: 'organic clothing',
      toneDescriptors: ['minimalist', 'clean'],
      audienceDescription: 'eco shoppers',
      styleReferences: ['Patagonia'],
      ethicalPositioning: '100% circular recycled organic linen program'
    }, authHeader);
    if (onboardingRes.status !== 201) throw new Error('Onboarding submit failed');
    
    // Trigger harvest to set brand DNA to complete
    const harvestRes = await makeRequest('POST', '/api/brand-dna/harvest', {
      websiteUrl: 'https://cleanwear.com',
      socialUrls: [],
      competitorLinks: []
    }, authHeader);
    if (harvestRes.status !== 200) throw new Error('Harvest trigger failed');

    let completed = false;
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const checkDna = await makeRequest('GET', '/api/brand-dna', null, authHeader);
      if (checkDna.data.status === 'complete') {
        completed = true;
        break;
      }
    }
    if (!completed) throw new Error('Brand DNA status did not become complete');
    console.log('Brand DNA completed harvest.\n');

    // 3. Create target segment persona
    console.log('[3/7] Creating target Segment Persona...');
    const personaRes = await makeRequest('POST', '/api/content/personas', {
      name: 'Organic Olivia',
      description: 'Loves natural organic fabrics and zero plastic packaging',
      values: 'Sustainability, Packaging'
    }, authHeader);
    if (personaRes.status !== 201) throw new Error('Persona creation failed');
    personaId = personaRes.data.id;
    console.log(`Created Segment Persona: "${personaRes.data.name}" (ID: ${personaId})\n`);

    // 4. Trigger Coordinated Campaign Generation
    console.log('[4/7] Generating coordinated Campaign calendar strategy...');
    const generateRes = await makeRequest('POST', '/api/content/campaigns', {
      name: 'Spring linen release',
      description: 'Launching our latest 100% organic linen shirts and trousers program. trigger_originality',
      launchDate: '2026-09-01',
      duration: 30,
      platforms: ['Instagram', 'LinkedIn', 'Blog'],
      personaId
    }, authHeader);
    if (generateRes.status !== 201) throw new Error('Campaign generation failed');
    campaignId = generateRes.data.campaignId;
    console.log(`Coordinated campaign calendar generated successfully (ID: ${campaignId}).\n`);
    console.log('Campaign generation response data:', JSON.stringify(generateRes.data));

    // 5. Fetch Campaign Details & Assert Prompt Template References
    console.log('[5/7] Querying generated campaign details...');
    const detailRes = await makeRequest('GET', `/api/content/campaigns/${campaignId}`, null, authHeader);
    if (detailRes.status !== 200) throw new Error('Failed to retrieve campaign details');
    console.log('Campaign details response data:', JSON.stringify(detailRes.data));
    
    console.log(`Campaign Name: "${detailRes.data.campaign.name}"`);
    console.log(`Generated Posts Count: ${detailRes.data.pieces.length}`);

    // Assert that every generated post references a PromptTemplate and does not contain inline prompt string
    for (const piece of detailRes.data.pieces) {
      if (!piece.template_id) {
        throw new Error(`Piece ${piece.id} on ${piece.platform} is missing template_id reference!`);
      }
      console.log(` - Post on ${piece.platform} (${piece.content_type}) references Template: "${piece.template_id}"`);
    }
    console.log('All posts successfully referenced valid templates.\n');

    contentPieceId = detailRes.data.pieces[0].id;

    // 6. Update scheduling via PUT (Drag and Drop simulation)
    console.log('[6/7] Simulating calendar rescheduling (drag-and-drop)...');
    const newScheduleDate = '2026-09-05T00:00:00.000Z';
    const scheduleRes = await makeRequest('PUT', `/api/content/pieces/${contentPieceId}/schedule`, {
      scheduledDate: newScheduleDate
    }, authHeader);
    if (scheduleRes.status !== 200) throw new Error('Failed to reschedule post');
    console.log(`Post rescheduled successfully to: ${scheduleRes.data.piece.scheduled_date}\n`);

    // 7. Batch Firewall Evaluation & Campaign Approval blocks
    console.log('[7/7] Executing batch campaigns Ethical Firewall check & Approval...');
    const approveRes = await makeRequest('POST', `/api/content/campaigns/${campaignId}/approve`, null, authHeader);
    if (approveRes.status !== 200) throw new Error('Batch approval endpoint failed');
    
    console.log('Approval Success Status:', approveRes.data.success);
    console.log('Unresolved Flagged Pieces Count:', approveRes.data.flaggedPieceIds.length);

    // Assert that campaigns cannot be approved if unresolved flags exist (red cells block)
    if (approveRes.data.success !== false || approveRes.data.flaggedPieceIds.length === 0) {
      throw new Error('Expected campaign approval block due to unresolved mock firewall check flags');
    }
    console.log('Approval blocked successfully as expected. Blocked post outlines highlighted red.\n');

    console.log('✅ All Epic 6 Campaign Simulator E2E verification tests passed!');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

runTests();
