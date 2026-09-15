import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { RecordingItem, Neighbors } from '../types/camera';
import { resolveRecordingThumbnailUrl } from '../services/apiService';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Gauge,
  Scissors,
  Download,
  X,
  Check
} from 'lucide-react';

interface PlaybackTimelineProps {
  currentDate: string;
  recordings?: RecordingItem[];
  neighbors?: Neighbors;
  apiBaseUrl?: string;
  authToken?: string;
  onSelectRecording?: (rec: RecordingItem) => void;
  activeRecording?: RecordingItem | null;
  videoElement?: HTMLVideoElement | null;
}

export const PlaybackTimeline: React.FC<PlaybackTimelineProps> = ({
  currentDate,
  recordings = [],
  neighbors,
  apiBaseUrl = 'http://10.10.12.50:3000',
  authToken = '',
  onSelectRecording,
  activeRecording,
  videoElement
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [zoomScale, setZoomScale] = useState<number>(1); // 1x to 8x zoom
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoveredSeconds, setHoveredSeconds] = useState<number | null>(null);

  // Playback Speed Adjustment State
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);

  // Frame Cut & Download State
  const [cutStartSeconds, setCutStartSeconds] = useState<number | null>(null);
  const [cutEndSeconds, setCutEndSeconds] = useState<number | null>(null);
  const [isCutMode, setIsCutMode] = useState<boolean>(false);
  const [isExportingCut, setIsExportingCut] = useState<boolean>(false);

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

  // Sync playback speed with video HTML element
  useEffect(() => {
    if (videoElement) {
      videoElement.playbackRate = playbackSpeed;
    }
  }, [videoElement, playbackSpeed]);

  // Frame Cut & MP4 Download trigger handler
  const handleDownloadCutMp4 = () => {
    let mediaUrl = activeRecording?.videoUrl || (activeRecording?.videoPath ? `${apiBaseUrl}/${activeRecording.videoPath}` : undefined);
    if (!mediaUrl && videoElement?.src) {
      mediaUrl = videoElement.src;
    }

    const startSec = cutStartSeconds !== null ? cutStartSeconds : currentSeconds;
    const endSec = cutEndSeconds !== null ? cutEndSeconds : Math.min(86400, startSec + 60);

    const startStr = formatTimeStr(startSec).replace(/:/g, '-');
    const endStr = formatTimeStr(endSec).replace(/:/g, '-');
    const filename = `OmniRecord_Cut_${startStr}_to_${endStr}.mp4`;

    setIsExportingCut(true);

    if (mediaUrl) {
      // Trigger instant direct download of `.mp4` video format
      const a = document.createElement('a');
      a.href = mediaUrl;
      a.download = filename;
      a.target = '_blank';
      a.click();
      setTimeout(() => setIsExportingCut(false), 1500);
    } else {
      setTimeout(() => setIsExportingCut(false), 1000);
    }
  };

  // Center scroll container viewport on current playhead position when zoomed in
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
        // Pointer capture safeguard
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

  const hoveredClip = useMemo(() => {
    if (hoveredSeconds === null || !recordings || recordings.length === 0) return null;
    return recordings.find((rec) => {
      const startSecs = getSecondsFromIso(rec.startTime);
      const endSecs = rec.endTime ? getSecondsFromIso(rec.endTime) : startSecs + (rec.duration || 60);
      return hoveredSeconds >= startSecs && hoveredSeconds <= endSecs;
    });
  }, [hoveredSeconds, recordings, getSecondsFromIso]);

  const hoveredThumbUrl = useMemo(() => {
    if (!hoveredClip) return null;
    return resolveRecordingThumbnailUrl(apiBaseUrl, hoveredClip, authToken);
  }, [hoveredClip, apiBaseUrl, authToken]);

  // Major 2-hour interval ruler ticks for maximum readability
  const rulerTicks = useMemo(() => {
    return Array.from({ length: 25 }).map((_, hr) => {
      const hrStr = String(hr % 24).padStart(2, '0');
      const pct = (hr / 24) * 100;
      const showLabel = hr % 2 === 0 || zoomScale >= 2;
      return { hr, hrStr, pct, showLabel };
    });
  }, [zoomScale]);

  return (
    <div className="w-full bg-[#0B0D12] text-[#E0E6ED] select-none h-[88px] flex items-center px-4 border-t border-[#1F2432] font-sans z-40 relative shadow-2xl backdrop-blur-xl">
      
      {/* Left Section: Sleek Media Controls */}
      <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-[#1F2432]">
        <button 
          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1A1E2B] rounded-lg transition"
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
          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1A1E2B] rounded-lg transition relative" 
          onClick={() => handleSeekDelta(-10)}
          title="Back 10 Seconds"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="absolute inset-0 flex items-center justify-center text-[7px] font-extrabold mt-0.5">10</span>
        </button>

        <button 
          onClick={togglePlay}
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transition transform active:scale-95"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <button 
          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1A1E2B] rounded-lg transition relative" 
          onClick={() => handleSeekDelta(10)}
          title="Forward 10 Seconds"
        >
          <RotateCw className="w-4 h-4" />
          <span className="absolute inset-0 flex items-center justify-center text-[7px] font-extrabold mt-0.5">10</span>
        </button>

        <button 
          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1A1E2B] rounded-lg transition"
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

      {/* Center Section: Beautiful Structured Timeline Track */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 h-full mx-4 overflow-x-auto overflow-y-visible scrollbar-none relative"
      >
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          style={{ width: `${zoomScale * 100}%` }}
          className="relative h-full min-w-full cursor-pointer flex flex-col justify-between py-2.5 group touch-none"
        >
          {/* Top Layer: Ruler Hour Labels */}
          <div className="w-full h-4 relative pointer-events-none">
            {rulerTicks.map((tick) => (
              <div
                key={tick.hr}
                style={{ left: `${tick.pct}%` }}
                className="absolute top-0 flex flex-col items-center -translate-x-1/2"
              >
                {tick.showLabel && (
                  <span className="text-[10px] text-gray-400 font-mono font-semibold">
                    {tick.hrStr}:00
                  </span>
                )}
                <div className="w-[1px] h-1.5 bg-[#2E364A] mt-0.5"></div>
              </div>
            ))}
          </div>

          {/* Middle Layer: Recording Track Channel Bar & Cut Segment Overlay */}
          <div className="relative w-full h-5 bg-[#141722] border border-[#23293A] rounded-full overflow-hidden shadow-inner flex items-center my-auto">
            {recordingBlocks.map((block) => (
              <div
                key={block.id}
                style={{ left: `${block.leftPct}%`, width: `${block.widthPct}%` }}
                className="absolute h-full bg-[#4F46E5] opacity-90 transition-all z-0"
              />
            ))}

            {/* Glowing Cut Selection Range Highlight */}
            {cutStartSeconds !== null && cutEndSeconds !== null && cutStartSeconds < cutEndSeconds && (
              <div
                style={{
                  left: `${(cutStartSeconds / 86400) * 100}%`,
                  width: `${((cutEndSeconds - cutStartSeconds) / 86400) * 100}%`
                }}
                className="absolute h-full bg-amber-500/80 border-y-2 border-amber-300 z-10 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)]"
              />
            )}
          </div>

          {/* Bottom Layer: Ruler Tick Marks */}
          <div className="w-full h-2 relative pointer-events-none flex justify-between items-end">
            {rulerTicks.map((tick) => (
              <div
                key={`b-${tick.hr}`}
                style={{ left: `${tick.pct}%` }}
                className="absolute bottom-0 -translate-x-1/2"
              >
                <div className="w-[1px] h-2 bg-[#2E364A]"></div>
              </div>
            ))}
          </div>

          {/* Hover Indicator Needle & Mini Video Snapshot Preview Tooltip */}
          {hoveredSeconds !== null && !isDragging && (
            <div 
              className="absolute top-0 bottom-0 z-50 pointer-events-none flex flex-col items-center"
              style={{ left: `${(hoveredSeconds / 86400) * 100}%` }}
            >
              <div className="absolute bottom-full mb-2 flex flex-col items-center -translate-x-1/2 left-1/2">
                <div className="bg-[#0F121C] border border-indigo-500/70 rounded-xl p-1 shadow-2xl flex flex-col items-center backdrop-blur-xl">
                  {hoveredThumbUrl ? (
                    <div className="w-32 h-18 rounded-lg overflow-hidden relative bg-black border border-gray-800">
                      <img
                        src={hoveredThumbUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>
                  ) : null}
                  <span className="text-[10px] font-mono font-extrabold text-indigo-300 px-2 py-0.5 mt-0.5 tracking-wider">
                    {formatTimeStr(hoveredSeconds)}
                  </span>
                </div>
                {/* Subtle downward arrow indicator */}
                <div className="w-2 h-2 bg-[#0F121C] border-r border-b border-indigo-500/70 rotate-45 -mt-1"></div>
              </div>
              <div className="w-[1px] h-full bg-white/40 border-l border-dashed border-white/60"></div>
            </div>
          )}

          {/* Sleek Red Playhead Needle & Pill Badge */}
          <div 
            className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
            style={{ left: `${(currentSeconds / 86400) * 100}%` }}
          >
            {/* Playhead Time Badge */}
            <div className="bg-red-600 text-white text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full shadow-lg shadow-red-600/60 tracking-wider border border-red-400 z-40 whitespace-nowrap">
              {formatTimeStr(currentSeconds)}
            </div>

            {/* Red Vertical Needle */}
            <div className="w-[2px] h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
          </div>
        </div>
      </div>

      {/* Right Section: Speed Adjust, Cut Tools, Time Display & Zoom Controls */}
      <div className="flex items-center gap-3 shrink-0 pl-4 border-l border-[#1F2432]">
        
        {/* Playback Speed Adjustment Button & Menu */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1 border ${
              playbackSpeed !== 1
                ? 'bg-amber-600/30 text-amber-300 border-amber-500/60 shadow-sm'
                : 'bg-[#141722] hover:bg-[#1C2130] text-gray-300 border-[#23293A]'
            }`}
            title="Adjust Playback Speed"
          >
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>{playbackSpeed}x</span>
          </button>

          {showSpeedMenu && (
            <div className="absolute bottom-full mb-2 right-0 bg-[#12151E] border border-[#2B3245] rounded-xl p-1 shadow-2xl z-50 flex flex-col gap-0.5 min-w-[90px] backdrop-blur-xl">
              {[0.25, 0.5, 1, 1.25, 1.5, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    setPlaybackSpeed(spd);
                    setShowSpeedMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center justify-between transition ${
                    playbackSpeed === spd
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-[#1E2333] hover:text-white'
                  }`}
                >
                  <span>{spd}x</span>
                  {playbackSpeed === spd && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Frame Cut & Trim Tool Controls */}
        <div className="flex items-center bg-[#141722] border border-[#23293A] rounded-xl p-1 gap-1">
          <button
            onClick={() => setIsCutMode(!isCutMode)}
            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              isCutMode || cutStartSeconds !== null
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1C2130]'
            }`}
            title="Frame Cut & Trim Tool"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Cut</span>
          </button>

          {isCutMode && (
            <>
              <button
                onClick={() => setCutStartSeconds(currentSeconds)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-extrabold transition ${
                  cutStartSeconds !== null ? 'bg-indigo-600 text-white' : 'bg-[#212738] text-indigo-300 hover:bg-[#2C344A]'
                }`}
                title="Set Start Cut Marker"
              >
                [ Start
              </button>

              <button
                onClick={() => setCutEndSeconds(currentSeconds)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-extrabold transition ${
                  cutEndSeconds !== null ? 'bg-indigo-600 text-white' : 'bg-[#212738] text-indigo-300 hover:bg-[#2C344A]'
                }`}
                title="Set End Cut Marker"
              >
                End ]
              </button>

              {(cutStartSeconds !== null || cutEndSeconds !== null) && (
                <button
                  onClick={() => {
                    setCutStartSeconds(null);
                    setCutEndSeconds(null);
                  }}
                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition"
                  title="Clear Cut Segment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Download Video in MP4 Format Button */}
        <button
          onClick={handleDownloadCutMp4}
          disabled={isExportingCut}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 shrink-0"
          title="Download Clip / Cut Range as MP4 Video"
        >
          <Download className={`w-3.5 h-3.5 ${isExportingCut ? 'animate-bounce' : ''}`} />
          <span className="font-mono">{isExportingCut ? 'Exporting...' : 'MP4'}</span>
        </button>

        {/* Monospace Timestamp Badge */}
        <div className="flex flex-col items-end hidden sm:flex">
          <span className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold">Playback Time</span>
          <span className="font-mono text-sm font-extrabold text-white tracking-wider bg-[#141722] px-3 py-1 rounded-lg border border-[#23293A] shadow-sm">
            {formattedDisplayTime}
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-[#141722] border border-[#23293A] rounded-xl p-1 text-xs">
          <button
            onClick={() => setZoomScale(Math.max(1, zoomScale - 1))}
            disabled={zoomScale <= 1}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition rounded-lg"
            title="Zoom Out Timeline"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 font-mono text-xs font-extrabold text-indigo-400">
            {zoomScale}x
          </span>

          <button
            onClick={() => setZoomScale(Math.min(8, zoomScale + 1))}
            disabled={zoomScale >= 8}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition rounded-lg"
            title="Zoom In Timeline"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoomScale(1)}
            className="p-1 text-gray-400 hover:text-white transition ml-1 border-l border-[#23293A] rounded-lg"
            title="Fit Full Day (1x)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
