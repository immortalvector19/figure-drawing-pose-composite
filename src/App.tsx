import { useState, useEffect, useRef, useCallback } from 'react';
import { AppHeader } from './ui/AppHeader';
import { UploadZone } from './ui/UploadZone';
import { VideoPlayer } from './ui/VideoPlayer';
import { StudioSidebar } from './ui/StudioSidebar';
import { AlertBanner } from './ui/AlertBanner';
import { ImageCropperModal } from './ui/ImageCropperModal';
import { AnatomyGuideModal } from './ui/AnatomyGuideModal';
import { ConstructionCanvas } from './canvas/ConstructionCanvas';
import { PoseDetectionResult } from './types/pose';
import {
  ConstructionStyle,
  ConstructionMode,
  BodyPartCategory,
  PrimitiveType,
  ConstructionPrimitive,
} from './types/shapes';
import { useShapeStore } from './state/shapeStore';
import { useFilterStore } from './state/filterStore';
import { getPoseLandmarker, detectPoseFromImage } from './ml/poseDetector';
import { VideoPoseTracker } from './ml/videoProcessor';
import { buildConstructionPrimitives } from './geometry/sceneBuilder';
import { evaluateDetectionHeuristics, QualityAlert } from './ml/heuristics';
import { createSyntheticPose } from './samplePoses';
import { Proportions } from './geometry/proportions';
import { downloadPngFile } from './export/pngExporter';
import { downloadSvgFile } from './export/svgExporter';
import { RefreshCw } from 'lucide-react';

