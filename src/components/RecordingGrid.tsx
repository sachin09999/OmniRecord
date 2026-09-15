import React, { useState } from 'react';
import type { Camera } from '../types/camera';
import {
  MapPin,
  ArrowRight,
  VideoOff,
  RotateCw,
  FileText,
  Radio,
  Film,
  Play
} from 'lucide-react';

interface RecordingGridProps {
  cameras: Camera[];
  onSelectCamera: (cam: Camera) => void;
  onSelectLiveCamera?: (cam: Camera) => void;
  currentDate: string;
  viewMode: 'grid' | 'list' | 'map';
  onAddStickyNote: (cam: Camera) => void;
  selectedSite: string;
}

export const RecordingGrid: React.FC<RecordingGridProps> = ({
  cameras,
  onSelectCamera,
  onSelectLiveCamera,
  viewMode,
  onAddStickyNote,
  selectedSite,
}) => {
  // Track camera card mode state: 'live' or 'recordings'
  const [cardModes, setCardModes] = useState<Record<string, 'live' | 'recordings'>>({});

  const toggleCardMode = (camId: string, mode: 'live' | 'recordings', e: React.MouseEvent) => {
    e.stopPropagation();
    setCardModes((prev) => ({ ...prev, [camId]: mode }));
  };

  const handleCardClick = (cam: Camera) => {
    const mode = cardModes[cam._id] || 'recordings';
    if (mode === 'live' && onSelectLiveCamera) {
      onSelectLiveCamera(cam);
    } else {
      onSelectCamera(cam);
    }
  };

  if (cameras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-2xl border border-gray-200 my-8 shadow-sm">
        <VideoOff className="w-10 h-10 text-gray-400 mb-3" />
        <h3 className="text-base font-semibold text-gray-800">No Cameras Found</h3>
        <p className="text-xs text-gray-500 max-w-xs mt-1">
          No 360° camera feeds match your search criteria.
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-3 py-2">
        <div className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between border-b border-gray-200">
          <span>Camera Name & Location</span>
          <span>Relay URI</span>
          <span>Rotation</span>
          <span>Quick Actions</span>
        </div>

        {cameras.map((cam) => (
          <div
            key={cam._id}
            className="bg-white p-4 flex items-center justify-between gap-4 border border-gray-200 rounded-xl hover:border-indigo-500 transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" title="Live Camera Feed Active"></div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  {cam.name}
                </h4>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{cam.uri || cam.name.split('_')[0]}</span>
                </p>
              </div>
            </div>

            <div className="text-xs font-mono font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              {cam.relayUri}
            </div>

            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-gray-400" />
              <span>Speed: {cam.rotateSpeed}x ({cam.basePosition}°)</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Watch Live Button */}
              {onSelectLiveCamera && (
                <button
                  onClick={() => onSelectLiveCamera(cam)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                  title="Watch Live 360 Stream"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Watch Live</span>
                </button>
              )}

              {/* Day Recordings Button */}
              <button
                onClick={() => onSelectCamera(cam)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                title="Browse Recordings Archive"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Archives</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onAddStickyNote(cam)}
                title="Add Note"
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition border border-gray-200"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-2 space-y-6">
      {/* Page Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Cameras</h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Live feeds and recorded streams from all 360° cameras at {selectedSite}
          </p>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-sm font-extrabold text-gray-900">{cameras.length} Feeds Live</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">All camera streams connected</p>
        </div>
      </div>

      {/* 4x2 Camera Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cameras.map((cam) => {
          const locationText = cam.uri || cam.name.split('_')[0];
          const activeMode = cardModes[cam._id] || 'recordings';

          return (
            <div
              key={cam._id}
              onClick={() => handleCardClick(cam)}
              className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all duration-300"
            >
              {/* Card Top Header: Camera Title + Mode Segment Switch */}
              <div className="flex items-center justify-between mb-3 px-0.5">
                <h3 className="text-xs font-bold text-gray-900 truncate max-w-[140px]" title={cam.name}>
                  {cam.name}
                </h3>

                {/* Simple Live / Archive Mode Switch */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[10px] font-bold">
                  <button
                    onClick={(e) => toggleCardMode(cam._id, 'live', e)}
                    className={`px-2 py-0.5 rounded-md transition flex items-center gap-1 ${
                      activeMode === 'live'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Switch to Live Stream Mode"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                    <span>Live</span>
                  </button>

                  <button
                    onClick={(e) => toggleCardMode(cam._id, 'recordings', e)}
                    className={`px-2 py-0.5 rounded-md transition flex items-center gap-1 ${
                      activeMode === 'recordings'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Switch to Recordings Mode"
                  >
                    <Film className="w-2.5 h-2.5" />
                    <span>Archive</span>
                  </button>
                </div>
              </div>

              {/* Card Image Frame (Visual Camera Stream Thumbnail) */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 mb-3.5 border border-gray-200 shadow-inner group">
                <img
                  src={cam.thumbnailUrl || cam.panoramaUrl}
                  alt={cam.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded backdrop-blur-md border ${
                      activeMode === 'live'
                        ? 'bg-red-600/90 text-white border-red-400'
                        : 'bg-indigo-600/90 text-white border-indigo-400'
                    }`}>
                      {activeMode === 'live' ? '🔴 LIVE STREAM' : '📁 RECORDINGS'}
                    </span>
                    <span className="text-[10px] font-mono text-gray-300 bg-black/60 px-1.5 py-0.5 rounded border border-white/20">
                      {cam.relayUri}
                    </span>
                  </div>

                  {/* Center Hover Play Button */}
                  <div className="self-center w-10 h-10 rounded-full bg-indigo-600/90 group-hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-300 border border-indigo-300">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>

                  <div className="text-[10px] font-medium text-gray-300 flex items-center justify-between">
                    <span>{locationText}</span>
                    <span className="font-bold text-white group-hover:underline">
                      {activeMode === 'live' ? 'Click to Watch Live' : 'Click to View Day Archive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Bar: Watch Live & Day Archives Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                {/* Watch Live Button */}
                {onSelectLiveCamera && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLiveCamera(cam);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-xl font-bold text-[11px] transition shadow-2xs"
                    title="Watch Live 360° Stream"
                  >
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>Watch Live</span>
                  </button>
                )}

                {/* Day Archives Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCamera(cam);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[11px] transition shadow-xs"
                  title="Browse Day Recordings Archive"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Archives</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
