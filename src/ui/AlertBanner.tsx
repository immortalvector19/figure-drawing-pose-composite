import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { QualityAlert } from '../ml/heuristics';

interface AlertBannerProps {
  alerts: QualityAlert[];
  onDismiss: (index: number) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-2xl mx-auto px-4 my-2 z-20">
      {alerts.map((alert, idx) => {
        const isWarning = alert.type === 'warning';

        return (
          <div
            key={idx}
            className={`flex items-start justify-between p-2.5 rounded-lg border text-xs shadow-md transition-all ${
              isWarning
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-200'
            }`}
          >
            <div className="flex items-start space-x-2">
              {isWarning ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="font-semibold block">{alert.title}</strong>
                <p className="text-[11px] opacity-90">{alert.message}</p>
              </div>
            </div>

            <button
              onClick={() => onDismiss(idx)}
              className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition shrink-0 ml-2"
              title="Dismiss warning"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