export function App() {
  const [modelReady, setModelReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'synthetic' | null>(null);
  const [mediaElement, setMediaElement] = useState<HTMLImageElement | HTMLVideoElement | null>(null);
  const [originalImage, setOriginalImage] = useState<{ src: string; width: number; height: number } | null>(null);
  const [pendingCrop, setPendingCrop] = useState<{
    src: string;
    width: number;
    height: number;
    originalImg: HTMLImageElement;
  } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 1000 });
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [isContinuousTracking, setIsContinuousTracking] = useState(false);
  const [showAnatomyGuide, setShowAnatomyGuide] = useState(false);
  const [lastPoseResult, setLastPoseResult] = useState<PoseDetectionResult | null>(null);

  const videoTrackerRef = useRef(new VideoPoseTracker());
  const animationFrameRef = useRef<number | null>(null);

  // Shape Store (active shapes, selection, undo/redo, custom addition)
  const {
    shapes,
    selectedShapeId,
    canUndo,
    canRedo,
    setInitialShapes,
    updateShape,
    selectShape,
    deleteShape,
    addPrimitive,
    addCustomShape,
    clearShapes,
    duplicateShape,
    reorderShape,
    loadStarterMannequin,
    resetToAutoDetected,
    undo,
    redo,
  } = useShapeStore();

  // Filter Store (body part isolation, opacity, cross-contours, action line, stroke width, styles, modes)
  const {
    visibility,
    shapesOpacity,
    imageOpacity,
    strokeWidth,
    constructionStyle,
    showCrossContours,
    showLineOfAction,
    show8HeadGrid,
    togglePart,
    selectAll,
    isolatePart,
    setShapesOpacity,
    setImageOpacity,
    setStrokeWidth,
    setConstructionStyle,
    setShowCrossContours,
    setShowLineOfAction,
    setShow8HeadGrid,
    showPlumbLine,
    setShowPlumbLine,
    constructionMode,
    setConstructionMode,
    activeDrawTool,
    setActiveDrawTool,
    activeBodyPart,
    setActiveBodyPart,
  } = useFilterStore();

  // Initialize MediaPipe Vision model in background
  useEffect(() => {
    getPoseLandmarker()
      .then((landmarker) => {
        if (landmarker) setModelReady(true);
      })
      .catch((err) => console.error('Failed to preload model:', err));
  }, []);

  // Process pose detection and update shapes
  const processPoseDetection = useCallback(async (
    imageOrVideo: HTMLImageElement | HTMLVideoElement,
    isVideo = false,
    timestampMs = 0
  ) => {
    setIsProcessing(true);
    try {
      let poseResult;
      if (isVideo) {
        poseResult = await videoTrackerRef.current.processFrame(
          imageOrVideo as HTMLVideoElement,
          timestampMs
        );
      } else {
        poseResult = await detectPoseFromImage(imageOrVideo as HTMLImageElement);
      }

      // Check heuristics & quality alerts
      const newAlerts = evaluateDetectionHeuristics(
        poseResult.landmarks,
        poseResult.totalPosesDetected
      );
      setAlerts(newAlerts);

      setLastPoseResult(poseResult);

      // Derive 3D-informed construction primitives
      const targetW = imageOrVideo instanceof HTMLVideoElement ? imageOrVideo.videoWidth : imageOrVideo.naturalWidth || 800;
      const targetH = imageOrVideo instanceof HTMLVideoElement ? imageOrVideo.videoHeight : imageOrVideo.naturalHeight || 1000;

      const primitives = buildConstructionPrimitives(
        poseResult,
        targetW,
        targetH,
        constructionStyle
      );

      setInitialShapes(primitives);
    } catch (err) {
      console.error('Error during pose detection:', err);
      setAlerts([
        {
          type: 'warning',
          title: 'Detection Error',
          message: 'Could not extract landmarks from this frame. Try a different frame or image.',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [setInitialShapes, constructionStyle]);

  // Load user-uploaded file (Image or Video)
  const handleMediaLoaded = useCallback((file: File, type: 'image' | 'video') => {
    const url = URL.createObjectURL(file);
    videoTrackerRef.current.reset();

    if (type === 'image') {
      const img = new Image();
      img.onload = async () => {
        try {
          if ('decode' in img) {
            await img.decode();
          }
        } catch {
          // Proceed even if decode promise rejects
        }
        const w = img.naturalWidth || 800;
        const h = img.naturalHeight || 1000;
        setOriginalImage({ src: url, width: w, height: h });
        // Preserve 100% native resolution directly without forced compression or pre-crop
        setDimensions({ width: w, height: h });
        setMediaElement(img);
        setMediaType('image');
        if (constructionMode === 'auto') {
          processPoseDetection(img, false);
        } else {
          setInitialShapes([]);
        }
      };
      img.src = url;
    } else {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';

      video.onloadedmetadata = () => {
        const w = video.videoWidth || 800;
        const h = video.videoHeight || 600;
        setDimensions({ width: w, height: h });
        setMediaElement(video);
        setMediaType('video');
        if (constructionMode === 'auto') {
          // Initial detection at frame 0 in auto mode
          processPoseDetection(video, true, 0);
        } else {
          setInitialShapes([]);
        }
      };
      video.src = url;
    }
  }, [constructionMode, processPoseDetection, setInitialShapes]);

  // Crop trigger handler from sidebar
  const handleOpenCrop = useCallback(() => {
    if (originalImage) {
      const img = new Image();
      img.src = originalImage.src;
      setPendingCrop({
        src: originalImage.src,
        width: originalImage.width,
        height: originalImage.height,
        originalImg: img,
      });
    }
  }, [originalImage]);

  // New media reset handler
  const handleNewMedia = useCallback(() => {
    setMediaType(null);
    setMediaElement(null);
    setOriginalImage(null);
    setPendingCrop(null);
    setAlerts([]);
  }, []);

  // Crop confirmation handlers
  const handleApplyCrop = useCallback((croppedImg: HTMLImageElement, cropW: number, cropH: number) => {
    setPendingCrop(null);
    setDimensions({ width: cropW, height: cropH });
    setMediaElement(croppedImg);
    setMediaType('image');
    if (constructionMode === 'auto') {
      processPoseDetection(croppedImg, false);
    } else {
      if (shapes.length === 0) {
        setInitialShapes([]);
      }
    }
  }, [constructionMode, processPoseDetection, shapes.length, setInitialShapes]);

  const handleUseFullImage = useCallback(() => {
    if (!pendingCrop) return;
    const { originalImg, width: w, height: h } = pendingCrop;
    setPendingCrop(null);
    setDimensions({ width: w, height: h });
    setMediaElement(originalImg);
    setMediaType('image');
    if (constructionMode === 'auto') {
      processPoseDetection(originalImg, false);
    } else {
      if (shapes.length === 0) {
        setInitialShapes([]);
      }
    }
  }, [pendingCrop, constructionMode, processPoseDetection, shapes.length, setInitialShapes]);

  const handleCancelCrop = useCallback(() => {
    setPendingCrop(null);
  }, []);

  // Load Synthetic Sample Pose presets
  const handleLoadSample = useCallback((sampleType: 'standing' | 'contrapposto' | 'foreshortened' | 'portrait') => {
    setMediaType('synthetic');
    setDimensions({ width: 700, height: 950 });

    const isForeshortened = sampleType === 'foreshortened';
    const isContrapposto = sampleType === 'contrapposto';
    const isPortrait = sampleType === 'portrait';

    const pose = createSyntheticPose({
      contrapposto: isContrapposto,
      foreshortenedArm: isForeshortened,
      partialBody: isPortrait,
    });

    const newAlerts = evaluateDetectionHeuristics(pose.landmarks, pose.totalPosesDetected);
    setAlerts(newAlerts);

    setLastPoseResult(pose);
    const primitives = buildConstructionPrimitives(pose, 700, 950, constructionStyle);
    setInitialShapes(primitives);
    setMediaElement(null); // Pure construction canvas
  }, [setInitialShapes, constructionStyle]);

  // Master style switch: dynamically re-derive shapes in selected style
  const handleStyleChange = useCallback((newStyle: ConstructionStyle) => {
    setConstructionStyle(newStyle);
    if (lastPoseResult) {
      const primitives = buildConstructionPrimitives(
        lastPoseResult,
        dimensions.width,
        dimensions.height,
        newStyle
      );
      setInitialShapes(primitives);
    }
  }, [lastPoseResult, dimensions, setConstructionStyle, setInitialShapes]);


  // Continuous Video Tracking loop
  useEffect(() => {
    if (!isContinuousTracking || mediaType !== 'video' || !mediaElement) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const video = mediaElement as HTMLVideoElement;
    let lastTime = -1;

    const trackLoop = async () => {
      if (!video.paused && !video.ended && video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        await processPoseDetection(video, true, video.currentTime * 1000);
      }
      animationFrameRef.current = requestAnimationFrame(trackLoop);
    };

    animationFrameRef.current = requestAnimationFrame(trackLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isContinuousTracking, mediaType, mediaElement, processPoseDetection]);

  // Filter shapes based on body-part visibility and feature toggles
  const visibleShapes = shapes.map(shape => {
    let isVisible = shape.isVisible;

    // Body part filter
    if (!visibility[shape.bodyPart]) {
      isVisible = false;
    }

    // Cross-contour toggle
    if (shape.type === 'cross_contour' && !showCrossContours) {
      isVisible = false;
    }

    // Line of action toggle
    if (shape.type === 'line_of_action' && !showLineOfAction) {
      isVisible = false;
    }

    return {
      ...shape,
      isVisible,
    };
  });

  const selectedShape = shapes.find(s => s.id === selectedShapeId) ?? null;

  // Freeform interactive canvas drawing handler
  const handleAddShapeFromDraw = useCallback((shapeData: {
    type: PrimitiveType;
    x: number;
    y: number;
    width: number;
    height: number;
    points?: number[];
  }) => {
    let strokeColor = Proportions.COLORS.torsoStroke;
    let fillColor = Proportions.COLORS.torsoFill;

    if (activeBodyPart === 'face') {
      strokeColor = Proportions.COLORS.headStroke;
      fillColor = Proportions.COLORS.headFill;
    } else if (activeBodyPart === 'arms') {
      strokeColor = Proportions.COLORS.armsStroke;
      fillColor = Proportions.COLORS.armsFill;
    } else if (activeBodyPart === 'legs') {
      strokeColor = Proportions.COLORS.legsStroke;
      fillColor = Proportions.COLORS.legsFill;
    } else if (activeBodyPart === 'hands' || activeBodyPart === 'feet') {
      strokeColor = Proportions.COLORS.handsStroke;
      fillColor = Proportions.COLORS.handsFill;
    }

    const newId = `user-shape-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newShape: ConstructionPrimitive = {
      id: newId,
      type: shapeData.type,
      bodyPart: activeBodyPart,
      name: `Custom ${shapeData.type.charAt(0).toUpperCase() + shapeData.type.slice(1)}`,
      x: shapeData.x,
      y: shapeData.y,
      width: shapeData.width,
      height: shapeData.height,
      points: shapeData.points,
      rotation: 0,
      depthZ: -0.1,
      strokeColor,
      strokeWidth: strokeWidth || 3.0,
      fillColor,
      fillOpacity: 0.25,
      isUserCreated: true,
      isVisible: true,
    };

    addCustomShape(newShape);
  }, [activeBodyPart, strokeWidth, addCustomShape]);

  // Color & Category inspection updates for selected shape
  const handleUpdateSelectedColor = useCallback((strokeColor: string, fillColor: string) => {
    if (!selectedShapeId) return;
    updateShape(selectedShapeId, { strokeColor, fillColor });
  }, [selectedShapeId, updateShape]);

  const handleUpdateSelectedCategory = useCallback((bodyPart: BodyPartCategory) => {
    if (!selectedShapeId) return;
    let strokeColor = Proportions.COLORS.torsoStroke;
    let fillColor = Proportions.COLORS.torsoFill;
    if (bodyPart === 'face') {
      strokeColor = Proportions.COLORS.headStroke;
      fillColor = Proportions.COLORS.headFill;
    } else if (bodyPart === 'arms') {
      strokeColor = Proportions.COLORS.armsStroke;
      fillColor = Proportions.COLORS.armsFill;
    } else if (bodyPart === 'legs') {
      strokeColor = Proportions.COLORS.legsStroke;
      fillColor = Proportions.COLORS.legsFill;
    } else if (bodyPart === 'hands' || bodyPart === 'feet') {
      strokeColor = Proportions.COLORS.handsStroke;
      fillColor = Proportions.COLORS.handsFill;
    }
    updateShape(selectedShapeId, { bodyPart, strokeColor, fillColor });
  }, [selectedShapeId, updateShape]);

  // Starter mannequin loader
  const handleLoadStarterMannequin = useCallback(() => {
    loadStarterMannequin(dimensions.width, dimensions.height, constructionStyle);
  }, [loadStarterMannequin, dimensions, constructionStyle]);

  // Manual mode: trigger AI detection on demand
  const handleRunAutoDetect = useCallback(() => {
    if (mediaElement) {
      processPoseDetection(mediaElement, mediaType === 'video');
    }
  }, [mediaElement, mediaType, processPoseDetection]);

  // Mode toggle (Auto <-> Manual)
  const handleToggleMode = useCallback((newMode: ConstructionMode) => {
    setConstructionMode(newMode);
    if (newMode === 'auto' && mediaElement && shapes.length === 0) {
      processPoseDetection(mediaElement, mediaType === 'video');
    }
  }, [setConstructionMode, mediaElement, shapes.length, mediaType, processPoseDetection]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedShapeId) {
      duplicateShape(selectedShapeId);
    }
  }, [selectedShapeId, duplicateShape]);

  const handleReorderSelected = useCallback((direction: 'forward' | 'backward') => {
    if (selectedShapeId) {
      reorderShape(selectedShapeId, direction);
    }
  }, [selectedShapeId, reorderShape]);

  // Global keyboard shortcuts for drawing tools and duplication
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      // Duplicate shortcut: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedShapeId) {
          e.preventDefault();
          duplicateShape(selectedShapeId);
        }
        return;
      }

      // Tool shortcuts (when not holding Ctrl/Cmd)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setActiveDrawTool('select');
            break;
          case 'r':
            setActiveDrawTool('rectangle');
            break;
          case 'c':
            setActiveDrawTool('circle');
            break;
          case 'o':
            setActiveDrawTool('oval');
            break;
          case 'y':
            setActiveDrawTool('cylinder');
            break;
          case 'l':
            setActiveDrawTool('line');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, duplicateShape, setActiveDrawTool]);

  // Export handlers
  const handleExportPng = () => {
    downloadPngFile(
      visibleShapes,
      dimensions.width,
      dimensions.height,
      'figure-construction-forms.png',
      { strokeWidth, shapesOpacity }
    );
  };

  const handleExportSvg = () => {
    downloadSvgFile(
      visibleShapes,
      dimensions.width,
      dimensions.height,
      'figure-construction-forms.svg',
      { strokeWidth, shapesOpacity }
    );
  };

  const handleDismissAlert = (index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-studio-900 text-studio-100 overflow-hidden select-none">
      {/* App Navigation Header */}
      <AppHeader
        modelReady={modelReady}
        constructionMode={constructionMode}
        onToggleMode={handleToggleMode}
        onLoadSample={handleLoadSample}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onOpenAnatomyGuide={() => setShowAnatomyGuide(true)}
        hasShapes={shapes.length > 0}
      />

      {/* Floating Quality & Heuristic Toast Alerts */}
      <div className="fixed bottom-4 right-[336px] z-50 max-w-sm pointer-events-auto">
        <AlertBanner alerts={alerts} onDismiss={handleDismissAlert} />
      </div>

      {/* Main Content Area */}
      {mediaType === null ? (
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <UploadZone
            constructionMode={constructionMode}
            onToggleMode={handleToggleMode}
            onMediaLoaded={handleMediaLoaded}
            onLoadSample={handleLoadSample}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-row overflow-hidden relative">
          {/* Main Stage: Canvas Viewport + Optional Video Playback */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 relative overflow-hidden bg-studio-950 flex items-center justify-center">
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-30 flex items-center justify-center pointer-events-none">
                  <div className="px-5 py-3 rounded-xl bg-studio-800/95 border border-studio-600 shadow-2xl flex items-center space-x-3 text-xs text-white">
                    <RefreshCw className="w-4 h-4 text-brand-accent animate-spin" />
                    <span className="font-medium">Extracting 3D Construction Forms...</span>
                  </div>
                </div>
              )}

              <ConstructionCanvas
                imageElement={mediaElement}
                width={dimensions.width}
                height={dimensions.height}
                shapes={visibleShapes}
                selectedShapeId={selectedShapeId}
                shapesOpacity={shapesOpacity}
                imageOpacity={imageOpacity}
                strokeWidth={strokeWidth}
                show8HeadGrid={show8HeadGrid}
                showPlumbLine={showPlumbLine}
                activeDrawTool={activeDrawTool}
                activeBodyPart={activeBodyPart}
                onAddShapeFromDraw={handleAddShapeFromDraw}
                onSelectShape={selectShape}
                onUpdateShape={updateShape}
                onDeleteShape={deleteShape}
              />
            </div>

            {/* Video Scrubbing & Playback Bar */}
            {mediaType === 'video' && mediaElement instanceof HTMLVideoElement && (
              <VideoPlayer
                videoElement={mediaElement}
                onConvertCurrentFrame={() => {
                  if (mediaElement) {
                    processPoseDetection(mediaElement, true, mediaElement.currentTime * 1000);
                  }
                }}
                isContinuousTracking={isContinuousTracking}
                onToggleContinuousTracking={setIsContinuousTracking}
              />
            )}
          </div>

          {/* Dedicated Right-Side Studio Sidebar with All Tools, Inspectors & Controls */}
          <StudioSidebar
            constructionMode={constructionMode}
            activeDrawTool={activeDrawTool}
            activeBodyPart={activeBodyPart}
            onToggleMode={handleToggleMode}
            onSelectDrawTool={setActiveDrawTool}
            onSelectBodyPart={setActiveBodyPart}
            onAddPrimitive={(type) => addPrimitive(type, activeBodyPart)}
            onLoadStarterMannequin={handleLoadStarterMannequin}
            onClearShapes={clearShapes}
            onResetAuto={resetToAutoDetected}
            onRunAutoDetect={handleRunAutoDetect}
            selectedShape={selectedShape}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onDuplicateSelected={handleDuplicateSelected}
            onDeleteSelected={() => selectedShapeId && deleteShape(selectedShapeId)}
            onReorderSelected={handleReorderSelected}
            onUpdateSelectedColor={handleUpdateSelectedColor}
            onUpdateSelectedCategory={handleUpdateSelectedCategory}
            constructionStyle={constructionStyle}
            onStyleChange={handleStyleChange}
            show8HeadGrid={show8HeadGrid}
            showPlumbLine={showPlumbLine}
            showCrossContours={showCrossContours}
            showLineOfAction={showLineOfAction}
            onToggle8HeadGrid={setShow8HeadGrid}
            onTogglePlumbLine={setShowPlumbLine}
            onToggleCrossContours={setShowCrossContours}
            onToggleLineOfAction={setShowLineOfAction}
            visibility={visibility}
            onTogglePart={togglePart}
            onSelectAll={selectAll}
            onIsolatePart={isolatePart}
            shapesOpacity={shapesOpacity}
            imageOpacity={imageOpacity}
            strokeWidth={strokeWidth}
            onShapesOpacityChange={setShapesOpacity}
            onImageOpacityChange={setImageOpacity}
            onStrokeWidthChange={setStrokeWidth}
            mediaType={mediaType}
            hasOriginalImage={!!originalImage}
            onOpenCrop={handleOpenCrop}
            onNewMedia={handleNewMedia}
          />
        </div>
      )}

      {/* Image Cropper Modal: crop reference image before pose extraction */}
      {pendingCrop && (
        <ImageCropperModal
          imageSrc={pendingCrop.src}
          originalWidth={pendingCrop.width}
          originalHeight={pendingCrop.height}
          onApplyCrop={handleApplyCrop}
          onUseFullImage={handleUseFullImage}
          onCancel={handleCancelCrop}
        />
      )}

      {/* Classical Anatomy & Master Construction Illustrated Guide */}
      <AnatomyGuideModal
        isOpen={showAnatomyGuide}
        onClose={() => setShowAnatomyGuide(false)}
      />
    </div>
  );
}
