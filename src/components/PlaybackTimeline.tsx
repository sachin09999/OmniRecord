import React, { useState } from 'react';
import type { RecordingItem, Neighbors } from '../types/camera';
import {
  Play,
  Pause,
  FastForward,
  Rewind,
  Clock,
  Video
} from 'lucide-react';

interface PlaybackTimelineProps {
  currentDate: string;
  recordings?: RecordingItem[];
  neighbors?: Neighbors;
  apiBaseUrl?: string;
  onSelectRecording?: (rec: RecordingItem) => void;
  activeRecording?: RecordingItem | null;
}

export const PlaybackTimeline: React.FC<PlaybackTimelineProps> = ({
  currentDate,
  recordings = [],
  neighbors,
  onSelectRecording,
  activeRecording
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentSeconds, setCurrentSeconds] = useState<number>(
    activeRecording && activeRecording.startTime ? getSecondsFromIso(activeRecording.startTime) : 5 * 3600 + 2 * 60 + 2
  );

  const speeds = [0.5, 1, 2, 4, 8];

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentSeconds(parseInt(e.target.value, 10));
  };

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

  return (
    <div className="w-full px-6 py-4 bg-white text-gray-900 select-none shadow-inner">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-indigo-700 font-mono font-bold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-2 shadow-sm">
              <Clock className="w-4 h-4 text-indigo-600" />
              {formatTime(currentSeconds)}
            </span>
            <span className="text-gray-500 font-mono text-xs bg-gray-50 px-2 py-1 rounded-md border border-gray-200">{currentDate}</span>

            {recordings.length > 0 && (
              <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-sm">
                <Video className="w-3 h-3 text-emerald-600" />
                {recordings.length} Segment{recordings.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentSeconds((s) => Math.max(0, s - 30))}
              className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100"
              title="Rewind 30s"
            >
              <Rewind className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition shadow-md shadow-indigo-600/30 active:scale-95"
              title={isPlaying ? 'Pause Playback' : 'Play Recording'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => setCurrentSeconds((s) => Math.min(86400, s + 30))}
              className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100"
              title="Fast Forward 30s"
            >
              <FastForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Previous/Next Recording quick jump buttons */}
            {neighbors?.next && (
              <button
                onClick={() => {
                  if (onSelectRecording && neighbors.next) {
                    onSelectRecording(neighbors.next);
                    if (neighbors.next.startTime) {
                      setCurrentSeconds(getSecondsFromIso(neighbors.next.startTime));
                    }
                  }
                }}
                className="px-3 py-1.5 rounded-md text-[10px] font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 transition flex items-center gap-1 shadow-sm"
                title="Jump to next recording stream"
              >
                <span>Next Clip</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-inner">
              {speeds.map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono transition ${
                    playbackSpeed === spd
                      ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 24-Hour Interactive Recording Timeline Track */}
        <div className="relative w-full pt-2 pb-3">
          <div className="w-full h-4 bg-gray-100 rounded-full relative overflow-hidden border border-gray-200 shadow-inner">
            {/* Dynamic Recording Bars */}
            {recordings.map((rec, idx) => {
              const startSec = getSecondsFromIso(rec.startTime);
              const endSec = rec.endTime ? getSecondsFromIso(rec.endTime) : startSec + (rec.duration || 300);

              const leftPct = (startSec / 86400) * 100;
              const widthPct = Math.max(0.6, ((endSec - startSec) / 86400) * 100);
              
              const isActive = activeRecording && (activeRecording._id === rec._id);

              return (
                <div
                  key={rec._id || idx}
                  onClick={() => {
                    setCurrentSeconds(startSec);
                    if (onSelectRecording) onSelectRecording(rec);
                  }}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  className={`absolute h-full cursor-pointer shadow-sm transition-colors duration-200 ${
                    isActive 
                      ? 'bg-indigo-600 border-x border-indigo-700 z-10 scale-y-110' 
                      : 'bg-emerald-400 hover:bg-indigo-400'
                  }`}
                  title={`Recording ${rec.cameraPath || ''}: ${rec.startTime || ''} (${Math.round(rec.duration || 60)}s)`}
                />
              );
            })}
          </div>
          
          {/* Timeline Playhead Indicator */}
          <div 
            className="absolute top-1 bottom-3 w-[2px] bg-indigo-600 z-20 pointer-events-none transition-all duration-100"
            style={{ left: `${(currentSeconds / 86400) * 100}%` }}
          >
            <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-600 shadow-md"></div>
          </div>

          <input
            type="range"
            min={0}
            max={86400}
            step={1}
            value={currentSeconds}
            onChange={handleSliderChange}
            className="absolute top-2 left-0 w-full h-4 opacity-0 cursor-pointer z-30"
          />

          <div className="flex justify-between text-[10px] font-medium font-mono text-gray-400 mt-2 px-1 select-none">
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>24:00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

