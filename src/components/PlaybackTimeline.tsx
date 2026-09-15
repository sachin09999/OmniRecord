import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  const [zoomScale, setZoomScale] = useState<number>(1); // 1x to 8x zoom
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoveredSeconds, setHoveredSeconds] = useState<number | null>(null);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Convert ISO string to seconds from start of day (0 to 86400)
  const getSecondsFromIso = useCallback((isoStr?: string): number => {
    if (!isoStr) return 0;
    try {
      const d = new Date(isoStr);
      return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
    } catch {
      return 0;
    }
  }, []);

  const [currentSeconds, setCurrentSeconds] = useState<number>(
    activeRecording && activeRecording.startTime ? getSecondsFromIso(activeRecording.startTime) : 0
  );

  const currentSecondsRef = useRef<number>(currentSeconds);
  useEffect(() => {
    currentSecondsRef.current = currentSeconds;
  }, [currentSeconds]);

  useEffect(() => {
    if (activeRecording && activeRecording.startTime && !isDragging) {
      setCurrentSeconds(getSecondsFromIso(activeRecording.startTime));
    }
  }, [activeRecording, getSecondsFromIso, isDragging]);

  // Sync video time updates when NOT dragging
  useEffect(() => {
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      if (!isDragging && activeRecording && activeRecording.startTime) {
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

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, [videoElement, activeRecording, getSecondsFromIso, isDragging]);

  // Center scroll container viewport on current playhead position when zoomed in or when playhead moves
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || zoomScale <= 1) return;
    const playheadPct = currentSeconds / 86400;
    const targetScrollLeft = playheadPct * container.scrollWidth - container.clientWidth / 2;
    container.scrollLeft = Math.max(0, targetScrollLeft);
  }, [currentSeconds, zoomScale]);

  const seekToSeconds = useCallback((newSecs: number) => {
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
  }, [recordings, activeRecording, videoElement, onSelectRecording, getSecondsFromIso]);

  // Smooth Mouse Wheel Scrubbing & Pinch Zooming
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Ctrl + Wheel = Smooth Zoom In / Zoom Out
      if (e.ctrlKey || e.metaKey) {
        setZoomScale((prev) => {
          if (e.deltaY < 0) return Math.min(8, prev + 1);
          if (e.deltaY > 0) return Math.max(1, prev - 1);
          return prev;
        });
        return;
      }

      // Standard Mouse Wheel = Smooth Timeline Time Scrubbing
      const rawDelta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (rawDelta === 0) return;

      // Scale time step dynamically according to zoom scale for butter-smooth timing
      const scaleFactor = Math.max(1, 10 / Math.sqrt(zoomScale));
      const direction = rawDelta > 0 ? 1 : -1;
      const stepSecs = Math.max(1, Math.round(Math.abs(rawDelta) * 0.08 * scaleFactor));
      const targetSecs = Math.max(0, Math.min(86400, currentSecondsRef.current + direction * stepSecs));

      seekToSeconds(targetSecs);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [seekToSeconds, zoomScale]);

  // Calculate timeline position from pointer event
  const getSecondsFromPointer = (e: React.PointerEvent<HTMLDivElement>): number => {
    const trackEl = trackRef.current;
    if (!trackEl) return 0;
    const rect = trackEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    return Math.round(pct * 86400);
  };

  // Pointer Scrubbing Handlers for butter-smooth drag
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    const secs = getSecondsFromPointer(e);
    seekToSeconds(secs);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const secs = getSecondsFromPointer(e);
    setHoveredSeconds(secs);

    if (isDragging) {
      seekToSeconds(secs);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture release safeguard
      }
      setIsDragging(false);
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoveredSeconds(null);
    }
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
    seekToSeconds(currentSeconds + delta);
  };

  // Format seconds to HH:MM:SS string
  const formatTimeStr = (totalSecs: number): string => {
    const h = String(Math.floor(totalSecs / 3600) % 24).padStart(2, '0');
    const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(totalSecs % 60)).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formattedDisplayTime = useMemo(() => {
    const d = new Date(currentDate);
    const ms = d.getTime();
    if (isNaN(ms)) return "00:00:00";
    
    const displayDate = new Date(ms + currentSeconds * 1000);
    const h = String(displayDate.getUTCHours()).padStart(2, '0');
    const m = String(displayDate.getUTCMinutes()).padStart(2, '0');
    const s = String(displayDate.getUTCSeconds()).padStart(2, '0');
    
    return `${h}:${m}:${s}`;
  }, [currentDate, currentSeconds]);

  // Pre-calculate recording blocks for rendering efficiency
  const recordingBlocks = useMemo(() => {
    return recordings.map((rec, idx) => {
      const startSec = getSecondsFromIso(rec.startTime);
      const endSec = rec.endTime ? getSecondsFromIso(rec.endTime) : startSec + (rec.duration || 60);
      const leftPct = (startSec / 86400) * 100;
      const widthPct = Math.max(0.2, ((endSec - startSec) / 86400) * 100);
      const isActive = activeRecording && activeRecording._id === rec._id;

      return {
        id: rec._id || idx,
        leftPct,
        widthPct,
        isActive
      };
    });
  }, [recordings, activeRecording, getSecondsFromIso]);

  // Pre-calculate ruler tick positions
  const rulerTicks = useMemo(() => {
    return Array.from({ length: 25 }).map((_, hr) => {
      const hrStr = String(hr % 24).padStart(2, '0');
      const pct = (hr / 24) * 100;
      return { hr, hrStr, pct };
    });
  }, []);

  return (
    <div className="w-full bg-[#0E1017] text-[#E0E6ED] select-none h-[96px] flex items-center px-4 border-t border-[#222736] font-sans z-40 relative shadow-2xl backdrop-blur-lg">
      
      {/* Left Section: Sleek Media Controls */}
      <div className="flex items-center gap-3 shrink-0 pr-5 border-r border-[#222736]">
        <button 
          className="p-2 text-gray-400 hover:text-white hover:bg-[#1E2332] rounded-lg transition"
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
          className="p-2 text-gray-400 hover:text-white hover:bg-[#1E2332] rounded-lg transition relative" 
          onClick={() => handleSeekDelta(-10)}
          title="Back 10 Seconds"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="absolute inset-0 flex items-center justify-center text-[7px] font-extrabold mt-0.5">10</span>
        </button>

        <button 
          onClick={togglePlay}
          className="w-11 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transition transform active:scale-95"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <button 
          className="p-2 text-gray-400 hover:text-white hover:bg-[#1E2332] rounded-lg transition relative" 
          onClick={() => handleSeekDelta(10)}
          title="Forward 10 Seconds"
        >
          <RotateCw className="w-4 h-4" />
          <span className="absolute inset-0 flex items-center justify-center text-[7px] font-extrabold mt-0.5">10</span>
        </button>

        <button 
          className="p-2 text-gray-400 hover:text-white hover:bg-[#1E2332] rounded-lg transition"
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

      {/* Center Section: Butter-Smooth Horizontally Scrollable & Mouse-Wheel Scrubbable Timeline Track */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 h-full mx-5 overflow-x-auto overflow-y-hidden scrollbar-none relative"
      >
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          style={{ width: `${zoomScale * 100}%` }}
          className="relative h-full min-w-full cursor-pointer flex flex-col justify-center group touch-none"
        >
          {/* Main Track Background Bar (Thick 28px Channel) */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-7 bg-[#161922] border border-[#262C3D] rounded-xl overflow-hidden shadow-inner flex items-center">
            {/* Recording Segments (Glowing Gradient Blocks) */}
            {recordingBlocks.map((block) => (
              <div
                key={block.id}
                style={{ left: `${block.leftPct}%`, width: `${block.widthPct}%` }}
                className={`absolute h-full rounded-md transition-all ${
                  block.isActive
                    ? 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-400 border-x border-cyan-300 shadow-md shadow-cyan-500/50 z-10'
                    : 'bg-gradient-to-r from-indigo-700/80 to-indigo-600/80 border-x border-indigo-400/30 hover:from-indigo-600 hover:to-indigo-500 z-0'
                }`}
              />
            ))}
          </div>

          {/* Hourly Ruler Markings Layer */}
          <div className="absolute inset-0 flex justify-between pointer-events-none items-end pb-1.5">
            {rulerTicks.map((tick) => (
              <div
                key={tick.hr}
                style={{ left: `${tick.pct}%` }}
                className="absolute bottom-0 flex flex-col items-center -translate-x-1/2"
              >
                <span className="text-[10px] text-gray-500 font-mono font-semibold mb-0.5">
                  {tick.hrStr}:00
                </span>
                <div className="w-[1.5px] h-3 bg-[#333A4D]"></div>
              </div>
            ))}

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
                  <div className="w-[1px] h-2 bg-[#262C3D]"></div>
                </div>
              );
            })}
          </div>

          {/* Hover Preview Line & Timestamp Badge */}
          {hoveredSeconds !== null && !isDragging && (
            <div 
              className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
              style={{ left: `${(hoveredSeconds / 86400) * 100}%` }}
            >
              <div className="bg-[#1F2433] text-gray-200 border border-gray-600 text-[10px] font-mono px-2 py-0.5 rounded shadow-md mb-1 -mt-1 font-bold whitespace-nowrap">
                {formatTimeStr(hoveredSeconds)}
              </div>
              <div className="w-[1px] h-full bg-white/40 border-l border-dashed border-white/60"></div>
            </div>
          )}

          {/* Glowing Red Playhead Line & Scrub Handle */}
          <div 
            className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center transition-all duration-75"
            style={{ left: `${(currentSeconds / 86400) * 100}%` }}
          >
            {/* Live Playhead Floating Time Badge */}
            <div className="bg-red-600 text-white text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full shadow-lg shadow-red-600/50 mb-1 -mt-2.5 tracking-wider border border-red-400">
              {formatTimeStr(currentSeconds)}
            </div>

            {/* Playhead Scrub Needle */}
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(239,68,68,1)] -mt-1"></div>
            <div className="w-[2.5px] h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"></div>
          </div>
        </div>
      </div>

      {/* Right Section: Time Display & Zoom Controls */}
      <div className="flex items-center gap-4 shrink-0 pl-5 border-l border-[#222736]">
        {/* Monospace Timestamp Badge */}
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold">Playback Time</span>
          <span className="font-mono text-sm font-extrabold text-white tracking-wider bg-[#161922] px-3 py-1 rounded-lg border border-[#262C3D] shadow-sm">
            {formattedDisplayTime}
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-[#161922] border border-[#262C3D] rounded-xl p-1 text-xs">
          <button
            onClick={() => setZoomScale(Math.max(1, zoomScale - 1))}
            disabled={zoomScale <= 1}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition rounded-lg"
            title="Zoom Out Timeline"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="px-2.5 font-mono text-xs font-extrabold text-indigo-400">
            {zoomScale}x
          </span>

          <button
            onClick={() => setZoomScale(Math.min(8, zoomScale + 1))}
            disabled={zoomScale >= 8}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition rounded-lg"
            title="Zoom In Timeline"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoomScale(1)}
            className="p-1.5 text-gray-400 hover:text-white transition ml-1 border-l border-[#262C3D] rounded-lg"
            title="Fit Full Day (1x)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
