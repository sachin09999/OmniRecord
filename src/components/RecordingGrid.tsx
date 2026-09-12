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
      <div className="flex flex-col items-center justify-center p-16 text-center bg-[#111927] rounded-2xl border border-[#1E2B45] my-8">
        <VideoOff className="w-10 h-10 text-slate-500 mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Cameras Found</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          No 360° camera feeds match your search criteria.
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-3 py-2">
        <div className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-[#1E2B45]">
          <span>Camera Name & Location</span>
          <span>Relay URI</span>
          <span>Rotation</span>
          <span>Action</span>
        </div>

        {cameras.map((cam) => (
          <div
            key={cam._id}
            className="mockup-card p-4 flex items-center justify-between gap-4 border border-[#1E2B45] hover:border-blue-500 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  {cam.name}
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{cam.uri || cam.name.split('_')[0]}</span>
                </p>
              </div>
            </div>

            <div className="text-xs font-mono font-semibold text-slate-300 bg-[#0B132B] px-3 py-1.5 rounded-lg border border-[#1E2B45]">
              {cam.relayUri}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Speed: {cam.rotateSpeed}x ({cam.basePosition}°)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectCamera(cam)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
              >
                <span>View 360°</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onAddStickyNote(cam)}
                title="Add Note"
                className="p-2 bg-[#1E2B45] hover:bg-slate-700 text-slate-300 rounded-xl transition"
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
      {/* Page Header Section matching Mockup Image 1:1 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Cameras</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Live feeds from all 360° cameras at {selectedSite}
          </p>
        </div>

        {/* Right Status matching Mockup: ● 8 Online / All systems operational */}
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-sm font-extrabold text-slate-100">{cameras.length} Online</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">All systems operational</p>
        </div>
      </div>

      {/* 4x2 Camera Card Grid matching Mockup Image 1:1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cameras.map((cam) => {
          const locationText = cam.uri || cam.name.split('_')[0];

          return (
            <div
              key={cam._id}
              onClick={() => onSelectCamera(cam)}
              className="mockup-card mockup-card-hover p-4 flex flex-col justify-between cursor-pointer group"
            >
              {/* Card Top Header: Camera Title + LIVE Indicator */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold text-slate-100 truncate max-w-[170px]" title={cam.name}>
                  {cam.name}
                </h3>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wide">LIVE</span>
                </div>
              </div>

              {/* Card Image Frame matching Mockup Image */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-[#0B132B] mb-4 border border-[#1E2B45]/60 shadow-inner">
                <img
                  src={cam.thumbnailUrl || cam.panoramaUrl}
                  alt={cam.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>
              </div>

              {/* Card Footer Bar matching Mockup Image 1:1 */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1E2B45]/50">
                {/* Left: Location Pin + Location Name */}
                <div className="flex items-center gap-1.5 text-xs text-slate-300 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate font-medium text-[11px]" title={locationText}>{locationText}</span>
                </div>

                {/* Right: Relay tag + View 360° Royal Blue Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-slate-300 bg-[#0B132B] px-2 py-1 rounded-md border border-[#1E2B45]">
                    {cam.relayUri}
                  </span>

                  <button
                    onClick={() => onSelectCamera(cam)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition group-hover:bg-blue-500"
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
