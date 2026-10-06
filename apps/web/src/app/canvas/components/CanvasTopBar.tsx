'use client';

import React from 'react';
import Link from 'next/link';

interface CanvasTopBarProps {
  projectName: string;
  setProjectName: (name: string) => void;
  format: string;
  width: number;
  height: number;
  zoom: number;
  setZoom: (zoom: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  isSaving: boolean;
  onOpenAiModal: () => void;
  onExport: (type: 'png' | 'jpg' | 'json') => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
}

export default function CanvasTopBar({
  projectName,
  setProjectName,
  format,
  width,
  height,
  zoom,
  setZoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  isSaving,
  onOpenAiModal,
  onExport,
  showGrid,
  setShowGrid
}: CanvasTopBarProps) {
  const [isExportOpen, setIsExportOpen] = React.useState(false);

  return (
    <header style={{
      height: '56px',
      backgroundColor: '#0F172A',
      borderBottom: '1px solid #1E293B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      gap: '12px',
      zIndex: 50,
      flexShrink: 0
    }}>
      {/* Left Section: Back link & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#94A3B8',
            textDecoration: 'none',
            fontSize: '0.82rem',
            fontWeight: 500,
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: '#1E293B',
            transition: 'color 0.15s, background 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.backgroundColor = '#334155'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.backgroundColor = '#1E293B'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Dashboard
        </Link>

        <div style={{ height: '20px', width: '1px', backgroundColor: '#334155' }} />

        {/* Project Name Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid transparent',
              color: '#FFFFFF',
              fontFamily: 'var(--font-inter), sans-serif',
              fontWeight: 600,
              fontSize: '0.92rem',
              padding: '4px 8px',
              borderRadius: '6px',
              outline: 'none',
              maxWidth: '220px',
              transition: 'border-color 0.15s, background 0.15s'
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.backgroundColor = '#1E293B'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          />

          <span style={{
            fontSize: '0.72rem',
            color: '#38BDF8',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}>
            {format} ({width}×{height})
          </span>
        </div>
      </div>

      {/* Center Section: History & View Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: '8px', padding: '2px' }}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            style={{
              padding: '6px 10px',
              backgroundColor: 'transparent',
              border: 'none',
              color: canUndo ? '#F8FAFC' : '#475569',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            style={{
              padding: '6px 10px',
              backgroundColor: 'transparent',
              border: 'none',
              color: canRedo ? '#F8FAFC' : '#475569',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
            </svg>
          </button>
        </div>

        <div style={{ height: '20px', width: '1px', backgroundColor: '#334155' }} />

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: '8px', padding: '2px 6px', gap: '4px' }}>
          <button
            onClick={() => setZoom(Math.max(0.2, Math.round((zoom - 0.1) * 10) / 10))}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            −
          </button>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#E2E8F0', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(3.0, Math.round((zoom + 0.1) * 10) / 10))}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(1.0)}
            title="Reset Zoom to 100%"
            style={{
              background: '#334155',
              border: 'none',
              color: '#CBD5E1',
              cursor: 'pointer',
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '3px 6px',
              borderRadius: '4px',
              marginLeft: '4px'
            }}
          >
            Fit
          </button>
        </div>

        {/* Grid Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle alignment grid"
          style={{
            padding: '6px 10px',
            backgroundColor: showGrid ? 'rgba(99, 102, 241, 0.2)' : '#1E293B',
            border: `1px solid ${showGrid ? '#6366F1' : '#334155'}`,
            color: showGrid ? '#818CF8' : '#94A3B8',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          Grid
        </button>
      </div>

      {/* Right Section: AI Generator, Save & Export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* AI Magic Generator CTA */}
        <button
          onClick={onOpenAiModal}
          style={{
            padding: '7px 14px',
            background: 'linear-gradient(135deg, #6366F1, #A855F7, #EC4899)',
            border: 'none',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 10px rgba(168, 85, 247, 0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(168, 85, 247, 0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(168, 85, 247, 0.35)'; }}
        >
          <span>✨</span>
          <span>AI Design Studio</span>
        </button>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          style={{
            padding: '7px 14px',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#F8FAFC',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => { if (!isSaving) e.currentTarget.style.backgroundColor = '#334155'; }}
          onMouseLeave={e => { if (!isSaving) e.currentTarget.style.backgroundColor = '#1E293B'; }}
        >
          {isSaving ? (
            <>
              <div style={{ width: '12px', height: '12px', border: '2px solid #818CF8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              Saving...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save
            </>
          )}
        </button>

        {/* Export Button & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            style={{
              padding: '7px 14px',
              backgroundColor: '#3B82F6',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563EB'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3B82F6'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
            <span style={{ fontSize: '0.65rem' }}>▼</span>
          </button>

          {isExportOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                width: '190px',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '4px',
                zIndex: 60
              }}
            >
              {[
                { label: 'PNG Image (High Res 2x)', ext: 'png' as const },
                { label: 'JPEG Image (Compressed)', ext: 'jpg' as const },
                { label: 'Project JSON (Editable)', ext: 'json' as const }
              ].map(opt => (
                <button
                  key={opt.ext}
                  onClick={() => {
                    onExport(opt.ext);
                    setIsExportOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: '#E2E8F0',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1E293B'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#E2E8F0'; }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
