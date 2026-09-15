import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Camera, RecordingItem } from '../types/camera';
import { fetchCameraRecordings, extractCameraPath, resolveApiUrl } from '../services/apiService';
import { ModernCalendarPicker } from './ModernCalendarPicker';
import {
  ChevronLeft,
  Clock,
  Video,
  Play,
  Film,
  RefreshCw,
  AlertCircle,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface CameraRecordingsScreenProps {
  camera: Camera;
  currentDate: string;
  onDateChange?: (date: string) => void;
  apiBaseUrl: string;
  authToken: string;
  onBackToGrid: () => void;
  onSelectRecording: (recording: RecordingItem) => void;
}

interface HourGroup {
  hourLabel: string;
  hourNum: number;
  clips: RecordingItem[];
  totalDurationSec: number;
}

export const CameraRecordingsScreen: React.FC<CameraRecordingsScreenProps> = ({
  camera,
  currentDate,
  onDateChange,
  apiBaseUrl,
  authToken,
  onBackToGrid,
  onSelectRecording,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default 00:00 on top!
  const [latestDate, setLatestDate] = useState<string | undefined>(undefined);
  const userChangedDateRef = useRef<boolean>(false);

  const activeCameraPath = extractCameraPath(camera);

  useEffect(() => {
    setSelectedDate(currentDate);
  }, [currentDate]);

  const loadRecordings = (dateStr: string) => {
    setLoading(true);
    setError(null);

    fetchCameraRecordings(apiBaseUrl, camera, dateStr, undefined, undefined, authToken)
      .then((res) => {
        setRecordings(res.recordings);
        setLoading(false);

        if (res.recordings && res.recordings.length > 0) {
          const recordingDates = res.recordings
            .filter((r) => r.startTime)
            .map((r) => {
              const d = new Date(r.startTime!);
              const y = d.getUTCFullYear();
              const m = String(d.getUTCMonth() + 1).padStart(2, '0');
              const dd = String(d.getUTCDate()).padStart(2, '0');
              return `${y}/${m}/${dd}`;
            });

          if (recordingDates.length > 0) {
            recordingDates.sort();
            const newestDate = recordingDates[recordingDates.length - 1];
            setLatestDate(newestDate);

            // Auto-select latest recording date if user hasn't explicitly picked a date yet and current is empty
            if (!userChangedDateRef.current && newestDate && res.recordings.length === 0) {
              setSelectedDate(newestDate);
              if (onDateChange) onDateChange(newestDate);
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch recordings:', err);
        setError('Failed to fetch camera recordings.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRecordings(selectedDate);
  }, [camera, selectedDate, apiBaseUrl, authToken]);

  const handleDateChange = (newDate: string) => {
    userChangedDateRef.current = true;
    const formatted = newDate.replace(/-/g, '/');
    setSelectedDate(formatted);
    if (onDateChange) onDateChange(formatted);
  };

  // Group 1-minute raw recording segments into Continuous Hourly Stream Blocks
  const hourGroups = useMemo(() => {
    const map = new Map<number, RecordingItem[]>();
    
    // Sort raw recordings chronologically first
    const sorted = [...recordings].sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return timeA - timeB;
    });

    sorted.forEach((rec) => {
      if (!rec.startTime) return;
      try {
        const d = new Date(rec.startTime);
        const hr = d.getUTCHours();
        if (!map.has(hr)) map.set(hr, []);
        map.get(hr)!.push(rec);
      } catch (e) {
        console.warn('Failed to parse recording start time', e);
      }
    });

    const groups: HourGroup[] = [];
    map.forEach((clips, hr) => {
      const totalDurationSec = clips.reduce((acc, c) => acc + (c.duration || 60), 0);
      const formattedHr = String(hr).padStart(2, '0');
      const nextHr = String((hr + 1) % 24).padStart(2, '0');
      groups.push({
        hourLabel: `${formattedHr}:00 - ${nextHr}:00`,
        hourNum: hr,
        clips,
        totalDurationSec,
      });
    });

    // Ascending by default: 00:00 on top!
    groups.sort((a, b) => (sortOrder === 'asc' ? a.hourNum - b.hourNum : b.hourNum - a.hourNum));
    return groups;
  }, [recordings, sortOrder]);

  // Helper function to resolve video media source URL
  const getVideoMediaUrl = (rec?: RecordingItem): string => {
    if (!rec) return '';
    return rec.videoUrl || (rec.videoPath ? resolveApiUrl(apiBaseUrl, rec.videoPath) : '');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sleek Enterprise Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToGrid}
            className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition border border-gray-200 flex items-center gap-1 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Cameras</span>
          </button>

          <div className="h-4 w-px bg-gray-200"></div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-gray-900">
              {camera.name}
            </h1>
            <span className="text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {activeCameraPath}
            </span>
          </div>
        </div>

        {/* Modern Custom Calendar Selector & Refresh */}
        <div className="flex items-center gap-3">
          <ModernCalendarPicker
            selectedDate={selectedDate}
            onSelectDate={handleDateChange}
            latestRecordingDate={latestDate}
          />

          <button
            onClick={() => loadRecordings(selectedDate)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition border border-gray-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Header Controls & View Options Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <Film className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-gray-900">
                {hourGroups.length > 0 ? `${hourGroups.length} Continuous Hours Recorded` : 'No Recordings'}
              </span>
            </div>

            <span className="text-gray-300">•</span>

            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-gray-900">{selectedDate} Archive</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Direction Toggle (Ascending 00:00 first) */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              title="Toggle Time Order (00:00 First)"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>{sortOrder === 'asc' ? 'From 00:00 (Top)' : 'From 23:00 (Top)'}</span>
              {sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            </button>

            {/* View Mode Toggle: Grid | List */}
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
              <button
                onClick={() => setViewType('grid')}
                className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                  viewType === 'grid'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View of Hourly Streams"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>

              <button
                onClick={() => setViewType('list')}
                className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                  viewType === 'list'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View of Hourly Streams"
              >
                <List className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
            </div>

            {/* Play Full Day Button */}
            {hourGroups.length > 0 && !loading && (
              <button
                onClick={() => onSelectRecording(hourGroups[0].clips[0])}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Full Day</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-pulse flex flex-col space-y-3"
              >
                <div className="h-40 bg-gray-200 w-full"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-red-200 text-center my-8 shadow-sm">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <h3 className="text-sm font-bold text-gray-900">{error}</h3>
            <button
              onClick={() => loadRecordings(selectedDate)}
              className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 transition"
            >
              Retry
            </button>
          </div>
        ) : hourGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-gray-200 border-dashed text-center my-8 shadow-sm">
            <Video className="w-10 h-10 text-gray-300 mb-2" />
            <h3 className="text-sm font-semibold text-gray-700">No Recordings Found</h3>
            <p className="text-xs text-gray-400 mt-1">No video archive available for {selectedDate}.</p>
          </div>
        ) : viewType === 'grid' ? (
          /* Grid View: Continuous Hourly Stream Cards (Starting from 00:00 on top!) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {hourGroups.map((group) => {
              const totalMin = Math.round(group.totalDurationSec / 60);
              const firstClip = group.clips[0];
              const mediaUrl = getVideoMediaUrl(firstClip);

              return (
                <div
                  key={group.hourNum}
                  onClick={() => onSelectRecording(firstClip)}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500 transition duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  {/* Hour Block Visual Thumbnail Header */}
                  <div className="relative h-44 bg-slate-950 overflow-hidden flex items-center justify-center">
                    {firstClip?.thumbnailUrl || firstClip?.thumbnailPath ? (
                      <img
                        src={firstClip.thumbnailUrl || resolveApiUrl(apiBaseUrl, firstClip.thumbnailPath!)}
                        alt="Hour Thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : mediaUrl ? (
                      <video
                        src={`${mediaUrl}#t=1`}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <Film className="w-10 h-10 text-gray-600" />
                    )}

                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-between p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white bg-indigo-600/90 px-2.5 py-0.5 rounded shadow-sm border border-indigo-400">
                          {group.hourLabel}
                        </span>
                        <span className="text-xs font-semibold text-emerald-300 bg-black/60 px-2 py-0.5 rounded border border-emerald-500/40">
                          {totalMin} min recording
                        </span>
                      </div>

                      {/* Hover Play Button */}
                      <div className="self-center w-12 h-12 rounded-full bg-indigo-600/90 group-hover:bg-indigo-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition duration-300 border border-indigo-300">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>

                      <div className="text-[11px] font-medium text-gray-300 flex items-center justify-between">
                        <span>Starts at {group.hourLabel.split(' - ')[0]}</span>
                        <span className="font-semibold text-indigo-300 group-hover:underline">Play Stream</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Info */}
                  <div className="p-3.5 bg-white flex items-center justify-between border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{group.hourLabel}</span>
                    </div>

                    <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-sm">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View: Continuous Hourly Streams Table */
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
            {hourGroups.map((group) => {
              const totalMin = Math.round(group.totalDurationSec / 60);
              const firstClip = group.clips[0];
              const mediaUrl = getVideoMediaUrl(firstClip);

              return (
                <div
                  key={group.hourNum}
                  onClick={() => onSelectRecording(firstClip)}
                  className="p-4 flex items-center justify-between hover:bg-indigo-50/50 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    {/* Video Thumbnail */}
                    <div className="w-24 h-14 bg-slate-900 rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center border border-gray-200">
                      {firstClip?.thumbnailUrl || firstClip?.thumbnailPath ? (
                        <img
                          src={firstClip.thumbnailUrl || resolveApiUrl(apiBaseUrl, firstClip.thumbnailPath!)}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : mediaUrl ? (
                        <video
                          src={`${mediaUrl}#t=1`}
                          preload="metadata"
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Video className="w-4 h-4 text-gray-500" />
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition">
                        <Play className="w-5 h-5 text-white fill-current opacity-90 group-hover:scale-110 transition" />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>{group.hourLabel}</span>
                      </div>
                      <div className="text-xs text-emerald-600 font-semibold mt-1">
                        {totalMin} Minutes Continuous Recording
                      </div>
                    </div>
                  </div>

                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Stream</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
