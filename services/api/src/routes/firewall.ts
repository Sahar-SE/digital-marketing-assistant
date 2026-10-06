import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbQuery } from '../db';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { EthicalFirewallService } from '../services/ethical-firewall';

export const firewallRouter = Router();

// Helper to check and debit credit ledger for Phase 1 users
async function debitCreditIfNeeded(userId: string): Promise<{ success: boolean; errorStatus?: number; errorResponse?: any }> {
  const userQuery = await dbQuery('SELECT phase, generation_credits FROM users WHERE user_id = $1', [userId]);
  if (userQuery.rows.length === 0) {
    return { success: false, errorStatus: 404, errorResponse: { error: 'User not found' } };
  }

  const { phase } = userQuery.rows[0];
  if (phase === 'phase_2' || phase === 'phase_3') {
    return { success: true };
  }

  const updateResult = await dbQuery(
    'UPDATE users SET generation_credits = generation_credits - 1 WHERE user_id = $1 AND generation_credits > 0 RETURNING generation_credits',
    [userId]
  );

  if (updateResult.rows.length === 0) {
    return { success: false, errorStatus: 403, errorResponse: { error: 'CREDITS_EXHAUSTED' } };
  }

  return { success: true };
}

// Helper to fetch complete Brand DNA profile
async function getCompleteBrandDna(userId: string): Promise<{ success: boolean; dna?: any; errorStatus?: number; errorResponse?: any }> {
  const dnaQuery = await dbQuery('SELECT * FROM brand_dna WHERE user_id = $1', [userId]);
  if (dnaQuery.rows.length === 0) {
    return { success: false, errorStatus: 400, errorResponse: { error: 'BRAND_DNA_INCOMPLETE' } };
  }

  const row = dnaQuery.rows[0];
  if (row.status !== 'complete') {
    return { success: false, errorStatus: 400, errorResponse: { error: 'BRAND_DNA_INCOMPLETE' } };
  }

  return {
    success: true,
    dna: {
      id: row.id,
      userId: row.user_id,
      brandName: row.brand_name,
      productCategory: row.product_category,
      toneDescriptors: row.tone_descriptors,
      audienceDescription: row.audience_description,
      styleReferences: row.style_references,
      ethicalPositioning: row.ethical_positioning,
      status: row.status,
      questionnaireComplete: row.questionnaire_complete
    }
  };
}

// 1. Run Ethical Firewall Check (Story 3.1 / FR-8)
firewallRouter.post('/pieces/:id/evaluate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const contentPieceId = req.params.id;

  try {
    // A. Verify ownership
    const pieceQuery = await dbQuery('SELECT * FROM content_pieces WHERE id = $1 AND user_id = $2', [contentPieceId, userId]);
    if (pieceQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Content piece not found' });
    }

    // B. Check complete Brand DNA
    const dnaCheck = await getCompleteBrandDna(userId!);
    if (!dnaCheck.success) {
      return res.status(dnaCheck.errorStatus!).json(dnaCheck.errorResponse);
    }

    // C. Check credits
    const creditCheck = await debitCreditIfNeeded(userId!);
    if (!creditCheck.success) {
      return res.status(creditCheck.errorStatus!).json(creditCheck.errorResponse);
    }

    // D. Fetch latest content version body
    const versionQuery = await dbQuery(
      'SELECT version_number, content_body FROM content_versions WHERE content_piece_id = $1 ORDER BY version_number DESC LIMIT 1',
      [contentPieceId]
    );
    if (versionQuery.rows.length === 0) {
      return res.status(400).json({ error: 'No content versions exist for this content piece' });
    }
    const { version_number, content_body } = versionQuery.rows[0];

    // E. Run Ethical Firewall Evaluation
    const reportData = await EthicalFirewallService.evaluate(content_body, dnaCheck.dna);

    // F. Store report in database
    await dbQuery(
      'INSERT INTO content_health_reports (content_piece_id, version_number, report_data) VALUES ($1, $2, $3)',
      [contentPieceId, version_number, JSON.stringify(reportData)]
    );

    res.json({
      contentPieceId,
      versionNumber: version_number,
      report: reportData
    });
  } catch (error) {
    console.error('[Firewall Evaluation Route Error]:', error);
    res.status(500).json({ error: 'Internal server error running ethical check' });
  }
});

// 2. Log Human Verification audit trail (Story 3.3 / FR-10)
firewallRouter.post('/pieces/:id/resolve', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const contentPieceId = req.params.id;
  const { checkType } = req.body; // e.g. 'bias', 'hallucination', etc.

  if (!checkType) {
    return res.status(400).json({ error: 'Missing checkType' });
  }

  // Plagiarism check self-verification block rule (FR-10)
  if (checkType === 'originality') {
    return res.status(403).json({ error: 'HUMAN_VERIFIED_NOT_PERMITTED_FOR_PLAGIARISM' });
  }

  try {
    // A. Verify ownership
    const pieceQuery = await dbQuery('SELECT * FROM content_pieces WHERE id = $1 AND user_id = $2', [contentPieceId, userId]);
    if (pieceQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Content piece not found' });
    }

    // B. Create audit log row (immutable table write check)
    await dbQuery(
      'INSERT INTO firewall_resolution_logs (user_id, content_piece_id, check_type, action) VALUES ($1, $2, $3, $4)',
      [userId, contentPieceId, checkType, 'HUMAN_VERIFIED']
    );

    // C. Update active health report status in database to 'pass' to clear the gate
    const reportQuery = await dbQuery(
      'SELECT id, report_data FROM content_health_reports WHERE content_piece_id = $1 ORDER BY version_number DESC LIMIT 1',
      [contentPieceId]
    );

    let updatedReport = null;
    if (reportQuery.rows.length > 0) {
      const { id, report_data } = reportQuery.rows[0];
      const data = typeof report_data === 'string' ? JSON.parse(report_data) : report_data;
      
      if (data[checkType]) {
        data[checkType].status = 'pass';
        data[checkType].resolved = true;
        data[checkType].resolvedBy = req.user?.email || 'User';
      }

      await dbQuery(
        'UPDATE content_health_reports SET report_data = $1 WHERE id = $2',
        [JSON.stringify(data), id]
      );
      updatedReport = data;
    }

    res.json({ success: true, checkType, report: updatedReport });
  } catch (error) {
    console.error('[Firewall Resolution Log Error]:', error);
    res.status(500).json({ error: 'Internal server error resolving check flag' });
  }
});

// 3. Fetch latest ContentHealthReport and Resolution Logs (Story 3.2 / FR-9)
firewallRouter.get('/pieces/:id/report', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const contentPieceId = req.params.id;

  try {
    // A. Verify ownership
    const pieceQuery = await dbQuery('SELECT * FROM content_pieces WHERE id = $1 AND user_id = $2', [contentPieceId, userId]);
    if (pieceQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Content piece not found' });
    }

    // B. Fetch active report
    const reportQuery = await dbQuery(
      'SELECT report_data FROM content_health_reports WHERE content_piece_id = $1 ORDER BY version_number DESC LIMIT 1',
      [contentPieceId]
    );

    // C. Fetch logs
    const logsQuery = await dbQuery(
      'SELECT * FROM firewall_resolution_logs WHERE content_piece_id = $1 ORDER BY created_at ASC',
      [contentPieceId]
    );

    res.json({
      report: reportQuery.rows[0]?.report_data || null,
      resolutionLogs: logsQuery.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        contentPieceId: row.content_piece_id,
        checkType: row.check_type,
        action: row.action,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('[Fetch Health Report Error]:', error);
    res.status(500).json({ error: 'Internal server error fetching content health metadata' });
  }
});
