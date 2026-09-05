import React from 'react';
import { Layers, Image as ImageIcon, Compass, GitCommit, SlidersHorizontal, Ruler, Palette, Anchor } from 'lucide-react';
import { ConstructionStyle } from '../types/shapes';

interface OpacitySliderProps {
  shapesOpacity?: number;
  imageOpacity?: number;
  strokeWidth?: number;
  showCrossContours: boolean;
  showLineOfAction: boolean;
  constructionStyle?: ConstructionStyle;
  show8HeadGrid?: boolean;
  showPlumbLine?: boolean;
  onShapesOpacityChange?: (value: number) => void;
  onImageOpacityChange?: (value: number) => void;
  onStrokeWidthChange?: (value: number) => void;
  onToggleCrossContours: (enabled: boolean) => void;
  onToggleLineOfAction: (enabled: boolean) => void;
  onStyleChange?: (style: ConstructionStyle) => void;
  onToggle8HeadGrid?: (show: boolean) => void;
  onTogglePlumbLine?: (show: boolean) => void;

  // Backwards compatibility props
  opacity?: number;
  onOpacityChange?: (value: number) => void;
}

export const OpacitySlider: React.FC<OpacitySliderProps> = ({
  shapesOpacity,
  imageOpacity = 0.85,
  strokeWidth = 5.0,
  showCrossContours,
  showLineOfAction,
  constructionStyle = 'hybrid',
  show8HeadGrid = false,
  showPlumbLine = false,
  onShapesOpacityChange,
  onImageOpacityChange,
  onStrokeWidthChange,
  onToggleCrossContours,
  onToggleLineOfAction,
  onStyleChange,
  onToggle8HeadGrid,
  onTogglePlumbLine,
  opacity,
  onOpacityChange,
}) => {
  const currentShapesOpacity = shapesOpacity ?? opacity ?? 0.90;
  const handleShapesChange = (val: number) => {
    if (onShapesOpacityChange) onShapesOpacityChange(val);
    if (onOpacityChange) onOpacityChange(val);
  };

  const boldnessPresets = [
    { label: 'Norm', width: 3.5 },
    { label: 'Bold', width: 5.0 },
    { label: 'Heavy', width: 7.5 },
  ];

  const stylePresets: { id: ConstructionStyle; label: string; title: string }[] = [
    { id: 'okabayashi', label: 'Okabayashi', title: 'Figure Drawing For Dummies: Egg cranium, neck cylinder, stomach column & articulated ball joints' },
    { id: 'brokendraw', label: 'BrokenDraw', title: '25 Exercises: 3 Big Boxes (Skull, Ribcage, Pelvis), ear center & sternum/sacral landmarks' },
    { id: 'woodward', label: 'Woodward', title: 'Gesture Drawing: Conté crayon rhythms & head-to-supporting-ankle gravity flow' },
    { id: 'tiner', label: 'Tiner', title: 'Figure Without a Model: Center of gravity plumb line & reciprocal contrapposto tilts' },
    { id: 'loomis', label: 'Loomis', title: 'Sphere cranium & facial thirds guide planes' },
    { id: 'bridgman', label: 'Bridgman', title: 'Interlocking torso blocks & waist mortise wedging' },
    { id: 'hampton', label: 'Hampton', title: 'Dynamic gesture spine rhythm & limb flow paths' },
    { id: 'hybrid', label: 'Hybrid', title: 'Synthesize all master drawing principles' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 px-3 bg-studio-800/90 rounded-xl border border-studio-700 select-none shadow-sm text-xs">
      {/* 1. Shapes Opacity Slider */}
      <div className="flex items-center space-x-1.5" title="Adjust transparency of 2D construction shapes">
        <span className="text-[11px] font-medium text-studio-300 flex items-center space-x-1">
          <Layers className="w-3.5 h-3.5 text-brand-accent" />
          <span className="hidden md:inline">Shapes:</span>
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={currentShapesOpacity}
          onChange={(e) => handleShapesChange(parseFloat(e.target.value))}
          className="w-16 sm:w-20 h-1.5 bg-studio-600 rounded-lg appearance-none cursor-pointer accent-brand-500"
          title={`Shapes opacity: ${Math.round(currentShapesOpacity * 100)}%`}
        />
        <span className="text-[10px] font-mono text-studio-300 w-7">
          {Math.round(currentShapesOpacity * 100)}%
        </span>
      </div>

      <div className="h-4 w-[1px] bg-studio-700" />

      {/* 2. Image Opacity Slider */}
      <div className="flex items-center space-x-1.5" title="Adjust transparency of background reference image">
        <span className="text-[11px] font-medium text-studio-300 flex items-center space-x-1">
          <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">Image:</span>
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={imageOpacity}
          onChange={(e) => onImageOpacityChange && onImageOpacityChange(parseFloat(e.target.value))}
          className="w-16 sm:w-20 h-1.5 bg-studio-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
          title={`Image opacity: ${Math.round(imageOpacity * 100)}%`}
        />
        <span className="text-[10px] font-mono text-studio-300 w-7">
          {Math.round(imageOpacity * 100)}%
        </span>
      </div>

      <div className="h-4 w-[1px] bg-studio-700 hidden sm:block" />

      {/* 3. Shape Boldness / Line Weight Selector */}
      {onStrokeWidthChange && (
        <div className="flex items-center space-x-1" title="Adjust stroke thickness of construction lines">
          <SlidersHorizontal className="w-3 h-3 text-studio-400 hidden lg:inline" />
          <div className="flex bg-studio-900/80 p-0.5 rounded-lg border border-studio-700/80">
            {boldnessPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => onStrokeWidthChange(preset.width)}
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition ${
                  Math.abs(strokeWidth - preset.width) < 0.5
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-studio-400 hover:text-white hover:bg-studio-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="h-4 w-[1px] bg-studio-700 hidden md:block" />

      {/* 4. Master Construction Style Selector (Loomis, Bridgman, Hampton, Hybrid) */}
      {onStyleChange && (
        <div className="flex items-center space-x-1" title="Select figure construction method">
          <span className="text-[11px] font-medium text-studio-300 hidden xl:flex items-center space-x-1">
            <Palette className="w-3.5 h-3.5 text-brand-accent" />
            <span>Style:</span>
          </span>
          <div className="flex bg-studio-900/80 p-0.5 rounded-lg border border-studio-700/80">
            {stylePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onStyleChange(preset.id)}
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition ${
                  constructionStyle === preset.id
                    ? 'bg-brand-600 text-white shadow-sm font-semibold'
                    : 'text-studio-400 hover:text-white hover:bg-studio-800'
                }`}
                title={preset.title}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="h-4 w-[1px] bg-studio-700 hidden sm:block" />

      {/* 5. 8-Head Proportional Ruler Toggle */}
      {onToggle8HeadGrid && (
        <button
          onClick={() => onToggle8HeadGrid(!show8HeadGrid)}
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border transition ${
            show8HeadGrid
              ? 'bg-brand-500/25 text-brand-accent border-brand-accent/50 shadow-sm'
              : 'bg-studio-800/50 text-studio-400 border-studio-700/50 hover:text-studio-200'
          }`}
          title="Toggle classical 8-head proportional canon ruler & division lines"
        >
          <Ruler className="w-3.5 h-3.5 text-brand-accent" />
          <span className="hidden lg:inline">8-Head Ruler</span>
        </button>
      )}

      {/* 6. Ron Tiner Gravitational Plumb Line & Balance Toggle */}
      {onTogglePlumbLine && (
        <button
          onClick={() => onTogglePlumbLine(!showPlumbLine)}
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border transition ${
            showPlumbLine
              ? 'bg-emerald-500/25 text-emerald-400 border-emerald-400/50 shadow-sm'
              : 'bg-studio-800/50 text-studio-400 border-studio-700/50 hover:text-studio-200'
          }`}
          title="Toggle Ron Tiner Center of Gravity Plumb Line & Base of Support Balance"
        >
          <Anchor className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Plumb Line</span>
        </button>
      )}

      {/* 6. Perspective Toggles: Cross-Contours & Line of Action */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onToggleCrossContours(!showCrossContours)}
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border transition ${
            showCrossContours
              ? 'bg-studio-700 text-white border-studio-600'
              : 'bg-studio-800/50 text-studio-400 border-studio-700/50'
          }`}
          title="Toggle 3D perspective cross-contour curves on limbs"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden 2xl:inline">Cross-Contours</span>
        </button>

        <button
          onClick={() => onToggleLineOfAction(!showLineOfAction)}
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border transition ${
            showLineOfAction
              ? 'bg-studio-700 text-white border-studio-600'
              : 'bg-studio-800/50 text-studio-400 border-studio-700/50'
          }`}
          title="Toggle gestural spine line of action"
        >
          <GitCommit className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden 2xl:inline">Action</span>
        </button>
      </div>
    </div>
  );
};
