import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { ConstructionMode } from '../types/shapes';
import { UploadCloud, Image as ImageIcon, Video, AlertCircle, Sparkles, Pencil } from 'lucide-react';

interface UploadZoneProps {
  constructionMode?: ConstructionMode;
  onToggleMode?: (mode: ConstructionMode) => void;
  onMediaLoaded: (file: File, type: 'image' | 'video') => void;
  onLoadSample: (sampleType: 'standing' | 'contrapposto' | 'foreshortened') => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  constructionMode = 'auto',
  onToggleMode,
  onMediaLoaded,
  onLoadSample,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);

    // Max 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('File size exceeds 100MB limit. Please upload a smaller photo or video.');
      return;
    }

    if (file.type.startsWith('image/')) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validImageTypes.includes(file.type)) {
        setErrorMessage(`Unsupported image format: ${file.type}. Please use JPG, PNG, or WebP.`);
        return;
      }
      onMediaLoaded(file, 'image');
    } else if (file.type.startsWith('video/')) {
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!validVideoTypes.includes(file.type)) {
        setErrorMessage(`Unsupported video format: ${file.type}. Please use MP4, WebM, or MOV.`);
        return;
      }
      onMediaLoaded(file, 'video');
    } else {
      setErrorMessage(`Unsupported file format. Please upload an image or video file.`);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-xl mx-auto w-full">
      {onToggleMode && (
        <div className="mb-4 flex items-center bg-studio-800/90 p-1 rounded-xl border border-studio-700 shadow-sm">
          <span className="text-xs text-studio-400 font-medium px-2.5">Mode:</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMode('auto');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              constructionMode === 'auto'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-studio-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto (AI Detect)</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMode('manual');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              constructionMode === 'manual'
                ? 'bg-brand-accent text-studio-900 font-semibold shadow-sm'
                : 'text-studio-400 hover:text-white'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Manual (Freeform)</span>
          </button>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-brand-accent bg-brand-500/10 scale-[1.01]'
            : 'border-studio-600 bg-studio-800/60 hover:border-studio-400 hover:bg-studio-800'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="w-16 h-16 rounded-2xl bg-studio-700/80 border border-studio-600 flex items-center justify-center mb-4 shadow-inner text-brand-accent">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-medium text-white mb-1">
          Upload Reference Image or Video
        </h3>
        <p className="text-xs text-studio-400 text-center max-w-xs mb-5">
          Drag & drop a reference photo or video here, or click to browse from your device.
        </p>

        <div className="flex items-center space-x-6 text-xs text-studio-400">
          <span className="flex items-center space-x-1.5">
            <ImageIcon className="w-4 h-4 text-studio-300" />
            <span>JPG, PNG, WebP</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Video className="w-4 h-4 text-studio-300" />
            <span>MP4, WebM, MOV</span>
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 w-full rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Test Presets */}
      <div className="mt-8 text-center">
        <p className="text-xs text-studio-400 mb-3 flex items-center justify-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>No image ready? Start practicing instantly with a preset:</span>
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => onLoadSample('contrapposto')}
            className="px-3.5 py-1.5 rounded-lg bg-studio-700 hover:bg-studio-600 text-xs font-medium text-studio-200 hover:text-white transition border border-studio-600 shadow-sm"
          >
            Contrapposto Figure
          </button>
          <button
            onClick={() => onLoadSample('foreshortened')}
            className="px-3.5 py-1.5 rounded-lg bg-studio-700 hover:bg-studio-600 text-xs font-medium text-studio-200 hover:text-white transition border border-studio-600 shadow-sm"
          >
            Foreshortened Pose
          </button>
          <button
            onClick={() => onLoadSample('standing')}
            className="px-3.5 py-1.5 rounded-lg bg-studio-700 hover:bg-studio-600 text-xs font-medium text-studio-200 hover:text-white transition border border-studio-600 shadow-sm"
          >
            Neutral Standing
          </button>
        </div>
      </div>
    </div>
  );
};
