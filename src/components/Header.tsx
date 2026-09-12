import React, { useState } from 'react';
import {
  ChevronLeft,
  Calendar,
  Search,
  Building2,
  Grid,
  List,
  MapPin,
  Settings,
  Clock,
  ChevronDown
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
  liveStatus: boolean;
  totalCameras: number;
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
  onOpenSettings,
  totalCameras,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);

  const sites = ['UAE-OFFICE', 'UAE-OFFICE Building B', 'Dubai Command Hub', 'Abu Dhabi Substation'];
  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900 border-b border-slate-800 px-5 py-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <button
            title="Back to Dashboard"
            className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-slate-200 transition border border-slate-700/60"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                OmniRecord
              </h1>
              <span className="text-xs text-slate-400">({totalCameras} Cameras)</span>
            </div>
          </div>
        </div>

        {/* Center: Search, Date Filter & Site Selector */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          {/* Search Bar */}
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search cameras..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Date Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 transition"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentDate}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-lg p-3 shadow-xl z-50">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> September 2026
                  </span>
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

          {/* Site Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSiteDropdown(!showSiteDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{selectedSite}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showSiteDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg py-1 shadow-xl z-50">
                {sites.map((site) => (
                  <button
                    key={site}
                    onClick={() => {
                      onSiteChange(site);
                      setShowSiteDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs transition ${
                      selectedSite === site
                        ? 'bg-blue-600/20 text-blue-400 font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {site}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Layout Switcher & Settings */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-md border border-slate-800">
            <button
              onClick={() => onViewModeChange('grid')}
              title="Grid View"
              className={`p-1 rounded transition ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              title="List View"
              className={`p-1 rounded transition ${
                viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('map')}
              title="2D Floorplan View"
              className={`p-1 rounded transition ${
                viewMode === 'map' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenSettings}
            title="Configure Cupola Server Settings"
            className="p-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
