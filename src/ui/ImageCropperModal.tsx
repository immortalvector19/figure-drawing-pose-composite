import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crop, X, Maximize2, RotateCcw, Sparkles } from 'lucide-react';

interface CropBox {
  x: number; // 0 to 1 relative to displayed image width
  y: number; // 0 to 1 relative to displayed image height
  width: number; // 0 to 1
  height: number; // 0 to 1
}

interface ImageCropperModalProps {
  imageSrc: string;
  originalWidth: number;
  originalHeight: number;
  onApplyCrop: (croppedImg: HTMLImageElement, width: number, height: number) => void;
  onUseFullImage: () => void;
  onCancel: () => void;
}

type AspectRatio = 'free' | '1:1' | '4:5' | '3:4' | '16:9';

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  originalWidth,
  originalHeight,
  onApplyCrop,
  onUseFullImage,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Normalized crop box: starts at 100% full image (no forced pre-crop!)
  const [crop, setCrop] = useState<CropBox>({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialCrop: CropBox } | null>(null);
  const [displayedSize, setDisplayedSize] = useState({ width: 0, height: 0 });

  // Update displayed image dimensions on resize or load
  const updateDisplayedSize = useCallback(() => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDisplayedSize({ width: rect.width, height: rect.height });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateDisplayedSize);
    return () => window.removeEventListener('resize', updateDisplayedSize);
  }, [updateDisplayedSize]);

  // Adjust crop box when aspect ratio changes
  const applyAspectRatio = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    if (ratio === 'free') return;

    let targetRatio = 1.0;
    if (ratio === '1:1') targetRatio = 1.0;
    else if (ratio === '4:5') targetRatio = 4 / 5;
    else if (ratio === '3:4') targetRatio = 3 / 4;
    else if (ratio === '16:9') targetRatio = 16 / 9;

    const imgAspect = originalWidth / originalHeight;
    const normRatio = targetRatio / imgAspect;

    let newWidth = crop.width;
    let newHeight = newWidth / normRatio;

    if (newHeight > 1.0) {
      newHeight = 1.0;
      newWidth = newHeight * normRatio;
    }
    if (newWidth > 1.0) {
      newWidth = 1.0;
      newHeight = newWidth / normRatio;
    }

    const newX = Math.max(0, Math.min(1 - newWidth, crop.x));
    const newY = Math.max(0, Math.min(1 - newHeight, crop.y));

    setCrop({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  };

  const resetToFull = () => {
    setAspectRatio('free');
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
  };

  // Mouse drag handling with no arbitrary limits (allows down to 0.005 / ~10px)
  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(handle);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialCrop: { ...crop },
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeHandle || !dragStartRef.current || displayedSize.width <= 0 || displayedSize.height <= 0) {
      return;
    }

    const dx = (e.clientX - dragStartRef.current.mouseX) / displayedSize.width;
    const dy = (e.clientY - dragStartRef.current.mouseY) / displayedSize.height;
    const init = dragStartRef.current.initialCrop;
    const MIN_SIZE = 0.005; // Flexible minimum size (~10px), no annoying limit!

    let next = { ...init };

    if (activeHandle === 'move') {
      next.x = Math.max(0, Math.min(1 - init.width, init.x + dx));
      next.y = Math.max(0, Math.min(1 - init.height, init.y + dy));
    } else {
      if (activeHandle.includes('right')) {
        next.width = Math.max(MIN_SIZE, Math.min(1 - init.x, init.width + dx));
      }
      if (activeHandle.includes('left')) {
        const potentialX = Math.max(0, Math.min(init.x + init.width - MIN_SIZE, init.x + dx));
        const potentialWidth = init.width - (potentialX - init.x);
        next.x = potentialX;
        next.width = Math.max(MIN_SIZE, potentialWidth);
      }
      if (activeHandle.includes('bottom')) {
        next.height = Math.max(MIN_SIZE, Math.min(1 - init.y, init.height + dy));
      }
      if (activeHandle.includes('top')) {
        const potentialY = Math.max(0, Math.min(init.y + init.height - MIN_SIZE, init.y + dy));
        const potentialHeight = init.height - (potentialY - init.y);
        next.y = potentialY;
        next.height = Math.max(MIN_SIZE, potentialHeight);
      }
    }

    setCrop(next);
  }, [activeHandle, displayedSize]);

  const handleMouseUp = useCallback(() => {
    setActiveHandle(null);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (activeHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [activeHandle, handleMouseMove, handleMouseUp]);

  // Compute actual native pixel dimensions of cropped area
  const pixelCrop = {
    x: Math.round(crop.x * originalWidth),
    y: Math.round(crop.y * originalHeight),
    width: Math.max(10, Math.min(originalWidth, Math.round(crop.width * originalWidth))),
    height: Math.max(10, Math.min(originalHeight, Math.round(crop.height * originalHeight))),
  };

  // High-fidelity client-side canvas crop
  const handleApply = () => {
    // If the crop is practically the full image, bypass re-encoding completely to preserve 100% original quality
    if (crop.x <= 0.002 && crop.y <= 0.002 && crop.width >= 0.996 && crop.height >= 0.996) {
      onUseFullImage();
      return;
    }

    const srcImg = new Image();
    srcImg.crossOrigin = 'anonymous';
    srcImg.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Enable high-quality image smoothing for the crop
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        srcImg,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      const croppedImg = new Image();
      croppedImg.onload = () => {
        onApplyCrop(croppedImg, pixelCrop.width, pixelCrop.height);
      };
      // High-quality PNG encoding
      croppedImg.src = canvas.toDataURL('image/png', 1.0);
    };
    srcImg.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-studio-900 border border-studio-700 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-studio-700 flex items-center justify-between bg-studio-850">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-accent border border-brand-500/30">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Crop Reference Image</h2>
              <p className="text-[11px] text-studio-400">
                Focus on your figure or subject before extracting 3D construction forms
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 text-studio-400 hover:text-white rounded-lg hover:bg-studio-700 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Toolbar & Dimension Tag */}
        <div className="px-5 py-2.5 border-b border-studio-800 bg-studio-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-studio-400 text-[11px] mr-1">Aspect Ratio:</span>
            {(['free', '1:1', '4:5', '3:4', '16:9'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => applyAspectRatio(ratio)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  aspectRatio === ratio
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-studio-800 text-studio-300 hover:text-white hover:bg-studio-700'
                }`}
              >
                {ratio === 'free' ? 'Freeform' : ratio}
              </button>
            ))}

            <button
              onClick={resetToFull}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium text-studio-400 hover:text-white hover:bg-studio-800 transition ml-2 border border-studio-700/60"
              title="Reset to full image size"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Real-time Dimensions */}
          <div className="flex items-center space-x-2 text-[11px] font-mono text-studio-300 bg-studio-800 px-2.5 py-1 rounded-lg border border-studio-700">
            <Maximize2 className="w-3 h-3 text-brand-accent" />
            <span>Crop: {pixelCrop.width} × {pixelCrop.height} px</span>
            <span className="text-studio-500">({originalWidth} × {originalHeight} px original)</span>
          </div>
        </div>

        {/* Crop Viewport */}
        <div
          ref={containerRef}
          className="relative flex-1 min-h-[360px] max-h-[58vh] bg-studio-950 flex items-center justify-center p-4 overflow-hidden"
        >
          <div className="relative inline-block select-none shadow-2xl">
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Reference"
              onLoad={updateDisplayedSize}
              className="max-h-[54vh] max-w-[75vw] object-contain block pointer-events-none rounded-sm"
            />

            {/* Dimmed backdrop outside the crop rectangle */}
            {displayedSize.width > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'rgba(0, 0, 0, 0.68)',
                  clipPath: `polygon(
                    0% 0%, 0% 100%,
                    ${crop.x * 100}% 100%,
                    ${crop.x * 100}% ${crop.y * 100}%,
                    ${(crop.x + crop.width) * 100}% ${crop.y * 100}%,
                    ${(crop.x + crop.width) * 100}% ${(crop.y + crop.height) * 100}%,
                    ${crop.x * 100}% ${(crop.y + crop.height) * 100}%,
                    ${crop.x * 100}% 100%,
                    100% 100%, 100% 0%
                  )`,
                }}
              />
            )}

            {/* Interactive Crop Rectangle */}
            {displayedSize.width > 0 && (
              <div
                className="absolute border-2 border-brand-accent cursor-move select-none shadow-[0_0_15px_rgba(56,189,248,0.35)]"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.width * 100}%`,
                  height: `${crop.height * 100}%`,
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
              >
                {/* Rule-of-Thirds Grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div />
                </div>

                {/* 8 Drag Handles */}
                {/* Corner Handles */}
                <div
                  className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-brand-accent border-2 border-white rounded-sm cursor-nwse-resize shadow-md"
                  onMouseDown={(e) => handleMouseDown(e, 'top-left')}
                />
                <div
                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-brand-accent border-2 border-white rounded-sm cursor-nesw-resize shadow-md"
                  onMouseDown={(e) => handleMouseDown(e, 'top-right')}
                />
                <div
                  className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-brand-accent border-2 border-white rounded-sm cursor-nesw-resize shadow-md"
                  onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
                />
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-brand-accent border-2 border-white rounded-sm cursor-nwse-resize shadow-md"
                  onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
                />

                {/* Edge Handles */}
                <div
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-5 bg-brand-accent border border-white rounded-sm cursor-ew-resize shadow"
                  onMouseDown={(e) => handleMouseDown(e, 'left')}
                />
                <div
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-5 bg-brand-accent border border-white rounded-sm cursor-ew-resize shadow"
                  onMouseDown={(e) => handleMouseDown(e, 'right')}
                />
                <div
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-3 bg-brand-accent border border-white rounded-sm cursor-ns-resize shadow"
                  onMouseDown={(e) => handleMouseDown(e, 'top')}
                />
                <div
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-3 bg-brand-accent border border-white rounded-sm cursor-ns-resize shadow"
                  onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-studio-700 bg-studio-850 flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-studio-300 hover:text-white hover:bg-studio-700 transition"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onUseFullImage}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-studio-200 hover:text-white bg-studio-700 hover:bg-studio-600 transition border border-studio-600 shadow-sm"
              title="Process the complete image without cropping"
            >
              Use Full Image (No Crop)
            </button>

            <button
              onClick={handleApply}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-brand-600 hover:bg-brand-500 transition shadow-lg shadow-brand-500/25 border border-brand-400"
              title="Apply this crop and extract 3D construction forms"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span className="font-semibold">Crop & Detect Forms</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
