const http = require('http');

const API_URL = 'http://localhost:4000';
let authToken = '';
let contentPieceId = '';
let firstVersionBody = '';
let templateId = 'a0e0a0a0-0000-0000-0000-000000000001'; // Instagram template
const testUserEmail = `content_test_${Date.now()}@example.com`;

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
  console.log('--- DMA Content Creation & Handshake Verification Tests ---\n');

  try {
    // 1. Sign Up
    console.log('[1/8] Registering test user...');
    const signupRes = await makeRequest('POST', '/api/auth/signup', {
      email: testUserEmail,
      password: 'TestPassword123'
    });
    if (signupRes.status !== 201) throw new Error('Sign up failed');
    authToken = signupRes.data.token;
    console.log('Token generated:', authToken.slice(0, 20) + '...\n');

    const authHeader = { 'Authorization': `Bearer ${authToken}` };

    // 2. Try Draft Generation before onboarding (should fail with BRAND_DNA_INCOMPLETE)
    console.log('[2/8] Generating draft before onboarding (expecting 400)...');
    const failDraftRes = await makeRequest('POST', '/api/content/pieces', {
      platform: 'Instagram',
      contentType: 'product launch',
      templateId
    }, authHeader);
    console.log('Status:', failDraftRes.status);
    console.log('Response:', failDraftRes.data);
    if (failDraftRes.status !== 400 || failDraftRes.data.error !== 'BRAND_DNA_INCOMPLETE') {
      throw new Error('Should block draft generation if Brand DNA is incomplete');
    }
    console.log('Success: Correctly blocked draft generation.\n');

    // 3. Complete Onboarding DNA Profile
    console.log('[3/8] Completing Brand DNA onboarding...');
    const onboardingRes = await makeRequest('POST', '/api/brand-dna', {
      brandName: 'EcoWear',
      productCategory: 'organic apparel',
      toneDescriptors: ['ethical', 'sustainable', 'inspiring'],
      audienceDescription: 'millennial climate-conscious consumers',
      styleReferences: ['minimalist layout', 'earthy background colors'],
      ethicalPositioning: '100% certified organic cotton, circular recycle trade-in program'
    }, authHeader);
    if (onboardingRes.status !== 201) throw new Error('Failed to submit onboarding');
    console.log('Questionnaire complete. Status:', onboardingRes.data.status);

    console.log('Triggering background resource harvest...');
    const harvestRes = await makeRequest('POST', '/api/brand-dna/harvest', {
      websiteUrl: 'https://ecowear.com',
      socialUrls: ['https://instagram.com/ecowear']
    }, authHeader);
    if (harvestRes.status !== 200 || harvestRes.data.harvestStatus !== 'processing') {
      throw new Error('Trigger harvest failed');
    }

    console.log('Waiting for background harvest scraper to complete...');
    let harvestComplete = false;
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const checkDna = await makeRequest('GET', '/api/brand-dna', null, authHeader);
      console.log(`Polling Brand DNA (Attempt ${i+1}): status=${checkDna.data.status}, harvestStatus=${checkDna.data.harvestStatus}`);
      if (checkDna.data.harvestStatus === 'completed' && checkDna.data.status === 'complete') {
        harvestComplete = true;
        break;
      }
    }
    if (!harvestComplete) {
      throw new Error('Background harvest timed out');
    }
    console.log('Brand DNA is complete and ready!\n');

    // 4. Fetch matched templates
    console.log('[4/8] Fetching matched templates for platform Instagram...');
    const templatesRes = await makeRequest('GET', '/api/content/templates?platform=Instagram', null, authHeader);
    if (templatesRes.status !== 200) throw new Error('Failed to fetch templates');
    console.log(`Matched templates count: ${templatesRes.data.length}`);
    templatesRes.data.forEach((t, i) => console.log(` - Template ${i+1}: ${t.name} (Category: ${t.category}, Score: ${t.performanceScore}%)`));
    console.log('\n');

    // 5. Generate first draft
    console.log('[5/8] Generating draft version 1...');
    const draftRes = await makeRequest('POST', '/api/content/pieces', {
      platform: 'Instagram',
      contentType: 'product launch',
      templateId
    }, authHeader);
    if (draftRes.status !== 201) {
      throw new Error(`Draft generation failed: ${JSON.stringify(draftRes.data)}`);
    }
    contentPieceId = draftRes.data.contentPieceId;
    firstVersionBody = draftRes.data.contentBody;
    console.log('Draft generated successfully!');
    console.log('Content Piece ID:', contentPieceId);
    console.log('Version:', draftRes.data.versionNumber);
    console.log('Body snippet:', firstVersionBody.slice(0, 80) + '...\n');

    // 6. Target Segment Persona
    console.log('[6/8] Associating Segment Persona (Eco Emma)...');
    const personasRes = await makeRequest('GET', '/api/content/personas', null, authHeader);
    if (personasRes.status !== 200 || personasRes.data.length === 0) {
      throw new Error('Failed to fetch personas list');
    }
    const targetPersonaId = personasRes.data[0].id;
    console.log('Persona Eco Emma ID:', targetPersonaId);

    const personaAssocRes = await makeRequest('PUT', `/api/content/pieces/${contentPieceId}/persona`, {
      personaId: targetPersonaId
    }, authHeader);
    console.log('Persona Assoc Status:', personaAssocRes.status);
    console.log('Persona Assoc Data:', personaAssocRes.data);
    if (personaAssocRes.status !== 200 || personaAssocRes.data.personaId !== targetPersonaId) {
      throw new Error('Failed to associate persona');
    }
    console.log('Persona associated successfully.\n');

    // 7. Refine draft inline (Human-AI Handshake)
    console.log('[7/8] Refining draft (inline annotation)...');
    const refinementRes = await makeRequest('POST', `/api/content/pieces/${contentPieceId}/refine`, {
      currentBody: firstVersionBody,
      annotationText: 'make circular recycling benefits prominent',
      selectedText: 'Slide 2'
    }, authHeader);
    if (refinementRes.status !== 201) {
      throw new Error(`Refinement failed: ${JSON.stringify(refinementRes.data)}`);
    }
    console.log('Refined Version Number:', refinementRes.data.versionNumber);
    console.log('Annotation used:', refinementRes.data.annotationUsed);
    console.log('Refined body snippet:', refinementRes.data.contentBody.slice(0, 100) + '...\n');

    // 8. Fetch timelines history
    console.log('[8/8] Fetching Content Piece version history...');
    const historyRes = await makeRequest('GET', `/api/content/pieces/${contentPieceId}/versions`, null, authHeader);
    if (historyRes.status !== 200) throw new Error('Failed to fetch version list');
    console.log(`Number of version nodes: ${historyRes.data.length}`);
    historyRes.data.forEach((v) => {
      console.log(` - Version ${v.versionNumber} [Created: ${v.createdAt}]:`);
      console.log(`   Annotation: ${v.annotationUsed || '(Initial draft)'}`);
      console.log(`   Body: ${v.contentBody.replace(/\n/g, ' ')}\n`);
    });

    if (historyRes.data.length !== 2) {
      throw new Error('Timeline should track exactly 2 versions');
    }

    console.log('✅ All Epic 2 Content Creation and Human-AI Handshake tests passed!');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

runTests();
