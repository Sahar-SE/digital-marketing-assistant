'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  templateBody: string;
  variables: string[];
  performanceScore: number | null;
  platform: string;
  industry: string;
  source: string;
}

interface SegmentPersona {
  id: string;
  name: string;
  description: string;
  values: string[];
  ageRange: string;
  platformPreference: string;
}

interface ContentVersion {
  id?: string;
  contentPieceId: string;
  versionNumber: number;
  contentBody: string;
  templateId: string;
  annotationUsed: string | null;
  createdAt: string;
}

interface FirewallCheckResult {
  status: 'pass' | 'warn' | 'flag' | 'CHECK_UNAVAILABLE';
  flaggedText: string;
  explanation: string;
  resolved?: boolean;
  resolvedBy?: string;
}

interface ContentHealthReport {
  originality: FirewallCheckResult;
  bias: FirewallCheckResult;
  hallucination: FirewallCheckResult;
  brand_tone: FirewallCheckResult;
  data_cleansing: FirewallCheckResult;
}

export default function ContentEditor() {
  const [editorState, setEditorState] = useState<'goal_selection' | 'editing'>('goal_selection');
  
  // Selection states
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [selectedType, setSelectedType] = useState('product launch');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('default');
  
  // Data lists
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [personas, setPersonas] = useState<SegmentPersona[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  
  // Content states
  const [contentPieceId, setContentPieceId] = useState<string | null>(null);
  const [activeVersion, setActiveVersion] = useState<ContentVersion | null>(null);
  const [versionsList, setVersionsList] = useState<ContentVersion[]>([]);
  
  // UI Loading/Error states
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [brandDnaError, setBrandDnaError] = useState<boolean>(false);
  
  // Popover state for selection annotations
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [annotationText, setAnnotationText] = useState('');
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Right panel slide-in preview
  const [previewVersion, setPreviewVersion] = useState<ContentVersion | null>(null);
  const [showPersonaDetails, setShowPersonaDetails] = useState<boolean>(false);
  const [personaChangePrompt, setPersonaChangePrompt] = useState<{ newPersonaId: string; name: string } | null>(null);

  // Epic 3: Ethical Firewall states
  const [firewallReport, setFirewallReport] = useState<ContentHealthReport | null>(null);
  const [checkingFirewall, setCheckingFirewall] = useState(false);
  const [checkingStillLabel, setCheckingStillLabel] = useState(false);
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState<string | null>(null);
  const [lastCheckedBody, setLastCheckedBody] = useState<string>('');
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);

  // Epic 4: Browse More Overlay states
  const [showBrowseMore, setShowBrowseMore] = useState(false);
  const [browseTemplates, setBrowseTemplates] = useState<PromptTemplate[]>([]);
  const [browseSearch, setBrowseSearch] = useState('');
  const [browsePlatform, setBrowsePlatform] = useState('');
  const [browseCategory, setBrowseCategory] = useState('');
  const [browseIndustry, setBrowseIndustry] = useState('');
  const [browseSort, setBrowseSort] = useState<'score' | 'recency'>('score');

  // Epic 5: Segment Personas states
  const [rightPanelTab, setRightPanelTab] = useState<'firewall' | 'personas'>('firewall');
  const [personaReactionText, setPersonaReactionText] = useState<{ [personaId: string]: string }>({});
  const [personaReactionLoading, setPersonaReactionLoading] = useState<{ [personaId: string]: boolean }>({});
  const [expandedPersonaId, setExpandedPersonaId] = useState<string | null>(null);

  const handleGetPersonaReaction = async (pId: string) => {
    if (!contentPieceId) return;
    setPersonaReactionLoading(prev => ({ ...prev, [pId]: true }));
    setPersonaReactionText(prev => ({ ...prev, [pId]: '' }));

    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${contentPieceId}/personas/${pId}/react`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (res.ok) {
        setPersonaReactionText(prev => ({ ...prev, [pId]: data.reaction }));
      } else {
        alert(data.error || 'Failed to get reaction');
      }
    } catch (err: any) {
      alert(`Error getting reaction: ${err.message}`);
    } finally {
      setPersonaReactionLoading(prev => ({ ...prev, [pId]: false }));
    }
  };

  const editorRef = useRef<HTMLTextAreaElement>(null);

  const platforms = ['Instagram', 'LinkedIn', 'Blog', 'Email', 'Facebook', 'TikTok'];
  const contentTypes = ['product launch', 'engagement', 'educational', 'promotional', 'story', 'carousel'];

  // Load templates & personas
  useEffect(() => {
    if (editorState === 'goal_selection') {
      fetchTemplates();
      fetchAllTemplatesForBrowse();
    }
    fetchPersonas();
  }, [selectedPlatform, selectedType, editorState]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/templates?platform=${selectedPlatform}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplate(data[0]);
        } else {
          setSelectedTemplate(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllTemplatesForBrowse = async () => {
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/templates`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setBrowseTemplates(data);
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    setBrandDnaError(false);
    setFirewallReport(null);
    setLastCheckedBody('');
    setPublishSuccess(false);
    
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            platform: selectedPlatform,
            contentType: selectedType,
            templateId: selectedTemplate.id,
            personaId: selectedPersonaId === 'default' ? null : selectedPersonaId
          })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'BRAND_DNA_INCOMPLETE') {
          setBrandDnaError(true);
          return;
        }
        throw new Error(data.error || 'Failed to generate draft');
      }

      setContentPieceId(data.contentPieceId);
      setActiveVersion(data);
      setVersionsList([data]);
      setEditorState('editing');
    } catch (err: any) {
      alert(`Error generating draft: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut Ctrl+Shift+A / Cmd+Shift+A and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        triggerAnnotationPopover();
      }
      if (e.key === 'Escape') {
        dismissPopover();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVersion]);

  const triggerAnnotationPopover = () => {
    if (!editorRef.current) return;
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const text = editorRef.current.value.substring(start, end).trim();

    if (!text) {
      alert('Please select/highlight some text in the editor first to annotate.');
      return;
    }

    setSelectedText(text);
    setSelectionRange({ start, end });

    // Calculate approximate coordinates inside editor area
    const rect = editorRef.current.getBoundingClientRect();
    setPopoverPosition({
      top: rect.top - 80 + window.scrollY,
      left: rect.left + 80 + window.scrollX
    });
  };

  const dismissPopover = () => {
    setSelectionRange(null);
    setSelectedText('');
    setAnnotationText('');
    setPopoverPosition(null);
  };

  const handleRefine = async () => {
    if (!contentPieceId || !activeVersion || !annotationText.trim()) return;

    setRefining(true);
    const bodyToSend = activeVersion.contentBody;
    const instruction = annotationText;
    const selection = selectedText;

    dismissPopover();

    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${contentPieceId}/refine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentBody: bodyToSend,
            annotationText: instruction,
            selectedText: selection
          })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refinement failed');

      setActiveVersion(data);
      // Fetch latest versions
      const versionsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${contentPieceId}/versions`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const versionsData = await versionsRes.json();
      if (versionsRes.ok) {
        setVersionsList(versionsData);
      }
    } catch (err: any) {
      alert(`Refinement failed: ${err.message}`);
    } finally {
      setRefining(false);
    }
  };

  const handleRestoreVersion = async (v: ContentVersion) => {
    if (!window.confirm(`Are you sure you want to restore Version ${v.versionNumber}?`)) return;
    
    setRefining(true);
    setPreviewVersion(null);
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${contentPieceId}/refine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentBody: v.contentBody,
            annotationText: `Restored Version ${v.versionNumber}`
          })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore');

      setActiveVersion(data);
      const versionsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${contentPieceId}/versions`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const versionsData = await versionsRes.json();
      if (versionsRes.ok) {
        setVersionsList(versionsData);
      }
    } catch (err: any) {
      alert(`Failed to restore: ${err.message}`);
    } finally {
      setRefining(false);
    }
  };

  const handleStartOver = () => {
    if (window.confirm('Switching templates will clear your current draft. Continue?')) {
      setEditorState('goal_selection');
      setContentPieceId(null);
      setActiveVersion(null);
      setVersionsList([]);
      setSelectedTemplate(null);
      setBrandDnaError(false);
      dismissPopover();
      setPreviewVersion(null);
      setPersonaChangePrompt(null);
      setFirewallReport(null);
      setLastCheckedBody('');
      setPublishSuccess(false);
    }
  };

  const handlePersonaChangeSelect = async (newId: string) => {
    if (!contentPieceId) {
      setSelectedPersonaId(newId);
      return;
    }

    const matchedPersona = personas.find(p => p.id === newId);
    const name = matchedPersona ? matchedPersona.name : 'Primary audience';
    setPersonaChangePrompt({ newPersonaId: newId, name });
  };

  const applyPersonaChangeWithoutRegen = async () => {
    if (!contentPieceId || !personaChangePrompt) return;
    try {
      const token = localStorage.getItem('dma_token');
      const pId = personaChangePrompt.newPersonaId === 'default' ? null : personaChangePrompt.newPersonaId;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${contentPieceId}/persona`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ personaId: pId })
        }
      );
      if (res.ok) {
        setSelectedPersonaId(personaChangePrompt.newPersonaId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPersonaChangePrompt(null);
    }
  };

  const applyPersonaChangeWithRegen = async () => {
    if (!contentPieceId || !personaChangePrompt || !selectedTemplate) return;
    setLoading(true);
    const newId = personaChangePrompt.newPersonaId;
    setPersonaChangePrompt(null);
    try {
      const token = localStorage.getItem('dma_token');
      
      // Update DB record persona association first
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${contentPieceId}/persona`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ personaId: newId === 'default' ? null : newId })
        }
      );

      // Trigger a complete regeneration delta under a new version
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${contentPieceId}/refine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentBody: activeVersion?.contentBody || '',
            annotationText: `Regenerated target for segment: ${newId === 'default' ? 'Primary Audience' : 'Eco Emma'}`
          })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActiveVersion(data);
      setSelectedPersonaId(newId);

      const versionsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${contentPieceId}/versions`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const versionsData = await versionsRes.json();
      if (versionsRes.ok) {
        setVersionsList(versionsData);
      }
    } catch (err: any) {
      alert(`Failed to regenerate: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getActivePersona = () => {
    if (selectedPersonaId === 'default') return null;
    return personas.find(p => p.id === selectedPersonaId) || null;
  };

  // Epic 3: Ethical Firewall evaluation triggering
  const handleCheckContent = async () => {
    if (!contentPieceId || !activeVersion) return;
    setCheckingFirewall(true);
    setCheckingStillLabel(false);
    setPublishSuccess(false);

    const labelTimer = setTimeout(() => {
      setCheckingStillLabel(true);
    }, 15000);

    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/firewall/pieces/${contentPieceId}/evaluate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'CREDITS_EXHAUSTED') {
          alert('Firewall check blocked: credit balance exhausted!');
          return;
        }
        throw new Error(data.error || 'Firewall evaluation failed');
      }

      setFirewallReport(data.report);
      setLastCheckedBody(activeVersion.contentBody);
    } catch (err: any) {
      alert(`Error checking content: ${err.message}`);
    } finally {
      clearTimeout(labelTimer);
      setCheckingFirewall(false);
      setCheckingStillLabel(false);
    }
  };

  // Return focus panel re-evaluation check (Story 3.3)
  const handleCardInteraction = () => {
    if (activeVersion && activeVersion.contentBody !== lastCheckedBody && !checkingFirewall && !refining && firewallReport) {
      console.log('[Firewall Card] Auto re-checking modified draft version...');
      handleCheckContent();
    }
  };

  const handleEditTextSelection = (flaggedText: string) => {
    if (!editorRef.current || !flaggedText) return;
    const body = activeVersion?.contentBody || '';
    const index = body.indexOf(flaggedText);
    if (index !== -1) {
      editorRef.current.focus();
      editorRef.current.setSelectionRange(index, index + flaggedText.length);
    }
  };

  const handleRemoveFlaggedText = async (flaggedText: string, checkKey: string) => {
    if (!activeVersion || !contentPieceId) return;
    const body = activeVersion.contentBody;
    const cleanBody = body.replace(flaggedText, '').trim();

    setRefining(true);
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${contentPieceId}/refine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentBody: cleanBody,
            annotationText: `Removed flagged segment in ${checkKey}`
          })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove text');

      setActiveVersion(data);
      // Fetch latest history
      const versionsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${contentPieceId}/versions`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const versionsData = await versionsRes.json();
      if (versionsRes.ok) {
        setVersionsList(versionsData);
      }

      // Automatically re-evaluate report
      const reRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/firewall/pieces/${contentPieceId}/evaluate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const reData = await reRes.json();
      if (reRes.ok) {
        setFirewallReport(reData.report);
        setLastCheckedBody(data.contentBody);
      }
    } catch (err: any) {
      alert(`Remove segment failed: ${err.message}`);
    } finally {
      setRefining(false);
    }
  };

  const handleConfirmHumanVerify = async (checkKey: string) => {
    if (!contentPieceId) return;
    setShowVerifyConfirm(null);
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/firewall/pieces/${contentPieceId}/resolve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ checkType: checkKey })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'HUMAN_VERIFIED_NOT_PERMITTED_FOR_PLAGIARISM') {
          alert("Plagiarism flags must be edited or removed — you can't self-verify this one");
          return;
        }
        throw new Error(data.error || 'Failed to submit verification');
      }

      if (data.report) {
        setFirewallReport(data.report);
      }
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    }
  };

  const getUnresolvedIssuesCount = () => {
    if (!firewallReport) return 0;
    let count = 0;
    const checks = ['originality', 'bias', 'hallucination', 'brand_tone', 'data_cleansing'] as const;
    for (const key of checks) {
      const check = firewallReport[key];
      if (check && check.status !== 'pass') {
        count++;
      }
    }
    return count;
  };

  const isPublishEnabled = () => {
    if (!firewallReport) return false;
    return getUnresolvedIssuesCount() === 0;
  };

  const handlePublishContent = async () => {
    if (!isPublishEnabled() || !contentPieceId) return;
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/pieces/${contentPieceId}/publish`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (res.ok) {
        setPublishSuccess(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Epic 4: Browse More Filters Overlay calculation
  const getFilteredBrowseTemplates = () => {
    let list = [...browseTemplates];

    if (browseSearch) {
      const s = browseSearch.toLowerCase();
      list = list.filter(t => 
        t.name.toLowerCase().includes(s) || 
        t.templateBody.toLowerCase().includes(s) || 
        t.category.toLowerCase().includes(s)
      );
    }

    if (browsePlatform) {
      list = list.filter(t => t.platform.toLowerCase() === browsePlatform.toLowerCase());
    }

    if (browseCategory) {
      list = list.filter(t => t.category.toLowerCase().includes(browseCategory.toLowerCase()));
    }

    if (browseIndustry) {
      list = list.filter(t => t.industry.toLowerCase().includes(browseIndustry.toLowerCase()));
    }

    list.sort((a, b) => {
      if (browseSort === 'score') {
        const scoreA = a.performanceScore ?? -1;
        const scoreB = b.performanceScore ?? -1;
        if (scoreB !== scoreA) return scoreB - scoreA;
      }
      return b.id.localeCompare(a.id);
    });

    return list;
  };

  const renderCheckRow = (title: string, checkKey: string, check: FirewallCheckResult) => {
    const isExpanded = expandedCheck === checkKey;
    let color = '#94a3b8';
    let statusText = 'Cleared';

    if (check.status === 'pass') {
      color = '#16a34a';
      statusText = check.resolved ? 'Human Verified' : 'Pass';
    } else if (check.status === 'warn') {
      color = '#d97706';
      statusText = 'Warning';
    } else if (check.status === 'flag' || check.status === 'CHECK_UNAVAILABLE') {
      color = '#dc2626';
      statusText = check.status === 'CHECK_UNAVAILABLE' ? 'Offline' : 'Flagged';
    }

    return (
      <div key={checkKey} style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          onClick={() => setExpandedCheck(isExpanded ? null : checkKey)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>{title}</span>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{statusText}</span>
        </div>

        {isExpanded && (
          <div style={{ padding: '0 0 12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {check.flaggedText && (
              <div style={{ padding: '6px 10px', backgroundColor: '#fff5f5', borderLeft: '3px solid #dc2626', fontSize: '0.8rem', fontStyle: 'italic' }}>
                "{check.flaggedText}"
              </div>
            )}
            
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--foreground-muted)', lineHeight: 1.4 }}>
              {check.explanation}
            </p>

            {check.status !== 'pass' && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button
                  onClick={() => check.flaggedText && handleEditTextSelection(check.flaggedText)}
                  style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#ffffff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  EDIT
                </button>
                <button
                  onClick={() => check.flaggedText && handleRemoveFlaggedText(check.flaggedText, checkKey)}
                  style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#ffffff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  REMOVE
                </button>
                <button
                  onClick={() => {
                    if (checkKey === 'originality') return;
                    setShowVerifyConfirm(checkKey);
                  }}
                  disabled={checkKey === 'originality'}
                  title={checkKey === 'originality' ? "Plagiarism flags must be edited or removed — you can't self-verify this one" : ""}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    backgroundColor: checkKey === 'originality' ? '#f1f5f9' : '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: checkKey === 'originality' ? '#94a3b8' : 'var(--foreground)',
                    cursor: checkKey === 'originality' ? 'not-allowed' : 'pointer'
                  }}
                >
                  VERIFY
                </button>
              </div>
            )}
            
            {checkKey === 'originality' && check.status !== 'pass' && (
              <span style={{ fontSize: '0.7rem', color: '#dc2626' }}>
                Plagiarism flags must be edited or removed — you can't self-verify this one.
              </span>
            )}

            {check.resolved && (
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                ✓ Verified by {check.resolvedBy}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'var(--font-inter), sans-serif', minHeight: 'calc(100vh - 120px)', position: 'relative' }}>
      
      {/* Brand DNA Incomplete Banner */}
      {brandDnaError && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '0.95rem',
          fontWeight: 600,
          border: '1px solid #fca5a5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>🧬 Finish your Brand DNA to start creating. Go to settings configuration to complete it.</span>
          <Link href="/dashboard/brand-dna" style={{ color: '#b91c1c', fontWeight: 700, textDecoration: 'underline' }}>
            Go to Settings
          </Link>
        </div>
      )}

      {/* State A: Goal selection screen */}
      {editorState === 'goal_selection' && (
        <div>
          <h1 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '2rem', marginBottom: '24px', color: 'var(--foreground)' }}>
            Start Content Project
          </h1>

          {/* Configuration Selection Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Target Platform</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.95rem', backgroundColor: '#ffffff' }}
              >
                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Content Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.95rem', backgroundColor: '#ffffff' }}
              >
                {contentTypes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Target Persona</label>
              <select
                value={selectedPersonaId}
                onChange={(e) => handlePersonaChangeSelect(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.95rem', backgroundColor: '#ffffff' }}
              >
                <option value="default">Primary audience (Brand DNA)</option>
                {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

          </div>

          {/* Templates Grid Section */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.25rem', margin: 0, color: 'var(--foreground)' }}>
                Matched Prompt Templates
              </h3>
              <button
                onClick={() => { setBrowsePlatform(selectedPlatform); setShowBrowseMore(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Browse more
              </button>
            </div>
            
            {templates.length === 0 ? (
              <p style={{ color: 'var(--foreground-muted)' }}>No templates found for this platform. Please run migration seeds.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {templates.map(t => {
                  const isSelected = selectedTemplate?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      style={{
                        padding: '20px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: isSelected ? 'var(--primary-subtle)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase' }}>
                            {t.category} &rsaquo; {t.subcategory}
                          </span>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e2e8f0', fontWeight: 600 }}>
                            {t.source}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--foreground)' }}>
                          {t.name}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                          {t.templateBody.slice(0, 100)}...
                        </p>
                      </div>

                      {/* Performance Score Chip */}
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Rating:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {t.performanceScore ? `${t.performanceScore}%` : 'Not yet rated'}
                          </span>
                          {t.performanceScore && (
                            <div style={{ width: '60px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${t.performanceScore}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleGenerate}
              disabled={loading || !selectedTemplate}
              style={{
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)'
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--primary)')}
            >
              {loading ? 'Creating Brand Draft...' : 'Generate with this template'}
            </button>
          </div>

        </div>
      )}

      {/* State B: Active Editor workspace */}
      {editorState === 'editing' && activeVersion && (
        <div style={{ display: 'flex', gap: '32px', position: 'relative' }}>
          
          {/* Main work area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Draft Workspace / Version {activeVersion.versionNumber}
                </span>
                <h1 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', margin: '4px 0 0 0' }}>
                  Editor
                </h1>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={triggerAnnotationPopover}
                  disabled={refining}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Annotate Selection (Ctrl+Shift+A)
                </button>
                <button
                  onClick={handleStartOver}
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Switch Template
                </button>
              </div>
            </div>

            {/* Live interactive Editor space */}
            <div style={{ position: 'relative', width: '100%' }}>
              
              {/* Refinement Loader Animation */}
              {refining && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(1px)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 10,
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem', animation: 'spin 1s infinite linear' }}>🔄</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>Refining copy guidelines...</span>
                  </div>
                </div>
              )}

              {loading && (
                <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '12px', minHeight: '300px', backgroundColor: '#f8fafc' }}>
                  <div style={{ height: '20px', backgroundColor: '#e2e8f0', width: '80%', marginBottom: '12px', borderRadius: '4px' }} className="skeleton" />
                  <div style={{ height: '20px', backgroundColor: '#e2e8f0', width: '90%', marginBottom: '12px', borderRadius: '4px' }} className="skeleton" />
                  <div style={{ height: '20px', backgroundColor: '#e2e8f0', width: '70%', marginBottom: '12px', borderRadius: '4px' }} className="skeleton" />
                </div>
              )}

              {!loading && (
                <textarea
                  ref={editorRef}
                  value={activeVersion.contentBody}
                  readOnly={refining}
                  onChange={(e) => setActiveVersion({ ...activeVersion, contentBody: e.target.value })}
                  style={{
                    width: '100%',
                    minHeight: '350px',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    fontSize: '1.05rem',
                    lineHeight: 1.6,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    backgroundColor: refining ? '#f8fafc' : '#ffffff'
                  }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
              <span>Highlight text &amp; click Annotate to request inline edit.</span>
              <span>Words: {activeVersion.contentBody.split(/\s+/).filter(Boolean).length}</span>
            </div>

          </div>

          {/* Right panel: Timeline, Persona & Ethical Firewall card */}
          <div style={{ width: '280px', borderLeft: '1px solid var(--border)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Persona targeting avatar card */}
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase' }}>Target Persona</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <div
                  onClick={() => getActivePersona() && setShowPersonaDetails(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '9999px',
                    backgroundColor: selectedPersonaId === 'default' ? '#f1f5f9' : 'var(--primary-subtle)',
                    cursor: getActivePersona() ? 'pointer' : 'default',
                    flex: 1
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>👤</span>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: selectedPersonaId === 'default' ? '#475569' : 'var(--primary)' }}>
                      {getActivePersona() ? getActivePersona()!.name : 'Primary Audience'}
                    </div>
                  </div>
                </div>

                <select
                  value={selectedPersonaId}
                  onChange={(e) => handlePersonaChangeSelect(e.target.value)}
                  style={{ width: '24px', height: '24px', border: 'none', background: 'none', cursor: 'pointer', outline: 'none', marginLeft: '6px' }}
                >
                  <option value="default">Primary Audience</option>
                  {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Tab switch header */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '16px' }}>
              <button
                onClick={() => setRightPanelTab('firewall')}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: rightPanelTab === 'firewall' ? '2px solid var(--primary)' : 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: rightPanelTab === 'firewall' ? 'var(--primary)' : 'var(--foreground-muted)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                FIREWALL
              </button>
              <button
                onClick={() => setRightPanelTab('personas')}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: rightPanelTab === 'personas' ? '2px solid var(--primary)' : 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: rightPanelTab === 'personas' ? 'var(--primary)' : 'var(--foreground-muted)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                PERSONAS
              </button>
            </div>

            {/* Tab Content */}
            {rightPanelTab === 'firewall' && (
              <div
                id="firewall-card"
                onMouseEnter={handleCardInteraction}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: firewallReport && getUnresolvedIssuesCount() === 0 ? '2px solid #16a34a' : '1px solid var(--border)',
                  backgroundColor: firewallReport && getUnresolvedIssuesCount() === 0 ? '#f0fdf4' : '#f8fafc',
                  transition: 'all 200ms ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)' }}>ETHICAL FIREWALL</span>
                  {!firewallReport && !checkingFirewall && (
                    <button
                      onClick={handleCheckContent}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Check content
                    </button>
                  )}
                </div>

                {/* Loader Skeleton states */}
                {checkingFirewall && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                        <div className="skeleton" style={{ height: '12px', backgroundColor: '#e2e8f0', width: '80%', borderRadius: '3px' }} />
                      </div>
                    ))}
                    {checkingStillLabel && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '4px' }}>
                        Still checking...
                      </span>
                    )}
                  </div>
                )}

                {/* Report Header message */}
                {firewallReport && !checkingFirewall && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: getUnresolvedIssuesCount() === 0 ? '#16a34a' : '#dc2626'
                    }}>
                      {getUnresolvedIssuesCount() === 0
                        ? 'Looks good — ready to publish'
                        : getUnresolvedIssuesCount() === 1
                          ? 'One thing to review before publishing'
                          : `${getUnresolvedIssuesCount()} things to review before publishing`}
                    </div>
                    <button
                      onClick={handleCheckContent}
                      style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        backgroundColor: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Re-run check
                    </button>
                  </div>
                )}

                {/* Check rows list */}
                {firewallReport && !checkingFirewall && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {renderCheckRow('Originality scan', 'originality', firewallReport.originality)}
                    {renderCheckRow('Bias Audit', 'bias', firewallReport.bias)}
                    {renderCheckRow('Fact check', 'hallucination', firewallReport.hallucination)}
                    {renderCheckRow('Tone alignment', 'brand_tone', firewallReport.brand_tone)}
                    {renderCheckRow('Data Cleansing', 'data_cleansing', firewallReport.data_cleansing)}
                  </div>
                )}

                {!firewallReport && !checkingFirewall && (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--foreground-muted)', lineHeight: 1.4 }}>
                    Content check is required before publishing to scan for plagiarism, bias, facts, and PII leaks.
                  </p>
                )}
              </div>
            )}

            {rightPanelTab === 'personas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {personas.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--foreground-muted)', lineHeight: 1.4 }}>
                    No custom personas defined. Go to Segment Personas configuration dashboard to create target segments.
                  </p>
                ) : (
                  personas.map(p => {
                    const isExpanded = expandedPersonaId === p.id;
                    const isReactionLoading = !!personaReactionLoading[p.id];
                    const reaction = personaReactionText[p.id];
                    
                    // Safe initials extractor
                    const nameParts = (p.name || 'Segment Persona').split(/\s+/).filter(Boolean);
                    const initials = ((nameParts[0]?.charAt(0) || '') + (nameParts[1]?.charAt(0) || '')).toUpperCase();

                    return (
                      <div
                        key={p.id}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
                        }}
                      >
                        <div
                          onClick={() => setExpandedPersonaId(isExpanded ? null : p.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', justifyContent: 'space-between' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-subtle)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.75rem'
                            }}>
                              {initials}
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>{p.name}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>

                        {isExpanded && (
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '0.75rem', color: 'var(--foreground-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <p style={{ margin: 0, color: 'var(--foreground)', lineHeight: 1.3 }}>{p.description}</p>
                            {p.ageRange && <div><strong>Age:</strong> {p.ageRange}</div>}
                            {p.platformPreference && <div><strong>Platform:</strong> {p.platformPreference}</div>}
                            <div><strong>Values:</strong> {p.values.join(', ')}</div>
                          </div>
                        )}

                        {reaction && (
                          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--foreground)', lineHeight: 1.4, fontStyle: 'italic', backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '4px' }}>
                              "{reaction}"
                            </p>
                            <span style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)', fontStyle: 'italic' }}>
                              How {p.name} might react — simulated, not real audience data
                            </span>
                          </div>
                        )}

                        {isReactionLoading && (
                          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                              Asking {p.name}...
                            </span>
                            <div className="skeleton" style={{ height: '8px', backgroundColor: '#e2e8f0', width: '90%', borderRadius: '2px' }} />
                            <div className="skeleton" style={{ height: '8px', backgroundColor: '#e2e8f0', width: '70%', borderRadius: '2px' }} />
                          </div>
                        )}

                        {!isReactionLoading && (
                          <button
                            onClick={() => handleGetPersonaReaction(p.id)}
                            style={{
                              alignSelf: 'flex-end',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--primary-subtle)',
                              color: 'var(--primary)',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Get Reaction
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Active/Disabled Publish export button */}
            <div>
              <button
                onClick={handlePublishContent}
                disabled={!isPublishEnabled()}
                aria-disabled={!isPublishEnabled() ? 'true' : 'false'}
                aria-describedby={!isPublishEnabled() ? 'firewall-card' : undefined}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isPublishEnabled() ? '#16a34a' : '#e2e8f0',
                  color: isPublishEnabled() ? '#ffffff' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: isPublishEnabled() ? 'pointer' : 'not-allowed',
                  transition: 'all 200ms ease'
                }}
              >
                Publish &amp; Export
              </button>

              {publishSuccess && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  border: '1px solid #bbf7d0'
                }}>
                  🎉 Publishing successful! Content published to platform.
                </div>
              )}
            </div>

            {/* Edit version Timeline */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase' }}>Version Timeline</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: '16px', position: 'relative' }}>
                {versionsList.map((ver, idx) => {
                  const isActive = activeVersion.versionNumber === ver.versionNumber;
                  return (
                    <div
                      key={idx}
                      onClick={() => setPreviewVersion(ver)}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        cursor: 'pointer',
                        paddingBottom: '20px',
                        position: 'relative'
                      }}
                    >
                      {/* Connection line */}
                      {idx < versionsList.length - 1 && (
                        <div style={{
                          position: 'absolute',
                          left: '11px',
                          top: '24px',
                          bottom: 0,
                          width: '1px',
                          borderLeft: '2px dashed var(--border)'
                        }} />
                      )}

                      {/* Node indicator dot */}
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: isActive ? '2px solid var(--primary)' : '2px solid var(--border)',
                        backgroundColor: isActive ? '#ffffff' : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: isActive ? 'var(--primary)' : 'var(--foreground-muted)',
                        zIndex: 2
                      }}>
                        {ver.versionNumber}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                          {ver.annotationUsed ? `Refined: "${ver.annotationUsed.slice(0, 16)}..."` : 'Initial Brand Draft'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)', marginTop: '2px' }}>
                          {new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Interactive Annotation Popover Modal */}
          {popoverPosition && (
            <div style={{
              position: 'absolute',
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '16px',
              width: '300px',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>REFINEMENT ANNOTATION</span>
                <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#475569', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  "{selectedText}"
                </div>
              </div>

              <input
                type="text"
                maxLength={200}
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                placeholder="e.g. make this punchier, add pricing..."
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={dismissPopover} style={{ background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--foreground-muted)' }}>Cancel</button>
                <button
                  onClick={handleRefine}
                  disabled={!annotationText.trim()}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: !annotationText.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  Refine
                </button>
              </div>
            </div>
          )}

          {/* Past version preview drawer */}
          {previewVersion && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.3)',
              display: 'flex',
              justifyContent: 'flex-end',
              zIndex: 100
            }}>
              <div style={{
                width: '100%',
                maxWidth: '440px',
                backgroundColor: '#ffffff',
                height: '100%',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '-4px 0 20px rgba(0,0,0,0.05)',
                boxSizing: 'border-box'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.25rem', margin: 0 }}>
                      Preview Version {previewVersion.versionNumber}
                    </h3>
                    <button onClick={() => setPreviewVersion(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
                      ✕
                    </button>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', marginBottom: '16px' }}>
                    {previewVersion.annotationUsed ? `Refinement trigger: "${previewVersion.annotationUsed}"` : 'Initial system generation'}
                  </p>

                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#f8fafc',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {previewVersion.contentBody}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setPreviewVersion(null)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={() => handleRestoreVersion(previewVersion)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Restore this version
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Persona details modal */}
          {showPersonaDetails && getActivePersona() && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 100
            }}>
              <div style={{
                width: '100%',
                maxWidth: '440px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '28px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.25rem', margin: 0 }}>
                    Target segment card
                  </h3>
                  <button onClick={() => setShowPersonaDetails(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Persona Name</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{getActivePersona()!.name}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Description</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>{getActivePersona()!.description}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Core Motivations / Values</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {getActivePersona()!.values.map((v, i) => (
                        <span key={i} style={{ padding: '4px 10px', backgroundColor: '#e2e8f0', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Age range</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{getActivePersona()!.ageRange}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Platform preference</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{getActivePersona()!.platformPreference}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Persona change prompt overlay banner */}
          {personaChangePrompt && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
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
                padding: '28px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <h3 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.25rem', marginBottom: '12px' }}>
                  Target segment changed
                </h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--foreground-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
                  You changed target segment to <strong>{personaChangePrompt.name}</strong>. Do you want to regenerate copy or refine manually?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={applyPersonaChangeWithRegen}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Regenerate for {personaChangePrompt.name}
                  </button>
                  <button
                    onClick={applyPersonaChangeWithoutRegen}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Refine manually
                  </button>
                  <button
                    onClick={() => setPersonaChangePrompt(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.85rem',
                      color: 'var(--foreground-muted)',
                      cursor: 'pointer',
                      marginTop: '6px'
                    }}
                  >
                    Cancel Change
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Human Verify Log disclaimer confirmation popup overlay */}
          {showVerifyConfirm && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 120
            }}>
              <div style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '28px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <h3 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.2rem', marginBottom: '12px' }}>
                  Confirm Human Verification
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--foreground-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
                  You are asserting that you can verify this flagged claim. Your email name and the timestamp will be permanently logged in the audit trail.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowVerifyConfirm(null)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmHumanVerify(showVerifyConfirm)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Confirm Verify
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Epic 4: Browse More Full-Screen Overlay Modal (Story 4.2 / FR-13) */}
      {showBrowseMore && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#ffffff',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          padding: '32px',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.5rem', margin: 0 }}>Browse Prompt Templates</h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>Select any template to use for your content generation.</p>
            </div>
            <button
              onClick={() => setShowBrowseMore(false)}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close Browser
            </button>
          </div>

          {/* Combinable Filters Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: '#f8fafc' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search templates..."
                value={browseSearch}
                onChange={(e) => setBrowseSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
              />
            </div>
            {/* Platform select */}
            <select
              value={browsePlatform}
              onChange={(e) => setBrowsePlatform(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
            >
              <option value="">All Platforms</option>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {/* Category search input */}
            <input
              type="text"
              placeholder="Filter by Category..."
              value={browseCategory}
              onChange={(e) => setBrowseCategory(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
            />
            {/* Industry filter */}
            <input
              type="text"
              placeholder="Filter by Industry..."
              value={browseIndustry}
              onChange={(e) => setBrowseIndustry(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
            />
            {/* Sort order */}
            <select
              value={browseSort}
              onChange={(e) => setBrowseSort(e.target.value as 'score' | 'recency')}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
            >
              <option value="score">Sort by Performance Score</option>
              <option value="recency">Sort by Recency</option>
            </select>
          </div>

          {/* Filtered list Grid */}
          {getFilteredBrowseTemplates().length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--foreground-muted)' }}>
              No templates found matching the combined filter search.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {getFilteredBrowseTemplates().map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t);
                    setSelectedPlatform(t.platform);
                    setShowBrowseMore(false);
                  }}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase' }}>
                        {t.platform} / {t.category}
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontWeight: 600 }}>
                        {t.source}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--foreground)' }}>
                      {t.name}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                      {t.templateBody}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Rating:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {t.performanceScore ? `${t.performanceScore}%` : 'Not yet rated'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CSS Keyframes */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        .skeleton {
          animation: pulse 1.5s infinite ease-in-out;
        }
      `}</style>

    </div>
  );
}
