'use client';

import React, { useState } from 'react';

interface DesignVariant {
  id: string;
  name: string;
  style: string;
  width: number;
  height: number;
  format: string;
  palette: string[];
  layers: any[];
}

interface AiDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVariant: (variant: DesignVariant) => void;
  currentFormat: string;
  imageContext?: string | null; // data URL or URL of uploaded image
}

export default function AiDesignModal({
  isOpen,
  onClose,
  onSelectVariant,
  currentFormat,
  imageContext
}: AiDesignModalProps) {
  const [format, setFormat] = useState(currentFormat || 'Instagram Post');
  const [topic, setTopic] = useState('');
  const [mood, setMood] = useState('Modern Glass & Neon');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<DesignVariant[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [brandDnaUsed, setBrandDnaUsed] = useState<{ brandName: string; category: string } | null>(null);

  if (!isOpen) return null;

  const formats = [
    { name: 'Instagram Post', desc: '1080 × 1080 px (Square)', icon: '📱' },
    { name: 'Instagram Story', desc: '1080 × 1920 px (Vertical 9:16)', icon: '📸' },
    { name: 'Facebook Ad', desc: '1200 × 628 px (Landscape)', icon: '📢' },
    { name: 'LinkedIn Banner', desc: '1584 × 396 px (Panoramic)', icon: '💼' }
  ];

  const moods = [
    'Modern Glass & Neon',
    'Solar Warm High-Conversion',
    'Clean Luxury Editorial',
    'Cyberpunk Vibrant Tech',
    'Minimalist Monochrome'
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('dma_token') : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/canvas/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          format,
          topic: topic.trim() || 'New Product Launch',
          mood,
          customPrompt: customPrompt.trim(),
          // Pass image context if user uploaded one
          imageContext: imageContext || undefined
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.variants)) {
        setVariants(data.variants);
        if (data.brandDna) setBrandDnaUsed(data.brandDna);
      } else {
        setErrorMsg(data.error || 'Failed to generate design variants');
      }
    } catch (err: any) {
      console.error('AI generation request failed:', err);
      setErrorMsg('Failed to connect to AI Design service');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        backgroundColor: '#0F172A',
        border: '1px solid #334155',
        borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(99,102,241,0.1), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>✨</span>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                AI Visual Studio & Asset Synthesizer
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '2px 0 0' }}>
                Generates a complete multi-layer canvas customized for your Brand DNA in seconds.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Format Picker */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px', display: 'block' }}>
              1. Choose Canvas Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {formats.map(f => {
                const isSelected = format === f.name;
                return (
                  <div
                    key={f.name}
                    onClick={() => setFormat(f.name)}
                    style={{
                      padding: '12px',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.18)' : '#1E293B',
                      border: `1px solid ${isSelected ? '#6366F1' : '#334155'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{f.icon}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? '#FFFFFF' : '#CBD5E1' }}>
                        {f.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{f.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Topic & Mood */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px', display: 'block' }}>
                2. Campaign / Design Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Next-Gen Cloud Platform, Summer Drop 2026..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px', display: 'block' }}>
                3. Mood & Aesthetic Preset
              </label>
              <select
                value={mood}
                onChange={e => setMood(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {moods.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Context Preview */}
          {imageContext && (
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <img
                src={imageContext}
                alt="Uploaded image context"
                style={{
                  width: '56px',
                  height: '56px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  flexShrink: 0
                }}
              />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#C4B5FD' }}>
                  🎨 Image Context Active
                </div>
                <div style={{ fontSize: '0.73rem', color: '#94A3B8', marginTop: '3px', lineHeight: 1.4 }}>
                  AI will incorporate your uploaded image's colors, style and composition into the generated design.
                </div>
              </div>
            </div>
          )}

          {/* Custom Prompt Instructions */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px', display: 'block' }}>
              4. Additional Art Direction Instructions (Optional)
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="e.g. Include a 20% discount badge, keep background dark with violet highlights..."
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {errorMsg && (
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#FCA5A5', fontSize: '0.8rem' }}>
              {errorMsg}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              padding: '14px',
              background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              transition: 'opacity 0.15s'
            }}
          >
            {isGenerating ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                <span>Synthesizing Design Variants with AI...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate 3 Design Options</span>
              </>
            )}
          </button>

          {/* GENERATED VARIANTS PREVIEW CARDS */}
          {variants.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>

              {/* Brand DNA confirmation */}
              {brandDnaUsed && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: '#6EE7B7'
                }}>
                  <span style={{ fontSize: '1rem' }}>🧬</span>
                  <span>
                    <strong>Brand DNA Applied:</strong> Designs crafted for <strong>{brandDnaUsed.brandName}</strong> · {brandDnaUsed.category}
                  </span>
                </div>
              )}

              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                Select a Design Variant to Load into Editor:
              </div>


              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                {variants.map((v, i) => (
                  <div
                    key={v.id || i}
                    onClick={() => {
                      onSelectVariant(v);
                      onClose();
                    }}
                    style={{
                      padding: '16px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = '#6366F1';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.25)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = '#334155';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Simulated Mini Card Preview */}
                    <div style={{
                      height: '130px',
                      borderRadius: '8px',
                      backgroundColor: v.palette?.[0] || '#090D16',
                      border: '1px solid #334155',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '10px',
                      boxSizing: 'border-box',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Mini visual elements */}
                      <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        background: v.palette?.[1] || '#6366F1',
                        opacity: 0.4,
                        filter: 'blur(10px)'
                      }} />

                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: v.palette?.[3] || '#38BDF8' }}>
                        {v.style}
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                        {v.name}
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {(v.palette || []).map((c, ci) => (
                          <div key={ci} style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c }} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>{v.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{v.layers?.length || 0} editable layers</div>
                    </div>

                    <button
                      style={{
                        padding: '8px',
                        backgroundColor: '#6366F1',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      Use This Design →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
