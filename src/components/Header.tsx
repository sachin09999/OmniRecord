import React, { useState } from 'react';
import {
  Calendar,
  Search,
  MapPin,
  Grid,
  List,
  Map,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';

interface HeaderProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  selectedSite: string;
  onSiteChange: (site: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'grid' | 'list' | 'map';
  onViewModeChange: (mode: 'grid' | 'list' | 'map') => void;
  onOpenSettings: () => void;
  totalCameras: number;
  liveStatus?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  selectedSite,
  onSiteChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);

  const sites = ['UAE-OFFICE', 'UAE-OFFICE Building B', 'Dubai Command Hub', 'Abu Dhabi Substation'];
  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0B132B]/95 border-b border-[#1E2B45] px-6 py-4 backdrop-blur-md">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left Branding matching Mockup */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Swirl / Orbit Logo Icon */}
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-tight">
              OmniRecord
            </h1>
            <p className="text-xs text-blue-300 font-medium tracking-wide">
              360° Camera Surveillance
            </p>
          </div>
        </div>

        {/* Center Pill Controls matching Mockup */}
        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap justify-center">
          {/* Date Picker Pill */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#111927] border border-[#1E2B45] text-xs font-medium text-slate-200 hover:border-blue-500 transition shadow-sm"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{currentDate}</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
            </button>

            {showDatePicker && (
              <div className="absolute left-0 mt-2 w-64 bg-[#111927] border border-[#1E2B45] rounded-xl p-3 shadow-2xl z-50">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">September 2026</span>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 mb-1">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dayStr = day < 10 ? `0${day}` : `${day}`;
                    const formatted = `2026/09/${dayStr}`;
                    const isSelected = currentDate.endsWith(dayStr);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          onDateChange(formatted);
                          setShowDatePicker(false);
                        }}
                        className={`p-1.5 rounded text-xs transition ${
                          isSelected
                            ? 'bg-blue-600 font-semibold text-white'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Site Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setShowSiteDropdown(!showSiteDropdown)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#111927] border border-[#1E2B45] text-xs font-medium text-slate-200 hover:border-blue-500 transition shadow-sm"
            >
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-slate-100">{selectedSite}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {showSiteDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-[#111927] border border-[#1E2B45] rounded-xl py-1 shadow-2xl z-50">
                {sites.map((site) => (
                  <button
                    key={site}
                    onClick={() => {
                      onSiteChange(site);
                      setShowSiteDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-xs transition ${
                      selectedSite === site
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {site}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input Pill matching mockup placeholder */}
          <div className="relative min-w-[260px] flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search cameras, locations or tags..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#111927] border border-[#1E2B45] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-sm"
            />
          </div>
        </div>

        {/* Right View Mode Tabs matching mockup buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-[#111927] text-slate-300 border border-[#1E2B45] hover:bg-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Grid</span>
          </button>

          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-[#111927] text-slate-300 border border-[#1E2B45] hover:bg-slate-800'
            }`}
          >
            <List className="w-4 h-4" />
            <span>List</span>
          </button>

          <button
            onClick={() => onViewModeChange('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-[#111927] text-slate-300 border border-[#1E2B45] hover:bg-slate-800'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Floorplan Map</span>
          </button>
        </div>
      </div>
    </header>
  );
};
