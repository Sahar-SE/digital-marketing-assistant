'use client';

import React, { useState } from 'react';

export interface SelectedObjectProps {
  id: string;
  type: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill?: string;
  color?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  borderRadius?: number;
  alignment?: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
}

interface CanvasInspectorProps {
  selectedObj: SelectedObjectProps | null;
  onUpdateProp: (key: string, value: any) => void;
  canvasBg: string;
  setCanvasBg: (color: string) => void;
  format: string;
  width: number;
  height: number;
  palette: string[];
  onAiRewriteText?: (instruction: string) => Promise<string | void>;
}

export default function CanvasInspector({
  selectedObj,
  onUpdateProp,
  canvasBg,
  setCanvasBg,
  format,
  width,
  height,
  palette,
  onAiRewriteText
}: CanvasInspectorProps) {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiRewriting, setIsAiRewriting] = useState(false);

  const defaultPalette = palette.length > 0 ? palette : ['#090D16', '#6366F1', '#EC4899', '#38BDF8', '#10B981', '#F8FAFC'];

  const fontOptions = [
    { label: 'Inter (Clean Sans)', value: 'Inter' },
    { label: 'Bricolage Grotesque (Punchy Display)', value: 'Bricolage Grotesque' },
    { label: 'Outfit (Modern Tech)', value: 'Outfit' },
    { label: 'Roboto (Neutral Sans)', value: 'Roboto' },
    { label: 'Space Grotesk (Tech Minimal)', value: 'Space Grotesk' },
    { label: 'Playfair Display (Luxe Serif)', value: 'Playfair Display' }
  ];

  const handleAiRewrite = async (preset?: string) => {
    if (!onAiRewriteText) return;
    const promptToUse = preset || aiPrompt;
    if (!promptToUse.trim()) return;

    setIsAiRewriting(true);
    try {
      const newText = await onAiRewriteText(promptToUse);
      if (newText) {
        onUpdateProp('text', newText);
      }
      setAiPrompt('');
    } catch (err) {
      console.error('AI Rewrite Error:', err);
    } finally {
      setIsAiRewriting(false);
    }
  };

  return (
    <aside style={{
      width: '280px',
      height: 'calc(100vh - 56px)',
      backgroundColor: '#0F172A',
      borderLeft: '1px solid #1E293B',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      padding: '16px',
      gap: '16px',
      zIndex: 40,
      flexShrink: 0,
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
          {selectedObj ? `${selectedObj.type.toUpperCase()} INSPECTOR` : 'CANVAS SETTINGS'}
        </span>
        {selectedObj && (
          <span style={{ fontSize: '0.68rem', backgroundColor: '#1E293B', color: '#818CF8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
            Active Layer
          </span>
        )}
      </div>

      {/* TEXT OBJECT INSPECTOR */}
      {selectedObj && (selectedObj.type === 'text' || selectedObj.type === 'i-text' || selectedObj.type === 'textbox') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Text Content Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>Text Content</label>
            <textarea
              value={selectedObj.text || ''}
              onChange={e => onUpdateProp('text', e.target.value)}
              rows={3}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#FFFFFF',
                padding: '8px 10px',
                fontSize: '0.82rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>

          {/* AI Magic Rewrite Panel */}
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.9rem' }}>✨</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A5B4FC' }}>AI Copy Enhancer</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {['Make Punchy', 'Shorten', 'Add Urgency', 'Make Luxury'].map(preset => (
                <button
                  key={preset}
                  onClick={() => handleAiRewrite(`${preset}: "${selectedObj.text}"`)}
                  disabled={isAiRewriting}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.68rem',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#CBD5E1',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAiRewrite(); }}
                placeholder="Custom copy instruction..."
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleAiRewrite()}
                disabled={isAiRewriting || !aiPrompt.trim()}
                style={{
                  padding: '6px 10px',
                  background: 'linear-gradient(135deg, #6366F1, #A855F7)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: isAiRewriting || !aiPrompt.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {isAiRewriting ? '...' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Typography Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>Font Family</label>
            <select
              value={selectedObj.fontFamily || 'Inter'}
              onChange={e => onUpdateProp('fontFamily', e.target.value)}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#FFFFFF',
                padding: '6px 8px',
                fontSize: '0.78rem',
                outline: 'none'
              }}
            >
              {fontOptions.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Font Size & Weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Font Size ({selectedObj.fontSize || 24}px)</label>
              <input
                type="range"
                min="10"
                max="120"
                value={selectedObj.fontSize || 24}
                onChange={e => onUpdateProp('fontSize', parseInt(e.target.value))}
                style={{ accentColor: '#6366F1', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Weight</label>
              <select
                value={selectedObj.fontWeight || 'normal'}
                onChange={e => onUpdateProp('fontWeight', e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  padding: '4px 6px',
                  fontSize: '0.75rem'
                }}
              >
                <option value="400">Regular (400)</option>
                <option value="600">SemiBold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">ExtraBold (800)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>
          </div>

          {/* Alignment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Alignment</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['left', 'center', 'right'].map(align => (
                <button
                  key={align}
                  onClick={() => onUpdateProp('textAlign', align)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: selectedObj.alignment === align ? '#6366F1' : '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    cursor: 'pointer'
                  }}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          {/* Text Color */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={selectedObj.fill || selectedObj.color || '#FFFFFF'}
                onChange={e => onUpdateProp('fill', e.target.value)}
                style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent' }}
              />
              <span style={{ fontSize: '0.8rem', color: '#CBD5E1', fontFamily: 'monospace' }}>
                {selectedObj.fill || selectedObj.color || '#FFFFFF'}
              </span>
            </div>

            {/* Brand Palette Quick Swatches */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {defaultPalette.map((c, i) => (
                <div
                  key={i}
                  onClick={() => onUpdateProp('fill', c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: '1px solid #334155',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SHAPE OBJECT INSPECTOR */}
      {selectedObj && (selectedObj.type === 'rect' || selectedObj.type === 'circle') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Fill Color */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Fill Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={selectedObj.fill || '#6366F1'}
                onChange={e => onUpdateProp('fill', e.target.value)}
                style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent' }}
              />
              <span style={{ fontSize: '0.8rem', color: '#CBD5E1', fontFamily: 'monospace' }}>
                {selectedObj.fill || '#6366F1'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {defaultPalette.map((c, i) => (
                <div
                  key={i}
                  onClick={() => onUpdateProp('fill', c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: '1px solid #334155',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Opacity Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Opacity ({Math.round((selectedObj.opacity ?? 1) * 100)}%)</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedObj.opacity ?? 1}
              onChange={e => onUpdateProp('opacity', parseFloat(e.target.value))}
              style={{ accentColor: '#6366F1', cursor: 'pointer' }}
            />
          </div>

          {/* Stroke Width & Color */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Border Width</label>
              <input
                type="number"
                min="0"
                max="20"
                value={selectedObj.strokeWidth ?? 0}
                onChange={e => onUpdateProp('strokeWidth', parseInt(e.target.value) || 0)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  padding: '6px',
                  fontSize: '0.78rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Border Color</label>
              <input
                type="color"
                value={selectedObj.stroke || '#FFFFFF'}
                onChange={e => onUpdateProp('stroke', e.target.value)}
                style={{ width: '100%', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent' }}
              />
            </div>
          </div>

          {/* Border Radius for Rectangles */}
          {selectedObj.type === 'rect' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Corner Rounding ({selectedObj.borderRadius || 0}px)</label>
              <input
                type="range"
                min="0"
                max="60"
                value={selectedObj.borderRadius || 0}
                onChange={e => onUpdateProp('rx', parseInt(e.target.value))}
                style={{ accentColor: '#6366F1', cursor: 'pointer' }}
              />
            </div>
          )}
        </div>
      )}

      {/* NO OBJECT SELECTED -> CANVAS DEFAULTS */}
      {!selectedObj && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#1E293B',
            borderRadius: '8px',
            border: '1px solid #334155'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#CBD5E1' }}>Canvas Dimensions</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#38BDF8', marginTop: '2px' }}>
              {width} × {height} px ({format})
            </div>
          </div>

          {/* Canvas Background Color */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>Canvas Background Fill</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={canvasBg}
                onChange={e => setCanvasBg(e.target.value)}
                style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent' }}
              />
              <span style={{ fontSize: '0.8rem', color: '#CBD5E1', fontFamily: 'monospace' }}>
                {canvasBg}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              {['#080C14', '#0F172A', '#180828', '#111827', '#0A192F', '#FFFFFF'].map((bg, i) => (
                <div
                  key={i}
                  onClick={() => setCanvasBg(bg)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    backgroundColor: bg,
                    border: '1px solid #475569',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Tip Box */}
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: '#94A3B8',
            lineHeight: 1.4
          }}>
            <strong style={{ color: '#38BDF8' }}>💡 Pro Tip:</strong> Click any element on the canvas to edit its typography, colors, borders, and AI rewrite prompts!
          </div>
        </div>
      )}
    </aside>
  );
}
