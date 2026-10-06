'use client';

import { useState, useEffect } from 'react';
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
  status: string;
  userId: string | null;
  lastScoredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function PromptLibrary() {
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Modal forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<PromptTemplate | null>(null);
  const [readOnlyWarning, setReadOnlyWarning] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formTemplateBody, setFormTemplateBody] = useState('');
  const [formVariables, setFormVariables] = useState('');
  const [formPlatform, setFormPlatform] = useState('Instagram');
  const [formIndustry, setFormIndustry] = useState('General');

  const platforms = ['Instagram', 'LinkedIn', 'Blog', 'Email', 'Facebook', 'TikTok'];

  useEffect(() => {
    fetchProfileAndTemplates();
  }, [platformFilter, sourceFilter, showArchived]);

  const fetchProfileAndTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('dma_token');
      if (!token) {
        setError('Please log in first.');
        setLoading(false);
        return;
      }

      // Fetch user profile
      const userRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/me`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const userData = await userRes.json();
      if (!userRes.ok) throw new Error(userData.error || 'Failed to fetch profile');
      setUser(userData.user);

      if (userData.user.phase === 'phase_1') {
        setLoading(false);
        return; // blocked by gate
      }

      // Fetch library templates
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/templates/library?showArchived=${showArchived}`;
      if (platformFilter) url += `&platform=${platformFilter}`;
      if (sourceFilter) url += `&source=${sourceFilter}`;

      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch prompt library');

      setTemplates(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
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
        fetchProfileAndTemplates();
      }
    } catch (err) {
      alert('Upgrade request failed');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName || !formCategory || !formTemplateBody) {
      setFormError('Name, Category, and Template Body are required.');
      return;
    }

    setFormLoading(true);
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/templates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formName,
            category: formCategory,
            subcategory: formSubcategory,
            templateBody: formTemplateBody,
            variables: formVariables.split(',').map(s => s.trim()).filter(Boolean),
            platform: formPlatform,
            industry: formIndustry
          })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Template creation failed');

      setShowCreateModal(false);
      clearForm();
      setSuccessMessage(`\u2705 Template "${data.name}" created successfully!`);
      await fetchProfileAndTemplates();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormError(`Create failed: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/templates/${showEditModal.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formName,
            category: formCategory,
            subcategory: formSubcategory,
            templateBody: formTemplateBody,
            variables: formVariables.split(',').map(s => s.trim()).filter(Boolean),
            platform: formPlatform,
            industry: formIndustry
          })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'TEMPLATE_SYSTEM_READONLY') {
          setReadOnlyWarning("System templates can't be edited — duplicate it to make your own version");
          return;
        }
        throw new Error(data.error);
      }

      setShowEditModal(null);
      clearForm();
      fetchProfileAndTemplates();
    } catch (err: any) {
      alert(`Edit failed: ${err.message}`);
    }
  };

  const handleDuplicate = async (templateId: string) => {
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/templates/${templateId}/duplicate`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (!res.ok) throw new Error('Failed to duplicate');
      fetchProfileAndTemplates();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleArchive = async (templateId: string, isSystem: boolean) => {
    if (isSystem) {
      alert("System templates can't be edited — duplicate it to make your own version");
      return;
    }
    if (!window.confirm('Are you sure you want to archive this template?')) return;

    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/templates/${templateId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (!res.ok) throw new Error('Failed to archive');
      fetchProfileAndTemplates();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const clearForm = () => {
    setFormName('');
    setFormCategory('');
    setFormSubcategory('');
    setFormTemplateBody('');
    setFormVariables('');
    setFormPlatform('Instagram');
    setFormIndustry('General');
    setReadOnlyWarning(null);
  };

  const populateForm = (t: PromptTemplate) => {
    setFormName(t.name);
    setFormCategory(t.category);
    setFormSubcategory(t.subcategory);
    setFormTemplateBody(t.templateBody);
    setFormVariables(t.variables.join(', '));
    setFormPlatform(t.platform);
    setFormIndustry(t.industry);
    setReadOnlyWarning(null);
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return '#94a3b8'; // grey
    if (score >= 85) return '#16a34a'; // green
    if (score >= 70) return '#d97706'; // yellow
    return '#dc2626'; // red
  };

  // Filter templates list on client by search query
  const filteredTemplates = templates.filter(t => {
    const term = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.templateBody.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <span style={{ fontSize: '1.2rem', color: 'var(--foreground-muted)' }}>Loading library components...</span>
      </div>
    );
  }

  // Phase 1 Access Upgrade Gate Screen
  if (user && user.phase === 'phase_1') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', fontFamily: 'var(--font-inter), sans-serif' }}>
        <div style={{
          maxWidth: '500px',
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          backgroundColor: '#ffffff',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '3rem' }}>🔒</span>
          <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', marginTop: '16px', color: 'var(--foreground)' }}>
            Prompt Library
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--foreground-muted)', lineHeight: 1.6, margin: '16px 0 24px 0' }}>
            The Prompt Library is a premium **Phase 2** feature. Upgrade to create custom prompt structures, duplicate system templates, and view live, rolling platform performance audit scores.
          </p>
          <button
            onClick={handleUpgrade}
            style={{
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font-inter), sans-serif', minHeight: '80vh' }}>
      
      {/* Success Toast */}
      {successMessage && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ECFDF5', border: '1px solid #10B981', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', color: '#047857', fontSize: '0.88rem', fontWeight: 500 }}>
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857', fontSize: '1.2rem', fontWeight: 'bold', padding: '0 4px' }}>×</button>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '2rem', margin: 0, color: 'var(--foreground)' }}>
            Prompt Library
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--foreground-muted)', fontSize: '0.95rem' }}>
            Manage custom templates, duplicate system configurations, and track performance scores.
          </p>
        </div>
        
        <button
          onClick={() => { clearForm(); setFormError(null); setShowCreateModal(true); }}
          style={{
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          + Create Template
        </button>
      </div>


      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '24px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: '#ffffff' }}>
        
        {/* Search */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search templates name or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>

        {/* Platform Filter */}
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
        >
          <option value="">All Platforms</option>
          {platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* Source Filter */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
        >
          <option value="">All Sources</option>
          <option value="system">System templates</option>
          <option value="user-created">User created</option>
          <option value="harvest">Imported from harvest</option>
        </select>

        {/* Archived Checkbox */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--foreground-muted)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          Show archived
        </label>
      </div>

      {/* Grid List */}
      {filteredTemplates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--foreground-muted)' }}>
          No prompt templates found matching the current filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredTemplates.map(t => (
            <div
              key={t.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase' }}>
                    {t.category} {t.subcategory ? `› ${t.subcategory}` : ''}
                  </span>
                  
                  {/* Badge */}
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    backgroundColor: t.source === 'system' ? '#f1f5f9' : t.source === 'harvest' ? 'var(--primary-subtle)' : '#fffbeb',
                    color: t.source === 'system' ? '#475569' : t.source === 'harvest' ? 'var(--primary)' : '#d97706'
                  }}>
                    {t.source === 'system' ? 'System' : t.source === 'harvest' ? 'Imported from your content' : 'User Created'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--foreground)' }}>
                  {t.name}
                </h3>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.5, margin: '0 0 16px 0', whiteSpace: 'pre-wrap' }}>
                  {t.templateBody.length > 150 ? `${t.templateBody.slice(0, 150)}...` : t.templateBody}
                </p>
              </div>

              <div>
                {/* Score bar */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--foreground-muted)' }}>Engagement Rating:</span>
                    <span style={{ fontWeight: 700, color: getScoreColor(t.performanceScore) }}>
                      {t.performanceScore ? `${t.performanceScore}%` : 'Not yet rated'}
                    </span>
                  </div>
                  
                  {t.performanceScore && (
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${t.performanceScore}%`, height: '100%', backgroundColor: getScoreColor(t.performanceScore) }} />
                    </div>
                  )}

                  <div style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)', marginTop: '4px' }}>
                    {t.lastScoredAt ? `Last scored ${new Date(t.lastScoredAt).toLocaleDateString()}` : 'Not yet rated'}
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { populateForm(t); setShowEditModal(t); }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t.source === 'system' ? 'VIEW' : 'EDIT'}
                  </button>
                  <button
                    onClick={() => handleDuplicate(t.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Duplicate"
                  >
                    📁 Duplicate
                  </button>
                  {t.status === 'active' && t.source !== 'system' && (
                    <button
                      onClick={() => handleArchive(t.id, t.source === 'system')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #fee2e2',
                        backgroundColor: '#fff5f5',
                        color: '#b91c1c',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Archive"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(2px)' }}>
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', margin: '0 16px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.25rem', margin: 0 }}>Create Prompt Template</h3>
              <button onClick={() => { setShowCreateModal(false); setFormError(null); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '14px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Template Name *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="e.g. Circular Economy Story" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category *</label>
                  <input type="text" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required placeholder="Product Launch" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Subcategory</label>
                  <input type="text" value={formSubcategory} onChange={(e) => setFormSubcategory(e.target.value)} placeholder="Carousel" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Platform *</label>
                  <select value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Industry</label>
                  <input type="text" value={formIndustry} onChange={(e) => setFormIndustry(e.target.value)} placeholder="Apparel" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Template Body *</label>
                <textarea value={formTemplateBody} onChange={(e) => setFormTemplateBody(e.target.value)} required rows={4} placeholder="Write a post about {{brandName}}'s launch..." style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Variables (comma-separated)</label>
                <input type="text" value={formVariables} onChange={(e) => setFormVariables(e.target.value)} placeholder="brandName, productCategory" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => { setShowCreateModal(false); setFormError(null); }} style={{ background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', color: 'var(--foreground-muted)' }}>Cancel</button>
                <button type="submit" disabled={formLoading} style={{ backgroundColor: formLoading ? '#a78bfa' : 'var(--primary)', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: formLoading ? 'wait' : 'pointer' }}>
                  {formLoading ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.25rem', margin: 0 }}>
                {showEditModal.source === 'system' ? 'View Template' : 'Edit Template'}
              </h3>
              <button onClick={() => setShowEditModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {readOnlyWarning && (
              <div style={{ padding: '10px', backgroundColor: '#fff5f5', borderLeft: '3px solid #dc2626', color: '#dc2626', fontSize: '0.85rem', marginBottom: '14px', fontWeight: 600 }}>
                {readOnlyWarning}
              </div>
            )}

            <form onSubmit={handleEditTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Template Name *</label>
                <input type="text" disabled={showEditModal.source === 'system'} value={formName} onChange={(e) => setFormName(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', backgroundColor: showEditModal.source === 'system' ? '#f1f5f9' : '#ffffff' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category *</label>
                  <input type="text" disabled={showEditModal.source === 'system'} value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', backgroundColor: showEditModal.source === 'system' ? '#f1f5f9' : '#ffffff' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Subcategory</label>
                  <input type="text" disabled={showEditModal.source === 'system'} value={formSubcategory} onChange={(e) => setFormSubcategory(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', backgroundColor: showEditModal.source === 'system' ? '#f1f5f9' : '#ffffff' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Platform *</label>
                  <select disabled={showEditModal.source === 'system'} value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', backgroundColor: showEditModal.source === 'system' ? '#f1f5f9' : '#ffffff' }}>
                    {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Industry</label>
                  <input type="text" disabled={showEditModal.source === 'system'} value={formIndustry} onChange={(e) => setFormIndustry(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', backgroundColor: showEditModal.source === 'system' ? '#f1f5f9' : '#ffffff' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Template Body *</label>
                <textarea disabled={showEditModal.source === 'system'} value={formTemplateBody} onChange={(e) => setFormTemplateBody(e.target.value)} required rows={4} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', backgroundColor: showEditModal.source === 'system' ? '#f1f5f9' : '#ffffff' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Variables (comma-separated)</label>
                <input type="text" disabled={showEditModal.source === 'system'} value={formVariables} onChange={(e) => setFormVariables(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', backgroundColor: showEditModal.source === 'system' ? '#f1f5f9' : '#ffffff' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowEditModal(null)} style={{ background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', color: 'var(--foreground-muted)' }}>Close</button>
                {showEditModal.source !== 'system' && (
                  <button type="submit" style={{ backgroundColor: 'var(--primary)', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
                )}
                {showEditModal.source === 'system' && (
                  <button type="button" onClick={() => { handleDuplicate(showEditModal.id); setShowEditModal(null); }} style={{ backgroundColor: 'var(--primary)', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Duplicate to Edit</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
