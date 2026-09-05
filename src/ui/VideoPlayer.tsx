import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Camera, Eye } from 'lucide-react';

interface VideoPlayerProps {
  videoElement: HTMLVideoElement | null;
  onConvertCurrentFrame: () => void;
  isContinuousTracking: boolean;
  onToggleContinuousTracking: (enabled: boolean) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoElement,
  onConvertCurrentFrame,
  isContinuousTracking,
  onToggleContinuousTracking,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);

    if (videoElement.duration) {
      setDuration(videoElement.duration);
    }

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [videoElement]);

  const togglePlay = () => {
    if (!videoElement) return;
    if (videoElement.paused) {
      videoElement.play();
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoElement) return;
    const time = parseFloat(e.target.value);
    videoElement.currentTime = time;
    setCurrentTime(time);
    onConvertCurrentFrame();
  };

  const stepFrame = (deltaSeconds: number) => {
    if (!videoElement) return;
    videoElement.pause();
    setIsPlaying(false);
    const newTime = Math.max(0, Math.min(duration, videoElement.currentTime + deltaSeconds));
    videoElement.currentTime = newTime;
    setCurrentTime(newTime);
    onConvertCurrentFrame();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  if (!videoElement) return null;

  return (
    <div className="w-full bg-studio-800 border-t border-studio-700 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 z-20">
      {/* Scrubber & Controls */}
      <div className="flex items-center space-x-2 w-full sm:w-auto flex-1 max-w-xl">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="p-1.5 rounded-lg bg-studio-700 hover:bg-studio-600 text-white transition"
          title={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Step Back (1 frame approx 1/30s) */}
        <button
          onClick={() => stepFrame(-1 / 30)}
          className="p-1.5 rounded-lg bg-studio-700/60 hover:bg-studio-600 text-studio-300 hover:text-white transition"
          title="Previous frame (1/30s)"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        {/* Step Forward (1 frame approx 1/30s) */}
        <button
          onClick={() => stepFrame(1 / 30)}
          className="p-1.5 rounded-lg bg-studio-700/60 hover:bg-studio-600 text-studio-300 hover:text-white transition"
          title="Next frame (1/30s)"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Timeline Slider */}
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.033"
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-studio-600 rounded-lg appearance-none cursor-pointer accent-brand-500"
        />

        {/* Timecode */}
        <span className="text-[11px] font-mono text-studio-400 shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Frame Extraction Actions */}
      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={onConvertCurrentFrame}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white transition shadow-sm"
          title="Convert the current scrubbed video frame into basic construction forms"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Convert Frame</span>
        </button>

        <button
          onClick={() => onToggleContinuousTracking(!isContinuousTracking)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            isContinuousTracking
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-studio-700/50 text-studio-400 border-studio-600 hover:text-studio-200'
          }`}
          title="Continuous video tracking mode (runs pose estimation on every playback frame with EMA jitter smoothing)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Live Tracking</span>
        </button>
      </div>
    </div>
  );
};
