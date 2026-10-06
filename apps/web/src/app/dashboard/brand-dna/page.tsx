'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BrandDNA {
  id: string;
  brandName: string;
  productCategory: string;
  toneDescriptors: string[];
  audienceDescription: string;
  styleReferences: string[];
  ethicalPositioning: string;
  status: 'incomplete' | 'complete';
  questionnaireComplete: boolean;
  harvestStatus: string;
}

interface BrandDNAVersion {
  id: string;
  brandName: string;
  productCategory: string;
  toneDescriptors: string[];
  audienceDescription: string;
  styleReferences: string[];
  ethicalPositioning: string;
  createdAt: string;
}

export default function BrandDNAConfig() {
  const [dna, setDna] = useState<BrandDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<keyof BrandDNA | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<BrandDNAVersion[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchBrandDna = async () => {
    try {
      const token = localStorage.getItem('dma_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/brand-dna`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 404) {
        setError('NO_PROFILE');
        return;
      }
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load Brand DNA');
      
      setDna(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandDna();
  }, []);

  const handleEditClick = (field: keyof BrandDNA, value: any) => {
    setEditingField(field);
    if (Array.isArray(value)) {
      setEditValue(value.join(', '));
    } else {
      setEditValue(value || '');
    }
  };

  const handleSaveField = async (field: keyof BrandDNA) => {
    if (!dna) return;
    
    // Construct updated body
    let finalValue: any = editValue;
    if (field === 'toneDescriptors' || field === 'styleReferences') {
      finalValue = editValue.split(',').map(s => s.trim()).filter(Boolean);
    }

    const updatedData = {
      brandName: dna.brandName,
      productCategory: dna.productCategory,
      toneDescriptors: dna.toneDescriptors,
      audienceDescription: dna.audienceDescription,
      styleReferences: dna.styleReferences,
      ethicalPositioning: dna.ethicalPositioning,
      [field]: finalValue
    };

    try {
      const token = localStorage.getItem('dma_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/brand-dna`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update field');

      setDna(data);
      setEditingField(null);
    } catch (err: any) {
      alert(`Error updating field: ${err.message}`);
    }
  };

  const handleFetchHistory = async () => {
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('dma_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/brand-dna/versions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setVersions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) return <div style={{ fontFamily: 'var(--font-inter)' }}>Loading Brand DNA profile...</div>;

  if (error === 'NO_PROFILE') {
    return (
      <div style={{ textAlign: 'center', marginTop: '64px', fontFamily: 'var(--font-inter)' }}>
        <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', marginBottom: '12px' }}>
          No Brand DNA Profile Found
        </h2>
        <p style={{ color: 'var(--foreground-muted)', marginBottom: '24px' }}>
          You need to complete onboarding to build your brand voice.
        </p>
        <Link href="/onboarding" style={{
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          fontWeight: 600,
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none'
        }}>
          Start Onboarding
        </Link>
      </div>
    );
  }

  if (!dna) return <div>Failed to load Brand DNA.</div>;

  return (
    <div style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
      
      {/* Upper Status Block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '2rem', margin: 0, color: 'var(--foreground)' }}>
            Brand DNA
          </h1>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Manage the core intelligence driving your AI marketing assistant.
          </p>
        </div>
        <button
          onClick={handleFetchHistory}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Brand DNA history
        </button>
      </div>

      {dna.status === 'incomplete' && (
        <div style={{
          backgroundColor: '#fffbeb',
          color: '#b45309',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '0.95rem',
          fontWeight: 500,
          border: '1px solid #fde68a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>🧬 Finish your Brand DNA to start creating. Complete all resource harvests.</span>
          <Link href="/onboarding" style={{ color: '#b45309', fontWeight: 700, textDecoration: 'underline' }}>
            Complete profile
          </Link>
        </div>
      )}

      {/* Brand DNA Card SPEC: left purple accent, gradient background */}
      <div style={{
        position: 'relative',
        padding: '32px',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--primary)',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, var(--primary-subtle) 0%, #ffffff 100%)',
        boxShadow: '0 4px 20px rgba(124, 58, 237, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        {/* Brand Name & Status Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(124, 58, 237, 0.1)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand Profile</span>
            <div className="editable-field-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              {editingField === 'brandName' ? (
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSaveField('brandName')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveField('brandName')}
                    autoFocus
                    style={{ fontSize: '1.5rem', fontWeight: 700, border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px', outline: 'none' }}
                  />
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                    {dna.brandName}
                  </h2>
                  <button onClick={() => handleEditClick('brandName', dna.brandName)} className="edit-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '1.1rem' }}>
                    ✏️
                  </button>
                </>
              )}
            </div>
          </div>

          <span style={{
            padding: '6px 12px',
            borderRadius: '9999px',
            backgroundColor: dna.status === 'complete' ? '#d1fae5' : '#fee2e2',
            color: dna.status === 'complete' ? '#065f46' : '#b91c1c',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            {dna.status}
          </span>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          
          {/* Product Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Product Category</span>
            {editingField === 'productCategory' ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSaveField('productCategory')}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveField('productCategory')}
                autoFocus
                style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{dna.productCategory}</span>
                <button onClick={() => handleEditClick('productCategory', dna.productCategory)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>✏️</button>
              </div>
            )}
          </div>

          {/* Tone Descriptors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Tone Descriptors</span>
            {editingField === 'toneDescriptors' ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSaveField('toneDescriptors')}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveField('toneDescriptors')}
                autoFocus
                style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {dna.toneDescriptors.map((t, i) => (
                    <span key={i} style={{ padding: '4px 10px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {t}
                    </span>
                  ))}
                </div>
                <button onClick={() => handleEditClick('toneDescriptors', dna.toneDescriptors)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>✏️</button>
              </div>
            )}
          </div>

          {/* Style References */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Brands We Admire</span>
            {editingField === 'styleReferences' ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSaveField('styleReferences')}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveField('styleReferences')}
                autoFocus
                style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {dna.styleReferences.length > 0 ? (
                    dna.styleReferences.map((s, i) => (
                      <span key={i} style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {s}
                      </span>
                    ))
                  ) : <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>None specified</span>}
                </div>
                <button onClick={() => handleEditClick('styleReferences', dna.styleReferences)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>✏️</button>
              </div>
            )}
          </div>

        </div>

        {/* Full Width Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid rgba(124, 58, 237, 0.05)', paddingTop: '20px' }}>
          
          {/* Target Audience Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Ideal Audience Definition</span>
              <button onClick={() => handleEditClick('audienceDescription', dna.audienceDescription)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>✏️</button>
            </div>
            {editingField === 'audienceDescription' ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSaveField('audienceDescription')}
                rows={3}
                autoFocus
                style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'none' }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, color: '#334155' }}>
                {dna.audienceDescription}
              </p>
            )}
          </div>

          {/* Ethical Positioning / Challenge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Key Tone Challenges & Guidelines</span>
              <button onClick={() => handleEditClick('ethicalPositioning', dna.ethicalPositioning)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>✏️</button>
            </div>
            {editingField === 'ethicalPositioning' ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSaveField('ethicalPositioning')}
                rows={3}
                autoFocus
                style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'none' }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, color: '#334155' }}>
                {dna.ethicalPositioning}
              </p>
            )}
          </div>

        </div>

      </div>

      {/* History Version Modal */}
      {isHistoryOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          fontFamily: 'var(--font-inter), sans-serif'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.25rem', margin: 0 }}>
                Brand DNA Version History
              </h3>
              <button onClick={() => setIsHistoryOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {historyLoading ? (
              <div>Loading history records...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {versions.length === 0 ? (
                  <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No historical versions stored yet.</p>
                ) : (
                  versions.map((ver, i) => (
                    <div key={ver.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Version {versions.length - i}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                          {new Date(ver.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px', color: '#475569' }}>
                        <div><strong>Brand Name:</strong> {ver.brandName}</div>
                        <div><strong>Category:</strong> {ver.productCategory}</div>
                        <div><strong>Tones:</strong> {ver.toneDescriptors.join(', ')}</div>
                        <div><strong>Audience:</strong> {ver.audienceDescription}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
