import React from 'react';
import {
  MousePointer,
  Square,
  Circle,
  Cylinder,
  Minus,
  RotateCcw,
  Trash2,
  Undo2,
  Redo2,
  Plus,
  Copy,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Pencil,
  Crop,
  Upload,
  SlidersHorizontal,
  Compass,
  Ruler,
  Anchor,
  GitCommit,
} from 'lucide-react';
import {
  ConstructionPrimitive,
  PrimitiveType,
  DrawToolType,
  ConstructionMode,
  BodyPartCategory,
  ConstructionStyle,
  BodyPartVisibilityMap,
} from '../types/shapes';
import { Proportions } from '../geometry/proportions';

export interface StudioSidebarProps {
  // Mode & Tools
  constructionMode: ConstructionMode;
  activeDrawTool: DrawToolType;
  activeBodyPart: BodyPartCategory;
  onToggleMode: (mode: ConstructionMode) => void;
  onSelectDrawTool: (tool: DrawToolType) => void;
  onSelectBodyPart: (part: BodyPartCategory) => void;
  onAddPrimitive: (type: PrimitiveType) => void;
  onLoadStarterMannequin: () => void;
  onClearShapes: () => void;
  onResetAuto: () => void;
  onRunAutoDetect: () => void;

  // Selection & Inspector
  selectedShape: ConstructionPrimitive | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onReorderSelected: (direction: 'forward' | 'backward') => void;
  onUpdateSelectedColor: (stroke: string, fill: string) => void;
  onUpdateSelectedCategory: (cat: BodyPartCategory) => void;

  // Master Styles
  constructionStyle: ConstructionStyle;
  onStyleChange: (style: ConstructionStyle) => void;

  // Overlays & Canon
  show8HeadGrid: boolean;
  showPlumbLine: boolean;
  showCrossContours: boolean;
  showLineOfAction: boolean;
  onToggle8HeadGrid: (show: boolean) => void;
  onTogglePlumbLine: (show: boolean) => void;
  onToggleCrossContours: (show: boolean) => void;
  onToggleLineOfAction: (show: boolean) => void;

  // Visibility
  visibility: BodyPartVisibilityMap;
  onTogglePart: (part: BodyPartCategory) => void;
  onSelectAll: () => void;
  onIsolatePart: (part: BodyPartCategory) => void;

  // Opacity & Stroke
  shapesOpacity: number;
  imageOpacity: number;
  strokeWidth: number;
  onShapesOpacityChange: (val: number) => void;
  onImageOpacityChange: (val: number) => void;
  onStrokeWidthChange: (val: number) => void;

  // Media
  mediaType: 'image' | 'video' | 'synthetic' | null;
  hasOriginalImage: boolean;
  onOpenCrop: () => void;
  onNewMedia: () => void;
}

const COLOR_SWATCHES = [
  { label: 'Cyan (Head)', stroke: Proportions.COLORS.headStroke, fill: Proportions.COLORS.headFill },
  { label: 'Rose (Torso)', stroke: Proportions.COLORS.torsoStroke, fill: Proportions.COLORS.torsoFill },
  { label: 'Purple (Pelvis)', stroke: Proportions.COLORS.pelvisStroke, fill: Proportions.COLORS.pelvisFill },
  { label: 'Amber (Arms)', stroke: Proportions.COLORS.armsStroke, fill: Proportions.COLORS.armsFill },
  { label: 'Green (Legs)', stroke: Proportions.COLORS.legsStroke, fill: Proportions.COLORS.legsFill },
  { label: 'Orange (Extremities)', stroke: Proportions.COLORS.handsStroke, fill: Proportions.COLORS.handsFill },
  { label: 'White (Neutral)', stroke: '#ffffff', fill: '#94a3b8' },
];

