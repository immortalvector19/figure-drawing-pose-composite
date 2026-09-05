import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Transformer, Image as KonvaImage, Line, Text, Rect, Group, Circle, Ellipse } from 'react-konva';
import Konva from 'konva';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import { ConstructionPrimitive, DrawToolType, PrimitiveType, BodyPartCategory } from '../types/shapes';
import { CanvasShapeItem } from './CanvasShapeItem';

interface ConstructionCanvasProps {
  imageElement: HTMLImageElement | HTMLVideoElement | null;
  width: number;
  height: number;
  shapes: ConstructionPrimitive[];
  selectedShapeId: string | null;
  opacity?: number;
  shapesOpacity?: number;
  imageOpacity?: number;
  strokeWidth?: number;
  show8HeadGrid?: boolean;
  showPlumbLine?: boolean;
  activeDrawTool?: DrawToolType;
  activeBodyPart?: BodyPartCategory;
  onAddShapeFromDraw?: (shapeData: { type: PrimitiveType; x: number; y: number; width: number; height: number; points?: number[] }) => void;
  onSelectShape: (id: string | null) => void;
  onUpdateShape: (id: string, patch: Partial<ConstructionPrimitive>) => void;
  onDeleteShape: (id: string) => void;
}

export const ConstructionCanvas: React.FC<ConstructionCanvasProps> = ({
  imageElement,
  width,
  height,
  shapes,
  selectedShapeId,
  opacity = 0.90,
  shapesOpacity,
  imageOpacity,
  strokeWidth,
  show8HeadGrid,
  showPlumbLine,
  activeDrawTool = 'select',
  onAddShapeFromDraw,
  onSelectShape,
  onUpdateShape,
  onDeleteShape,
}) => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapesLayerRef = useRef<Konva.Layer | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [drawingState, setDrawingState] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Zoom & Pan Engine for high-resolution clarity
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; initialOffsetX: number; initialOffsetY: number } | null>(null);

  // Configure high-DPI supersampled crisp rendering (2x minimum for ultra-sharp lines and images)
  useEffect(() => {
    Konva.pixelRatio = Math.max(2, window.devicePixelRatio || 1);
  }, []);

  // Robust container measurement (ignores momentary layout flashes < 200px)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(el.clientWidth, Math.round(rect.width));
      const h = Math.max(el.clientHeight, Math.round(rect.height));
      if (w > 200 && h > 200) {
        setContainerSize({ width: w, height: h });
      }
    };

    measure();

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 200 && h > 200) {
          setContainerSize({ width: Math.round(w), height: Math.round(h) });
        }
      }
    });

    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [width, height]);

  // Compute base fit scale to fit native dimensions within container
  const baseScale = Math.min(
    (containerSize.width * 0.94) / Math.max(1, width),
    (containerSize.height * 0.94) / Math.max(1, height)
  );

  const scale = baseScale * zoom;
  const stageWidth = width * scale;
  const stageHeight = height * scale;

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
        panStartRef.current = null;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Smooth, controllable wheel zoom with cursor anchoring (prevents oversensitivity on both mice and trackpads)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    // Dampen deltaY to avoid sensitivity jumps
    const delta = Math.max(-80, Math.min(80, e.deltaY));
    const zoomSpeed = 0.0012;
    const factor = Math.exp(-delta * zoomSpeed);

    setZoom(prev => {
      const nextZoom = Math.max(0.15, Math.min(10.0, prev * factor));
      const actualFactor = nextZoom / prev;

      // Zoom toward cursor position
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - rect.width / 2;
      const cursorY = e.clientY - rect.top - rect.height / 2;

      setPanOffset(pan => ({
        x: cursorX - (cursorX - pan.x) * actualFactor,
        y: cursorY - (cursorY - pan.y) * actualFactor,
      }));

      return nextZoom;
    });
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1 || (e.button === 0 && e.target === containerRef.current)) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        initialOffsetX: panOffset.x,
        initialOffsetY: panOffset.y,
      };
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset({
        x: panStartRef.current.initialOffsetX + dx,
        y: panStartRef.current.initialOffsetY + dy,
      });
    }
  };

  const handleContainerMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }
  };

  const effectiveShapesOpacity = shapesOpacity !== undefined ? shapesOpacity : opacity;
  const effectiveImageOpacity =
    imageOpacity !== undefined
      ? imageOpacity
      : opacity > 0.9
      ? Math.max(0.15, 1 - (opacity - 0.9) * 8)
      : 1.0;
  const effectiveStrokeWidth = strokeWidth ?? 5.0;

  // Redraw layers when image or shapes change & enforce high image smoothing quality
  useEffect(() => {
    shapesLayerRef.current?.batchDraw();
    if (stageRef.current) {
      try {
        stageRef.current.getLayers().forEach(layer => {
          const htmlCanvas = layer.getCanvas()?._canvas;
          const ctx = htmlCanvas?.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
          }
        });
      } catch {
        // Fallback gracefully
      }
    }
  }, [shapes, effectiveShapesOpacity, effectiveImageOpacity, effectiveStrokeWidth, imageElement, scale, zoom]);

  // Attach Transformer to selected node
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    if (selectedShapeId) {
      const selectedNode = stageRef.current.findOne(`#${selectedShapeId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
        return;
      }
    }

    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedShapeId, shapes]);

  // Keyboard shortcut: Delete or Backspace to remove selected shape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;

        e.preventDefault();
        onDeleteShape(selectedShapeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, onDeleteShape]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeDrawTool && activeDrawTool !== 'select') return;
    if (e.target === stageRef.current || e.target.name() === 'background-image') {
      onSelectShape(null);
    }
  };

  const handleStageMouseDown = (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!activeDrawTool || activeDrawTool === 'select') return;
    onSelectShape(null);
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const nativeX = pointer.x / scale;
    const nativeY = pointer.y / scale;
    setDrawingState({
      startX: nativeX,
      startY: nativeY,
      currentX: nativeX,
      currentY: nativeY,
    });
  };

  const handleStageMouseMove = (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!drawingState) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    setDrawingState(prev => prev ? ({
      ...prev,
      currentX: pointer.x / scale,
      currentY: pointer.y / scale,
    }) : null);
  };

  const handleStageMouseUp = () => {
    if (!drawingState || !activeDrawTool || activeDrawTool === 'select') {
      setDrawingState(null);
      return;
    }
    const x1 = Math.min(drawingState.startX, drawingState.currentX);
    const y1 = Math.min(drawingState.startY, drawingState.currentY);
    const x2 = Math.max(drawingState.startX, drawingState.currentX);
    const y2 = Math.max(drawingState.startY, drawingState.currentY);
    let w = x2 - x1;
    let h = y2 - y1;

    // Minimum sensible dimensions if user just clicked
    if (w < 8 && h < 8) {
      w = activeDrawTool === 'circle' ? 70 : activeDrawTool === 'oval' ? 80 : 70;
      h = activeDrawTool === 'circle' ? 70 : activeDrawTool === 'cylinder' ? 120 : 80;
    }

    if (activeDrawTool === 'circle') {
      const size = Math.max(w, h);
      w = size;
      h = size;
    }

    const centerX = (drawingState.startX + drawingState.currentX) / 2;
    const centerY = (drawingState.startY + drawingState.currentY) / 2;

    let primType: PrimitiveType = 'box';
    let points: number[] | undefined = undefined;

    if (activeDrawTool === 'rectangle') primType = 'box';
    else if (activeDrawTool === 'circle') primType = 'circle';
    else if (activeDrawTool === 'oval') primType = 'oval';
    else if (activeDrawTool === 'cylinder') primType = 'cylinder';
    else if (activeDrawTool === 'line') {
      primType = 'line_of_action';
      points = [drawingState.startX, drawingState.startY, drawingState.currentX, drawingState.currentY];
    }

    if (onAddShapeFromDraw) {
      onAddShapeFromDraw({
        type: primType,
        x: centerX,
        y: centerY,
        width: Math.max(15, w),
        height: Math.max(15, h),
        points,
      });
    }

    setDrawingState(null);
  };

    // Calculate 8-Head Proportions Grid markers (Loomis 8-Head Canon)
  const headGridData = React.useMemo(() => {
    if (!show8HeadGrid || shapes.length === 0) return null;

    const visible = shapes.filter(s => s.isVisible && s.type !== 'facial_thirds');
    if (visible.length === 0) return null;

    // Find cranium or highest point
    const cranium = shapes.find(s => s.id === 'primitive-cranium');
    let topY: number;
    if (cranium) {
      topY = cranium.y - cranium.height / 2;
    } else {
      topY = Math.min(...visible.map(s => s.y - s.height / 2));
    }

    // Find feet or lowest point
    const feet = visible.filter(s => s.bodyPart === 'feet');
    let bottomY: number;
    if (feet.length > 0) {
      bottomY = Math.max(...feet.map(s => s.y + s.height / 2));
    } else {
      bottomY = Math.max(...visible.map(s => s.y + s.height / 2));
    }

    const totalHeight = bottomY - topY;
    if (totalHeight < 100) return null;

    const headUnit = totalHeight / 8;

    const minX = Math.min(...visible.map(s => s.x - s.width / 2));
    const maxX = Math.max(...visible.map(s => s.x + s.width / 2));

    const rulerX = Math.max(30, minX - 50);
    const lineEndX = Math.min(width - 15, maxX + 50);

    const labels = [
      '0: Crown',
      '1: Chin / Jaw',
      '2: Nipples (Pecs)',
      '3: Navel (Elbows)',
      '4: Crotch (Midpoint)',
      '5: Mid-Thigh (Fingertips)',
      '6: Knee Base',
      '7: Calf Base',
      '8: Soles of Feet',
    ];

    const marks = Array.from({ length: 9 }, (_, i) => {
      const y = topY + i * headUnit;
      return {
        unit: i,
        y,
        label: labels[i],
        isMidpoint: i === 4,
        isMajor: i === 0 || i === 4 || i === 8,
      };
    });

    return {
      rulerX,
      lineEndX,
      topY,
      bottomY,
      marks,
      headUnit,
    };
  }, [show8HeadGrid, shapes, width]);

  // Calculate Ron Tiner Center of Gravity Plumb Line & Reciprocal Counterpoise (Figure Drawing Without a Model)
  const plumbLineData = React.useMemo(() => {
    if (!showPlumbLine || shapes.length === 0) return null;

    const visible = shapes.filter(s => s.isVisible && s.type !== 'facial_thirds');
    if (visible.length === 0) return null;

    // 1. Suprasternal Notch (Pit of the neck / clavicle notch)
    const neck = shapes.find(s => s.id === 'primitive-neck');
    const ribcage = shapes.find(s => s.id === 'primitive-ribcage');
    const cranium = shapes.find(s => s.id === 'primitive-cranium');

    let notchX: number;
    let notchY: number;

    if (neck) {
      notchX = neck.x;
      notchY = neck.y + neck.height * 0.45;
    } else if (ribcage) {
      notchX = ribcage.x;
      notchY = ribcage.y - ribcage.height * 0.45;
    } else if (cranium) {
      notchX = cranium.x;
      notchY = cranium.y + cranium.height * 0.5 + 25;
    } else {
      notchX = width / 2;
      notchY = height * 0.22;
    }

    // 2. Base of Support on ground from feet primitives
    const feet = visible.filter(s => s.bodyPart === 'feet');
    let groundY: number;
    let minFootX: number;
    let maxFootX: number;

    if (feet.length > 0) {
      groundY = Math.max(...feet.map(f => f.y + f.height / 2));
      minFootX = Math.min(...feet.map(f => f.x - f.width / 2));
      maxFootX = Math.max(...feet.map(f => f.x + f.width / 2));
    } else {
      groundY = Math.max(...visible.map(s => s.y + s.height / 2));
      minFootX = width / 2 - 50;
      maxFootX = width / 2 + 50;
    }

    // Ron Tiner rule: Figure is in static equilibrium if the plumb line
    // dropped from the suprasternal notch falls within the base of support.
    const supportMargin = 20;
    const isBalanced = notchX >= minFootX - supportMargin && notchX <= maxFootX + supportMargin;

    // 3. Reciprocal Counterpoise (Contrapposto Shoulder vs. Hip Tilts)
    const leftShoulder = shapes.find(s => s.id === 'joint-shoulder-left' || s.id === 'primitive-left-upper-arm');
    const rightShoulder = shapes.find(s => s.id === 'joint-shoulder-right' || s.id === 'primitive-right-upper-arm');
    const leftHip = shapes.find(s => s.id === 'joint-hip-left' || s.id === 'primitive-left-thigh');
    const rightHip = shapes.find(s => s.id === 'joint-hip-right' || s.id === 'primitive-right-thigh');

    let shoulderTiltDeg: number | null = null;
    let pelvisTiltDeg: number | null = null;
    let shoulderLine: [number, number, number, number] | null = null;
    let pelvisLine: [number, number, number, number] | null = null;

    if (leftShoulder && rightShoulder) {
      const dx = rightShoulder.x - leftShoulder.x;
      const dy = rightShoulder.y - leftShoulder.y;
      shoulderTiltDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      shoulderLine = [leftShoulder.x - 25, leftShoulder.y, rightShoulder.x + 25, rightShoulder.y];
    }

    if (leftHip && rightHip) {
      const dx = rightHip.x - leftHip.x;
      const dy = rightHip.y - leftHip.y;
      pelvisTiltDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      pelvisLine = [leftHip.x - 25, leftHip.y, rightHip.x + 25, rightHip.y];
    }

    return {
      notchX,
      notchY,
      groundY: groundY + 16,
      minFootX,
      maxFootX,
      isBalanced,
      shoulderTiltDeg,
      pelvisTiltDeg,
      shoulderLine,
      pelvisLine,
    };
  }, [showPlumbLine, shapes, width, height]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      className={`relative w-full h-full flex-1 flex items-center justify-center p-2 overflow-hidden bg-studio-950 select-none ${
        isPanning || isSpacePressed
          ? 'cursor-grab active:cursor-grabbing'
          : activeDrawTool && activeDrawTool !== 'select'
          ? 'cursor-crosshair'
          : 'cursor-default'
      }`}
    >
      <div
        className="relative shadow-2xl rounded-xl overflow-hidden border border-studio-700 bg-studio-900 transition-transform duration-75"
        style={{
          width: stageWidth,
          height: stageHeight,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
      >
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          scaleX={scale}
          scaleY={scale}
          onClick={handleStageClick}
          onTap={handleStageClick}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onTouchStart={handleStageMouseDown}
          onTouchMove={handleStageMouseMove}
          onTouchEnd={handleStageMouseUp}
        >
          {/* Background Layer: Source Media */}
          <Layer>
            {imageElement && (
              <KonvaImage
                key={imageElement instanceof HTMLImageElement ? imageElement.src : 'video-frame'}
                name="background-image"
                image={imageElement}
                width={width}
                height={height}
                opacity={effectiveImageOpacity}
                listening={true}
              />
            )}
          </Layer>

          {/* 8-Head Proportions Grid Layer */}
          {headGridData && (
            <Layer listening={false}>
              {/* Main Vertical Ruler Baseline */}
              <Line
                points={[headGridData.rulerX, headGridData.topY, headGridData.rulerX, headGridData.bottomY]}
                stroke="#38bdf8"
                strokeWidth={2}
                dash={[6, 3]}
                opacity={0.85}
              />

              {headGridData.marks.map((mark) => {
                const badgeOnRight = headGridData.rulerX < 155;
                const badgeX = badgeOnRight ? headGridData.rulerX + 12 : headGridData.rulerX - 148;
                const textX = badgeX + 6;

                return (
                  <Group key={mark.unit}>
                    {/* Horizontal Guideline across figure */}
                    <Line
                      points={[headGridData.rulerX - 8, mark.y, headGridData.lineEndX, mark.y]}
                      stroke={mark.isMidpoint ? '#f43f5e' : mark.isMajor ? '#38bdf8' : '#64748b'}
                      strokeWidth={mark.isMidpoint ? 2 : mark.isMajor ? 1.5 : 1}
                      dash={mark.isMidpoint ? undefined : [4, 4]}
                      opacity={mark.isMidpoint ? 0.9 : 0.6}
                    />

                    {/* Ruler Tick Mark */}
                    <Line
                      points={[headGridData.rulerX - 10, mark.y, headGridData.rulerX + 6, mark.y]}
                      stroke={mark.isMidpoint ? '#f43f5e' : '#38bdf8'}
                      strokeWidth={mark.isMidpoint ? 2.5 : 2}
                      opacity={0.95}
                    />

                    {/* Label Badge Background */}
                    <Rect
                      x={badgeX}
                      y={mark.y - 9}
                      width={138}
                      height={18}
                      fill="#0f172a"
                      cornerRadius={4}
                      opacity={0.92}
                      stroke={mark.isMidpoint ? '#f43f5e' : mark.isMajor ? '#0284c7' : '#334155'}
                      strokeWidth={1}
                    />

                    {/* Unit Label Text */}
                    <Text
                      x={textX}
                      y={mark.y - 6}
                      text={mark.label}
                      fontSize={11}
                      fontFamily="ui-monospace, monospace"
                      fontStyle={mark.isMidpoint ? 'bold' : 'normal'}
                      fill={mark.isMidpoint ? '#fb7185' : mark.isMajor ? '#38bdf8' : '#94a3b8'}
                    />
                  </Group>
                );
              })}
            </Layer>
          )}

          {/* Ron Tiner Center of Gravity Plumb Line & Reciprocal Tilt Layer */}
          {plumbLineData && (
            <Layer listening={false}>
              {/* Reciprocal Shoulder Counterpoise Axis */}
              {plumbLineData.shoulderLine && (
                <Group>
                  <Line
                    points={plumbLineData.shoulderLine}
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dash={[5, 4]}
                    opacity={0.8}
                  />
                  <Rect
                    x={plumbLineData.shoulderLine[2] + 8}
                    y={plumbLineData.shoulderLine[3] - 10}
                    width={96}
                    height={20}
                    fill="#0f172a"
                    cornerRadius={4}
                    stroke="#0284c7"
                    strokeWidth={1}
                    opacity={0.9}
                  />
                  <Text
                    x={plumbLineData.shoulderLine[2] + 12}
                    y={plumbLineData.shoulderLine[3] - 6}
                    text={`Shoulders: ${plumbLineData.shoulderTiltDeg}°`}
                    fontSize={10}
                    fontFamily="ui-monospace, monospace"
                    fill="#38bdf8"
                  />
                </Group>
              )}

              {/* Reciprocal Pelvic Counterpoise Axis */}
              {plumbLineData.pelvisLine && (
                <Group>
                  <Line
                    points={plumbLineData.pelvisLine}
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dash={[5, 4]}
                    opacity={0.8}
                  />
                  <Rect
                    x={plumbLineData.pelvisLine[2] + 8}
                    y={plumbLineData.pelvisLine[3] - 10}
                    width={96}
                    height={20}
                    fill="#0f172a"
                    cornerRadius={4}
                    stroke="#e11d48"
                    strokeWidth={1}
                    opacity={0.9}
                  />
                  <Text
                    x={plumbLineData.pelvisLine[2] + 12}
                    y={plumbLineData.pelvisLine[3] - 6}
                    text={`Pelvis: ${plumbLineData.pelvisTiltDeg}°`}
                    fontSize={10}
                    fontFamily="ui-monospace, monospace"
                    fill="#fb7185"
                  />
                </Group>
              )}

              {/* Base of Support Zone on Ground */}
              <Line
                points={[plumbLineData.minFootX - 15, plumbLineData.groundY, plumbLineData.maxFootX + 15, plumbLineData.groundY]}
                stroke="#10b981"
                strokeWidth={3}
                opacity={0.9}
              />
              <Line
                points={[plumbLineData.minFootX - 15, plumbLineData.groundY - 8, plumbLineData.minFootX - 15, plumbLineData.groundY + 8]}
                stroke="#10b981"
                strokeWidth={2}
              />
              <Line
                points={[plumbLineData.maxFootX + 15, plumbLineData.groundY - 8, plumbLineData.maxFootX + 15, plumbLineData.groundY + 8]}
                stroke="#10b981"
                strokeWidth={2}
              />
              <Rect
                x={(plumbLineData.minFootX + plumbLineData.maxFootX) / 2 - 55}
                y={plumbLineData.groundY + 6}
                width={110}
                height={18}
                fill="#0f172a"
                cornerRadius={4}
                stroke="#059669"
                strokeWidth={1}
                opacity={0.92}
              />
              <Text
                x={(plumbLineData.minFootX + plumbLineData.maxFootX) / 2 - 47}
                y={plumbLineData.groundY + 10}
                text="Base of Support"
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fill="#34d399"
              />

              {/* Gravitational Vertical Plumb Line */}
              <Line
                points={[plumbLineData.notchX, plumbLineData.notchY, plumbLineData.notchX, plumbLineData.groundY]}
                stroke={plumbLineData.isBalanced ? '#10b981' : '#f59e0b'}
                strokeWidth={2.5}
                dash={[6, 4]}
                opacity={0.95}
              />

              {/* Suprasternal Notch Anchor */}
              <Circle
                x={plumbLineData.notchX}
                y={plumbLineData.notchY}
                radius={6}
                fill={plumbLineData.isBalanced ? '#10b981' : '#f59e0b'}
                stroke="#ffffff"
                strokeWidth={2}
              />
              <Rect
                x={plumbLineData.notchX + 12}
                y={plumbLineData.notchY - 10}
                width={124}
                height={20}
                fill="#0f172a"
                cornerRadius={4}
                stroke={plumbLineData.isBalanced ? '#059669' : '#d97706'}
                strokeWidth={1}
                opacity={0.92}
              />
              <Text
                x={plumbLineData.notchX + 16}
                y={plumbLineData.notchY - 6}
                text="Suprasternal Notch"
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fill={plumbLineData.isBalanced ? '#6ee7b7' : '#fcd34d'}
              />

              {/* Plumb Bob Weight at bottom */}
              <Circle
                x={plumbLineData.notchX}
                y={plumbLineData.groundY}
                radius={7}
                fill={plumbLineData.isBalanced ? '#10b981' : '#f59e0b'}
                stroke="#ffffff"
                strokeWidth={2}
              />

              {/* Balance Assessment Status Badge */}
              <Rect
                x={Math.max(20, plumbLineData.notchX - 110)}
                y={Math.max(15, plumbLineData.notchY - 35)}
                width={220}
                height={24}
                fill="#0f172a"
                cornerRadius={6}
                stroke={plumbLineData.isBalanced ? '#10b981' : '#f59e0b'}
                strokeWidth={1.5}
                opacity={0.95}
              />
              <Text
                x={Math.max(26, plumbLineData.notchX - 104)}
                y={Math.max(21, plumbLineData.notchY - 29)}
                text={
                  plumbLineData.isBalanced
                    ? '⚖️ Plumb Line: BALANCED (Static)'
                    : '⚡ Plumb Line: DYNAMIC (Imbalance)'
                }
                fontSize={11}
                fontStyle="bold"
                fontFamily="ui-monospace, monospace"
                fill={plumbLineData.isBalanced ? '#34d399' : '#fbbf24'}
              />
            </Layer>
          )}

          {/* Construction Shapes Layer */}
          <Layer ref={shapesLayerRef}>
            {shapes.map(shape => (
              <CanvasShapeItem
                key={shape.id}
                shape={shape}
                isSelected={shape.id === selectedShapeId}
                opacity={effectiveShapesOpacity}
                strokeWidth={effectiveStrokeWidth}
                onSelect={onSelectShape}
                onChange={onUpdateShape}
              />
            ))}

            {/* Transformer Gizmo */}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
                  return oldBox;
                }
                return newBox;
              }}
              enabledAnchors={[
                'top-left',
                'top-right',
                'bottom-left',
                'bottom-right',
                'middle-left',
                'middle-right',
                'top-center',
                'bottom-center',
              ]}
              rotateEnabled={true}
              borderStroke="#38bdf8"
              borderStrokeWidth={2}
              borderDash={[4, 4]}
              anchorStroke="#38bdf8"
              anchorFill="#ffffff"
              anchorSize={10}
              anchorCornerRadius={2}
            />
          </Layer>

          {/* Interactive Freeform Drawing Preview Layer */}
          {drawingState && (
            <Layer listening={false}>
              {(() => {
                const x1 = Math.min(drawingState.startX, drawingState.currentX);
                const y1 = Math.min(drawingState.startY, drawingState.currentY);
                const w = Math.max(2, Math.abs(drawingState.currentX - drawingState.startX));
                const h = Math.max(2, Math.abs(drawingState.currentY - drawingState.startY));
                const x2 = x1 + w;
                const y2 = y1 + h;
                const cx = (drawingState.startX + drawingState.currentX) / 2;
                const cy = (drawingState.startY + drawingState.currentY) / 2;

                if (activeDrawTool === 'rectangle') {
                  const depth = Math.min(22, Math.max(8, Math.min(w, h) * 0.22));
                  const dx = depth * 0.72;
                  const dy = -depth * 0.62;
                  return (
                    <Group>
                      {/* Receding Top Facet */}
                      <Line
                        points={[x1, y1, x1 + dx, y1 + dy, x2 + dx, y1 + dy, x2, y1]}
                        closed={true}
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dash={[4, 3]}
                        fill="rgba(56, 189, 248, 0.2)"
                      />
                      {/* Receding Side Facet */}
                      <Line
                        points={[x2, y1, x2 + dx, y1 + dy, x2 + dx, y2 + dy, x2, y2]}
                        closed={true}
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dash={[4, 3]}
                        fill="rgba(56, 189, 248, 0.15)"
                      />
                      {/* Front Box Face */}
                      <Rect
                        x={x1}
                        y={y1}
                        width={w}
                        height={h}
                        cornerRadius={2}
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        dash={[5, 4]}
                        fill="rgba(56, 189, 248, 0.25)"
                      />
                      {/* Perspective Corner Lines */}
                      <Line points={[x1, y1, x1 + dx, y1 + dy]} stroke="#38bdf8" strokeWidth={1.8} dash={[4, 3]} />
                      <Line points={[x2, y1, x2 + dx, y1 + dy]} stroke="#38bdf8" strokeWidth={1.8} dash={[4, 3]} />
                      <Line points={[x2, y2, x2 + dx, y2 + dy]} stroke="#38bdf8" strokeWidth={1.8} dash={[4, 3]} />
                    </Group>
                  );
                }
                if (activeDrawTool === 'circle') {
                  const r = Math.max(w, h) / 2;
                  return (
                    <Group>
                      <Circle
                        x={cx}
                        y={cy}
                        radius={r}
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        dash={[5, 4]}
                        fill="rgba(56, 189, 248, 0.25)"
                      />
                      <Ellipse
                        x={cx}
                        y={cy}
                        radiusX={r * 0.98}
                        radiusY={r * 0.28}
                        stroke="#38bdf8"
                        strokeWidth={1.8}
                        dash={[4, 4]}
                        fill="transparent"
                      />
                      <Line
                        points={[cx, cy - r, cx, cy + r]}
                        stroke="#38bdf8"
                        strokeWidth={1.8}
                        dash={[4, 4]}
                      />
                    </Group>
                  );
                }
                if (activeDrawTool === 'oval') {
                  const rx = w / 2;
                  const ry = h / 2;
                  return (
                    <Group>
                      <Ellipse
                        x={cx}
                        y={cy}
                        radiusX={rx}
                        radiusY={ry}
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        dash={[5, 4]}
                        fill="rgba(56, 189, 248, 0.25)"
                      />
                      <Ellipse
                        x={cx}
                        y={cy}
                        radiusX={rx * 0.96}
                        radiusY={ry * 0.32}
                        stroke="#38bdf8"
                        strokeWidth={1.8}
                        dash={[4, 4]}
                        fill="transparent"
                      />
                      <Line
                        points={[cx, cy - ry, cx, cy + ry]}
                        stroke="#38bdf8"
                        strokeWidth={1.8}
                        dash={[4, 4]}
                      />
                    </Group>
                  );
                }
                if (activeDrawTool === 'cylinder') {
                  const rx = w / 2;
                  const ry = Math.max(3.5, Math.min(rx * 0.42, h * 0.22));
                  const topY = y1 + ry;
                  const botY = y2 - ry;
                  const bodyH = Math.max(0, h - 2 * ry);

                  return (
                    <Group>
                      {/* Cylindrical Body */}
                      <Rect
                        x={x1}
                        y={topY}
                        width={w}
                        height={bodyH}
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dash={[5, 4]}
                        fill="rgba(56, 189, 248, 0.2)"
                      />
                      {/* Bottom Base */}
                      <Ellipse
                        x={cx}
                        y={botY}
                        radiusX={rx}
                        radiusY={ry}
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dash={[5, 4]}
                        fill="rgba(56, 189, 248, 0.2)"
                      />
                      {/* Lateral Edges */}
                      <Line points={[x1, topY, x1, botY]} stroke="#38bdf8" strokeWidth={2.5} dash={[5, 4]} />
                      <Line points={[x2, topY, x2, botY]} stroke="#38bdf8" strokeWidth={2.5} dash={[5, 4]} />
                      {/* Mid Cross-Contour */}
                      <Ellipse
                        x={cx}
                        y={cy}
                        radiusX={rx * 0.96}
                        radiusY={ry * 0.9}
                        stroke="#38bdf8"
                        strokeWidth={1.8}
                        dash={[4, 3]}
                        fill="transparent"
                      />
                      {/* Top Rim Cap */}
                      <Ellipse
                        x={cx}
                        y={topY}
                        radiusX={rx}
                        radiusY={ry}
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        dash={[5, 4]}
                        fill="rgba(56, 189, 248, 0.35)"
                      />
                    </Group>
                  );
                }
                if (activeDrawTool === 'line') {
                  return (
                    <Line
                      points={[drawingState.startX, drawingState.startY, drawingState.currentX, drawingState.currentY]}
                      stroke="#f43f5e"
                      strokeWidth={3.5}
                      dash={[6, 3]}
                      lineCap="round"
                    />
                  );
                }
                return null;
              })()}
            </Layer>
          )}
        </Stage>
      </div>

      {/* Floating Canvas Zoom & Pan HUD */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center bg-studio-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-studio-700 shadow-2xl space-x-1.5 text-xs text-studio-300">
        <button
          onClick={() => setZoom(z => Math.min(10.0, z * 1.12))}
          className="p-1 hover:bg-studio-700 rounded-lg hover:text-white transition"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.15, z / 1.12))}
          className="p-1 hover:bg-studio-700 rounded-lg hover:text-white transition"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            if (baseScale > 0) {
              setZoom(1.0 / baseScale);
              setPanOffset({ x: 0, y: 0 });
            }
          }}
          className="px-2 py-0.5 hover:bg-studio-700 rounded-lg hover:text-white font-mono text-[11px] transition"
          title="100% Native 1:1 Resolution (Pixel-Perfect)"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={() => {
            setZoom(1.0);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="px-2 py-0.5 hover:bg-studio-700 rounded-lg hover:text-white text-[11px] transition font-medium"
          title="Fit Image to Viewport"
        >
          Fit
        </button>
        {isSpacePressed && (
          <span className="text-[10px] text-amber-400 font-medium px-1 flex items-center space-x-1">
            <Move className="w-3 h-3" />
            <span>Pan</span>
          </span>
        )}
      </div>
    </div>
  );
};
