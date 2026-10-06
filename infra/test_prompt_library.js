const http = require('http');

const API_URL = 'http://localhost:4000';
let authToken = '';
let contentPieceId = '';
let customTemplateId = '';
let systemTemplateId = 'a0e0a0a0-0000-0000-0000-000000000001';
const testUserEmail = `prompt_test_${Date.now()}@example.com`;

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
  console.log('--- DMA Self-Growing Prompt Library & Scorer Verification Tests ---\n');

  try {
    // 1. Sign Up & Upgrade to Phase 2 (Pro)
    console.log('[1/10] Registering test user...');
    const signupRes = await makeRequest('POST', '/api/auth/signup', {
      email: testUserEmail,
      password: 'TestPassword123'
    });
    if (signupRes.status !== 201) throw new Error('Sign up failed');
    authToken = signupRes.data.token;
    console.log('User signed up successfully.');

    const authHeader = { 'Authorization': `Bearer ${authToken}` };

    console.log('Upgrading user to Phase 2 (Pro)...');
    const upgradeRes = await makeRequest('POST', '/api/billing/upgrade', null, authHeader);
    if (upgradeRes.status !== 200) throw new Error('Upgrade failed');
    console.log('User successfully upgraded to Phase 2.\n');

    // 2. Onboarding Brand DNA
    console.log('[2/10] Submitting Brand DNA questionnaire to trigger auto-seeding scraper...');
    const onboardingRes = await makeRequest('POST', '/api/brand-dna', {
      brandName: 'CircularApparel',
      productCategory: 'eco apparel',
      toneDescriptors: ['ethical', 'clean'],
      audienceDescription: 'eco buyers',
      styleReferences: ['minimalist'],
      ethicalPositioning: '100% circular recycled organic cotton program'
    }, authHeader);
    if (onboardingRes.status !== 201) throw new Error('Onboarding submit failed');

    // Trigger URL harvest
    const harvestRes = await makeRequest('POST', '/api/brand-dna/harvest', {
      websiteUrl: 'https://circularapparel.com'
    }, authHeader);
    if (harvestRes.status !== 200) throw new Error('Trigger harvest failed');

    // Poll harvest completion
    let harvestComplete = false;
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const checkDna = await makeRequest('GET', '/api/brand-dna', null, authHeader);
      if (checkDna.data.harvestStatus === 'completed' && checkDna.data.status === 'complete') {
        harvestComplete = true;
        break;
      }
    }
    if (!harvestComplete) throw new Error('Brand DNA harvest timed out');
    console.log('Scraper completed. Seeded templates generated.\n');

    // 3. Fetch Library and check harvested templates
    console.log('[3/10] Verifying seeded harvested templates in library...');
    const libRes = await makeRequest('GET', '/api/content/templates/library', null, authHeader);
    if (libRes.status !== 200) throw new Error('Library fetch failed');
    
    const harvestedTemplates = libRes.data.filter(t => t.source === 'harvest');
    console.log(`Found ${harvestedTemplates.length} harvested templates:`);
    harvestedTemplates.forEach(t => console.log(` - Template: "${t.name}"`));
    console.log('\n');

    if (harvestedTemplates.length === 0) {
      throw new Error('Onboarding scraper did not seed harvested templates');
    }

    // 4. Create custom prompt template (CRUD)
    console.log('[4/10] Creating custom template...');
    const createRes = await makeRequest('POST', '/api/content/templates', {
      name: 'Custom Product Launch Template',
      category: 'Product Launch',
      subcategory: 'Email Blast',
      templateBody: 'Send a clean email about our circular recycled apparel program.',
      variables: ['brandName', 'productCategory'],
      platform: 'Email',
      industry: 'Apparel'
    }, authHeader);
    if (createRes.status !== 201) throw new Error('Template creation failed');
    customTemplateId = createRes.data.id;
    console.log('Custom template created successfully. ID:', customTemplateId, '\n');

    // 5. Attempt to edit/delete system template (should be blocked)
    console.log('[5/10] Verifying system template read-only lock...');
    const systemUpdateRes = await makeRequest('PUT', `/api/content/templates/${systemTemplateId}`, {
      name: 'Hacked System Template'
    }, authHeader);
    console.log('Update response status:', systemUpdateRes.status);
    console.log('Update response error:', systemUpdateRes.data.error);
    if (systemUpdateRes.status !== 403 || systemUpdateRes.data.error !== 'TEMPLATE_SYSTEM_READONLY') {
      throw new Error('Hacking system template should be locked');
    }

    const systemDeleteRes = await makeRequest('DELETE', `/api/content/templates/${systemTemplateId}`, null, authHeader);
    console.log('Delete response status:', systemDeleteRes.status);
    console.log('Delete response error:', systemDeleteRes.data.error);
    if (systemDeleteRes.status !== 403 || systemDeleteRes.data.error !== 'TEMPLATE_SYSTEM_READONLY') {
      throw new Error('Deleting system template should be locked');
    }
    console.log('System templates are verified as strictly read-only.\n');

    // 6. Edit custom template
    console.log('[6/10] Editing custom template...');
    const updateRes = await makeRequest('PUT', `/api/content/templates/${customTemplateId}`, {
      name: 'Updated Product Launch Template',
      category: 'Product Launch',
      templateBody: 'Send an eco circular email for CleanApparel.',
      platform: 'Email'
    }, authHeader);
    if (updateRes.status !== 200) throw new Error('Edit failed');
    console.log('Custom template updated successfully. New Name:', updateRes.data.name, '\n');

    // 7. Duplicate template
    console.log('[7/10] Duplicating template...');
    const duplicateRes = await makeRequest('POST', `/api/content/templates/${customTemplateId}/duplicate`, null, authHeader);
    if (duplicateRes.status !== 201) throw new Error('Duplicate failed');
    console.log('Template duplicated successfully. Title:', duplicateRes.data.name, '\n');

    // 8. Soft archive template
    console.log('[8/10] Archiving template...');
    const archiveRes = await makeRequest('DELETE', `/api/content/templates/${customTemplateId}`, null, authHeader);
    if (archiveRes.status !== 200) throw new Error('Archive failed');
    
    // Verify it is excluded from standard library fetch
    const fetchAgain = await makeRequest('GET', '/api/content/templates/library', null, authHeader);
    const activeMatch = fetchAgain.data.find(t => t.id === customTemplateId);
    if (activeMatch) {
      throw new Error('Archived template should not be returned in default library browse');
    }
    console.log('Template soft-archived successfully.\n');

    // 9. Create draft and Publish content piece to simulate performance data
    console.log('[9/10] Preparing published content piece to feed automated performance sync...');
    
    // Fetch matched system template for platform selection
    const matchTemplates = await makeRequest('GET', '/api/content/templates?platform=Instagram', null, authHeader);
    const usedSystemTemplateId = matchTemplates.data[0].id;
    console.log('Using template ID:', usedSystemTemplateId);

    const draftRes = await makeRequest('POST', '/api/content/pieces', {
      platform: 'Instagram',
      contentType: 'product launch',
      templateId: usedSystemTemplateId
    }, authHeader);
    if (draftRes.status !== 201) throw new Error('Draft creation failed');
    contentPieceId = draftRes.data.contentPieceId;

    // Publish Content
    console.log('Publishing content piece...');
    const publishRes = await makeRequest('POST', `/api/content/pieces/${contentPieceId}/publish`, null, authHeader);
    if (publishRes.status !== 200) throw new Error('Content publishing failed');
    console.log('Piece status updated to published.\n');

    // 10. Run Weekly Performance Auto-Scoring Sync job (Manually triggered)
    console.log('[10/10] Running performance sync scoring job...');
    const syncRes = await makeRequest('POST', '/api/content/templates/sync-performance', null, authHeader);
    if (syncRes.status !== 200) throw new Error('Scoring sync request failed');
    console.log('Sync job completed. Result message:', syncRes.data.message);

    // Verify template performance score is populated
    const checkTemplateLib = await makeRequest('GET', '/api/content/templates/library', null, authHeader);
    const scoredTemplate = checkTemplateLib.data.find(t => t.id === usedSystemTemplateId);
    console.log('Updated template performance score:', scoredTemplate.performanceScore);
    console.log('Updated template last scored timestamp:', scoredTemplate.lastScoredAt);
    console.log('\n');

    if (!scoredTemplate.performanceScore || !scoredTemplate.lastScoredAt) {
      throw new Error('Weekly performance job failed to calculate and save template rolling score');
    }

    console.log('✅ All Epic 4 Self-Growing Prompt Library & Cron Scorer tests passed!');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

runTests();
