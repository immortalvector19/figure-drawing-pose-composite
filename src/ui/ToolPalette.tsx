import React from 'react';
import {
  MousePointer,
  Circle,
  Square,
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
} from 'lucide-react';
import {
  PrimitiveType,
  ConstructionPrimitive,
  DrawToolType,
  ConstructionMode,
  BodyPartCategory,
} from '../types/shapes';
import { Proportions } from '../geometry/proportions';

export interface ToolPaletteProps {
  constructionMode: ConstructionMode;
  activeDrawTool: DrawToolType;
  activeBodyPart: BodyPartCategory;
  selectedShape: ConstructionPrimitive | null;
  canUndo: boolean;
  canRedo: boolean;
  onSelectDrawTool: (tool: DrawToolType) => void;
  onSelectBodyPart: (part: BodyPartCategory) => void;
  onAddPrimitive: (type: PrimitiveType) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected?: () => void;
  onReorderSelected?: (direction: 'forward' | 'backward') => void;
  onClearShapes?: () => void;
  onLoadStarterMannequin?: () => void;
  onResetAuto: () => void;
  onRunAutoDetect?: () => void;
  onUpdateSelectedColor?: (strokeColor: string, fillColor: string) => void;
  onUpdateSelectedCategory?: (part: BodyPartCategory) => void;
  onUndo: () => void;
  onRedo: () => void;
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

export const ToolPalette: React.FC<ToolPaletteProps> = ({
  constructionMode,
  activeDrawTool,
  activeBodyPart,
  selectedShape,
  canUndo,
  canRedo,
  onSelectDrawTool,
  onSelectBodyPart,
  onAddPrimitive,
  onDeleteSelected,
  onDuplicateSelected,
  onReorderSelected,
  onClearShapes,
  onLoadStarterMannequin,
  onResetAuto,
  onRunAutoDetect,
  onUpdateSelectedColor,
  onUpdateSelectedCategory,
  onUndo,
  onRedo,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-studio-800/90 rounded-xl border border-studio-700 select-none shadow-sm text-xs">
      {/* 1. Freeform Drawing Tools */}
      <div className="flex items-center bg-studio-900/60 p-0.5 rounded-lg border border-studio-700/60">
        <button
          onClick={() => onSelectDrawTool('select')}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md transition ${
            activeDrawTool === 'select'
              ? 'bg-brand-500 text-white font-medium shadow-sm'
              : 'text-studio-300 hover:text-white hover:bg-studio-700/50'
          }`}
          title="Select & Transform (V) - Click shape to drag, scale or rotate"
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Select</span>
        </button>

        <button
          onClick={() => onSelectDrawTool('rectangle')}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md transition ${
            activeDrawTool === 'rectangle'
              ? 'bg-brand-500 text-white font-medium shadow-sm'
              : 'text-studio-300 hover:text-white hover:bg-studio-700/50'
          }`}
          title="Draw Box / Rectangle (R) - Click & drag on canvas"
        >
          <Square className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden xl:inline">Box</span>
        </button>

        <button
          onClick={() => onSelectDrawTool('circle')}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md transition ${
            activeDrawTool === 'circle'
              ? 'bg-brand-500 text-white font-medium shadow-sm'
              : 'text-studio-300 hover:text-white hover:bg-studio-700/50'
          }`}
          title="Draw Circle / Sphere (C) - Click & drag on canvas"
        >
          <Circle className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden xl:inline">Circle</span>
        </button>

        <button
          onClick={() => onSelectDrawTool('oval')}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md transition ${
            activeDrawTool === 'oval'
              ? 'bg-brand-500 text-white font-medium shadow-sm'
              : 'text-studio-300 hover:text-white hover:bg-studio-700/50'
          }`}
          title="Draw Oval / Ellipse (O) - Click & drag on canvas"
        >
          <div className="w-3 h-2 rounded-full border border-rose-400" />
          <span className="hidden xl:inline">Oval</span>
        </button>

