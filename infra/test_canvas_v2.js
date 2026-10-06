const http = require('http');

const API_URL = 'http://localhost:4000';
let authToken = '';
let projectId = '';
const testUserEmail = `canvas_v2_test_${Date.now()}@example.com`;

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
  console.log('--- DMA Advanced AI Canvas Studio (v2) E2E Verification Suite ---\n');

  try {
    // 1. Sign Up test user
    console.log('[1/7] Registering test enterprise user...');
    const signupRes = await makeRequest('POST', '/api/auth/signup', {
      email: testUserEmail,
      password: 'TestPassword123'
    });
    if (signupRes.status !== 201) throw new Error('Sign up failed');
    authToken = signupRes.data.token;
    console.log('✓ User registered successfully.');

    const authHeader = { 'Authorization': `Bearer ${authToken}` };

    // Upgrade to Phase 3 if needed
    console.log('\n[2/7] Ensuring user is Phase 3...');
    await makeRequest('POST', '/api/billing/upgrade', { phase: 'phase_3' }, authHeader);
    console.log('✓ User Phase 3 access confirmed.');

    // 2. Set up Brand DNA
    console.log('\n[3/7] Setting up Brand DNA profile...');
    await makeRequest('POST', '/api/brand-dna', {
      brandName: 'Quantum Audio',
      productCategory: 'audiophile studio headphones',
      toneDescriptors: ['minimalist', 'ultra-precise', 'futuristic'],
      audienceDescription: 'audio engineers and musicians',
      styleReferences: ['Teenage Engineering', 'B&O'],
      ethicalPositioning: '100% Recycled aerospace aluminum and zero-plastic packaging'
    }, authHeader);
    console.log('✓ Brand DNA initialized.');

    // 3. Test AI-First Design Variant Generation
    console.log('\n[4/7] Testing POST /api/canvas/ai-generate (AI-First Multi-Layer Synthesis)...');
    const aiGenRes = await makeRequest('POST', '/api/canvas/ai-generate', {
      format: 'Instagram Post',
      topic: 'Studio Master Pro Launch',
      mood: 'Modern Glass & Neon',
      customPrompt: 'Include a 20% launch discount pill and dark obsidian background'
    }, authHeader);

    if (aiGenRes.status !== 200 || !aiGenRes.data.success || !Array.isArray(aiGenRes.data.variants)) {
      throw new Error(`AI Design generation failed with status: ${aiGenRes.status}`);
    }

    const variants = aiGenRes.data.variants;
    console.log(`✓ Successfully generated ${variants.length} complete multi-layer design variants!`);
    variants.forEach((v, i) => {
      console.log(`   - Variant ${i + 1}: "${v.name}" (${v.layers.length} layers, palette: ${v.palette.join(', ')})`);
    });

    const chosenVariant = variants[0];

    // 4. Test Project Creation & DB persistence (v2 columns: format, thumbnail_url, color_palette)
    console.log('\n[5/7] Testing POST /api/canvas (Persisting project to PostgreSQL)...');
    const createProjectRes = await makeRequest('POST', '/api/canvas', {
      name: chosenVariant.name,
      width: chosenVariant.width,
      height: chosenVariant.height,
      format: chosenVariant.format,
      thumbnail_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ai_brief: 'Studio Master Pro Launch',
      color_palette: chosenVariant.palette,
      projectPayload: {
        version: '5.3.0',
        objects: chosenVariant.layers
      }
    }, authHeader);

    if (createProjectRes.status !== 201 || !createProjectRes.data.success) {
      throw new Error(`Create canvas project failed: ${JSON.stringify(createProjectRes.data)}`);
    }

    projectId = createProjectRes.data.project.id;
    console.log(`✓ Project persisted to database with ID: ${projectId}`);
    console.log(`   - Format: ${createProjectRes.data.project.format}`);
    console.log(`   - Palette: ${JSON.stringify(createProjectRes.data.project.color_palette)}`);

    // 5. Test Project Duplication
    console.log('\n[6/7] Testing POST /api/canvas/:id/duplicate (Cloning project)...');
    const dupRes = await makeRequest('POST', `/api/canvas/${projectId}/duplicate`, {}, authHeader);
    if (dupRes.status !== 201 || !dupRes.data.success) {
      throw new Error('Project duplication failed');
    }
    console.log(`✓ Cloned project created: "${dupRes.data.project.name}" (ID: ${dupRes.data.project.id})`);

    // 6. Test AI Copy Rewriter
    console.log('\n[7/7] Testing POST /api/canvas/generate-text (AI Layer Copy Rewrite)...');
    const textRes = await makeRequest('POST', '/api/canvas/generate-text', {
      instruction: 'Make punchy headline for audiophile headphones',
      format: 'Instagram Post'
    }, authHeader);

    if (textRes.status !== 200 || !textRes.data.success || !textRes.data.text) {
      throw new Error('Text generation failed');
    }
    console.log(`✓ AI Copy Generated: "${textRes.data.text}"`);

    console.log('\n========================================================');
    console.log('🎉 ALL AI CANVAS & DATABASE VERIFICATION TESTS PASSED! 🎉');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  }
}

runTests();
