'use client';

import React, { useState, useEffect, useRef } from 'react';
import CanvasTopBar from './components/CanvasTopBar';
import CanvasLeftToolbar from './components/CanvasLeftToolbar';
import CanvasInspector, { SelectedObjectProps } from './components/CanvasInspector';
import AiDesignModal from './components/AiDesignModal';
import FabricCanvas, { FabricCanvasRef } from './components/FabricCanvas';

export default function CanvasStudioPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('AI Brand Design Draft');
  const [format, setFormat] = useState('Instagram Post');
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [zoom, setZoom] = useState(0.65);
  const [canvasBg, setCanvasBg] = useState('#080C14');
  const [palette, setPalette] = useState<string[]>(['#090D16', '#6366F1', '#8B5CF6', '#38BDF8', '#10B981', '#F8FAFC']);
  const [activeTab, setActiveTab] = useState<'templates' | 'text' | 'shapes' | 'media' | 'layers' | 'ai-images'>('templates');
  const [selectedObj, setSelectedObj] = useState<SelectedObjectProps | null>(null);
  const [layers, setLayers] = useState<any[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState<string | null>(null);
  const [brandDna, setBrandDna] = useState<any | null>(null);
  const [isInitialAiDraftLoaded, setIsInitialAiDraftLoaded] = useState(false);
  const [aiImageContext, setAiImageContext] = useState<string | null>(null);

  const canvasRef = useRef<FabricCanvasRef | null>(null);
  const [canvasApi, setCanvasApi] = useState<FabricCanvasRef | null>(null);

  // Initial Auto-fit Zoom calculation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const availW = window.innerWidth - 650; // toolbar 348 + inspector 280
      const availH = window.innerHeight - 120; // top bar 56 + padding
      const fitZoom = Math.min(availW / width, availH / height, 0.85);
      setZoom(Math.max(0.3, Math.round(fitZoom * 100) / 100));
    }
  }, [width, height]);

  // Fetch Brand DNA on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dma_token') : null;
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/brand-dna`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.brandDna) {
            setBrandDna(data.brandDna);
          }
        })
        .catch(err => console.warn('Brand DNA fetch error:', err));
    }
  }, []);

  const getActiveApi = () => canvasApi || canvasRef.current;

  // Check URL query or generate first AI draft automatically once canvasApi is ready
  useEffect(() => {
    if (!canvasApi || isInitialAiDraftLoaded) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      loadExistingProject(id);
    } else {
      generateInitialAiDraft();
    }
  }, [canvasApi]);

  const generateInitialAiDraft = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('dma_token') : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/canvas/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          format: 'Instagram Post',
          topic: '',
          mood: 'Modern Glass & Neon'
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.variants) && data.variants.length > 0) {
        const firstVariant = data.variants[0];
        handleSelectVariant(firstVariant);
        setIsInitialAiDraftLoaded(true);
      }
    } catch (err) {
      console.warn('Auto AI draft generation fallback:', err);
    }
  };

  const loadExistingProject = async (id: string) => {
    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/canvas/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.project) {
        const p = data.project;
        setProjectId(p.id);
        setProjectName(p.name);
        setWidth(p.width || 1080);
        setHeight(p.height || 1080);
        setFormat(p.format || 'Instagram Post');
        if (p.color_palette) setPalette(p.color_palette);

        const api = getActiveApi();
        if (p.project_payload && api) {
          api.loadJSON(p.project_payload);
        }
        setIsInitialAiDraftLoaded(true);
      }
    } catch (e) {
      console.error('Failed to load canvas project:', e);
    }
  };

  const handleSelectVariant = (variant: any) => {
    setFormat(variant.format || format);
    setWidth(variant.width || 1080);
    setHeight(variant.height || 1080);
    setProjectName(variant.name || 'AI Brand Design Draft');
    if (variant.palette) setPalette(variant.palette);

    const bg = variant.palette?.[0] || '#080C14';
    setCanvasBg(bg);

    setTimeout(() => {
      const api = getActiveApi();
      if (api) {
        api.loadVariantLayers(variant.layers, variant.width, variant.height, bg);
      }
    }, 150);
  };

  const handleSaveProject = async () => {
    const api = getActiveApi();
    if (!api) return;
    setIsSaving(true);
    setSaveStatusMsg(null);

    try {
      const token = localStorage.getItem('dma_token');
      const payload = api.exportJSON();

      // Generate a downscaled thumbnail (max 400px) to keep the request small
      let thumbnail: string | null = null;
      try {
        const fullDataUrl = api.exportImage('png');
        if (fullDataUrl) {
          const img = new Image();
          await new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = () => rej();
            img.src = fullDataUrl;
          });
          const maxThumbPx = 400;
          const scale = Math.min(maxThumbPx / img.width, maxThumbPx / img.height, 1);
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width  = Math.round(img.width  * scale);
          thumbCanvas.height = Math.round(img.height * scale);
          const ctx = thumbCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
            thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7); // JPEG at 70% keeps it small
          }
        }
      } catch (thumbErr) {
        console.warn('[Save] Thumbnail generation failed, skipping:', thumbErr);
      }

      const bodyData = {
        name: projectName,
        width,
        height,
        format,
        thumbnail_url: thumbnail,
        color_palette: palette,
        projectPayload: payload
      };

      const url = projectId
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/canvas/${projectId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/canvas`;

      const method = projectId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (data.success && data.project) {
        setProjectId(data.project.id);
        setSaveStatusMsg('Saved to Cloud ✓');
        setTimeout(() => setSaveStatusMsg(null), 3000);
      } else {
        const reason = data.error || data.detail || `HTTP ${res.status}`;
        console.error('[Save] Server returned error:', reason);
        setSaveStatusMsg(`Save Failed: ${reason}`);
        setTimeout(() => setSaveStatusMsg(null), 6000);
      }
    } catch (err: any) {
      console.error('[Save] Network or parse error:', err);
      setSaveStatusMsg(`Save Failed: ${err?.message || 'Network error'}`);
      setTimeout(() => setSaveStatusMsg(null), 6000);
    } finally {
      setIsSaving(false);
    }
  };


  const handleExport = (type: 'png' | 'jpg' | 'json') => {
    const api = getActiveApi();
    if (!api) return;

    if (type === 'json') {
      const payload = api.exportJSON();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${projectName.toLowerCase().replace(/\s+/g, '_')}_design.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      return;
    }

    const dataUrl = api.exportImage(type);
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}.${type}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAiRewriteText = async (instruction: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dma_token') : null;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/canvas/generate-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ instruction, format })
    });

    const data = await res.json();
    if (data.success && data.text) {
      const api = getActiveApi();
      if (api) {
        api.updateSelectedProp('text', data.text);
      }
      setSelectedObj(prev => prev ? { ...prev, text: data.text } : null);
      return data.text;
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#07090E',
      color: '#FFFFFF',
      overflow: 'hidden'
    }}>
      {/* 1. Fullscreen Studio Top Bar */}
      <CanvasTopBar
        projectName={projectName}
        setProjectName={setProjectName}
        format={format}
        width={width}
        height={height}
        zoom={zoom}
        setZoom={setZoom}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => getActiveApi()?.undo()}
        onRedo={() => getActiveApi()?.redo()}
        onSave={handleSaveProject}
        isSaving={isSaving}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onExport={handleExport}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
      />

      {/* Save Notification Toast */}
      {saveStatusMsg && (
        <div style={{
          position: 'fixed',
          top: '68px',
          right: '24px',
          maxWidth: '420px',
          backgroundColor: saveStatusMsg.includes('✓') ? '#059669' : '#DC2626',
          color: '#FFFFFF',
          padding: '10px 16px',
          borderRadius: '10px',
          fontSize: '0.8rem',
          fontWeight: 600,
          lineHeight: 1.5,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 80,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out',
          wordBreak: 'break-word'
        }}>
          <span style={{ flexShrink: 0, fontSize: '1rem' }}>
            {saveStatusMsg.includes('✓') ? '✅' : '❌'}
          </span>
          <span>{saveStatusMsg}</span>
        </div>
      )}


      {/* 2. Workspace Body: Left Toolbar + Center Viewport + Right Inspector */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Left Interactive Tool Strip */}
        <CanvasLeftToolbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onAddText={(type) => getActiveApi()?.addTextLayer(type)}
          onAddShape={(type) => getActiveApi()?.addShapeLayer(type)}
          onAddImage={(url) => getActiveApi()?.addImageLayer(url)}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          layers={layers}
          selectedLayerId={selectedObj?.id || null}
          onSelectLayer={(id) => getActiveApi()?.selectLayerById(id)}
          onToggleVisibility={(id) => getActiveApi()?.toggleLayerVisibility(id)}
          onToggleLock={(id) => getActiveApi()?.toggleLayerLock(id)}
          onDeleteLayer={(id) => {
            const api = getActiveApi();
            if (api) {
              api.selectLayerById(id);
              api.deleteSelected();
            }
          }}
          onMoveLayer={(id, dir) => getActiveApi()?.moveLayerOrder(id, dir)}
          onSetAiImageContext={(dataUrl) => setAiImageContext(dataUrl)}
        />

        {/* Center Canvas Viewport */}
        <main style={{
          flex: 1,
          height: 'calc(100vh - 56px)',
          backgroundColor: '#F1F3F7',
          backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          boxSizing: 'border-box'
        }}>
          <FabricCanvas
            ref={canvasRef}
            onReady={(api) => {
              setCanvasApi(api);
              canvasRef.current = api;
            }}
            width={width}
            height={height}
            zoom={zoom}
            canvasBg={canvasBg}
            showGrid={showGrid}
            onSelectionChange={setSelectedObj}
            onLayersChange={setLayers}
            onHistoryChange={(undoable, redoable) => {
              setCanUndo(undoable);
              setCanRedo(redoable);
            }}
          />
        </main>

        {/* Right Inspector Panel */}
        <CanvasInspector
          selectedObj={selectedObj}
          onUpdateProp={(key, val) => getActiveApi()?.updateSelectedProp(key, val)}
          canvasBg={canvasBg}
          setCanvasBg={setCanvasBg}
          format={format}
          width={width}
          height={height}
          palette={palette}
          onAiRewriteText={handleAiRewriteText}
        />
      </div>

      {/* 3. AI Design Generator Modal */}
      <AiDesignModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSelectVariant={handleSelectVariant}
        currentFormat={format}
        imageContext={aiImageContext}
      />
    </div>
  );
}
