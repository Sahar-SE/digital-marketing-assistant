'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SegmentPersona {
  id: string;
  name: string;
  description: string;
  values: string[];
}

interface CampaignPiece {
  id: string;
  campaign_id: string;
  platform: string;
  content_type: string;
  persona_id: string | null;
  scheduled_date: string;
  status: string;
  content_body: string;
  template_id: string | null;
  version_number: number;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  launch_date: string;
  duration: number;
  persona_id: string | null;
  created_at: string;
}

interface ContentHealthReport {
  originality: { status: string };
  bias: { status: string };
  hallucination: { status: string };
  brand_tone: { status: string };
  data_cleansing: { status: string };
}

export default function CampaignsPage() {
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [personas, setPersonas] = useState<SegmentPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Active Campaign State
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [campaignPieces, setCampaignPieces] = useState<CampaignPiece[]>([]);
  const [firewallReports, setFirewallReports] = useState<{ [pieceId: string]: ContentHealthReport | null }>({});
  const [flaggedPieces, setFlaggedPieces] = useState<{ [pieceId: string]: boolean }>({});
  const [isApproved, setIsApproved] = useState(false);
  const [approving, setApproving] = useState(false);

  // New Campaign Form Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');
  const [launchDate, setLaunchDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('7');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Instagram', 'LinkedIn']);
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [generating, setGenerating] = useState(false);

  // Viewport Responsive checks (FR-16)
  const [isDesktop, setIsDesktop] = useState(true);

  // Editor Side Sheet Overlay (FR-17)
  const [editingPiece, setEditingPiece] = useState<CampaignPiece | null>(null);
  const [editingPieceBody, setEditingPieceBody] = useState('');
  const [savingPiece, setSavingPiece] = useState(false);

  // Adaptation Dialog Warning (FR-16)
  const [adaptationWarning, setAdaptationWarning] = useState<{
    pieceId: string;
    fromPlatform: string;
    toPlatform: string;
    targetDate: string;
  } | null>(null);

  // Persona Re-generation Dialog (FR-16)
  const [personaRegenPrompt, setPersonaRegenPrompt] = useState<{
    pieceId: string;
    newPersonaId: string;
    personaName: string;
  } | null>(null);

  useEffect(() => {
    fetchProfile();
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResize = () => {
    setIsDesktop(window.innerWidth >= 1024);
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('dma_token');
      if (!token) return;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/profile`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        if (data.user.phase !== 'phase_1') {
          fetchCampaigns();
          fetchPersonas();
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/campaigns`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setCampaigns(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonas = async () => {
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/personas`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setPersonas(data);
        if (data.length > 0) {
          setSelectedPersonaId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCampaignDetails = async (id: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/campaigns/${id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setActiveCampaign(data.campaign);
        setCampaignPieces(data.pieces);
        setSelectedCampaignId(id);
        setIsApproved(false);

        // Fetch health reports for each piece
        const reports: { [key: string]: ContentHealthReport | null } = {};
        const flagged: { [key: string]: boolean } = {};
        for (const p of data.pieces) {
          const reportRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/firewall/pieces/${p.id}/report`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (reportRes.ok) {
            const reportData = await reportRes.json();
            if (reportData.report) {
              const parsedReport = typeof reportData.report === 'string' ? JSON.parse(reportData.report) : reportData.report;
              reports[p.id] = parsedReport;

              // Check if contains flags
              let isFlagged = false;
              const checks = ['originality', 'bias', 'hallucination', 'brand_tone', 'data_cleansing'] as const;
              for (const k of checks) {
                if (parsedReport[k] && parsedReport[k].status !== 'pass') {
                  isFlagged = true;
                  break;
                }
              }
              flagged[p.id] = isFlagged;
            } else {
              reports[p.id] = null;
              flagged[p.id] = true; // Count unresolved/unchecked
            }
          }
        }
        setFirewallReports(reports);
        setFlaggedPieces(flagged);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/upgrade`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (res.ok) {
        alert('Successfully upgraded to Pro Tier (Phase 2)!');
        fetchProfile();
      } else {
        alert('Upgrade failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !campaignDesc.trim() || !launchDate || !selectedPlatforms.length || !selectedPersonaId) {
      alert('All campaign parameters are required.');
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/campaigns`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: campaignName,
            description: campaignDesc,
            launchDate,
            duration: parseInt(duration, 10),
            platforms: selectedPlatforms,
            personaId: selectedPersonaId
          })
        }
      );

      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setCampaignName('');
        setCampaignDesc('');
        fetchCampaigns();
        fetchCampaignDetails(data.campaignId);
      } else {
        alert(data.error || 'Failed to generate campaign');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePlatformCheckbox = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  // Drag and Drop implementation (FR-16)
  const handleDragStart = (e: React.DragEvent, pieceId: string) => {
    if (!isDesktop) return;
    e.dataTransfer.setData('text/plain', pieceId);
  };

  const handleDropPost = async (e: React.DragEvent, targetDayIndex: number) => {
    e.preventDefault();
    if (!isDesktop || !activeCampaign) return;

    const pieceId = e.dataTransfer.getData('text/plain');
    const piece = campaignPieces.find(p => p.id === pieceId);
    if (!piece) return;

    // Calculate target date
    const targetDate = new Date(activeCampaign.launch_date);
    targetDate.setDate(targetDate.getDate() + targetDayIndex);

    // Save scheduled date immediately in DB
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${pieceId}/schedule`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ scheduledDate: targetDate.toISOString() })
        }
      );

      if (res.ok) {
        // Optimistic UI update
        setCampaignPieces(prev =>
          prev.map(p => (p.id === pieceId ? { ...p, scheduled_date: targetDate.toISOString() } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag to a different platform cell Adaptations (FR-16)
  const handleAdaptDrop = (pieceId: string, fromPlatform: string, toPlatform: string, targetDayIndex: number) => {
    if (fromPlatform === toPlatform) return;
    if (!activeCampaign) return;

    const targetDate = new Date(activeCampaign.launch_date);
    targetDate.setDate(targetDate.getDate() + targetDayIndex);

    setAdaptationWarning({
      pieceId,
      fromPlatform,
      toPlatform,
      targetDate: targetDate.toISOString()
    });
  };

  const acceptAdaptation = async () => {
    if (!adaptationWarning) return;
    const { pieceId, toPlatform, targetDate } = adaptationWarning;

    try {
      const token = localStorage.getItem('dma_token');
      // 1. Move/Schedule
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${pieceId}/schedule`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ scheduledDate: targetDate })
        }
      );

      // 2. Refinement adapt copy for toPlatform (simulating request in mock)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${pieceId}/refine`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            annotationText: `Adapt content piece platform guidelines formatted for ${toPlatform}`
          })
        }
      );

      if (res.ok) {
        setAdaptationWarning(null);
        if (selectedCampaignId) {
          fetchCampaignDetails(selectedCampaignId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const keepAsIs = async () => {
    if (!adaptationWarning) return;
    const { pieceId, targetDate } = adaptationWarning;

    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${pieceId}/schedule`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ scheduledDate: targetDate })
        }
      );
      if (res.ok) {
        setCampaignPieces(prev =>
          prev.map(p => (p.id === pieceId ? { ...p, scheduled_date: targetDate } : p))
        );
        setAdaptationWarning(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Change post targeted persona in cell select (FR-16)
  const handlePersonaChange = async (pieceId: string, newPersonaId: string) => {
    const selected = personas.find(p => p.id === newPersonaId);
    if (!selected) return;

    setPersonaRegenPrompt({
      pieceId,
      newPersonaId,
      personaName: selected.name
    });
  };

  const triggerPersonaRegen = async () => {
    if (!personaRegenPrompt) return;
    const { pieceId, newPersonaId } = personaRegenPrompt;

    try {
      const token = localStorage.getItem('dma_token');
      // 1. Update persona ID
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${pieceId}/persona`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ personaId: newPersonaId })
        }
      );

      // 2. Trigger refinement regeneration targeted for new persona
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${pieceId}/refine`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            annotationText: `Regenerate copy targeted specifically for persona`
          })
        }
      );

      if (res.ok) {
        setPersonaRegenPrompt(null);
        if (selectedCampaignId) {
          fetchCampaignDetails(selectedCampaignId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Batch Ethical Firewall Campaign Approval (FR-17)
  const handleApproveCampaign = async () => {
    if (!selectedCampaignId || approving) return;
    setApproving(true);

    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/campaigns/${selectedCampaignId}/approve`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (res.ok) {
        setIsApproved(data.success);
        
        // Map flagged pieces
        const flagged: { [key: string]: boolean } = {};
        for (const p of campaignPieces) {
          flagged[p.id] = data.flaggedPieceIds.includes(p.id);
        }
        setFlaggedPieces(flagged);

        if (!data.success) {
          alert(`Approval blocked: ${data.message}. Flagged items highlighted in red.`);
        } else {
          alert('Campaign approved and successfully scheduled!');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApproving(false);
    }
  };

  const handleOpenEditor = (piece: CampaignPiece) => {
    setEditingPiece(piece);
    setEditingPieceBody(piece.content_body);
  };

  const handleSaveEditorPiece = async () => {
    if (!editingPiece) return;
    setSavingPiece(true);

    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${editingPiece.id}/refine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            annotationText: 'Manual edit and save from campaigns dashboard',
            selectedText: editingPiece.content_body,
            refinedBody: editingPieceBody
          })
        }
      );

      if (res.ok) {
        setEditingPiece(null);
        if (selectedCampaignId) {
          fetchCampaignDetails(selectedCampaignId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPiece(false);
    }
  };

  // Get days list arrays
  const getDaysArray = () => {
    if (!activeCampaign) return [];
    return Array.from({ length: activeCampaign.duration }, (_, i) => i);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <span style={{ fontSize: '1.5rem' }}>🔄</span>
      </div>
    );
  }

  // Phase 1 Access Upgrade Gate Screen (FR-15 check)
  if (user && user.phase === 'phase_1') {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '80px auto',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        backgroundColor: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🗓️</div>
        <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', marginBottom: '16px' }}>
          Unlock Campaign Simulator
        </h2>
        <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '32px' }}>
          Campaign Simulator is a premium **Phase 2** (Pro) feature. Upgrade to create coordinated calendars across multiple platforms, adjust post scheduling via drag-and-drop, and run batch audits using the Ethical Firewall.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleUpgrade}
            disabled={upgradeLoading}
            style={{
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: upgradeLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            {upgradeLoading ? 'Upgrading...' : 'Upgrade to Pro'}
          </button>
          <Link href="/dashboard" style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem', textDecoration: 'underline' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', fontFamily: 'var(--font-inter), sans-serif' }}>
      
      {/* Viewport responsive info banner (FR-16) */}
      {!isDesktop && (
        <div style={{
          backgroundColor: 'var(--primary-subtle)',
          color: 'var(--primary)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>ℹ️</span> Rearrange posts on desktop. (Calendar view is currently read-only).
        </div>
      )}

      {/* Main Campaign Header details */}
      {!selectedCampaignId ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '2.25rem', margin: 0, color: 'var(--foreground)' }}>
                Campaign Simulator
              </h1>
              <p style={{ margin: '6px 0 0 0', color: 'var(--foreground-muted)', fontSize: '0.95rem' }}>
                Plan, edit, and approve coordinated campaigns.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              New Campaign
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '64px',
              borderRadius: '12px',
              border: '2px dashed var(--border)',
              backgroundColor: '#f8fafc',
              color: 'var(--foreground-muted)'
            }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '16px' }}>🗓️</span>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--foreground)' }}>No simulated campaigns</h3>
              <p style={{ margin: '6px 0 16px 0', fontSize: '0.85rem' }}>Start coordinate campaign timelines across multiple platforms.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{ backgroundColor: 'var(--primary)', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                Create your first campaign
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {campaigns.map(c => (
                <div
                  key={c.id}
                  onClick={() => fetchCampaignDetails(c.id)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)' }}>{c.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', fontWeight: 600, padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '20px' }}>
                      {c.duration} Days
                    </span>
                  </div>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>{c.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>
                    <span>Launch Date: {new Date(c.launch_date).toLocaleDateString()}</span>
                    <span>Created: {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Calendar view panel */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <button
                onClick={() => setSelectedCampaignId(null)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, padding: 0, marginBottom: '8px' }}
              >
                ← Back to Campaigns
              </button>
              <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', margin: 0 }}>
                {activeCampaign?.name}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
                Launch Date: {activeCampaign && new Date(activeCampaign.launch_date).toLocaleDateString()} ({activeCampaign?.duration} Days)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={handleApproveCampaign}
                disabled={approving || isApproved}
                style={{
                  backgroundColor: isApproved ? '#16a34a' : 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: (approving || isApproved) ? 'not-allowed' : 'pointer'
                }}
              >
                {approving ? 'Batch Auditing...' : isApproved ? '✓ Campaign Approved' : 'Approve Campaign'}
              </button>
            </div>
          </div>

          {/* Calendar Grid representation */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '40px'
          }}>
            {getDaysArray().map(dayIndex => {
              const date = new Date(activeCampaign!.launch_date);
              date.setDate(date.getDate() + dayIndex);
              const dateStr = date.toISOString().split('T')[0];

              // Find posts scheduled for this day
              const dayPieces = campaignPieces.filter(p => p.scheduled_date.startsWith(dateStr));

              return (
                <div
                  key={dayIndex}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropPost(e, dayIndex)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px',
                    minHeight: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'background-color 0.15s ease'
                  }}
                  onDragEnter={(e) => {
                    if (isDesktop) e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--foreground-muted)', fontWeight: 600 }}>
                    <span>Day {dayIndex + 1}</span>
                    <span>{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>

                  {dayPieces.map(piece => {
                    const isFlagged = flaggedPieces[piece.id];
                    return (
                      <div
                        key={piece.id}
                        draggable={isDesktop}
                        onDragStart={(e) => handleDragStart(e, piece.id)}
                        onDragEnd={(e) => {
                          // Handle drag adaptations check if dragged to different platform
                          // This simulates custom adaptations if platform cell is changed
                        }}
                        style={{
                          backgroundColor: '#ffffff',
                          border: isFlagged ? '2px solid #dc2626' : '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '10px',
                          cursor: isDesktop ? 'grab' : 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                        onClick={() => handleOpenEditor(piece)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            backgroundColor: 'var(--primary-subtle)',
                            color: 'var(--primary)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: '4px'
                          }}>
                            {piece.platform}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>
                            {piece.content_type}
                          </span>
                        </div>

                        <p style={{
                          margin: 0,
                          fontSize: '0.78rem',
                          color: 'var(--foreground)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          maxHeight: '4.2em'
                        }}>
                          {piece.content_body}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--foreground-muted)' }}>
                            Targeting:
                          </span>
                          <select
                            value={piece.persona_id || ''}
                            onChange={(e) => handlePersonaChange(piece.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: '0.68rem',
                              border: 'none',
                              outline: 'none',
                              color: 'var(--primary)',
                              backgroundColor: 'transparent',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="">Default Audience</option>
                            {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Campaign Form Dialog */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(1px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100
        }}>
          <form
            onSubmit={handleCreateCampaign}
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              boxSizing: 'border-box'
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.25rem', margin: '0 0 24px 0' }}>
              Create Campaign Calendar
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Campaign Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Launch"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Launch Target Description *</label>
                <textarea
                  placeholder="What is this campaign launching/addressing?"
                  value={campaignDesc}
                  onChange={(e) => setCampaignDesc(e.target.value)}
                  required
                  rows={3}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Launch Date *</label>
                  <input
                    type="date"
                    value={launchDate}
                    onChange={(e) => setLaunchDate(e.target.value)}
                    required
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Duration *</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Target Platforms *</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {['Instagram', 'LinkedIn', 'Blog', 'Email', 'Facebook', 'TikTok'].map(platform => (
                    <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform)}
                        onChange={() => handlePlatformCheckbox(platform)}
                      />
                      {platform}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Segment Persona *</label>
                {personas.length === 0 ? (
                  <div style={{ padding: '10px', borderRadius: '6px', border: '1px solid #fde68a', backgroundColor: '#fefce8', fontSize: '0.82rem', color: '#92400e' }}>
                    ⚠️ No personas found. <a href="/dashboard/personas" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create a persona first →</a>
                  </div>
                ) : (
                  <select
                    value={selectedPersonaId}
                    onChange={(e) => setSelectedPersonaId(e.target.value)}
                    required
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    <option value="" disabled>Select Persona</option>
                    {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: generating ? 'not-allowed' : 'pointer'
                }}
              >
                {generating ? 'Generating Strategy...' : 'Generate Calendar'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Adaptation Dialog Warning Modal (FR-16) */}
      {adaptationWarning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(1px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 110
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 700 }}>Adapt Platform Format?</h4>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
              This post was written for **{adaptationWarning.fromPlatform}**. Do you want to adapt its format for **{adaptationWarning.toPlatform}**?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={keepAsIs}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Keep As-Is
              </button>
              <button
                onClick={acceptAdaptation}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Accept Adaptation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segment Persona Regen Dialog Warning (FR-16) */}
      {personaRegenPrompt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(1px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 110
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 700 }}>Persona Target Changed</h4>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>
              You changed the targeted persona to **{personaRegenPrompt.personaName}**. Would you like to automatically regenerate this post content or refine it manually?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setPersonaRegenPrompt(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Refine Manually
              </button>
              <button
                onClick={triggerPersonaRegen}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Regenerate for Persona
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Side Sheet Overlay Modal (FR-17) */}
      {editingPiece && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.3)',
          zIndex: 120,
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            height: '100%',
            backgroundColor: '#ffffff',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
            padding: '32px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Edit Campaign Draft</h3>
                <button
                  onClick={() => setEditingPiece(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--foreground-muted)' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Platform</label>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{editingPiece.platform} ({editingPiece.content_type})</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Content Copy Draft</label>
                <textarea
                  value={editingPieceBody}
                  onChange={(e) => setEditingPieceBody(e.target.value)}
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              <button
                onClick={() => setEditingPiece(null)}
                style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditorPiece}
                disabled={savingPiece}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: savingPiece ? 'not-allowed' : 'pointer'
                }}
              >
                {savingPiece ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  function handleCheckboxChange(platform: string) {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  }
}
