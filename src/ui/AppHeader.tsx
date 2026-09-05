import { ConstructionMode } from '../types/shapes';
import { Download, Sparkles, Box, FileCode, CheckCircle2, RefreshCw, BookOpen, Pencil } from 'lucide-react';

interface AppHeaderProps {
  modelReady: boolean;
  constructionMode: ConstructionMode;
  onToggleMode: (mode: ConstructionMode) => void;
  onLoadSample: (sampleType: 'standing' | 'contrapposto' | 'foreshortened' | 'portrait') => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onOpenAnatomyGuide: () => void;
  hasShapes: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  modelReady,
  constructionMode,
  onToggleMode,
  onLoadSample,
  onExportPng,
  onExportSvg,
  onOpenAnatomyGuide,
  hasShapes,
}) => {
  return (
    <header className="h-14 bg-studio-800 border-b border-studio-700 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Concept */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-accent flex items-center justify-center shadow-md">
          <Box className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-semibold tracking-wide text-white">FormMaster</h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-accent border border-brand-accent/30">
              Loomis / Bridgman
            </span>
          </div>
          <p className="text-[11px] text-studio-400">3D-Informed Construction Primitives for Figure Drawing</p>
        </div>
      </div>

      {/* Center: Mode Switch, Presets & ML Status */}
      <div className="flex items-center space-x-3">
        {/* Mode Toggle: Auto (AI) vs Manual (Freeform) */}
        <div className="flex items-center bg-studio-900/90 p-0.5 rounded-lg border border-studio-700 shadow-inner">
          <button
            onClick={() => onToggleMode('auto')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              constructionMode === 'auto'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-studio-400 hover:text-white'
            }`}
            title="Auto Mode: Uses MediaPipe AI model to detect landmarks and auto-generate construction forms"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto (AI)</span>
          </button>
          <button
            onClick={() => onToggleMode('manual')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              constructionMode === 'manual'
                ? 'bg-brand-accent text-studio-900 font-semibold shadow-sm'
                : 'text-studio-400 hover:text-white'
            }`}
            title="Manual Mode: Draw freeform shapes, boxes, circles, cylinders, lines or use presets directly"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Manual (Freeform)</span>
          </button>
        </div>

        {/* ML Status Badge (shown in auto mode) */}
        {constructionMode === 'auto' && (
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-studio-700/60 border border-studio-600/50 text-[11px] text-studio-300">
            {modelReady ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>MediaPipe Active</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Loading Vision Model...</span>
              </>
            )}
          </div>
        )}

        {/* Sample Poses Dropdown / Buttons */}
        <div className="flex items-center space-x-1 bg-studio-700/40 p-1 rounded-lg border border-studio-600/40">
          <span className="text-[11px] text-studio-400 px-2 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Samples:</span>
          </span>
          <button
            onClick={() => onLoadSample('contrapposto')}
            className="text-[11px] px-2 py-0.5 rounded text-studio-200 hover:text-white hover:bg-studio-600/60 transition"
            title="Standing figure with hip and shoulder tilt"
          >
            Contrapposto
          </button>
          <button
            onClick={() => onLoadSample('foreshortened')}
            className="text-[11px] px-2 py-0.5 rounded text-studio-200 hover:text-white hover:bg-studio-600/60 transition"
            title="Arm reaching forward toward camera"
          >
            Foreshortened
          </button>
          <button
            onClick={() => onLoadSample('portrait')}
            className="text-[11px] px-2 py-0.5 rounded text-studio-200 hover:text-white hover:bg-studio-600/60 transition"
            title="Head and face construction planes"
          >
            Portrait
          </button>
        </div>
      </div>

      {/* Right: Anatomy Guide & Export Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenAnatomyGuide}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500/15 hover:bg-brand-500/25 text-brand-accent hover:text-white transition border border-brand-accent/30 shadow-sm"
          title="Open classical figure drawing guide: Loomis, Bridgman, Hampton & 8-Head Canon"
        >
          <BookOpen className="w-3.5 h-3.5 text-brand-accent" />
          <span className="hidden sm:inline">Anatomy</span> Guide
        </button>
        <button
          onClick={onExportPng}
          disabled={!hasShapes}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-studio-700 hover:bg-studio-600 text-studio-100 disabled:opacity-40 disabled:cursor-not-allowed transition border border-studio-600 shadow-sm"
          title="Export transparent PNG at native image resolution"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span> PNG
        </button>
        <button
          onClick={onExportSvg}
          disabled={!hasShapes}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          title="Export scalable vector SVG paths"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span> SVG
        </button>
      </div>
    </header>
  );
};