const STYLE_PRESETS: { id: ConstructionStyle; label: string; author: string; desc: string }[] = [
  { id: 'okabayashi', label: 'Okabayashi', author: 'Figure Drawing For Dummies', desc: 'Egg cranium, stomach column, ball joints' },
  { id: 'brokendraw', label: 'BrokenDraw', author: '25 Exercises (Tieran)', desc: '3 Big Boxes, ear center, sternum tie' },
  { id: 'woodward', label: 'Woodward', author: 'Conté Gesture Drawing', desc: 'Conté crayon rhythms, head-to-ankle flow' },
  { id: 'tiner', label: 'Tiner', author: 'Figure Without a Model', desc: 'Plumb line center of gravity & counterpoise' },
  { id: 'loomis', label: 'Loomis', author: 'Figure Drawing For All', desc: 'Sphere cranium & facial thirds planes' },
  { id: 'bridgman', label: 'Bridgman', author: 'Constructive Anatomy', desc: 'Interlocking torso blocks & waist mortise' },
  { id: 'hampton', label: 'Hampton', author: 'Figure Drawing Design', desc: 'Dynamic gesture spine rhythm & 3D flow' },
  { id: 'hybrid', label: 'Hybrid', author: 'Synthesis Canon', desc: 'All master construction principles combined' },
];

