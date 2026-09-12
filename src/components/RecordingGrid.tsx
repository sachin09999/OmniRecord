import React from 'react';
import type { Camera } from '../types/camera';
import {
  Eye,
  VideoOff,
  RotateCw,
  Video,
  FileText,
  Camera as CameraIcon
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
      <div className="flex flex-col items-center justify-center p-16 text-center bg-slate-900/40 rounded-xl border border-slate-800 my-8">
        <VideoOff className="w-8 h-8 text-slate-500 mb-2" />
        <h3 className="text-sm font-semibold text-slate-300">No Cameras Found</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          No recording feeds match your current filter ({currentDate}).
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2 py-3">
        <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800">
          <span>Camera Name</span>
          <span>Protocol / Relay</span>
          <span>Rotation</span>
          <span>Actions</span>
        </div>

        {cameras.map((cam) => (
          <div
            key={cam._id}
            className="bg-slate-900/60 hover:bg-slate-800/80 px-4 py-3 rounded-lg flex items-center justify-between gap-4 border border-slate-800/80 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <div>
                <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                  {cam.name}
                  <span className="text-[10px] font-normal text-slate-400">
                    ({cam.type === '360' ? '360° Patrol' : 'RTSP Feed'})
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  Path: {cam.path || cam.relayUri}
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {cam.relayUri}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-slate-400" />
              <span>{cam.rotateSpeed}x ({cam.basePosition}°)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectCamera(cam)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-md transition flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View 360°</span>
              </button>

              <button
                onClick={() => onAddStickyNote(cam)}
                title="Add Note"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-md transition border border-slate-700/60"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Clean Grid of Camera Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cameras.map((cam) => {
          const hasStreamImage = Boolean(cam.thumbnailUrl || cam.panoramaUrl);

          return (
            <div
              key={cam._id}
              onClick={() => onSelectCamera(cam)}
              className="group bg-slate-900/70 hover:bg-slate-800/90 rounded-xl overflow-hidden cursor-pointer border border-slate-800 transition-all duration-200 shadow-sm"
            >
              {/* Camera Stream Frame */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden flex flex-col items-center justify-center border-b border-slate-800">
                {hasStreamImage ? (
                  <img
                    src={cam.thumbnailUrl || cam.panoramaUrl}
                    alt={cam.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  /* Clean Minimalist "No Live Stream" Placeholder */
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
                      {cam.type === '360' ? (
                        <CameraIcon className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Video className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">No Stream Connected</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{cam.relayUri}</span>
                  </div>
                )}

                {/* Subtle Type Tag */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-950/80 text-slate-300 border border-slate-800">
                    {cam.type === '360' ? '360° Patrol' : 'RTSP'}
                  </span>
                </div>

                {/* Status Dot */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] text-slate-300 font-medium">Live</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-slate-900/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-100 truncate max-w-[140px]">{cam.name}</h4>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">{cam.relayUri}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddStickyNote(cam);
                    }}
                    title="Add Note"
                    className="p-1 text-slate-400 hover:text-slate-200 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectCamera(cam)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded transition flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>360°</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
