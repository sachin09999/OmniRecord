import React, { useState } from 'react';
import type { RecordingItem, Neighbors } from '../types/camera';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  ToggleRight,
  ToggleLeft
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
  const [currentSeconds, setCurrentSeconds] = useState<number>(
    activeRecording && activeRecording.startTime ? getSecondsFromIso(activeRecording.startTime) : 5 * 3600 + 2 * 60 + 2
  );
  
  const [isGreenToggleOn, setIsGreenToggleOn] = useState<boolean>(true);
  const [activeTimeSpan, setActiveTimeSpan] = useState<'hr'|'min'|'sec'>('hr');

  // Convert ISO string to seconds from start of day
  function getSecondsFromIso(isoStr?: string): number {
    if (!isoStr) return 0;
    try {
      const d = new Date(isoStr);
      return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
    } catch {
      return 0;
    }
  }

  React.useEffect(() => {
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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSecs = parseInt(e.target.value, 10);
    setCurrentSeconds(newSecs);

    if (recordings && recordings.length > 0) {
      // Find recording clip that covers newSecs
      const matchingRec = recordings.find((rec) => {
        const startSecs = getSecondsFromIso(rec.startTime);
        const endSecs = rec.endTime ? getSecondsFromIso(rec.endTime) : startSecs + (rec.duration || 60);
        return newSecs >= startSecs && newSecs <= endSecs;
      });

      if (matchingRec) {
        if (!activeRecording || matchingRec._id !== activeRecording._id) {
          if (onSelectRecording) onSelectRecording(matchingRec);
        } else if (videoElement && activeRecording && activeRecording.startTime) {
          const startSecs = getSecondsFromIso(activeRecording.startTime);
          videoElement.currentTime = Math.max(0, newSecs - startSecs);
        }
      }
    } else if (videoElement && activeRecording && activeRecording.startTime) {
      const startSecs = getSecondsFromIso(activeRecording.startTime);
      const relativeTime = newSecs - startSecs;
      if (relativeTime >= 0 && relativeTime <= (activeRecording.duration || 3600)) {
        videoElement.currentTime = relativeTime;
      }
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
    setCurrentSeconds((s) => {
      const newS = Math.max(0, Math.min(86400, s + delta));
      if (videoElement && activeRecording && activeRecording.startTime) {
        const startSecs = getSecondsFromIso(activeRecording.startTime);
        videoElement.currentTime = Math.max(0, newS - startSecs);
      }
      return newS;
    });
  };



  // Generate ticks for ruler
  const ticks = [];
  for (let i = 0; i <= 24; i += 6) {
    ticks.push(i === 24 ? 0 : i);
  }

  // Format real date/time for display like "Sep 13 23:17:34"
  const formattedDisplayTime = React.useMemo(() => {
    const d = new Date(currentDate);
    const ms = d.getTime();
    if (isNaN(ms)) return "--- -- --:--:--";
    
    const displayDate = new Date(ms + currentSeconds * 1000);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[displayDate.getUTCMonth()];
    const date = displayDate.getUTCDate();
    const h = String(displayDate.getUTCHours()).padStart(2, '0');
    const m = String(displayDate.getUTCMinutes()).padStart(2, '0');
    const s = String(displayDate.getUTCSeconds()).padStart(2, '0');
    
    return `${month} ${date} ${h}:${m}:${s}`;
  }, [currentDate, currentSeconds]);

  return (
    <div className="w-full bg-[#2A2A2A] text-[#D1D1D1] select-none h-[42px] flex items-center px-3 border-t border-[#1F1F1F] font-sans rounded-b-2xl z-50">
      
      {/* Controls Container */}
      <div className="flex items-center gap-4 shrink-0">
        
        {/* Seek Controls */}
        <div className="flex items-center gap-2 text-[#EAEAEA]">
          <button 
            className="hover:text-white transition"
            onClick={() => {
               if (onSelectRecording && neighbors?.previous) {
                 onSelectRecording(neighbors.previous);
               }
            }}
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>
          
          <button className="hover:text-white transition relative" onClick={() => handleSeekDelta(-10)}>
            <RotateCcw className="w-5 h-5" />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-0.5">10</span>
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-7 h-7 rounded-full border border-[#D1D1D1] flex items-center justify-center hover:bg-[#3A3A3A] hover:text-white transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>
          
          <button className="hover:text-white transition relative" onClick={() => handleSeekDelta(10)}>
            <RotateCw className="w-5 h-5" />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-0.5">10</span>
          </button>

          <button 
            className="hover:text-white transition"
            onClick={() => {
               if (onSelectRecording && neighbors?.next) {
                 onSelectRecording(neighbors.next);
               }
            }}
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Timeline Ruler */}
      <div className="flex-1 relative h-full mx-6">
         {/* Main Track Background */}
         <div className="absolute top-1/2 -translate-y-1/2 w-full h-[1px] bg-[#444] z-0"></div>
         
         {/* Tick Marks Layer */}
         <div className="absolute top-1/2 -translate-y-1/2 w-full h-4 z-10 flex justify-between pointer-events-none">
            {Array.from({ length: 49 }).map((_, i) => {
               const isMajor = i % 12 === 0;
               const isMinor = i % 2 === 0 && !isMajor;
               let label = null;
               
               if (isMajor) {
                 const hr = (i / 2) % 24;
                 label = hr === 0 || hr === 24 ? '00' : String(hr).padStart(2, '0');
               }

               return (
                 <div key={i} className="relative flex flex-col items-center justify-end h-full">
                    {label && (
                      <span className="absolute -top-3 text-[9px] text-[#A0A0A0] font-mono">{label}</span>
                    )}
                    <div className={`w-[1px] bg-[#666] ${isMajor ? 'h-3' : isMinor ? 'h-2' : 'h-1'}`}></div>
                 </div>
               );
            })}
         </div>

         {/* Recording Highlights */}
         {recordings.map((rec, idx) => {
            const startSec = getSecondsFromIso(rec.startTime);
            const endSec = rec.endTime ? getSecondsFromIso(rec.endTime) : startSec + (rec.duration || 300);
            const leftPct = (startSec / 86400) * 100;
            const widthPct = Math.max(0.6, ((endSec - startSec) / 86400) * 100);

            return (
              <div
                key={rec._id || idx}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                className="absolute top-1/2 -translate-y-1/2 h-1 bg-[#4A64B2]/40 border-b border-[#5A7AD6] z-10 pointer-events-none"
              />
            );
         })}

         {/* Playhead Red Dot */}
         <div 
           className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none"
           style={{ left: `${(currentSeconds / 86400) * 100}%` }}
         >
           <div className="w-2 h-2 bg-red-600 rounded-full -translate-x-1/2 shadow-[0_0_4px_rgba(220,38,38,0.8)]"></div>
         </div>

         {/* Seek Slider Overlay */}
         <input
            type="range"
            min={0}
            max={86400}
            step={1}
            value={currentSeconds}
            onChange={handleSliderChange}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-40"
         />
      </div>

      {/* Right Side Status & Toggles */}
      <div className="flex items-center gap-4 shrink-0 text-[10px]">
         <div className="font-mono text-[#D1D1D1] min-w-[95px] text-right">
           {formattedDisplayTime}
         </div>
         
         <div className="flex items-center border border-[#444] rounded text-[#888] overflow-hidden bg-[#222]">
           <button 
             onClick={() => setActiveTimeSpan('hr')}
             className={`px-1.5 py-0.5 hover:bg-[#333] transition ${activeTimeSpan === 'hr' ? 'text-white' : ''}`}
           >hr</button>
           <div className="w-[1px] h-3 bg-[#444]"></div>
           <button 
             onClick={() => setActiveTimeSpan('min')}
             className={`px-1.5 py-0.5 hover:bg-[#333] transition ${activeTimeSpan === 'min' ? 'text-white' : ''}`}
           >min</button>
           <div className="w-[1px] h-3 bg-[#444]"></div>
           <button 
             onClick={() => setActiveTimeSpan('sec')}
             className={`px-1.5 py-0.5 hover:bg-[#333] transition ${activeTimeSpan === 'sec' ? 'text-white' : ''}`}
           >sec</button>
         </div>

         <button 
           onClick={() => setIsGreenToggleOn(!isGreenToggleOn)}
           className={`transition-colors ${isGreenToggleOn ? 'text-[#84CC16]' : 'text-[#666]'}`}
         >
           {isGreenToggleOn ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
         </button>
      </div>
    </div>
  );
};

