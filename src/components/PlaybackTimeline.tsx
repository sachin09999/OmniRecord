import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { RecordingItem, Neighbors } from '../types/camera';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface PlaybackTimelineProps {
  currentDate: string;
  recordings?: RecordingItem[];
  neighbors?: Neighbors;
  apiBaseUrl?: string;
  onSelectRecording?: (rec: RecordingItem) => void;
  activeRecording?: RecordingItem | null;
  videoElement?: HTMLVideoElement | null;
}

export const PlaybackTimeline: React.FC<PlaybackTimelineProps> = ({
  currentDate,
  recordings = [],
  neighbors,
  onSelectRecording,
  activeRecording,
  videoElement
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1); // 1x to 8x zoom
  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Convert ISO string to seconds from start of day (0 to 86400)
  function getSecondsFromIso(isoStr?: string): number {
    if (!isoStr) return 0;
    try {
      const d = new Date(isoStr);
      return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
    } catch {
      return 0;
    }
  }

  const [currentSeconds, setCurrentSeconds] = useState<number>(
    activeRecording && activeRecording.startTime ? getSecondsFromIso(activeRecording.startTime) : 0
  );

  useEffect(() => {
    if (activeRecording && activeRecording.startTime) {
      setCurrentSeconds(getSecondsFromIso(activeRecording.startTime));
    }
  }, [activeRecording]);

  useEffect(() => {
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      if (activeRecording && activeRecording.startTime) {
        const startSecs = getSecondsFromIso(activeRecording.startTime);
        setCurrentSeconds(startSecs + videoElement.currentTime);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    
    setIsPlaying(!videoElement.paused);
    videoElement.playbackRate = playbackSpeed;

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, [videoElement, activeRecording, playbackSpeed]);

  // Center scroll on current playhead position when zoomScale changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const playheadPct = currentSeconds / 86400;
    const targetScrollLeft = playheadPct * container.scrollWidth - container.clientWidth / 2;
    container.scrollLeft = Math.max(0, targetScrollLeft);
  }, [zoomScale]);

  const handleSeekToSeconds = (newSecs: number) => {
    const clampedSecs = Math.max(0, Math.min(86400, newSecs));
    setCurrentSeconds(clampedSecs);

    if (recordings && recordings.length > 0) {
      const matchingRec = recordings.find((rec) => {
        const startSecs = getSecondsFromIso(rec.startTime);
        const endSecs = rec.endTime ? getSecondsFromIso(rec.endTime) : startSecs + (rec.duration || 60);
        return clampedSecs >= startSecs && clampedSecs <= endSecs;
      });

      if (matchingRec) {
        if (!activeRecording || matchingRec._id !== activeRecording._id) {
          if (onSelectRecording) onSelectRecording(matchingRec);
        } else if (videoElement && activeRecording && activeRecording.startTime) {
          const startSecs = getSecondsFromIso(activeRecording.startTime);
          videoElement.currentTime = Math.max(0, clampedSecs - startSecs);
        }
      }
    } else if (videoElement && activeRecording && activeRecording.startTime) {
      const startSecs = getSecondsFromIso(activeRecording.startTime);
      const relativeTime = clampedSecs - startSecs;
      if (relativeTime >= 0 && relativeTime <= (activeRecording.duration || 3600)) {
        videoElement.currentTime = relativeTime;
      }
    }
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const trackEl = trackRef.current;
    if (!trackEl) return;
    const rect = trackEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newSecs = Math.round(pct * 86400);
    handleSeekToSeconds(newSecs);
  };

  const togglePlay = () => {
    if (!videoElement) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  };

  const handleSeekDelta = (delta: number) => {
    handleSeekToSeconds(currentSeconds + delta);
  };

  const formattedDisplayTime = useMemo(() => {
    const d = new Date(currentDate);
    const ms = d.getTime();
    if (isNaN(ms)) return "00:00:00";
    
    const displayDate = new Date(ms + currentSeconds * 1000);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[displayDate.getUTCMonth()];
    const date = displayDate.getUTCDate();
    const h = String(displayDate.getUTCHours()).padStart(2, '0');
    const m = String(displayDate.getUTCMinutes()).padStart(2, '0');
    const s = String(displayDate.getUTCSeconds()).padStart(2, '0');
    
    return `${month} ${date}, ${h}:${m}:${s}`;
  }, [currentDate, currentSeconds]);

  return (
    <div className="w-full bg-[#121418] text-[#E0E0E0] select-none h-[80px] flex items-center px-4 border-t border-[#242832] font-sans z-40 relative shadow-2xl">
      
      {/* Left Section: Playback Controls */}
      <div className="flex items-center gap-3 shrink-0 pr-4 border-r border-[#242832]">
        <button 
          className="p-1.5 text-gray-400 hover:text-white transition"
          onClick={() => {
            if (onSelectRecording && neighbors?.previous) {
              onSelectRecording(neighbors.previous);
            }
          }}
          title="Previous Clip"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        <button 
          className="p-1.5 text-gray-400 hover:text-white transition relative" 
          onClick={() => handleSeekDelta(-10)}
          title="Back 10 Seconds"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold mt-0.5">10</span>
        </button>

        <button 
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transition transform active:scale-95"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <button 
          className="p-1.5 text-gray-400 hover:text-white transition relative" 
          onClick={() => handleSeekDelta(10)}
          title="Forward 10 Seconds"
        >
          <RotateCw className="w-4 h-4" />
          <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold mt-0.5">10</span>
        </button>

        <button 
          className="p-1.5 text-gray-400 hover:text-white transition"
          onClick={() => {
            if (onSelectRecording && neighbors?.next) {
              onSelectRecording(neighbors.next);
            }
          }}
          title="Next Clip"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* Center Section: Detailed Horizontally Scrollable Timeline Track */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 h-full mx-4 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent relative"
      >
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          style={{ width: `${zoomScale * 100}%` }}
          className="relative h-full min-w-full cursor-pointer flex flex-col justify-center group"
        >
          {/* Main Horizontal Track Line */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-[2px] bg-[#2E3442] z-0"></div>

          {/* Ticks & Labels Layer */}
          <div className="absolute inset-0 flex justify-between pointer-events-none items-end pb-2">
            {Array.from({ length: 25 }).map((_, hr) => {
              const hrStr = String(hr % 24).padStart(2, '0');
              const pct = (hr / 24) * 100;

              return (
                <div
                  key={hr}
                  style={{ left: `${pct}%` }}
                  className="absolute bottom-0 flex flex-col items-center -translate-x-1/2"
                >
                  <span className="text-[10px] text-gray-400 font-mono font-semibold mb-1">
                    {hrStr}:00
                  </span>
                  <div className="w-[1.5px] h-4 bg-gray-500"></div>
                </div>
              );
            })}

            {/* Sub-hour minor ticks when zoomed */}
            {zoomScale >= 2 && Array.from({ length: 96 }).map((_, idx) => {
              if (idx % 4 === 0) return null;
              const pct = (idx / 96) * 100;
              return (
                <div
                  key={`sub-${idx}`}
                  style={{ left: `${pct}%` }}
                  className="absolute bottom-0 flex flex-col items-center -translate-x-1/2"
                >
                  <div className="w-[1px] h-2.5 bg-gray-600/70"></div>
                </div>
              );
            })}
          </div>

          {/* Recording Highlight Bars (High visibility blue) */}
          {recordings.map((rec, idx) => {
            const startSec = getSecondsFromIso(rec.startTime);
            const endSec = rec.endTime ? getSecondsFromIso(rec.endTime) : startSec + (rec.duration || 60);
            const leftPct = (startSec / 86400) * 100;
            const widthPct = Math.max(0.4, ((endSec - startSec) / 86400) * 100);
            const isActive = activeRecording && activeRecording._id === rec._id;

            return (
              <div
                key={rec._id || idx}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                className={`absolute top-1/2 -translate-y-1/2 h-3.5 rounded-sm transition ${
                  isActive
                    ? 'bg-indigo-500 border border-indigo-300 shadow-md shadow-indigo-500/50 z-20'
                    : 'bg-indigo-600/60 border border-indigo-400/40 hover:bg-indigo-500/90 z-10'
                }`}
                title={`Clip: ${new Date(rec.startTime || 0).toLocaleTimeString()}`}
              />
            );
          })}

          {/* Red Playhead Line & Glowing Handle */}
          <div 
            className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
            style={{ left: `${(currentSeconds / 86400) * 100}%` }}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,1)] border-2 border-white -mt-1"></div>
            <div className="w-0.5 h-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>
          </div>
        </div>
      </div>

      {/* Right Section: Time Readout & Zoom Controls */}
      <div className="flex items-center gap-4 shrink-0 pl-4 border-l border-[#242832]">
        {/* Live Monospace Timestamp Display */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Playhead Time</span>
          <span className="font-mono text-xs font-bold text-white tracking-wide">
            {formattedDisplayTime}
          </span>
        </div>

        {/* Zoom Scale Buttons */}
        <div className="flex items-center bg-[#1D212A] border border-[#2A2F3D] rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setZoomScale(Math.max(1, zoomScale - 1))}
            disabled={zoomScale <= 1}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition"
            title="Zoom Out Timeline"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 font-mono text-[11px] font-bold text-indigo-400">
            {zoomScale}x
          </span>

          <button
            onClick={() => setZoomScale(Math.min(8, zoomScale + 1))}
            disabled={zoomScale >= 8}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition"
            title="Zoom In Timeline"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoomScale(1)}
            className="p-1 text-gray-400 hover:text-white transition ml-0.5 border-l border-[#2A2F3D]"
            title="Fit Full Day (1x)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
