import React from 'react';
import type { Camera } from '../types/camera';
import {
  MapPin,
  ArrowRight,
  VideoOff,
  RotateCw,
  FileText
} from 'lucide-react';

interface RecordingGridProps {
  cameras: Camera[];
  onSelectCamera: (cam: Camera) => void;
  onSelectLiveCamera?: (cam: Camera) => void;
  currentDate: string;
  viewMode: 'grid' | 'list' | 'map';
  onAddStickyNote: (cam: Camera) => void;
  selectedSite?: string;
  theme?: 'light' | 'dark';
}

export const RecordingGrid: React.FC<RecordingGridProps> = ({
  cameras,
  onSelectCamera,
  viewMode,
  onAddStickyNote,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  if (cameras.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-16 text-center rounded-2xl border my-8 shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-800'
      }`}>
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
          <span>Action</span>
        </div>

        {cameras.map((cam) => (
          <div
            key={cam._id}
            className="bg-white p-4 flex items-center justify-between gap-4 border border-gray-200 rounded-xl hover:border-indigo-500 transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
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
              <button
                onClick={() => onSelectCamera(cam)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <span>View 360°</span>
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
      {/* Clean Page Header */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Cameras</h2>

        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${
          isDark ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300' : 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-semibold">{cameras.length} Online</span>
        </div>
      </div>

      {/* 4x2 Clean Camera Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cameras.map((cam) => {
          const locationText = cam.uri || cam.name.split('_')[0];

          return (
            <div
              key={cam._id}
              onClick={() => onSelectCamera(cam)}
              className={`rounded-xl border p-4 flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-lg transition-all duration-200 ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500 text-white'
                  : 'bg-white border-gray-200 hover:border-indigo-400 text-gray-900'
              }`}
            >
              {/* Card Top Header: Camera Name */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className={`text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`} title={cam.name}>
                  {cam.name}
                </h3>
              </div>

              {/* Card Image Frame (Camera Stream Snapshot Thumbnail) */}
              <div className={`relative aspect-video rounded-xl overflow-hidden mb-4 border shadow-inner ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-100 border-gray-200'
              }`}>
                <img
                  src={cam.thumbnailUrl || cam.panoramaUrl}
                  alt={cam.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-transparent"></div>
              </div>

              {/* Card Footer Bar */}
              <div className={`flex items-center justify-between gap-2 pt-2 border-t ${
                isDark ? 'border-slate-800' : 'border-gray-100'
              }`}>
                {/* Left: Location Pin + Location Name */}
                <div className="flex items-center gap-1.5 text-xs min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className={`truncate font-medium text-[11px] ${isDark ? 'text-slate-300' : 'text-gray-600'}`} title={locationText}>{locationText}</span>
                </div>

                {/* Right: Relay tag + View 360 Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                    isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {cam.relayUri}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCamera(cam);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 border font-bold text-xs rounded-xl transition ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <span>View 360°</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
