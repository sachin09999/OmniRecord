import React from 'react';
import type { Camera } from '../types/camera';
import {
  Eye,
  Play,
  RotateCw,
  Video,
  FileText,
  Activity
} from 'lucide-react';

interface RecordingGridProps {
  cameras: Camera[];
  onSelectCamera: (cam: Camera) => void;
  currentDate: string;
  viewMode: 'grid' | 'list' | 'map';
  onAddStickyNote: (cam: Camera) => void;
}

export const RecordingGrid: React.FC<RecordingGridProps> = ({
  cameras,
  onSelectCamera,
  currentDate,
  viewMode,
  onAddStickyNote,
}) => {
  if (cameras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-slate-900/50 rounded-2xl border border-slate-800 my-8">
        <Activity className="w-10 h-10 text-slate-500 mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Cameras Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          No recording feeds match your current search query or date filter ({currentDate}).
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2 py-4">
        <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800">
          <span>Camera Name & Path</span>
          <span>Relay URI</span>
          <span>Rotation Specs</span>
          <span>Actions</span>
        </div>

        {cameras.map((cam) => (
          <div
            key={cam._id}
            className="bg-slate-900/80 hover:bg-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-4 border border-slate-800 transition"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                <img
                  src={cam.thumbnailUrl || cam.panoramaUrl}
                  alt={cam.name}
                  className="w-full h-full object-cover"
                />
                {cam.type === '360' && (
                  <span className="absolute top-0.5 right-0.5 bg-blue-600 text-white text-[9px] font-medium px-1 rounded">
                    360°
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  {cam.name}
                  {cam.isOnline && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  Path: {cam.path || cam.relayUri}
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {cam.relayUri}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Speed: {cam.rotateSpeed}x | Base: {cam.basePosition}°</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectCamera(cam)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View 360°</span>
              </button>

              <button
                onClick={() => onAddStickyNote(cam)}
                title="Add Note"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700"
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
    <div className="py-4">
      {/* Date Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">
            {currentDate}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400">{cameras.length} Recordings Available</span>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cameras.map((cam) => (
          <div
            key={cam._id}
            onClick={() => onSelectCamera(cam)}
            className="group relative bg-slate-900 hover:bg-slate-800/90 rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-slate-700 transition-all duration-200 shadow-md"
          >
            {/* Thumbnail Box */}
            <div className="relative aspect-video bg-slate-950 overflow-hidden">
              <img
                src={cam.thumbnailUrl || cam.panoramaUrl}
                alt={cam.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

              {/* Top Badges */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-950/90 text-slate-200 border border-slate-800 flex items-center gap-1">
                  {cam.type === '360' ? (
                    <>
                      <RotateCw className="w-3 h-3 text-blue-400" /> 360° Patrol
                    </>
                  ) : (
                    <>
                      <Video className="w-3 h-3 text-emerald-400" /> RTSP Feed
                    </>
                  )}
                </span>

                <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 bg-slate-950/90 px-2 py-0.5 rounded border border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  REC
                </span>
              </div>

              {/* Hover Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>

              {/* Bottom Card Title Overlay */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-slate-950/90 px-2.5 py-1 rounded border border-slate-800">
                  <p className="text-xs font-bold truncate text-slate-100">{cam.name}</p>
                </div>
              </div>
            </div>

            {/* Bottom Metadata Panel */}
            <div className="p-3 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
              <span className="font-mono truncate max-w-[150px]" title={cam.relayUri}>
                {cam.relayUri}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddStickyNote(cam);
                  }}
                  title="Add Note"
                  className="p-1 hover:text-white transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
                <span className="text-slate-400 font-mono text-[11px]">Base: {cam.basePosition}°</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
