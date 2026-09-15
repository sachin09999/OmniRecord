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
  currentDate: string;
  viewMode: 'grid' | 'list' | 'map';
  onAddStickyNote: (cam: Camera) => void;
  selectedSite: string;
}

export const RecordingGrid: React.FC<RecordingGridProps> = ({
  cameras,
  onSelectCamera,
  viewMode,
  onAddStickyNote,
  selectedSite,
}) => {
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
          <span>Action</span>
        </div>

        {cameras.map((cam) => (
          <div
            key={cam._id}
            className="bg-white p-4 flex items-center justify-between gap-4 border border-gray-200 rounded-xl hover:border-indigo-500 transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
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
      {/* Page Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Cameras</h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Live feeds from all 360° cameras at {selectedSite}
          </p>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-extrabold text-gray-900">{cameras.length} Online</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">All systems operational</p>
        </div>
      </div>

      {/* 4x2 Camera Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cameras.map((cam) => {
          const locationText = cam.uri || cam.name.split('_')[0];

          return (
            <div
              key={cam._id}
              onClick={() => onSelectCamera(cam)}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-md transition-shadow hover:border-indigo-400"
            >
              {/* Card Top Header: Camera Title + LIVE Indicator */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold text-gray-900 truncate max-w-[170px]" title={cam.name}>
                  {cam.name}
                </h3>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wide">LIVE</span>
                </div>
              </div>

              {/* Card Image Frame */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4 border border-gray-200 shadow-inner">
                <img
                  src={cam.thumbnailUrl || cam.panoramaUrl}
                  alt={cam.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent"></div>
              </div>

              {/* Card Footer Bar */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                {/* Left: Location Pin + Location Name */}
                <div className="flex items-center gap-1.5 text-xs text-gray-600 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate font-medium text-[11px]" title={locationText}>{locationText}</span>
                </div>

                {/* Right: Relay tag + View 360 Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                    {cam.relayUri}
                  </span>

                  <button
                    onClick={() => onSelectCamera(cam)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-bold text-xs rounded-xl transition"
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
