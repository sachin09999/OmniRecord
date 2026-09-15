import React from 'react';
import { Compass } from 'lucide-react';

interface ModernLoadingSpinnerProps {
  label?: string;
  sublabel?: string;
  isDark?: boolean;
}

export const ModernLoadingSpinner: React.FC<ModernLoadingSpinnerProps> = ({
  label = 'Loading 360° Surveillance...',
  sublabel = 'Connecting to Cupola Backend',
  isDark = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center select-none">
      {/* Outer Radar Lens Ring Container */}
      <div className="relative w-24 h-24 flex items-center justify-center mb-6">
        {/* Pulsing Outer Orbit Glow */}
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping opacity-75 blur-sm" />
        
        {/* Secondary Pulsing Ring */}
        <div className="absolute inset-2 rounded-full border-2 border-indigo-400/40 animate-pulse" />

        {/* Rotating Radar Sweep Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-emerald-400 animate-spin duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />

        {/* Center Glowing Icon */}
        <div className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-inner transition-colors ${
          isDark ? 'bg-slate-900 border border-slate-700 text-indigo-400' : 'bg-white border border-indigo-100 text-indigo-600 shadow-md'
        }`}>
          <Compass className="w-7 h-7 animate-spin duration-3000" />
        </div>
      </div>

      {/* High-Tech Loading Labels */}
      <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
        {label}
      </h3>
      <p className={`text-xs font-mono mt-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'} opacity-80 uppercase tracking-widest`}>
        {sublabel}
      </p>
    </div>
  );
};
