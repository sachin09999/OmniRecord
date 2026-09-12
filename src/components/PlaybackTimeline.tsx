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
}

export const PlaybackTimeline: React.FC<PlaybackTimelineProps> = ({
  currentDate,
  recordings = [],
  neighbors,
  onSelectRecording
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentSeconds, setCurrentSeconds] = useState<number>(5 * 3600 + 2 * 60 + 2); // default 05:02:02 matching neighbor start

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
  const getSecondsFromIso = (isoStr?: string): number => {
    if (!isoStr) return 0;
    try {
      const d = new Date(isoStr);
      return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
    } catch {
      return 0;
    }
  };

  return (
    <div className="w-full px-4 py-2.5 bg-slate-950/90 text-slate-200 select-none">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-mono font-bold text-sm bg-slate-900/90 px-2.5 py-1 rounded-md border border-cyan-500/30 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {formatTime(currentSeconds)}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">{currentDate}</span>

            {recordings.length > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Video className="w-3 h-3 text-emerald-400" />
                {recordings.length} Stream Segment{recordings.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentSeconds((s) => Math.max(0, s - 30))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Rewind 30s"
            >
              <Rewind className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/30"
              title={isPlaying ? 'Pause Playback' : 'Play Recording'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => setCurrentSeconds((s) => Math.min(86400, s + 30))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Fast Forward 30s"
            >
              <FastForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
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
                className="px-2 py-1 rounded text-[10px] font-bold bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 transition flex items-center gap-1"
                title="Jump to next recording stream"
              >
                <span>Next Clip</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              {speeds.map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                    playbackSpeed === spd
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 24-Hour Interactive Recording Timeline Track */}
        <div className="relative w-full pt-1 pb-2">
          <div className="w-full h-3.5 bg-slate-900 rounded-full relative overflow-hidden border border-slate-800">
            {/* Dynamic Recording Bars */}
            {recordings.map((rec, idx) => {
              const startSec = getSecondsFromIso(rec.startTime);
              const endSec = rec.endTime ? getSecondsFromIso(rec.endTime) : startSec + (rec.duration || 300);

              const leftPct = (startSec / 86400) * 100;
              const widthPct = Math.max(0.6, ((endSec - startSec) / 86400) * 100);

              return (
                <div
                  key={rec._id || idx}
                  onClick={() => {
                    setCurrentSeconds(startSec);
                    if (onSelectRecording) onSelectRecording(rec);
                  }}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  className="absolute h-full bg-emerald-500 hover:bg-emerald-400 cursor-pointer shadow-sm transition"
                  title={`Recording ${rec.cameraPath || ''}: ${rec.startTime || ''} (${Math.round(rec.duration || 60)}s)`}
                />
              );
            })}
          </div>

          <input
            type="range"
            min={0}
            max={86400}
            step={1}
            value={currentSeconds}
            onChange={handleSliderChange}
            className="absolute top-1 left-0 w-full h-3.5 opacity-0 cursor-pointer z-10"
          />

          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1 px-1">
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

