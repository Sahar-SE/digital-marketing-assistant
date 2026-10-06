'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SegmentPersona {
  id: string;
  name: string;
  description: string;
  values: string[];
  ageRange: string | null;
  platformPreference: string | null;
}

interface UserProfile {
  userId: string;
  email: string;
  phase: string;
  generationCredits: number;
}

export default function PersonasPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [personas, setPersonas] = useState<SegmentPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Dialog State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);

  // Form Fields
  const [segmentName, setSegmentName] = useState('');
  const [description, setDescription] = useState('');
  const [motivatingValues, setMotivatingValues] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [platformPreference, setPlatformPreference] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

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

  const fetchPersonas = async () => {
    try {
      setLoading(true);
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

  const openCreateModal = () => {
    if (personas.length >= 5) return;
    setModalMode('create');
    setEditingPersonaId(null);
    setSegmentName('');
    setDescription('');
    setMotivatingValues('');
    setAgeRange('');
    setPlatformPreference('');
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (p: SegmentPersona) => {
    setModalMode('edit');
    setEditingPersonaId(p.id);
    setSegmentName(p.name);
    setDescription(p.description);
    setMotivatingValues(p.values.join(', '));
    setAgeRange(p.ageRange || '');
    setPlatformPreference(p.platformPreference || '');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentName.trim() || !description.trim() || !motivatingValues.trim()) {
      setErrorMsg('Segment Name, Description, and Motivating Values are mandatory.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('dma_token');
      const url = modalMode === 'create'
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/personas`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/personas/${editingPersonaId}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: segmentName,
          description,
          values: motivatingValues,
          ageRange: ageRange || null,
          platformPreference: platformPreference || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save persona');
      }

      setShowModal(false);
      fetchPersonas();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this custom persona? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/personas/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (res.ok) {
        fetchPersonas();
      } else {
        alert('Failed to delete persona');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.split(/\s+/);
    const first = parts[0]?.charAt(0) || '';
    const second = parts[1]?.charAt(0) || '';
    return (first + second).toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <span style={{ fontSize: '1.5rem' }}>🔄</span>
      </div>
    );
  }

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
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👥</div>
        <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', marginBottom: '16px' }}>
          Unlock Segment Personas
        </h2>
        <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '32px' }}>
          Segment Personas dashboard is a premium **Phase 2** (Pro) feature. Upgrade to create custom target personas, view profile cards, and request simulated first-person audience reactions on draft content.
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
    <div style={{ maxWidth: '896px', margin: '0 auto', fontFamily: 'var(--font-inter), sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '2.25rem', margin: 0, color: 'var(--foreground)' }}>
            Segment Personas
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--foreground-muted)', fontSize: '0.95rem' }}>
            Define and manage up to 5 target segment personas (Active: {personas.length} / 5).
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={openCreateModal}
            disabled={personas.length >= 5}
            title={personas.length >= 5 ? 'You have reached the maximum limit of 5 personas' : 'Create new target persona'}
            style={{
              backgroundColor: personas.length >= 5 ? '#e2e8f0' : 'var(--primary)',
              color: personas.length >= 5 ? '#94a3b8' : '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: personas.length >= 5 ? 'not-allowed' : 'pointer',
              boxShadow: personas.length >= 5 ? 'none' : '0 4px 12px rgba(124, 58, 237, 0.15)'
            }}
          >
            Create Persona
          </button>
          {personas.length >= 5 && (
            <span style={{
              display: 'block',
              fontSize: '0.72rem',
              color: '#dc2626',
              textAlign: 'center',
              marginTop: '4px',
              fontWeight: 600
            }}>
              5-persona limit reached
            </span>
          )}
        </div>
      </div>

      {personas.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px',
          borderRadius: '12px',
          border: '2px dashed var(--border)',
          backgroundColor: '#f8fafc',
          color: 'var(--foreground-muted)'
        }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '16px' }}>👥</span>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--foreground)' }}>No custom personas yet</h3>
          <p style={{ margin: '6px 0 16px 0', fontSize: '0.85rem' }}>Define specific audience profiles to tailor your marketing campaigns.</p>
          <button
            onClick={openCreateModal}
            style={{ backgroundColor: 'var(--primary)', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            Create your first persona
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {personas.map(p => (
            <div
              key={p.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '260px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-subtle)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.95rem'
                  }}>
                    {getInitials(p.name)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)' }}>{p.name}</h3>
                    {p.ageRange && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)' }}>Age {p.ageRange}</span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  {p.description}
                </p>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {p.values.map((v, i) => (
                    <span key={i} style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontSize: '0.72rem', fontWeight: 600 }}>
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', fontStyle: 'italic' }}>
                  {p.platformPreference ? `Prefers: ${p.platformPreference}` : 'No platform preference'}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openEditModal(p)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {showModal && (
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
            onSubmit={handleSave}
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
              {modalMode === 'create' ? 'Create Segment Persona' : 'Edit Segment Persona'}
            </h3>

            {errorMsg && (
              <div style={{ backgroundColor: '#fff5f5', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '16px', fontWeight: 600 }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Segment Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Eco Buyers"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  required
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Description *</label>
                <input
                  type="text"
                  placeholder="1-sentence audience summary"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  maxLength={150}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Motivating Values *</label>
                <input
                  type="text"
                  placeholder="Comma-separated values, e.g. Sustainability, ROI (max 3)"
                  value={motivatingValues}
                  onChange={(e) => setMotivatingValues(e.target.value)}
                  required
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Age Range (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 22-30"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Preferred Platform (Optional)</label>
                  <select
                    value={platformPreference}
                    onChange={(e) => setPlatformPreference(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    <option value="">None</option>
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Blog">Blog</option>
                    <option value="Email">Email</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Saving...' : 'Save Persona'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
