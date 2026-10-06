const http = require('http');

const API_URL = 'http://localhost:4000';
let authToken = '';
let projectId = '';
const testUserEmail = `canvas_test_${Date.now()}@example.com`;

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
  console.log('--- DMA Design Canvas E2E Verification Tests ---\n');

  try {
    // 1. Sign Up & Verify Phase 3 Gate is active
    console.log('[1/8] Registering test user...');
    const signupRes = await makeRequest('POST', '/api/auth/signup', {
      email: testUserEmail,
      password: 'TestPassword123'
    });
    if (signupRes.status !== 201) throw new Error('Sign up failed');
    authToken = signupRes.data.token;
    console.log('User registered successfully.');

    const authHeader = { 'Authorization': `Bearer ${authToken}` };

    console.log('Verifying Phase 3 Gate block on canvas endpoints for Phase 1 user...');
    const canvasGateCheck = await makeRequest('GET', '/api/canvas', null, authHeader);
    if (canvasGateCheck.status !== 403) {
      throw new Error(`Expected 403 Forbidden phase gate block, got status: ${canvasGateCheck.status}`);
    }
    console.log('Gate active. Access blocked successfully.');

    // 2. Upgrade to Phase 3 (Enterprise)
    console.log('\n[2/8] Upgrading user to Phase 3 (Enterprise)...');
    const upgradeRes = await makeRequest('POST', '/api/billing/upgrade', { phase: 'phase_3' }, authHeader);
    if (upgradeRes.status !== 200) throw new Error('Upgrade failed');
    console.log(`User upgraded to Phase: ${upgradeRes.data.phase}`);

    console.log('Re-checking canvas access...');
    const canvasAccessCheck = await makeRequest('GET', '/api/canvas', null, authHeader);
    if (canvasAccessCheck.status !== 200) {
      throw new Error(`Expected 200 OK after upgrade, got status: ${canvasAccessCheck.status}`);
    }
    console.log('Access granted successfully.');

    // 3. Submitting Brand DNA questionnaire and completing harvest
    console.log('\n[3/8] Submitting Brand DNA onboarding questionnaire...');
    const onboardingRes = await makeRequest('POST', '/api/brand-dna', {
      brandName: 'DesignCorp',
      productCategory: 'premium furniture',
      toneDescriptors: ['minimalist', 'architectural'],
      audienceDescription: 'home designers',
      styleReferences: ['Muji'],
      ethicalPositioning: 'Sourced from circular sustainable wood cooperatives'
    }, authHeader);
    if (onboardingRes.status !== 201) throw new Error('Onboarding submit failed');

    const harvestRes = await makeRequest('POST', '/api/brand-dna/harvest', {
      websiteUrl: 'https://designcorp.com',
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
    console.log('Brand DNA completed harvest.');

    // 4. Generate visual layout templates
    console.log('\n[4/8] Generating visual layouts pre-populated with Brand DNA styles...');
    const layoutsRes = await makeRequest('POST', '/api/canvas/generate-layouts', {
      format: 'Instagram Post',
      topic: 'Minimalist wood design launch'
    }, authHeader);

    if (layoutsRes.status !== 200) {
      throw new Error(`Failed to generate layouts, got status: ${layoutsRes.status}`);
    }

    const layouts = layoutsRes.data.layouts;
    if (!layouts || layouts.length !== 3) {
      throw new Error(`Expected 3 layout options, got: ${layouts ? layouts.length : 'none'}`);
    }

    console.log(`Generated Layout options count: ${layouts.length}`);
    layouts.forEach((opt, idx) => {
      console.log(` - Layout Option ${idx + 1}: "${opt.name}" size: ${opt.width}x${opt.height}`);
      const bg = opt.layers.find(l => l.type === 'background');
      const texts = opt.layers.filter(l => l.type === 'text');
      console.log(`   Background Image URL: ${bg ? bg.url.slice(0, 50) + '...' : 'none'}`);
      console.log(`   Overlay Layers: ${texts.length} text elements`);
    });

    // 5. Save generated layout as a new project
    console.log('\n[5/8] Saving chosen layout option as a new canvas project...');
    const chosenLayout = layouts[0];
    const saveRes = await makeRequest('POST', '/api/canvas', {
      name: `${chosenLayout.name} - Instagram Post`,
      width: chosenLayout.width,
      height: chosenLayout.height,
      projectPayload: {
        layers: chosenLayout.layers
      }
    }, authHeader);

    if (saveRes.status !== 201) {
      throw new Error(`Failed to save canvas project, got status: ${saveRes.status}`);
    }

    projectId = saveRes.data.project.id;
    console.log(`Project saved successfully (ID: ${projectId})`);

    // 6. Verify listing projects returns the saved project
    console.log('\n[6/8] Fetching active projects list...');
    const listRes = await makeRequest('GET', '/api/canvas', null, authHeader);
    const found = listRes.data.projects.find(p => p.id === projectId);
    if (!found) {
      throw new Error('Saved project not found in active list');
    }
    console.log(`Found project: "${found.name}" containing ${found.project_payload.layers.length} layers.`);

    // 7. Update canvas project layout details
    console.log('\n[7/8] Simulating design modifications & saving changes...');
    const activeLayers = [...found.project_payload.layers];
    // Modify one text layer copy
    const textLayer = activeLayers.find(l => l.type === 'text');
    if (textLayer) {
      textLayer.text = 'MODIFIED BRAND HEADLINE';
      textLayer.fontSize = 48;
    }
    const updateRes = await makeRequest('PUT', `/api/canvas/${projectId}`, {
      name: 'Spring wood release - Instagram Post',
      projectPayload: {
        layers: activeLayers
      }
    }, authHeader);

    if (updateRes.status !== 200) {
      throw new Error(`Failed to update project, got status: ${updateRes.status}`);
    }

    const updated = updateRes.data.project;
    const updatedText = updated.project_payload.layers.find(l => l.type === 'text');
    console.log(`Modified project name: "${updated.name}"`);
    console.log(`Updated text layer value: "${updatedText ? updatedText.text : 'none'}" size: ${updatedText ? updatedText.fontSize : 'none'}px`);

    if (updated.name !== 'Spring wood release - Instagram Post' || !updatedText || updatedText.text !== 'MODIFIED BRAND HEADLINE') {
      throw new Error('Project changes were not successfully persisted');
    }

    // 8. Delete project and confirm removal
    console.log('\n[8/8] Deleting project...');
    const deleteRes = await makeRequest('DELETE', `/api/canvas/${projectId}`, null, authHeader);
    if (deleteRes.status !== 200) {
      throw new Error(`Failed to delete project, got status: ${deleteRes.status}`);
    }
    console.log('Project deleted.');

    const checkListRes = await makeRequest('GET', '/api/canvas', null, authHeader);
    const stillExists = checkListRes.data.projects.some(p => p.id === projectId);
    if (stillExists) {
      throw new Error('Project still exists after deletion');
    }
    console.log('Project verified removed from active list.');

    console.log('\n✅ All Epic 7 Product Design Canvas E2E verification tests passed!');

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

runTests();