const BODY_PARTS: { key: BodyPartCategory; label: string; colorDot: string }[] = [
  { key: 'face', label: 'Head / Face', colorDot: 'bg-sky-400' },
  { key: 'torso', label: 'Torso', colorDot: 'bg-rose-400' },
  { key: 'arms', label: 'Arms', colorDot: 'bg-amber-400' },
  { key: 'legs', label: 'Legs', colorDot: 'bg-emerald-400' },
  { key: 'hands', label: 'Hands', colorDot: 'bg-orange-400' },
  { key: 'feet', label: 'Feet', colorDot: 'bg-orange-400' },
];

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  constructionMode,
  activeDrawTool,
  activeBodyPart,
  onToggleMode,
  onSelectDrawTool,
  onSelectBodyPart,
  onAddPrimitive,
  onLoadStarterMannequin,
  onClearShapes,
  onResetAuto,
  onRunAutoDetect,
  selectedShape,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDuplicateSelected,
  onDeleteSelected,
  onReorderSelected,
  onUpdateSelectedColor,
  onUpdateSelectedCategory,
  constructionStyle,
  onStyleChange,
  show8HeadGrid,
  showPlumbLine,
  showCrossContours,
  showLineOfAction,
  onToggle8HeadGrid,
  onTogglePlumbLine,
  onToggleCrossContours,
  onToggleLineOfAction,
  visibility,
  onTogglePart,
  onSelectAll,
  onIsolatePart,
  shapesOpacity,
  imageOpacity,
  strokeWidth,
  onShapesOpacityChange,
  onImageOpacityChange,
  onStrokeWidthChange,
  mediaType,
  hasOriginalImage,
  onOpenCrop,
  onNewMedia,
}) => {
  const isAllVisible = Object.values(visibility).every(v => v);

  return (
    <aside className="w-80 h-full bg-studio-850 border-l border-studio-700 flex flex-col z-20 shrink-0 select-none overflow-hidden shadow-2xl">
      {/* 1. Header: Mode Toggle + Undo/Redo */}
      <div className="p-3 border-b border-studio-700/80 bg-studio-900/80 flex items-center justify-between gap-2">
        {/* Mode Segmented Pill */}
        <div className="flex-1 flex items-center bg-studio-950 p-0.5 rounded-lg border border-studio-700 shadow-inner">
          <button
            onClick={() => onToggleMode('auto')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-xs font-medium transition ${
              constructionMode === 'auto'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-studio-400 hover:text-white'
            }`}
            title="Auto Mode: MediaPipe AI automatically detects landmarks"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto</span>
          </button>
          <button
            onClick={() => onToggleMode('manual')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-xs font-semibold transition ${
              constructionMode === 'manual'
                ? 'bg-brand-accent text-studio-950 shadow-sm'
                : 'text-studio-400 hover:text-white'
            }`}
            title="Manual Mode: Draw freeform shapes, boxes, cylinders or presets"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Manual</span>
          </button>
        </div>

        {/* History: Undo / Redo */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-studio-300 hover:text-white hover:bg-studio-700 disabled:opacity-25 disabled:pointer-events-none transition border border-studio-700/60"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-studio-300 hover:text-white hover:bg-studio-700 disabled:opacity-25 disabled:pointer-events-none transition border border-studio-700/60"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Tools Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs scrollbar-thin scrollbar-thumb-studio-700 scrollbar-track-transparent">

        {/* SECTION A: Drawing Tools & Primitives */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-studio-400 uppercase">
              Draw Tools & Primitives
            </span>
            <span className="text-[10px] text-studio-500 font-mono">V, R, C, O, Y, L</span>
          </div>

          {/* 6 Tool Buttons Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onSelectDrawTool('select')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                activeDrawTool === 'select'
                  ? 'bg-brand-500 text-white border-brand-400 shadow-sm font-medium'
                  : 'bg-studio-800/80 text-studio-300 border-studio-700 hover:bg-studio-700 hover:text-white'
              }`}
              title="Select & Transform (V)"
            >
              <MousePointer className="w-4 h-4 mb-1" />
              <span className="text-[10px]">Select</span>
            </button>

            <button
              onClick={() => onSelectDrawTool('rectangle')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                activeDrawTool === 'rectangle'
                  ? 'bg-brand-500 text-white border-brand-400 shadow-sm font-medium'
                  : 'bg-studio-800/80 text-studio-300 border-studio-700 hover:bg-studio-700 hover:text-white'
              }`}
              title="Draw Box / Rectangle (R)"
            >
              <Square className="w-4 h-4 mb-1 text-rose-400" />
              <span className="text-[10px]">Box</span>
            </button>

            <button
              onClick={() => onSelectDrawTool('circle')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                activeDrawTool === 'circle'
                  ? 'bg-brand-500 text-white border-brand-400 shadow-sm font-medium'
                  : 'bg-studio-800/80 text-studio-300 border-studio-700 hover:bg-studio-700 hover:text-white'
              }`}
              title="Draw Circle (C)"
            >
              <Circle className="w-4 h-4 mb-1 text-sky-400" />
              <span className="text-[10px]">Circle</span>
            </button>

            <button
              onClick={() => onSelectDrawTool('oval')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                activeDrawTool === 'oval'
                  ? 'bg-brand-500 text-white border-brand-400 shadow-sm font-medium'
                  : 'bg-studio-800/80 text-studio-300 border-studio-700 hover:bg-studio-700 hover:text-white'
              }`}
              title="Draw Oval (O)"
            >
              <div className="w-3.5 h-2.5 rounded-full border-2 border-rose-400 mb-1" />
              <span className="text-[10px]">Oval</span>
            </button>

            <button
              onClick={() => onSelectDrawTool('cylinder')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                activeDrawTool === 'cylinder'
                  ? 'bg-brand-500 text-white border-brand-400 shadow-sm font-medium'
                  : 'bg-studio-800/80 text-studio-300 border-studio-700 hover:bg-studio-700 hover:text-white'
              }`}
              title="Draw Cylinder (Y)"
            >
              <Cylinder className="w-4 h-4 mb-1 text-amber-400" />
              <span className="text-[10px]">Cylinder</span>
            </button>

            <button
              onClick={() => onSelectDrawTool('line')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                activeDrawTool === 'line'
                  ? 'bg-brand-500 text-white border-brand-400 shadow-sm font-medium'
                  : 'bg-studio-800/80 text-studio-300 border-studio-700 hover:bg-studio-700 hover:text-white'
              }`}
              title="Draw Line of Action (L)"
            >
              <Minus className="w-4 h-4 mb-1 text-rose-500" />
              <span className="text-[10px]">Line</span>
            </button>
          </div>

          {/* Active Target Body Part */}
          <div className="flex items-center justify-between bg-studio-900/60 p-2 rounded-xl border border-studio-700/60">
            <span className="text-[11px] text-studio-400">Target Category:</span>
            <select
              value={activeBodyPart}
              onChange={(e) => onSelectBodyPart(e.target.value as BodyPartCategory)}
              className="bg-studio-950 border border-studio-700 text-studio-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-brand-accent cursor-pointer"
            >
              <option value="face">Face / Head</option>
              <option value="torso">Torso / Ribcage</option>
              <option value="arms">Arms</option>
              <option value="legs">Legs</option>
              <option value="hands">Hands</option>
              <option value="feet">Feet</option>
            </select>
          </div>

          {/* 1-Click Quick Drop Presets */}
          <div className="space-y-1.5 pt-1">
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => onAddPrimitive('box')}
                className="py-1 px-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-200 border border-studio-700/80 text-[11px] font-medium transition text-center"
                title="Quick insert Box"
              >
                +Box
              </button>
              <button
                onClick={() => onAddPrimitive('circle')}
                className="py-1 px-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-200 border border-studio-700/80 text-[11px] font-medium transition text-center"
                title="Quick insert Circle"
              >
                +Circle
              </button>
              <button
                onClick={() => onAddPrimitive('oval')}
                className="py-1 px-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-200 border border-studio-700/80 text-[11px] font-medium transition text-center"
                title="Quick insert Oval"
              >
                +Oval
              </button>
              <button
                onClick={() => onAddPrimitive('cylinder')}
                className="py-1 px-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-200 border border-studio-700/80 text-[11px] font-medium transition text-center"
                title="Quick insert Cylinder"
              >
                +Cylinder
              </button>
            </div>

            <button
              onClick={onLoadStarterMannequin}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 text-brand-accent hover:text-white border border-brand-accent/30 font-medium transition shadow-sm"
              title="Drop complete articulated proportional figure mannequin into canvas"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Drop Starter Mannequin</span>
            </button>
          </div>
        </div>

        {/* SECTION B: Selected Shape Inspector */}
        {selectedShape && (
          <div className="p-3 bg-studio-900/90 rounded-xl border border-brand-accent/40 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-brand-accent truncate max-w-[170px]">
                {selectedShape.name}
              </span>
              <span className="text-[10px] text-studio-400 font-mono">
                {Math.round(selectedShape.width)}×{Math.round(selectedShape.height)}
              </span>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[11px] text-studio-400">Color:</span>
              <div className="flex items-center space-x-1">
                {COLOR_SWATCHES.map((swatch, idx) => (
                  <button
                    key={idx}
                    onClick={() => onUpdateSelectedColor(swatch.stroke, swatch.fill)}
                    style={{ backgroundColor: swatch.stroke }}
                    className={`w-4 h-4 rounded-full border border-black/40 hover:scale-125 transition-transform ${
                      selectedShape.strokeColor === swatch.stroke ? 'ring-2 ring-white scale-110' : ''
                    }`}
                    title={swatch.label}
                  />
                ))}
              </div>
            </div>

            {/* Category Switch */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-studio-400">Part:</span>
              <select
                value={selectedShape.bodyPart}
                onChange={(e) => onUpdateSelectedCategory(e.target.value as BodyPartCategory)}
                className="bg-studio-950 border border-studio-700 text-studio-200 text-xs rounded-lg px-2 py-0.5 focus:outline-none"
              >
                <option value="face">Face</option>
                <option value="torso">Torso</option>
                <option value="arms">Arms</option>
                <option value="legs">Legs</option>
                <option value="hands">Hands</option>
                <option value="feet">Feet</option>
              </select>
            </div>

            {/* Reorder & Action Buttons */}
            <div className="flex items-center justify-between pt-1 border-t border-studio-700/60">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onReorderSelected('forward')}
                  className="p-1 rounded-lg text-studio-300 hover:text-white hover:bg-studio-700 border border-studio-700 transition"
                  title="Bring Forward"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onReorderSelected('backward')}
                  className="p-1 rounded-lg text-studio-300 hover:text-white hover:bg-studio-700 border border-studio-700 transition"
                  title="Send Backward"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onDuplicateSelected}
                  className="flex items-center space-x-1 px-2 py-1 rounded-lg text-studio-300 hover:text-white hover:bg-studio-700 border border-studio-700 transition text-[11px]"
                  title="Duplicate Shape (Ctrl+D)"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>

              <button
                onClick={onDeleteSelected}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition text-[11px]"
                title="Delete selected shape (Del)"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION C: Master Construction Styles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-studio-400 uppercase">
              Master Styles (8 Canons)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {STYLE_PRESETS.map((preset) => {
              const isSelected = constructionStyle === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onStyleChange(preset.id)}
                  className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-brand-500/20 text-brand-accent border-brand-accent/50 shadow-sm'
                      : 'bg-studio-800/60 text-studio-300 border-studio-700/60 hover:bg-studio-700/80 hover:text-white'
                  }`}
                  title={`${preset.author}: ${preset.desc}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-xs text-white">{preset.label}</span>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />}
                  </div>
                  <span className="text-[9px] text-studio-400 truncate mt-0.5">{preset.author}</span>
                </button>
              );
            })}
          </div>

          {/* Mode actions: Run AI Detect or Reset */}
          <div className="pt-1">
            {constructionMode === 'manual' ? (
              <button
                onClick={onRunAutoDetect}
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-accent hover:text-white border border-brand-accent/40 font-semibold transition shadow-sm"
                title="Run AI pose detection on reference image"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run AI Pose Detect</span>
              </button>
            ) : (
              <button
                onClick={onResetAuto}
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-studio-800 hover:bg-studio-700 text-studio-300 hover:text-white border border-studio-700 text-xs font-medium transition"
                title="Reset all shapes to initial AI-detected pose"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset to Auto-Detected</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION D: Classical Guides & Analysis */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold tracking-wider text-studio-400 uppercase">
            Anatomy Overlays & Analysis
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onToggle8HeadGrid(!show8HeadGrid)}
              className={`p-2 rounded-xl border flex items-center space-x-2 transition ${
                show8HeadGrid
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                  : 'bg-studio-800/60 text-studio-300 border-studio-700/60 hover:bg-studio-700 hover:text-white'
              }`}
              title="8-Head Proportion Ruler (Loomis)"
            >
              <Ruler className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs">8-Head Ruler</span>
            </button>

            <button
              onClick={() => onTogglePlumbLine(!showPlumbLine)}
              className={`p-2 rounded-xl border flex items-center space-x-2 transition ${
                showPlumbLine
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-studio-800/60 text-studio-300 border-studio-700/60 hover:bg-studio-700 hover:text-white'
              }`}
              title="Ron Tiner Center of Gravity Plumb Line"
            >
              <Anchor className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs">Plumb Line</span>
            </button>

            <button
              onClick={() => onToggleCrossContours(!showCrossContours)}
              className={`p-2 rounded-xl border flex items-center space-x-2 transition ${
                showCrossContours
                  ? 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                  : 'bg-studio-800/60 text-studio-300 border-studio-700/60 hover:bg-studio-700 hover:text-white'
              }`}
              title="3D Cross-Contour Curves"
            >
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs">Cross-Contours</span>
            </button>

            <button
              onClick={() => onToggleLineOfAction(!showLineOfAction)}
              className={`p-2 rounded-xl border flex items-center space-x-2 transition ${
                showLineOfAction
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                  : 'bg-studio-800/60 text-studio-300 border-studio-700/60 hover:bg-studio-700 hover:text-white'
              }`}
              title="Spine Rhythm & Gesture Line of Action"
            >
              <GitCommit className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs">Action Line</span>
            </button>
          </div>
        </div>

        {/* SECTION E: Display & Opacity Sliders */}
        <div className="space-y-2.5 p-3 bg-studio-900/60 rounded-xl border border-studio-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-studio-400 uppercase">
              Display & Opacity
            </span>
            <SlidersHorizontal className="w-3.5 h-3.5 text-studio-400" />
          </div>

          {/* Shapes Opacity Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-studio-300">
              <span>Shapes Opacity:</span>
              <span className="font-mono text-brand-accent">{Math.round(shapesOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={shapesOpacity}
              onChange={(e) => onShapesOpacityChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-studio-700 rounded-lg appearance-none cursor-pointer accent-brand-accent"
            />
          </div>

          {/* Reference Image Opacity Slider (100% full quality default) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-studio-300">
              <span>Image Opacity:</span>
              <span className="font-mono text-emerald-400">{Math.round(imageOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={imageOpacity}
              onChange={(e) => onImageOpacityChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-studio-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Stroke Width Buttons */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs text-studio-300">
              <span>Stroke Boldness:</span>
              <span className="font-mono">{strokeWidth}px</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[
                { label: 'Norm', width: 3.5 },
                { label: 'Bold', width: 5.0 },
                { label: 'Heavy', width: 7.5 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => onStrokeWidthChange(p.width)}
                  className={`py-1 rounded-lg text-xs font-medium border transition ${
                    Math.abs(strokeWidth - p.width) < 0.2
                      ? 'bg-brand-500 text-white border-brand-400 shadow-sm'
                      : 'bg-studio-800 text-studio-300 border-studio-700 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION F: Body Part Isolation Filters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-studio-400 uppercase">
              Filter Body Parts
            </span>
            <button
              onClick={onSelectAll}
              className={`text-[11px] px-2 py-0.5 rounded-lg border transition ${
                isAllVisible
                  ? 'bg-brand-500 text-white border-brand-400 font-medium'
                  : 'bg-studio-800 text-studio-300 border-studio-700 hover:text-white'
              }`}
            >
              All Visible
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {BODY_PARTS.map((part) => {
              const isVisible = visibility[part.key];
              return (
                <div
                  key={part.key}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition ${
                    isVisible
                      ? 'bg-studio-800 text-white border-studio-700'
                      : 'bg-studio-900/50 text-studio-500 border-studio-800'
                  }`}
                >
                  <button
                    onClick={() => onTogglePart(part.key)}
                    className="flex items-center space-x-1.5 truncate flex-1 text-left"
                    title={`Toggle ${part.label}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${part.colorDot}`} />
                    <span className="text-xs truncate">{part.label}</span>
                  </button>
                  <button
                    onClick={() => onIsolatePart(part.key)}
                    className="text-[10px] text-studio-400 hover:text-brand-accent px-1 transition"
                    title={`Solo / Isolate ${part.label} only`}
                  >
                    Solo
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION G: Media & Canvas Actions */}
        <div className="pt-2 border-t border-studio-700/80 space-y-1.5">
          {mediaType === 'image' && hasOriginalImage && (
            <button
              onClick={onOpenCrop}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-studio-800 hover:bg-studio-700 text-studio-200 hover:text-white border border-studio-700 text-xs font-medium transition shadow-sm"
              title="Crop reference image to focus on specific subject or area"
            >
              <Crop className="w-4 h-4 text-brand-accent" />
              <span>Crop Reference Image</span>
            </button>
          )}

          <button
            onClick={onClearShapes}
            className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-studio-800/40 hover:bg-studio-800 text-studio-400 hover:text-rose-400 border border-studio-700/40 text-xs transition"
            title="Clear all shapes from canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Canvas</span>
          </button>

          <button
            onClick={onNewMedia}
            className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-studio-800 hover:bg-studio-700 text-studio-300 hover:text-white border border-studio-700 text-xs transition"
            title="Upload new image or video reference"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Reference Media</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
