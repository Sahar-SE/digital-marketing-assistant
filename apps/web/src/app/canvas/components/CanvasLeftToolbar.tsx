'use client';

import React, { useState, useRef } from 'react';

interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
}

interface CanvasLeftToolbarProps {
  activeTab: 'templates' | 'text' | 'shapes' | 'media' | 'layers' | 'ai-images';
  setActiveTab: (tab: 'templates' | 'text' | 'shapes' | 'media' | 'layers' | 'ai-images') => void;
  onAddText: (type: 'heading' | 'subhead' | 'body' | 'pill') => void;
  onAddShape: (type: 'rect' | 'circle' | 'card' | 'bar' | 'pill') => void;
  onAddImage: (url: string) => void;
  onOpenAiModal: () => void;
  layers: LayerItem[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  // Optional: pass to AI modal for image-based generation
  onSetAiImageContext?: (dataUrl: string) => void;
}

export default function CanvasLeftToolbar({
  activeTab,
  setActiveTab,
  onAddText,
  onAddShape,
  onAddImage,
  onOpenAiModal,
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onDeleteLayer,
  onMoveLayer,
  onSetAiImageContext
}: CanvasLeftToolbarProps) {
  const [imageUploadUrl, setImageUploadUrl] = useState('');
  const [urlFeedback, setUrlFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Visuals & Illustrations Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState('3d-render');
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [generatedVisual, setGeneratedVisual] = useState<{
    imageUrl: string;
    enhancedPrompt: string;
    style: string;
  } | null>(null);
  const [recentAiImages, setRecentAiImages] = useState<Array<{ imageUrl: string; prompt: string; enhancedPrompt: string; style: string }>>([]);
  const [aiGenError, setAiGenError] = useState<string | null>(null);

  const handleGenerateAiVisual = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAiImage(true);
    setAiGenError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('dma_token') : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/canvas/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          style: aiStyle,
          format: 'Instagram Post'
        })
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        const visual = {
          imageUrl: data.imageUrl,
          prompt: aiPrompt.trim(),
          enhancedPrompt: data.enhancedPrompt || aiPrompt,
          style: data.style || aiStyle
        };
        setGeneratedVisual(visual);
        setRecentAiImages(prev => [visual, ...prev.slice(0, 8)]);
      } else {
        setAiGenError(data.error || 'Failed to generate visual');
      }
    } catch (err: any) {
      console.error('Visual generation failed:', err);
      setAiGenError('Network error connecting to image generator');
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setUrlFeedback({ type: 'error', msg: 'Please select a valid image file.' });
      setTimeout(() => setUrlFeedback(null), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        onAddImage(dataUrl);
        if (onSetAiImageContext) onSetAiImageContext(dataUrl);
        setUrlFeedback({ type: 'success', msg: `✓ ${file.name} added to canvas` });
        setTimeout(() => setUrlFeedback(null), 3000);
      }
    };
    reader.onerror = () => {
      setUrlFeedback({ type: 'error', msg: 'Failed to read file.' });
      setTimeout(() => setUrlFeedback(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlAdd = () => {
    const url = imageUploadUrl.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
      setUrlFeedback({ type: 'error', msg: 'Please enter a valid http(s) URL.' });
      setTimeout(() => setUrlFeedback(null), 3000);
      return;
    }
    onAddImage(url);
    setImageUploadUrl('');
    setUrlFeedback({ type: 'success', msg: '✓ Image added to canvas' });
    setTimeout(() => setUrlFeedback(null), 3000);
  };

  const tabs = [
    { id: 'templates' as const, label: 'AI Design', icon: '✨' },
    { id: 'ai-images' as const, label: 'AI Images', icon: '🎨' },
    { id: 'text' as const, label: 'Text', icon: '🔤' },
    { id: 'shapes' as const, label: 'Shapes', icon: '🔷' },
    { id: 'media' as const, label: 'Media', icon: '🖼️' },
    { id: 'layers' as const, label: 'Layers', icon: '📑' }
  ];

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 56px)',
      backgroundColor: '#0B0F19',
      borderRight: '1px solid #1E293B',
      zIndex: 40,
      flexShrink: 0
    }}>
      {/* Mini Icon Navigation Strip */}
      <div style={{
        width: '68px',
        backgroundColor: '#0F172A',
        borderRight: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: '8px'
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '54px',
                height: '52px',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                border: isActive ? '1px solid #6366F1' : '1px solid transparent',
                borderRadius: '10px',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#1E293B'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded Tool Tab Content */}
      <div style={{
        width: '280px',
        height: '100%',
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box'
      }}>
        {/* TAB 1: AI DESIGN & TEMPLATES */}
        {activeTab === 'templates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>✨</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF' }}>AI Visual Generator</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.4, margin: 0 }}>
                Generate full multi-layer professional designs crafted for your Brand DNA in 1 click.
              </p>
              <button
                onClick={onOpenAiModal}
                style={{
                  marginTop: '4px',
                  padding: '10px 14px',
                  background: 'linear-gradient(135deg, #6366F1, #A855F7)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
                }}
              >
                ✨ Launch AI Design Studio
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8', marginTop: '6px' }}>
              POPULAR FORMATS
            </div>

            {[
              { name: 'Instagram Post (1:1)', dims: '1080 × 1080 px', tag: 'Square' },
              { name: 'Instagram Story (9:16)', dims: '1080 × 1920 px', tag: 'Vertical' },
              { name: 'Facebook Ad (1.91:1)', dims: '1200 × 628 px', tag: 'Landscape' },
              { name: 'LinkedIn Banner', dims: '1584 × 396 px', tag: 'Ultra-wide' }
            ].map((f, i) => (
              <div
                key={i}
                onClick={onOpenAiModal}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'border-color 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366F1'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>{f.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{f.dims}</div>
                </div>
                <span style={{ fontSize: '0.68rem', backgroundColor: '#334155', color: '#CBD5E1', padding: '2px 6px', borderRadius: '4px' }}>
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 1.5: AI IMAGES & ILLUSTRATIONS */}
        {activeTab === 'ai-images' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header info card */}
            <div style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(236, 72, 153, 0.15))',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🎨</span>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#FFFFFF' }}>
                  AI Visuals & Illustrations
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#CBD5E1', lineHeight: 1.4, margin: 0 }}>
                Powered by Gemini & FLUX. Generate 3D illustrations, vector graphics, and photorealistic marketing visuals in seconds.
              </p>
            </div>

            {/* Prompt input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#E2E8F0' }}>
                Describe what you want to create:
              </label>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. 3D isometric marketing rocket, floating luxury watch with neon studio light, minimalist botanical background..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  lineHeight: 1.4,
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Quick Inspiration Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8' }}>
                QUICK INSPIRATION
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {[
                  { text: '🚀 3D Isometric Rocket', prompt: '3D isometric rocket launching with neon smoke and stars', style: '3d-render' },
                  { text: '💎 Luxury Perfume', prompt: 'Cosmic luxury perfume bottle on floating obsidian pedestal', style: 'photorealistic' },
                  { text: '📈 Growth Analytics', prompt: 'Modern isometric digital marketing analytics 3D vector illustration', style: 'vector-illustration' },
                  { text: '⚡ Cyberpunk Mascot', prompt: 'Cute futuristic cyberpunk AI robot companion mascot glowing', style: 'cyberpunk' },
                  { text: '🌿 Botanical Minimal', prompt: 'Organic aesthetic botanical leaf shadow on warm sand texture', style: 'minimalist' },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAiPrompt(chip.prompt);
                      setAiStyle(chip.style);
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#CBD5E1',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {chip.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#E2E8F0' }}>
                Visual Style:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { id: '3d-render', label: '🎨 3D Render' },
                  { id: 'vector-illustration', label: '✏️ Vector Graphic' },
                  { id: 'photorealistic', label: '📸 Photorealistic' },
                  { id: 'cyberpunk', label: '⚡ Cyberpunk Neon' },
                  { id: 'minimalist', label: '🌿 Minimalist Luxe' },
                  { id: 'watercolor', label: '🖌️ Watercolor Art' },
                  { id: 'product-showcase', label: '📦 Product Podium' }
                ].map(s => {
                  const isSel = aiStyle === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setAiStyle(s.id)}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: isSel ? 'rgba(99, 102, 241, 0.2)' : '#1E293B',
                        border: isSel ? '1px solid #6366F1' : '1px solid #334155',
                        borderRadius: '6px',
                        color: isSel ? '#FFFFFF' : '#94A3B8',
                        fontSize: '0.72rem',
                        fontWeight: isSel ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s'
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateAiVisual}
              disabled={isGeneratingAiImage || !aiPrompt.trim()}
              style={{
                padding: '12px 14px',
                background: isGeneratingAiImage || !aiPrompt.trim()
                  ? '#334155'
                  : 'linear-gradient(135deg, #6366F1, #EC4899)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: isGeneratingAiImage || !aiPrompt.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isGeneratingAiImage || !aiPrompt.trim() ? 'none' : '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              {isGeneratingAiImage ? (
                <>
                  <span style={{ display: 'inline-block' }}>⏳</span>
                  Synthesizing with Gemini...
                </>
              ) : (
                <>✨ Generate AI Visual</>
              )}
            </button>

            {aiGenError && (
              <div style={{
                padding: '8px 10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '6px',
                color: '#FCA5A5',
                fontSize: '0.72rem'
              }}>
                {aiGenError}
              </div>
            )}

            {/* Generated Visual Card */}
            {generatedVisual && (
              <div style={{
                padding: '12px',
                backgroundColor: '#1E293B',
                border: '1px solid #6366F1',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#38BDF8' }}>
                    ✓ Visual Generated
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'capitalize' }}>
                    {generatedVisual.style}
                  </span>
                </div>

                {/* Preview Image */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155'
                }}>
                  <img
                    src={generatedVisual.imageUrl}
                    alt="Generated Visual"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Action button */}
                <button
                  onClick={() => {
                    onAddImage(generatedVisual.imageUrl);
                    if (onSetAiImageContext) onSetAiImageContext(generatedVisual.imageUrl);
                  }}
                  style={{
                    padding: '10px',
                    backgroundColor: '#10B981',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  ➕ Add to Canvas Layer
                </button>
              </div>
            )}

            {/* Recent Gallery in session */}
            {recentAiImages.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94A3B8' }}>
                  RECENT GENERATIONS
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {recentAiImages.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => onAddImage(img.imageUrl)}
                      title={`Click to add: ${img.prompt}`}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid #334155',
                        position: 'relative'
                      }}
                    >
                      <img src={img.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TEXT TOOLBAR */}
        {activeTab === 'text' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>
              Add Typography Layers
            </div>

            <button
              onClick={() => onAddText('heading')}
              style={{
                padding: '14px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontFamily: 'var(--font-bricolage), sans-serif',
                fontSize: '1.2rem',
                fontWeight: 800,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.backgroundColor = '#26334D'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#1E293B'; }}
            >
              Add a Main Heading
            </button>

            <button
              onClick={() => onAddText('subhead')}
              style={{
                padding: '12px 14px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#E2E8F0',
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: '0.95rem',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.backgroundColor = '#26334D'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#1E293B'; }}
            >
              Add a Subtitle / Value Prop
            </button>

            <button
              onClick={() => onAddText('body')}
              style={{
                padding: '10px 14px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#94A3B8',
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: '0.82rem',
                fontWeight: 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.backgroundColor = '#26334D'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#1E293B'; }}
            >
              Add Body Paragraph Text
            </button>

            <button
              onClick={() => onAddText('pill')}
              style={{
                padding: '8px 14px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '20px',
                color: '#38BDF8',
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: '0.75rem',
                fontWeight: 700,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'}
            >
              ✦ Brand Category Tag Pill
            </button>
          </div>
        )}

        {/* TAB 3: SHAPES & ACCENTS */}
        {activeTab === 'shapes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>
              Modern UI & Design Accents
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => onAddShape('card')}
                style={{
                  padding: '16px 8px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <div style={{ width: '32px', height: '24px', backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Glass Card</span>
              </button>

              <button
                onClick={() => onAddShape('circle')}
                style={{
                  padding: '16px 8px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'radial-gradient(circle, #6366F1 0%, transparent 80%)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Glow Orb</span>
              </button>

              <button
                onClick={() => onAddShape('rect')}
                style={{
                  padding: '16px 8px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <div style={{ width: '32px', height: '24px', backgroundColor: '#6366F1', borderRadius: '4px' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Solid Panel</span>
              </button>

              <button
                onClick={() => onAddShape('pill')}
                style={{
                  padding: '16px 8px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <div style={{ width: '36px', height: '18px', backgroundColor: '#F43F5E', borderRadius: '10px' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>CTA Pill</span>
              </button>

              <button
                onClick={() => onAddShape('bar')}
                style={{
                  padding: '16px 8px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  gridColumn: 'span 2'
                }}
              >
                <div style={{ width: '80%', height: '4px', backgroundColor: '#10B981', borderRadius: '2px' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Accent Divider Bar</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: MEDIA & BACKGROUNDS */}
        {activeTab === 'media' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Section: Upload Local File */}
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>
              Upload Image
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                // reset so same file can be re-uploaded
                e.target.value = '';
              }}
            />

            {/* Drag-and-drop / click area */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '20px 12px',
                border: `2px dashed ${isDragOver ? '#6366F1' : '#334155'}`,
                borderRadius: '10px',
                backgroundColor: isDragOver ? 'rgba(99, 102, 241, 0.08)' : '#111827',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background-color 0.2s'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>🖼️</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#E2E8F0' }}>
                Click or drag & drop
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                PNG, JPG, WEBP, SVG supported
              </span>
            </div>

            {/* Feedback message */}
            {urlFeedback && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: urlFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${urlFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                color: urlFeedback.type === 'success' ? '#6EE7B7' : '#FCA5A5'
              }}>
                {urlFeedback.msg}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#1E293B' }} />
              <span style={{ fontSize: '0.7rem', color: '#475569', flexShrink: 0 }}>or paste URL</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#1E293B' }} />
            </div>

            {/* URL Input */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={imageUploadUrl}
                onChange={e => setImageUploadUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleUrlAdd(); }}
                placeholder="https://example.com/image.png"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleUrlAdd}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#6366F1',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Add
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8', marginTop: '2px', letterSpacing: '0.04em' }}>
              🎨 TEXTURE & BACKGROUND LIBRARY
            </div>

            {[
              {
                category: 'Dark & Moody',
                items: [
                  { name: 'Neon Cyber',     url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80' },
                  { name: 'Obsidian Fluid', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80' },
                  { name: 'Ink Cosmos',     url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=600&q=80' },
                  { name: 'Cold Frost',     url: 'https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=600&q=80' },
                ]
              },
              {
                category: 'Warm & Vibrant',
                items: [
                  { name: 'Sunset Fire',    url: 'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=600&q=80' },
                  { name: 'Abstract Fluid', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&q=80' },
                  { name: 'Gold Luxe',      url: 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=600&q=80' },
                  { name: 'Neon Triangle',  url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
                ]
              },
              {
                category: 'Nature & Organic',
                items: [
                  { name: 'Forest Green',   url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80' },
                  { name: 'Ocean Wave',     url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&q=80' },
                  { name: 'Marble White',   url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&q=80' },
                  { name: 'Paper Texture',  url: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=600&q=80' },
                ]
              },
              {
                category: 'Abstract & Tech',
                items: [
                  { name: 'Aurora Night',   url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&q=80' },
                  { name: 'Cosmic Dust',    url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=600&q=80' },
                  { name: 'Tech Circuit',   url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80' },
                  { name: 'Concrete Raw',   url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80' },
                ]
              }
            ].map((group, gi) => (
              <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{
                  fontSize: '0.68rem', fontWeight: 700, color: '#475569',
                  letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: gi > 0 ? '4px' : 0
                }}>
                  {group.category}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {group.items.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => onAddImage(img.url)}
                      title={`Add "${img.name}" to canvas`}
                      style={{
                        height: '66px',
                        borderRadius: '7px',
                        backgroundImage: `url(${img.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid #1E293B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '5px',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s, transform 0.12s',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#6366F1';
                        e.currentTarget.style.transform = 'scale(1.03)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#1E293B';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 700,
                        backgroundColor: 'rgba(0,0,0,0.72)',
                        color: '#E2E8F0', padding: '2px 5px',
                        borderRadius: '3px', lineHeight: 1.3,
                        backdropFilter: 'blur(4px)'
                      }}>
                        {img.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}


        {/* TAB 5: LAYERS MANAGER */}
        {activeTab === 'layers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>Layer Hierarchy</span>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{layers.length} layers</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {layers.slice().reverse().map((layer, revIdx) => {
                const isSelected = selectedLayerId === layer.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => onSelectLayer(layer.id)}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : '#1E293B',
                      border: `1px solid ${isSelected ? '#6366F1' : '#334155'}`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem' }}>
                        {layer.type === 'text' ? '🔤' : layer.type === 'image' || layer.type === 'background' ? '🖼️' : '🔷'}
                      </span>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#FFFFFF' : '#CBD5E1',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {layer.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {/* Move Up */}
                      <button
                        onClick={e => { e.stopPropagation(); onMoveLayer(layer.id, 'up'); }}
                        title="Move layer up"
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.75rem', padding: '2px' }}
                      >
                        ▲
                      </button>
                      {/* Move Down */}
                      <button
                        onClick={e => { e.stopPropagation(); onMoveLayer(layer.id, 'down'); }}
                        title="Move layer down"
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.75rem', padding: '2px' }}
                      >
                        ▼
                      </button>
                      {/* Eye / Visibility */}
                      <button
                        onClick={e => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                        style={{ background: 'none', border: 'none', color: layer.visible ? '#38BDF8' : '#64748B', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        {layer.visible ? '👁️' : '🚫'}
                      </button>
                      {/* Lock */}
                      <button
                        onClick={e => { e.stopPropagation(); onToggleLock(layer.id); }}
                        style={{ background: 'none', border: 'none', color: layer.locked ? '#F59E0B' : '#64748B', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        {layer.locked ? '🔒' : '🔓'}
                      </button>
                      {/* Delete */}
                      <button
                        onClick={e => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
