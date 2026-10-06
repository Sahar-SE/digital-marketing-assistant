'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface FabricCanvasRef {
  addTextLayer: (type: 'heading' | 'subhead' | 'body' | 'pill', defaultText?: string) => void;
  addShapeLayer: (type: 'rect' | 'circle' | 'card' | 'bar' | 'pill') => void;
  addImageLayer: (url: string) => Promise<void>;
  loadVariantLayers: (layers: any[], width: number, height: number, bg?: string) => void;
  updateSelectedProp: (key: string, value: any) => void;
  deleteSelected: () => void;
  getLayersList: () => any[];
  selectLayerById: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  moveLayerOrder: (id: string, direction: 'up' | 'down') => void;
  exportImage: (format: 'png' | 'jpg') => string;
  exportJSON: () => any;
  loadJSON: (json: any) => Promise<void>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface FabricCanvasProps {
  width: number;
  height: number;
  zoom: number;
  canvasBg: string;
  showGrid: boolean;
  onSelectionChange: (selected: any | null) => void;
  onLayersChange: (layers: any[]) => void;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  onReady?: (api: FabricCanvasRef) => void;
}

const FabricCanvas = forwardRef<FabricCanvasRef, FabricCanvasProps>(({
  width,
  height,
  zoom,
  canvasBg,
  showGrid,
  onSelectionChange,
  onLayersChange,
  onHistoryChange,
  onReady
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fabricCanvasRef = useRef<any | null>(null);
  const fabricModRef = useRef<any | null>(null);
  const isInternalUpdate = useRef(false);

  // Undo/Redo stacks
  const historyStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  const handleSelection = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject() as any;
    if (!active) {
      onSelectionChange(null);
      return;
    }

    onSelectionChange({
      id: active.id || 'active',
      type: active.type,
      text: active.text,
      fontSize: active.fontSize,
      fontFamily: active.fontFamily,
      fontWeight: active.fontWeight,
      fill: typeof active.fill === 'string' ? active.fill : '#FFFFFF',
      color: typeof active.fill === 'string' ? active.fill : '#FFFFFF',
      stroke: active.stroke,
      strokeWidth: active.strokeWidth,
      opacity: active.opacity ?? 1,
      borderRadius: active.rx || 0,
      alignment: active.textAlign || 'left',
      width: active.width,
      height: active.height
    });
  };

  const syncLayers = () => {
    if (!fabricCanvasRef.current) return;
    const objects = fabricCanvasRef.current.getObjects();
    const list = objects.map((obj: any, idx: number) => ({
      id: obj.id || `layer-${idx}`,
      name: obj.name || `${obj.type} layer`,
      type: obj.type || 'layer',
      visible: obj.visible !== false,
      locked: !!obj.lockMovementX
    }));
    onLayersChange(list);
  };

  const saveHistoryState = () => {
    if (isInternalUpdate.current || !fabricCanvasRef.current) return;
    try {
      const json = JSON.stringify(fabricCanvasRef.current.toJSON());
      historyStack.current.push(json);
      if (historyStack.current.length > 40) {
        historyStack.current.shift();
      }
      redoStack.current = [];
      onHistoryChange(historyStack.current.length > 1, false);
      syncLayers();
    } catch (e) {
      console.warn('History save warning:', e);
    }
  };

  const createApi = (): FabricCanvasRef => ({
    canUndo: historyStack.current.length > 1,
    canRedo: redoStack.current.length > 0,

    addTextLayer: (type, defaultText) => {
      const canvas = fabricCanvasRef.current;
      const fabric = fabricModRef.current;
      if (!canvas || !fabric) {
        console.warn('Canvas not ready for text layer');
        return;
      }

      let text = defaultText || 'Heading Title';
      let fontSize = 42;
      let fontFamily = 'Bricolage Grotesque';
      let fontWeight = '700';
      let fill = '#FFFFFF';

      if (type === 'subhead') {
        text = defaultText || 'Subtitle Value Proposition';
        fontSize = 24;
        fontFamily = 'Inter';
        fontWeight = '500';
        fill = '#94A3B8';
      } else if (type === 'body') {
        text = defaultText || 'Enter body description text here with precision and clarity.';
        fontSize = 16;
        fontFamily = 'Inter';
        fontWeight = '400';
        fill = '#CBD5E1';
      } else if (type === 'pill') {
        text = defaultText || '✦ VERIFIED ORGANIC';
        fontSize = 13;
        fontFamily = 'Inter';
        fontWeight = '700';
        fill = '#38BDF8';
      }

      const textObj = new fabric.Textbox(text, {
        left: Math.round(width * 0.15),
        top: Math.round(height * 0.3),
        width: Math.round(width * 0.7),
        fontSize,
        fontFamily,
        fontWeight,
        fill,
        cornerColor: '#6366F1',
        cornerStrokeColor: '#FFFFFF',
        borderColor: '#6366F1',
        cornerSize: 9,
        transparentCorners: false
      }) as any;

      textObj.id = `layer-text-${Date.now()}`;
      textObj.name = `${type.toUpperCase()} Text`;

      canvas.add(textObj);
      canvas.setActiveObject(textObj);
      canvas.renderAll();
      syncLayers();
      handleSelection();
    },

    addShapeLayer: (type) => {
      const canvas = fabricCanvasRef.current;
      const fabric = fabricModRef.current;
      if (!canvas || !fabric) {
        console.warn('Canvas not ready for shape layer');
        return;
      }

      let shapeObj: any;
      const id = `layer-shape-${Date.now()}`;

      if (type === 'circle') {
        shapeObj = new fabric.Circle({
          left: Math.round(width * 0.3),
          top: Math.round(height * 0.3),
          radius: Math.round(Math.min(width, height) * 0.2),
          fill: '#6366F1',
          opacity: 0.8,
          cornerColor: '#6366F1',
          cornerStrokeColor: '#FFFFFF',
          borderColor: '#6366F1',
          cornerSize: 9,
          transparentCorners: false
        });
        shapeObj.name = 'Glow Circle';
      } else if (type === 'card') {
        shapeObj = new fabric.Rect({
          left: Math.round(width * 0.1),
          top: Math.round(height * 0.15),
          width: Math.round(width * 0.8),
          height: Math.round(height * 0.7),
          fill: '#0F172A',
          opacity: 0.8,
          stroke: '#334155',
          strokeWidth: 1.5,
          rx: 20,
          ry: 20,
          cornerColor: '#6366F1',
          cornerStrokeColor: '#FFFFFF',
          borderColor: '#6366F1',
          cornerSize: 9,
          transparentCorners: false
        });
        shapeObj.name = 'Glass Card';
      } else if (type === 'bar') {
        shapeObj = new fabric.Rect({
          left: Math.round(width * 0.1),
          top: Math.round(height * 0.2),
          width: 6,
          height: Math.round(height * 0.5),
          fill: '#10B981',
          rx: 3,
          ry: 3,
          cornerColor: '#6366F1',
          cornerStrokeColor: '#FFFFFF',
          borderColor: '#6366F1',
          cornerSize: 9,
          transparentCorners: false
        });
        shapeObj.name = 'Accent Bar';
      } else if (type === 'pill') {
        shapeObj = new fabric.Rect({
          left: Math.round(width * 0.15),
          top: Math.round(height * 0.7),
          width: 200,
          height: 48,
          fill: '#6366F1',
          rx: 24,
          ry: 24,
          cornerColor: '#6366F1',
          cornerStrokeColor: '#FFFFFF',
          borderColor: '#6366F1',
          cornerSize: 9,
          transparentCorners: false
        });
        shapeObj.name = 'CTA Pill';
      } else {
        shapeObj = new fabric.Rect({
          left: Math.round(width * 0.2),
          top: Math.round(height * 0.2),
          width: 240,
          height: 180,
          fill: '#3B82F6',
          rx: 12,
          ry: 12,
          cornerColor: '#6366F1',
          cornerStrokeColor: '#FFFFFF',
          borderColor: '#6366F1',
          cornerSize: 9,
          transparentCorners: false
        });
        shapeObj.name = 'Panel Rect';
      }

      shapeObj.id = id;
      canvas.add(shapeObj);
      canvas.setActiveObject(shapeObj);
      canvas.renderAll();
      syncLayers();
      handleSelection();
    },

    addImageLayer: async (url: string) => {
      const canvas = fabricCanvasRef.current;
      const fabric = fabricModRef.current;
      if (!canvas || !fabric) {
        console.warn('Canvas not ready for image layer');
        return;
      }

      const placeImageObj = (imgObj: any) => {
        const maxDim = Math.min(width, height) * 0.65;
        const imgW = imgObj.width || 400;
        const imgH = imgObj.height || 400;
        if (imgW > maxDim || imgH > maxDim) {
          const scale = maxDim / Math.max(imgW, imgH);
          imgObj.scale(scale);
        }
        imgObj.set({
          left: Math.round(width * 0.15),
          top: Math.round(height * 0.15),
          cornerColor: '#6366F1',
          cornerStrokeColor: '#FFFFFF',
          borderColor: '#6366F1',
          cornerSize: 9,
          transparentCorners: false
        });
        imgObj.id = `layer-img-${Date.now()}`;
        imgObj.name = 'Image Layer';
        canvas.add(imgObj);
        canvas.setActiveObject(imgObj);
        canvas.renderAll();
        saveHistoryState();
        syncLayers();
        handleSelection();
      };

      // data: URLs (file uploads) — load directly without CORS
      if (url.startsWith('data:')) {
        try {
          const imgEl = new Image();
          await new Promise<void>((res, rej) => {
            imgEl.onload = () => res();
            imgEl.onerror = () => rej(new Error('Data URL image load failed'));
            imgEl.src = url;
          });
          const FabricImgClass = fabric.FabricImage || fabric.Image;
          const imgObj = new FabricImgClass(imgEl);
          placeImageObj(imgObj);
          return;
        } catch (err) {
          console.error('Failed to load data URL image:', err);
          return;
        }
      }

      // External URLs — try multiple strategies
      const fromURL = fabric.FabricImage?.fromURL || fabric.Image?.fromURL;
      let imgObj: any = null;

      if (fromURL) {
        // Strategy 1: with crossOrigin anonymous
        try {
          imgObj = await fromURL(url, { crossOrigin: 'anonymous' });
        } catch (_) {
          // Strategy 2: without crossOrigin (works for same-domain or permissive servers)
          try {
            imgObj = await fromURL(url);
          } catch (_2) {
            imgObj = null;
          }
        }
      }

      // Strategy 3: HTMLImageElement fallback
      if (!imgObj) {
        try {
          const imgEl = new Image();
          imgEl.crossOrigin = 'anonymous';
          await new Promise<void>((res, rej) => {
            imgEl.onload = () => res();
            imgEl.onerror = () => rej(new Error('Image load failed'));
            imgEl.src = url;
          });
          const FabricImgClass = fabric.FabricImage || fabric.Image;
          imgObj = new FabricImgClass(imgEl);
        } catch (err) {
          console.error('All image loading strategies failed. The URL may have CORS restrictions:', url, err);
          return;
        }
      }

      if (imgObj) {
        placeImageObj(imgObj);
      }
    },

    loadVariantLayers: (layers, newW, newH, bg) => {
      const canvas = fabricCanvasRef.current;
      const fabric = fabricModRef.current;
      if (!canvas || !fabric) return;

      isInternalUpdate.current = true;
      canvas.clear();
      if (bg) {
        canvas.backgroundColor = bg;
      }

      // Helper to load image objects asynchronously
      const loadImageLayer = async (layer: any): Promise<any | null> => {
        const url = layer.url;
        if (!url) return null;

        const fromURL = fabric.FabricImage?.fromURL || fabric.Image?.fromURL;

        // data: URLs — direct load, CORS-free
        if (url.startsWith('data:')) {
          try {
            const imgEl = new Image();
            await new Promise<void>((res, rej) => {
              imgEl.onload = () => res();
              imgEl.onerror = () => rej();
              imgEl.src = url;
            });
            const FabricImgClass = fabric.FabricImage || fabric.Image;
            return new FabricImgClass(imgEl);
          } catch { return null; }
        }

        // External URLs
        if (fromURL) {
          try { return await fromURL(url, { crossOrigin: 'anonymous' }); } catch (_) {}
          try { return await fromURL(url); } catch (_) {}
        }

        // HTMLImageElement fallback
        try {
          const imgEl = new Image();
          imgEl.crossOrigin = 'anonymous';
          await new Promise<void>((res, rej) => {
            imgEl.onload = () => res();
            imgEl.onerror = () => rej();
            imgEl.src = url;
          });
          const FabricImgClass = fabric.FabricImage || fabric.Image;
          return new FabricImgClass(imgEl);
        } catch { return null; }
      };

      const processLayers = async () => {
        const sortedLayers = [...(layers || [])];

        for (const layer of sortedLayers) {
          if (layer.type === 'background') {
            if (layer.fill) canvas.backgroundColor = layer.fill;
            continue;
          }

          let obj: any = null;

          if (layer.type === 'circle') {
            obj = new fabric.Circle({
              left: layer.x || 0,
              top: layer.y || 0,
              radius: layer.radius || 50,
              fill: layer.fill || '#6366F1',
              opacity: layer.opacity ?? 1,
              cornerColor: '#6366F1',
              cornerStrokeColor: '#FFFFFF',
              borderColor: '#6366F1',
              cornerSize: 9,
              transparentCorners: false
            });
          } else if (layer.type === 'rect') {
            obj = new fabric.Rect({
              left: layer.x || 0,
              top: layer.y || 0,
              width: layer.width || 200,
              height: layer.height || 100,
              fill: layer.fill === 'transparent' ? 'transparent' : (layer.fill || '#1E293B'),
              stroke: layer.stroke || undefined,
              strokeWidth: layer.strokeWidth || 0,
              rx: layer.borderRadius || 0,
              ry: layer.borderRadius || 0,
              opacity: layer.opacity ?? 1,
              cornerColor: '#6366F1',
              cornerStrokeColor: '#FFFFFF',
              borderColor: '#6366F1',
              cornerSize: 9,
              transparentCorners: false
            });
          } else if (layer.type === 'text') {
            obj = new fabric.Textbox(layer.text || '', {
              left: layer.x || 0,
              top: layer.y || 0,
              width: layer.width || Math.round(newW * 0.7),
              fontSize: layer.fontSize || 24,
              fontFamily: layer.fontFamily || 'Inter',
              fontWeight: layer.fontWeight || 'normal',
              fill: layer.color || layer.fill || '#FFFFFF',
              textAlign: layer.alignment || 'left',
              cornerColor: '#6366F1',
              cornerStrokeColor: '#FFFFFF',
              borderColor: '#6366F1',
              cornerSize: 9,
              transparentCorners: false
            });
          } else if (layer.type === 'image') {
            const imgObj = await loadImageLayer(layer);
            if (imgObj) {
              // Scale to fill the specified width/height if given
              const targetW = layer.width || newW;
              const targetH = layer.height || newH;
              const naturalW = imgObj.width || targetW;
              const naturalH = imgObj.height || targetH;
              const scaleX = targetW / naturalW;
              const scaleY = targetH / naturalH;
              imgObj.set({
                left: layer.x || 0,
                top: layer.y || 0,
                scaleX,
                scaleY,
                opacity: layer.opacity ?? 1,
                cornerColor: '#6366F1',
                cornerStrokeColor: '#FFFFFF',
                borderColor: '#6366F1',
                cornerSize: 9,
                transparentCorners: false
              });
              obj = imgObj;
            }
          }

          if (obj) {
            obj.id = layer.id || `layer-${Date.now()}-${Math.random()}`;
            obj.name = layer.name || `${layer.type} layer`;
            canvas.add(obj);
          }
        }

        canvas.renderAll();
        isInternalUpdate.current = false;
        saveHistoryState();
        syncLayers();
        handleSelection();
      };

      processLayers().catch(err => {
        console.warn('[loadVariantLayers] Error during async layer processing:', err);
        canvas.renderAll();
        isInternalUpdate.current = false;
        saveHistoryState();
        syncLayers();
      });
    },

    updateSelectedProp: (key, value) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject() as any;
      if (!active) return;

      if (key === 'text') {
        active.set('text', value);
      } else if (key === 'fontSize') {
        active.set('fontSize', value);
      } else if (key === 'fontFamily') {
        active.set('fontFamily', value);
      } else if (key === 'fontWeight') {
        active.set('fontWeight', value);
      } else if (key === 'fill') {
        active.set('fill', value);
      } else if (key === 'stroke') {
        active.set('stroke', value);
      } else if (key === 'strokeWidth') {
        active.set('strokeWidth', value);
      } else if (key === 'opacity') {
        active.set('opacity', value);
      } else if (key === 'rx') {
        active.set('rx', value);
        active.set('ry', value);
      } else if (key === 'textAlign') {
        active.set('textAlign', value);
      }

      active.setCoords();
      canvas.renderAll();
      saveHistoryState();
      handleSelection();
    },

    deleteSelected: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (active) {
        canvas.remove(active);
        canvas.discardActiveObject();
        canvas.renderAll();
        syncLayers();
        onSelectionChange(null);
      }
    },

    getLayersList: () => {
      if (!fabricCanvasRef.current) return [];
      return fabricCanvasRef.current.getObjects().map((obj: any, idx: number) => ({
        id: obj.id || `layer-${idx}`,
        name: obj.name || `${obj.type} layer`,
        type: obj.type,
        visible: obj.visible !== false,
        locked: !!obj.lockMovementX
      }));
    },

    selectLayerById: (id) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const target = canvas.getObjects().find((o: any) => o.id === id);
      if (target) {
        canvas.setActiveObject(target);
        canvas.renderAll();
        handleSelection();
      }
    },

    toggleLayerVisibility: (id) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const target = canvas.getObjects().find((o: any) => o.id === id);
      if (target) {
        target.visible = !target.visible;
        canvas.renderAll();
        syncLayers();
      }
    },

    toggleLayerLock: (id) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const target = canvas.getObjects().find((o: any) => o.id === id) as any;
      if (target) {
        const isLocked = !target.lockMovementX;
        target.lockMovementX = isLocked;
        target.lockMovementY = isLocked;
        target.lockRotation = isLocked;
        target.lockScalingX = isLocked;
        target.lockScalingY = isLocked;
        canvas.renderAll();
        syncLayers();
      }
    },

    moveLayerOrder: (id, direction) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const target = canvas.getObjects().find((o: any) => o.id === id);
      if (target) {
        if (direction === 'up') {
          if (typeof canvas.bringObjectForward === 'function') {
            canvas.bringObjectForward(target);
          } else if (typeof canvas.bringForward === 'function') {
            canvas.bringForward(target);
          }
        } else {
          if (typeof canvas.sendObjectBackwards === 'function') {
            canvas.sendObjectBackwards(target);
          } else if (typeof canvas.sendBackwards === 'function') {
            canvas.sendBackwards(target);
          }
        }
        canvas.renderAll();
        syncLayers();
      }
    },

    exportImage: (fmt) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return '';
      return canvas.toDataURL({
        format: fmt === 'jpg' ? 'jpeg' : 'png',
        quality: 0.95,
        multiplier: 2.0
      });
    },

    exportJSON: () => {
      if (!fabricCanvasRef.current) return {};
      return fabricCanvasRef.current.toJSON();
    },

    loadJSON: async (json) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !json) return;
      isInternalUpdate.current = true;
      try {
        if (typeof canvas.loadFromJSON === 'function') {
          const res = canvas.loadFromJSON(json, () => {
            canvas.renderAll();
            isInternalUpdate.current = false;
            saveHistoryState();
            syncLayers();
            handleSelection();
          });
          if (res && typeof res.then === 'function') {
            await res;
            canvas.renderAll();
            isInternalUpdate.current = false;
            saveHistoryState();
            syncLayers();
            handleSelection();
          }
        }
      } catch (err) {
        console.warn('loadJSON error:', err);
        isInternalUpdate.current = false;
      }
    },

    undo: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || historyStack.current.length <= 1) return;

      const current = historyStack.current.pop();
      if (current) redoStack.current.push(current);

      const previous = historyStack.current[historyStack.current.length - 1];
      if (previous) {
        isInternalUpdate.current = true;
        const res = canvas.loadFromJSON(JSON.parse(previous), () => {
          canvas.renderAll();
          isInternalUpdate.current = false;
          onHistoryChange(historyStack.current.length > 1, redoStack.current.length > 0);
          syncLayers();
          handleSelection();
        });
        if (res && typeof res.then === 'function') {
          res.then(() => {
            canvas.renderAll();
            isInternalUpdate.current = false;
            onHistoryChange(historyStack.current.length > 1, redoStack.current.length > 0);
            syncLayers();
            handleSelection();
          });
        }
      }
    },

    redo: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || redoStack.current.length === 0) return;

      const next = redoStack.current.pop();
      if (next) {
        historyStack.current.push(next);
        isInternalUpdate.current = true;
        const res = canvas.loadFromJSON(JSON.parse(next), () => {
          canvas.renderAll();
          isInternalUpdate.current = false;
          onHistoryChange(historyStack.current.length > 1, redoStack.current.length > 0);
          syncLayers();
          handleSelection();
        });
        if (res && typeof res.then === 'function') {
          res.then(() => {
            canvas.renderAll();
            isInternalUpdate.current = false;
            onHistoryChange(historyStack.current.length > 1, redoStack.current.length > 0);
            syncLayers();
            handleSelection();
          });
        }
      }
    }
  });

  useImperativeHandle(ref, createApi);

  // Initialize Fabric Canvas dynamically in browser environment
  useEffect(() => {
    let isMounted = true;

    async function initFabric() {
      if (typeof window === 'undefined') return;
      const fabric = await import('fabric');
      if (!isMounted) return;
      fabricModRef.current = fabric;

      const container = containerRef.current;
      if (!container) return;

      container.innerHTML = '';

      const canvasEl = document.createElement('canvas');
      canvasEl.width = width;
      canvasEl.height = height;
      container.appendChild(canvasEl);

      const canvas = new fabric.Canvas(canvasEl, {
        width,
        height,
        backgroundColor: canvasBg,
        preserveObjectStacking: true,
        selectionColor: 'rgba(99, 102, 241, 0.2)',
        selectionBorderColor: '#6366F1',
        selectionLineWidth: 1.5
      });

      fabricCanvasRef.current = canvas;

      canvas.on('selection:created', handleSelection);
      canvas.on('selection:updated', handleSelection);
      canvas.on('selection:cleared', () => onSelectionChange(null));

      canvas.on('object:modified', () => {
        saveHistoryState();
        handleSelection();
      });

      canvas.on('object:added', () => {
        if (!isInternalUpdate.current) saveHistoryState();
      });

      canvas.on('object:removed', () => {
        if (!isInternalUpdate.current) saveHistoryState();
      });

      saveHistoryState();

      // Emit onReady API object
      if (onReady) {
        onReady(createApi());
      }
    }

    initFabric();

    return () => {
      isMounted = false;
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
        } catch (err) {
          console.warn('Canvas dispose warning:', err);
        }
        fabricCanvasRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [width, height]);

  // Update canvas background
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.backgroundColor = canvasBg;
      fabricCanvasRef.current.renderAll();
    }
  }, [canvasBg]);

  // Keyboard Shortcuts for Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = fabricCanvasRef.current?.getActiveObject();
        if (active) {
          fabricCanvasRef.current?.remove(active);
          fabricCanvasRef.current?.discardActiveObject();
          fabricCanvasRef.current?.renderAll();
          syncLayers();
          onSelectionChange(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{
      position: 'relative',
      transform: `scale(${zoom})`,
      transformOrigin: 'center center',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      borderRadius: '4px',
      overflow: 'hidden',
      transition: 'transform 0.1s ease-out'
    }}>
      {/* Background Alignment Grid Overlay */}
      {showGrid && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 20
        }} />
      )}
      {/* Dedicated mount container for Fabric.js */}
      <div ref={containerRef} style={{ width, height, overflow: 'hidden' }} />
    </div>
  );
});

FabricCanvas.displayName = 'FabricCanvas';

export default FabricCanvas;
