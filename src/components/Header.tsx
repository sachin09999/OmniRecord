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
    <header className="sticky top-0 z-30 w-full bg-white/95 border-b border-gray-200 px-6 py-4 backdrop-blur-md shadow-sm">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Swirl / Orbit Logo Icon */}
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
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
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
              OmniRecord
            </h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide">
              360° Camera Surveillance
            </p>
          </div>
        </div>

        {/* Center Pill Controls */}
        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap justify-center">
          {/* Date Picker Pill */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:border-indigo-500 hover:bg-gray-50 transition shadow-sm"
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{currentDate}</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </button>

            {showDatePicker && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl p-3 shadow-xl z-50">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-800">September 2026</span>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 mb-1">
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
                            ? 'bg-indigo-600 font-semibold text-white shadow-sm'
                            : 'hover:bg-gray-100 text-gray-700'
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
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:border-indigo-500 hover:bg-gray-50 transition shadow-sm"
            >
              <MapPin className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-gray-900">{selectedSite}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </button>

            {showSiteDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl py-1 shadow-xl z-50">
                {sites.map((site) => (
                  <button
                    key={site}
                    onClick={() => {
                      onSiteChange(site);
                      setShowSiteDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-xs transition ${
                      selectedSite === site
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {site}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input Pill */}
          <div className="relative min-w-[260px] flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cameras, locations or tags..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
            />
          </div>
        </div>

        {/* Right View Mode Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Grid</span>
          </button>

          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" />
            <span>List</span>
          </button>

          <button
            onClick={() => onViewModeChange('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              viewMode === 'map'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
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
