import React from 'react';
import { BodyPartCategory, BodyPartVisibilityMap } from '../types/shapes';
import { Check, Layers, User, Crosshair } from 'lucide-react';

interface BodyPartToggleProps {
  visibility: BodyPartVisibilityMap;
  onTogglePart: (part: BodyPartCategory) => void;
  onSelectAll: () => void;
  onIsolatePart: (part: BodyPartCategory) => void;
}

interface PartConfig {
  key: BodyPartCategory;
  label: string;
  colorDot: string;
}

const PARTS: PartConfig[] = [
  { key: 'face', label: 'Face / Head', colorDot: 'bg-loomis-head' },
  { key: 'torso', label: 'Torso', colorDot: 'bg-loomis-ribcage' },
  { key: 'arms', label: 'Arms', colorDot: 'bg-loomis-arms' },
  { key: 'legs', label: 'Legs', colorDot: 'bg-loomis-legs' },
  { key: 'hands', label: 'Hands', colorDot: 'bg-loomis-extremity' },
  { key: 'feet', label: 'Feet', colorDot: 'bg-loomis-extremity' },
];

export const BodyPartToggle: React.FC<BodyPartToggleProps> = ({
  visibility,
  onTogglePart,
  onSelectAll,
  onIsolatePart,
}) => {
  const isAllSelected = Object.values(visibility).every(v => v);

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-studio-800/80 rounded-xl border border-studio-700/70 select-none shadow-sm">
      <span className="text-[11px] font-medium text-studio-400 px-2 flex items-center space-x-1">
        <Layers className="w-3.5 h-3.5 text-studio-400" />
        <span>Parts:</span>
      </span>

      {/* Whole Figure (All) */}
      <button
        onClick={onSelectAll}
        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
          isAllSelected
            ? 'bg-brand-600 text-white shadow-sm'
            : 'bg-studio-700/60 text-studio-300 hover:text-white hover:bg-studio-700'
        }`}
        title="Show entire figure"
      >
        <User className="w-3 h-3" />
        <span>Full Figure</span>
      </button>

      {/* Individual Part Chips with Multi-Select and Isolate buttons */}
      {PARTS.map(part => {
        const isSelected = visibility[part.key];

        return (
          <div
            key={part.key}
            className={`flex items-center rounded-lg border text-xs font-medium transition overflow-hidden ${
              isSelected
                ? 'bg-studio-700 border-studio-600 text-white'
                : 'bg-studio-800/40 border-studio-700/50 text-studio-500 hover:text-studio-300'
            }`}
          >
            {/* Toggle checkbox click */}
            <button
              onClick={() => onTogglePart(part.key)}
              className="flex items-center space-x-1.5 px-2 py-1 hover:bg-studio-600/40 transition"
              title={`Toggle ${part.label} visibility (multi-select)`}
            >
              <span className={`w-2 h-2 rounded-full ${part.colorDot}`} />
              <span>{part.label}</span>
              {isSelected && <Check className="w-3 h-3 text-brand-accent ml-0.5" />}
            </button>

            {/* Solo / Isolate button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIsolatePart(part.key);
              }}
              className="px-1.5 py-1 text-studio-400 hover:text-white hover:bg-studio-600 border-l border-studio-600/50 transition"
              title={`Solo / isolate ${part.label} only`}
            >
              <Crosshair className="w-2.5 h-2.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