        <button
          onClick={() => onSelectDrawTool('cylinder')}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md transition ${
            activeDrawTool === 'cylinder'
              ? 'bg-brand-500 text-white font-medium shadow-sm'
              : 'text-studio-300 hover:text-white hover:bg-studio-700/50'
          }`}
          title="Draw Cylinder / Capsule (Y) - Click & drag on canvas"
        >
          <Cylinder className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline">Cylinder</span>
        </button>

        <button
          onClick={() => onSelectDrawTool('line')}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md transition ${
            activeDrawTool === 'line'
              ? 'bg-brand-500 text-white font-medium shadow-sm'
              : 'text-studio-300 hover:text-white hover:bg-studio-700/50'
          }`}
          title="Draw Line of Action (L) - Click & drag spine or gesture axis"
        >
          <Minus className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden xl:inline">Line</span>
        </button>
      </div>

      {/* 2. Target Body Part Selector (determines color & category for new shapes) */}
      <div className="hidden sm:flex items-center space-x-1 pl-1">
        <span className="text-[10px] text-studio-400 font-mono">Part:</span>
        <select
          value={activeBodyPart}
          onChange={(e) => onSelectBodyPart(e.target.value as BodyPartCategory)}
          className="bg-studio-900 border border-studio-700 text-studio-200 text-xs rounded-md px-1.5 py-1 focus:outline-none focus:border-brand-accent cursor-pointer"
          title="Active body category for newly drawn shapes"
        >
          <option value="face">Face / Head</option>
          <option value="torso">Torso / Ribcage</option>
          <option value="arms">Arms</option>
          <option value="legs">Legs</option>
          <option value="hands">Hands</option>
          <option value="feet">Feet</option>
        </select>
      </div>

      <div className="h-4 w-[1px] bg-studio-700 mx-0.5" />

      {/* 3. Quick Presets (1-click center drop) */}
      <div className="flex items-center space-x-1">
        <span className="text-[10px] text-studio-400 px-1 hidden md:inline">Preset:</span>
        <button
          onClick={() => onAddPrimitive('circle')}
          className="px-2 py-1 rounded-md bg-studio-700/50 hover:bg-studio-700 text-studio-200 border border-studio-600/40 hover:text-white transition"
          title="Insert default Circle primitive"
        >
          +Circle
        </button>
        <button
          onClick={() => onAddPrimitive('oval')}
          className="px-2 py-1 rounded-md bg-studio-700/50 hover:bg-studio-700 text-studio-200 border border-studio-600/40 hover:text-white transition"
          title="Insert default Oval primitive"
        >
          +Oval
        </button>
        <button
          onClick={() => onAddPrimitive('box')}
          className="px-2 py-1 rounded-md bg-studio-700/50 hover:bg-studio-700 text-studio-200 border border-studio-600/40 hover:text-white transition"
          title="Insert default Box primitive"
        >
          +Box
        </button>
        <button
          onClick={() => onAddPrimitive('cylinder')}
          className="px-2 py-1 rounded-md bg-studio-700/50 hover:bg-studio-700 text-studio-200 border border-studio-600/40 hover:text-white transition"
          title="Insert default Cylinder primitive"
        >
          +Cylinder
        </button>

        {onLoadStarterMannequin && (
          <button
            onClick={onLoadStarterMannequin}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-brand-500/15 hover:bg-brand-500/25 text-brand-accent hover:text-white border border-brand-accent/30 transition font-medium"
            title="Drop full starter mannequin into the canvas to pose & adjust manually"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden lg:inline">Starter Mannequin</span>
            <span className="lg:hidden">Mannequin</span>
          </button>
        )}
      </div>

      <div className="h-4 w-[1px] bg-studio-700 mx-0.5" />

      {/* 4. Edit Actions: Duplicate, Delete, Layer Reorder, Undo, Redo */}
      <div className="flex items-center space-x-1">
        {onDuplicateSelected && (
          <button
            onClick={onDuplicateSelected}
            disabled={!selectedShape}
            className="p-1.5 rounded-md text-studio-300 hover:text-white hover:bg-studio-700/70 disabled:opacity-30 disabled:pointer-events-none transition border border-transparent hover:border-studio-600"
            title="Duplicate selected shape (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}

        {onReorderSelected && selectedShape && (
          <>
            <button
              onClick={() => onReorderSelected('forward')}
              className="p-1.5 rounded-md text-studio-300 hover:text-white hover:bg-studio-700/70 transition border border-transparent hover:border-studio-600"
              title="Bring shape forward"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onReorderSelected('backward')}
              className="p-1.5 rounded-md text-studio-300 hover:text-white hover:bg-studio-700/70 transition border border-transparent hover:border-studio-600"
              title="Send shape backward"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        <button
          onClick={onDeleteSelected}
          disabled={!selectedShape}
          className="flex items-center space-x-1 px-2 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 disabled:opacity-25 disabled:pointer-events-none transition"
          title="Delete selected shape (Delete / Backspace)"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Del</span>
        </button>

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-md text-studio-300 hover:text-white hover:bg-studio-700/70 disabled:opacity-25 disabled:pointer-events-none transition"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-md text-studio-300 hover:text-white hover:bg-studio-700/70 disabled:opacity-25 disabled:pointer-events-none transition"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-4 w-[1px] bg-studio-700 mx-0.5" />

      {/* 5. Mode Specific Actions: Clear All / Reset to Auto / Run AI Detect */}
      <div className="flex items-center space-x-1">
        {constructionMode === 'manual' ? (
          <>
            {onClearShapes && (
              <button
                onClick={onClearShapes}
                className="flex items-center space-x-1 px-2 py-1 rounded-md bg-studio-700/40 hover:bg-studio-700 text-studio-300 hover:text-rose-300 border border-studio-600/40 transition"
                title="Clear all shapes from canvas"
              >
                <span>Clear All</span>
              </button>
            )}
            {onRunAutoDetect && (
              <button
                onClick={onRunAutoDetect}
                className="flex items-center space-x-1 px-2 py-1 rounded-md bg-brand-500/20 hover:bg-brand-500/30 text-brand-accent hover:text-white border border-brand-accent/40 transition font-medium"
                title="Run AI Pose detection on the reference image to overlay construction forms"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run AI Detect</span>
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onResetAuto}
            className="flex items-center space-x-1 px-2 py-1 rounded-md bg-studio-700/50 hover:bg-studio-700 text-studio-300 hover:text-white border border-studio-600/40 transition"
            title="Reset all shapes to initial AI-detected pose"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset to Auto</span>
          </button>
        )}
      </div>

      {/* 6. Selected Shape Inspector (Swatches & Re-categorization) */}
      {selectedShape && (
        <div className="ml-auto flex items-center space-x-2 pl-2 bg-studio-900/80 px-2 py-0.5 rounded-lg border border-studio-700">
          <span className="text-[11px] text-brand-accent font-mono truncate max-w-[120px]">
            {selectedShape.name}
          </span>

          {/* Color swatches */}
          {onUpdateSelectedColor && (
            <div className="flex items-center space-x-1">
              {COLOR_SWATCHES.map((swatch, idx) => (
                <button
                  key={idx}
                  onClick={() => onUpdateSelectedColor(swatch.stroke, swatch.fill)}
                  style={{ backgroundColor: swatch.stroke }}
                  className="w-3.5 h-3.5 rounded-full border border-black/30 hover:scale-125 transition-transform"
                  title={swatch.label}
                />
              ))}
            </div>
          )}

          {/* Quick BodyPart re-assignment */}
          {onUpdateSelectedCategory && (
            <select
              value={selectedShape.bodyPart}
              onChange={(e) => onUpdateSelectedCategory(e.target.value as BodyPartCategory)}
              className="bg-studio-950 border border-studio-700 text-studio-300 text-[10px] rounded px-1 py-0.5 focus:outline-none"
              title="Change body part classification"
            >
              <option value="face">Face</option>
              <option value="torso">Torso</option>
              <option value="arms">Arms</option>
              <option value="legs">Legs</option>
              <option value="hands">Hands</option>
              <option value="feet">Feet</option>
            </select>
          )}
        </div>
      )}
    </div>
  );
};
