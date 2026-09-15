import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface ModernCalendarPickerProps {
  selectedDate: string; // "YYYY/MM/DD" or "YYYY-MM-DD"
  onSelectDate: (dateStr: string) => void; // Returns "YYYY/MM/DD"
  latestRecordingDate?: string;
  theme?: 'light' | 'dark';
}

export const ModernCalendarPicker: React.FC<ModernCalendarPickerProps> = ({
  selectedDate,
  onSelectDate,
  latestRecordingDate,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Parse input date
  const parseDateStr = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const clean = dateStr.replace(/\/-/g, '/');
    const parts = clean.split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  const currentDateObj = parseDateStr(selectedDate);
  const [viewYear, setViewYear] = useState<number>(currentDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(currentDateObj.getMonth());

  useEffect(() => {
    const d = parseDateStr(selectedDate);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selectedDate]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Generate calendar day cells
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handleDayClick = (dayNum: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const formatted = `${viewYear}/${mm}/${dd}`;
    onSelectDate(formatted);
    setIsOpen(false);
  };

  const todayObj = new Date();
  const todayYear = todayObj.getFullYear();
  const todayMonth = todayObj.getMonth();
  const todayDay = todayObj.getDate();

  const isToday = (dayNum: number) => {
    return viewYear === todayYear && viewMonth === todayMonth && dayNum === todayDay;
  };

  const isSelected = (dayNum: number) => {
    return (
      viewYear === currentDateObj.getFullYear() &&
      viewMonth === currentDateObj.getMonth() &&
      dayNum === currentDateObj.getDate()
    );
  };

  // Format display string
  const formatDisplayString = () => {
    const m = monthNames[currentDateObj.getMonth()];
    const d = currentDateObj.getDate();
    const y = currentDateObj.getFullYear();
    return `${m} ${d}, ${y}`;
  };

  const selectToday = () => {
    const mm = String(todayMonth + 1).padStart(2, '0');
    const dd = String(todayDay).padStart(2, '0');
    onSelectDate(`${todayYear}/${mm}/${dd}`);
    setIsOpen(false);
  };

  const selectYesterday = () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const mm = String(yest.getMonth() + 1).padStart(2, '0');
    const dd = String(yest.getDate()).padStart(2, '0');
    onSelectDate(`${yest.getFullYear()}/${mm}/${dd}`);
    setIsOpen(false);
  };

  const selectLatest = () => {
    if (latestRecordingDate) {
      onSelectDate(latestRecordingDate);
    } else {
      selectToday();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Modern Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 border rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition hover:border-indigo-500 group ${
          isDark
            ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
            : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
        }`}
      >
        <div className={`p-1 rounded-lg transition ${
          isDark ? 'bg-indigo-950/80 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
        }`}>
          <CalendarIcon className="w-4 h-4" />
        </div>
        <span>{formatDisplayString()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </button>

      {/* Modern Popover Card */}
      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-80 rounded-2xl p-5 shadow-2xl z-50 border animate-in fade-in zoom-in-95 duration-150 ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          {/* Calendar Month/Year Header */}
          <div className={`flex items-center justify-between mb-4 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <span>{monthNames[viewMonth]}</span>
              <span className="text-indigo-500">{viewYear}</span>
            </h3>

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={nextMonth}
                className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {daysOfWeek.map((day, idx) => (
              <span key={idx} className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="w-9 h-9"></div>
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const selected = isSelected(dayNum);
              const today = isToday(dayNum);

              return (
                <button
                  key={dayNum}
                  onClick={() => handleDayClick(dayNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition flex items-center justify-center relative ${
                    selected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-105 z-10'
                      : today
                      ? 'border-2 border-indigo-500 text-indigo-400 bg-indigo-950/40 font-extrabold'
                      : isDark
                      ? 'text-slate-200 hover:bg-slate-800 hover:text-indigo-400'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts Footer */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-1.5">
            {latestRecordingDate && (
              <button
                onClick={selectLatest}
                className="w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-indigo-100"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Select Latest Recording Date</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={selectToday}
                className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
              >
                Today
              </button>

              <button
                onClick={selectYesterday}
                className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
              >
                Yesterday
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
