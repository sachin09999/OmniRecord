import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Camera, RecordingItem } from '../types/camera';
import { fetchCameraRecordings, extractCameraPath, resolveApiUrl, resolveRecordingThumbnailUrl, downloadVideoFile } from '../services/apiService';
import { fetchNvrRecordings } from '../services/nvrService';
import { ModernCalendarPicker } from './ModernCalendarPicker';
import { ModernLoadingSpinner } from './ModernLoadingSpinner';

const scrollPosCache = new Map<string, number>();
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
  ArrowDown,
  Download
} from 'lucide-react';

interface CameraRecordingsScreenProps {
  camera: Camera;
  currentDate: string;
  onDateChange?: (date: string) => void;
  apiBaseUrl: string;
  authToken: string;
  onBackToGrid: () => void;
  onSelectRecording: (recording: RecordingItem) => void;
  theme?: 'light' | 'dark';
  activeRecording?: RecordingItem | null;
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
  theme = 'dark',
  activeRecording,
}) => {
  const isDark = theme === 'dark';
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default 00:00 on top!
  const [latestDate, setLatestDate] = useState<string | undefined>(undefined);
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null);
  const userChangedDateRef = useRef<boolean>(false);

  const activeCameraPath = extractCameraPath(camera);

  const handleStartDownload = async (e: React.MouseEvent, url: string, filename: string) => {
    e.stopPropagation();
    setDownloadingItem(filename);
    await downloadVideoFile(url, filename);
    setTimeout(() => setDownloadingItem(null), 1200);
  };

  useEffect(() => {
    setSelectedDate(currentDate);
  }, [currentDate]);

  const loadRecordings = (dateStr: string) => {
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        let recs: RecordingItem[] = [];
        
        if (camera.type === 'nvr' && camera.nvrChannelId) {
          const startOfDay = new Date(dateStr);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(dateStr);
          endOfDay.setHours(23, 59, 59, 999);
          recs = await fetchNvrRecordings(camera.nvrChannelId, startOfDay, endOfDay);
        } else {
          const res = await fetchCameraRecordings(apiBaseUrl, camera, dateStr, undefined, undefined, authToken);
          recs = res.recordings;
        }

        setRecordings(recs);
        setLoading(false);

        if (recs && recs.length > 0) {
          const recordingDates = recs
            .filter((r) => r.startTime)
            .map((r) => {
              const d = new Date(r.startTime!);
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              return `${y}/${m}/${dd}`;
            });

          if (recordingDates.length > 0) {
            recordingDates.sort();
            const newestDate = recordingDates[recordingDates.length - 1];
            setLatestDate(newestDate);

            // Auto-select latest recording date if user hasn't explicitly picked a date yet and current is empty
            if (!userChangedDateRef.current && newestDate && recs.length === 0) {
              setSelectedDate(newestDate);
              if (onDateChange) onDateChange(newestDate);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch recordings:', err);
        setError('Failed to fetch camera recordings.');
        setLoading(false);
      }
    };
    
    load();
  };

  useEffect(() => {
    loadRecordings(selectedDate);
  }, [camera, selectedDate, apiBaseUrl, authToken]);

  // Scroll position preservation handler when selecting a recording
  const handleSelectRecording = (rec: RecordingItem) => {
    const key = `${camera._id}_${selectedDate}`;
    scrollPosCache.set(key, window.scrollY);
    onSelectRecording(rec);
  };

  // Restore scroll position after recordings finish loading
  useEffect(() => {
    if (!loading && recordings.length > 0) {
      const key = `${camera._id}_${selectedDate}`;
      const savedY = scrollPosCache.get(key);
      if (savedY !== undefined && savedY > 0) {
        const timerId = setTimeout(() => {
          window.scrollTo({ top: savedY, behavior: 'instant' });
        }, 50);
        return () => clearTimeout(timerId);
      }
    }
  }, [loading, camera._id, selectedDate, recordings.length]);

  const handleDateChange = (newDate: string) => {
    userChangedDateRef.current = true;
    const formatted = newDate.replace(/-/g, '/');
    setSelectedDate(formatted);
    if (onDateChange) onDateChange(formatted);
  };

  // Group 1-minute raw recording segments into Continuous Hourly Stream Blocks
  const hourGroups = useMemo(() => {
    const map = new Map<number, RecordingItem[]>();
    const normalizedSelectedDate = selectedDate.replace(/-/g, '/');

    // Filter out clips that belong to a different date (e.g. previous/next day neighbor clips)
    const dateFilteredRecordings = recordings.filter((rec) => {
      if (!rec.startTime) return false;
      try {
        const d = new Date(rec.startTime);
        if (isNaN(d.getTime())) return false;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}/${m}/${dd}` === normalizedSelectedDate;
      } catch {
        return false;
      }
    });

    // Sort raw recordings chronologically first
    const sorted = [...dateFilteredRecordings].sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return timeA - timeB;
    });

    sorted.forEach((rec) => {
      if (!rec.startTime) return;
      try {
        const d = new Date(rec.startTime);
        const hr = d.getHours();
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

    if (camera.type === 'nvr' || (rec._id && rec._id.startsWith('nvr-'))) {
      const rawChan = camera.nvrChannelId || '1';
      const rtspChan = rawChan.length < 3 ? `${rawChan}01` : rawChan;
      
      const dStart = new Date(rec.startTime || selectedDate);
      const dEnd = rec.endTime ? new Date(rec.endTime) : new Date(dStart.getTime() + (rec.duration || 3600) * 1000);
      
      const yyyy1 = dStart.getFullYear();
      const mm1 = String(dStart.getMonth() + 1).padStart(2, '0');
      const dd1 = String(dStart.getDate()).padStart(2, '0');
      const hh1 = String(dStart.getHours()).padStart(2, '0');
      const mi1 = String(dStart.getMinutes()).padStart(2, '0');
      const ss1 = String(dStart.getSeconds()).padStart(2, '0');
      const startStr = `${yyyy1}${mm1}${dd1}T${hh1}${mi1}${ss1}Z`;

      const yyyy2 = dEnd.getFullYear();
      const mm2 = String(dEnd.getMonth() + 1).padStart(2, '0');
      const dd2 = String(dEnd.getDate()).padStart(2, '0');
      const hh2 = String(dEnd.getHours()).padStart(2, '0');
      const mi2 = String(dEnd.getMinutes()).padStart(2, '0');
      const ss2 = String(dEnd.getSeconds()).padStart(2, '0');
      const endStr = `${yyyy2}${mm2}${dd2}T${hh2}${mi2}${ss2}Z`;

      const rtspUrl = `rtsp://admin:16%40SnV%3FcR1@10.10.12.2:554/Streaming/tracks/${rtspChan}?starttime=${startStr}&endtime=${endStr}`;
      return `/api/stream.mp4?src=${encodeURIComponent(rtspUrl)}`;
    }

    return rec.videoUrl || (rec.videoPath ? resolveApiUrl(apiBaseUrl, rec.videoPath) : '');
  };

  const getVideoDownloadUrl = (rec?: RecordingItem): string => {
    if (!rec) return '';

    if (camera.type === 'nvr' || (rec._id && rec._id.startsWith('nvr-'))) {
      const rawChan = camera.nvrChannelId || '1';
      const rtspChan = rawChan.length < 3 ? `${rawChan}01` : rawChan;
      
      const dStart = new Date(rec.startTime || selectedDate);
      const dEnd = rec.endTime ? new Date(rec.endTime) : new Date(dStart.getTime() + (rec.duration || 3600) * 1000);
      
      const yyyy1 = dStart.getFullYear();
      const mm1 = String(dStart.getMonth() + 1).padStart(2, '0');
      const dd1 = String(dStart.getDate()).padStart(2, '0');
      const hh1 = String(dStart.getHours()).padStart(2, '0');
      const mi1 = String(dStart.getMinutes()).padStart(2, '0');
      const ss1 = String(dStart.getSeconds()).padStart(2, '0');
      const startStr = `${yyyy1}${mm1}${dd1}T${hh1}${mi1}${ss1}Z`;

      const yyyy2 = dEnd.getFullYear();
      const mm2 = String(dEnd.getMonth() + 1).padStart(2, '0');
      const dd2 = String(dEnd.getDate()).padStart(2, '0');
      const hh2 = String(dEnd.getHours()).padStart(2, '0');
      const mi2 = String(dEnd.getMinutes()).padStart(2, '0');
      const ss2 = String(dEnd.getSeconds()).padStart(2, '0');
      const endStr = `${yyyy2}${mm2}${dd2}T${hh2}${mi2}${ss2}Z`;

      const rtspUrl = `rtsp://admin:16%40SnV%3FcR1@10.10.12.2:554/Streaming/tracks/${rtspChan}?starttime=${startStr}&endtime=${endStr}`;
      // Use the ISAPI direct download API instead of the real-time transcoding stream
      return `/api/nvr/ISAPI/ContentMgmt/download?playbackURI=${encodeURIComponent(rtspUrl)}`;
    }

    // We explicitly construct the ABSOLUTE URL here to completely bypass the Vite proxy.
    // The Vite dev server's http-proxy drops long-running large MP4 transfers midway,
    // which causes the native browser downloader to mark the download as 'Failed: Site wasn't available'.
    const cleanPath = rec.videoPath.startsWith('/') ? rec.videoPath : `/${rec.videoPath}`;
    const cleanBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    const absoluteVidUrl = rec.videoUrl || `${cleanBase}${cleanPath}`;

    // Append token to bypass 401 errors on direct backend requests
    return absoluteVidUrl.includes('?') 
      ? `${absoluteVidUrl}&token=${encodeURIComponent(authToken)}` 
      : `${absoluteVidUrl}?token=${encodeURIComponent(authToken)}`;
  };

  return (
    <div className={`flex flex-col min-h-screen font-sans transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Sleek Enterprise Top Bar */}
      <div className={`border-b px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors ${
        isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToGrid}
            className={`px-3 py-1.5 rounded-lg transition border flex items-center gap-1 text-xs font-semibold ${
              isDark
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <div className={`h-4 w-px ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}></div>

          <div className="flex items-center gap-2.5">
            <h1 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {camera.name}
            </h1>
            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
              isDark ? 'text-indigo-300 bg-indigo-950/80 border-indigo-800/60' : 'text-indigo-700 bg-indigo-50 border-indigo-100'
            }`}>
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
            theme={theme}
          />

          <button
            onClick={() => loadRecordings(selectedDate)}
            className={`p-1.5 rounded-lg transition border ${
              isDark
                ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800 border-slate-700'
                : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-100 border-gray-200'
            }`}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Header Controls & View Options Toolbar */}
      <div className={`border-b px-6 py-3 ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            <div className="flex items-center gap-1.5">
              <Film className="w-4 h-4 text-indigo-500" />
              <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
                {hourGroups.length > 0 ? `${hourGroups.length} Hours` : 'No Recordings'}
              </span>
            </div>

            <span className={isDark ? 'text-slate-700' : 'text-gray-300'}>•</span>

            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>{selectedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Direction Toggle (Ascending 00:00 first) */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
              }`}
              title="Toggle Time Order (00:00 First)"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>{sortOrder === 'asc' ? 'From 00:00 (Top)' : 'From 23:00 (Top)'}</span>
              {sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            </button>

            {/* View Mode Toggle: Grid | List */}
            <div className={`flex items-center p-1 rounded-lg border text-xs ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'
            }`}>
              <button
                onClick={() => setViewType('grid')}
                className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                  viewType === 'grid'
                    ? isDark ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-indigo-600 shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
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
          <div className="py-20 flex flex-col items-center justify-center">
            <ModernLoadingSpinner
              label={`Loading ${camera.name} Recordings...`}
              sublabel={`Fetching Archives for ${selectedDate}`}
              isDark={isDark}
            />
          </div>
        ) : error ? (
          <div className={`flex flex-col items-center justify-center p-12 rounded-xl border text-center my-8 shadow-sm ${
            isDark ? 'bg-slate-900 border-red-900/60 text-white' : 'bg-white border-red-200 text-gray-900'
          }`}>
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <h3 className="text-sm font-bold">{error}</h3>
            <button
              onClick={() => loadRecordings(selectedDate)}
              className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 transition"
            >
              Retry
            </button>
          </div>
        ) : hourGroups.length === 0 ? (
          <div className={`flex flex-col items-center justify-center p-16 rounded-xl border border-dashed text-center my-8 shadow-sm ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <Video className="w-10 h-10 text-gray-500 mb-2" />
            <h3 className="text-sm font-semibold">No Recordings Found</h3>
            <p className="text-xs text-gray-400 mt-1">No video archive available for {selectedDate}.</p>
          </div>
        ) : viewType === 'grid' ? (
          /* Grid View: Continuous Hourly Stream Cards (Starting from 00:00 on top!) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {hourGroups.map((group) => {
              const totalMin = Math.round(group.totalDurationSec / 60);
              const firstClip = group.clips[0];
              const thumbUrl = resolveRecordingThumbnailUrl(apiBaseUrl, firstClip, authToken);
              const mediaUrl = getVideoMediaUrl(firstClip);
              const downloadUrl = getVideoDownloadUrl(firstClip);
              const isGroupActive = Boolean(activeRecording && group.clips.some(c => c._id === activeRecording._id));

              return (
                <div
                  key={group.hourNum}
                  onClick={() => handleSelectRecording(firstClip)}
                  className={`rounded-xl overflow-hidden cursor-pointer group flex flex-col justify-between transition-all duration-300 border ${
                    isGroupActive
                      ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-xl shadow-indigo-500/20 bg-indigo-950/20 scale-[1.02]'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 hover:border-indigo-500 shadow-sm hover:shadow-lg'
                      : 'bg-white border-gray-200 hover:border-indigo-400 shadow-sm hover:shadow-lg'
                  }`}
                >
                  {/* Hour Block Visual Thumbnail Header */}
                  <div className="relative h-44 bg-slate-950 overflow-hidden flex items-center justify-center">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt="Hour Thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-between p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white bg-indigo-600/90 px-2.5 py-0.5 rounded shadow-sm border border-indigo-400">
                          {group.hourLabel}
                        </span>

                        {isGroupActive ? (
                          <span className="text-[10px] font-extrabold text-white bg-emerald-500 px-2.5 py-0.5 rounded-full shadow-lg shadow-emerald-500/50 flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                            <span>NOW PLAYING</span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-300 bg-black/60 px-2 py-0.5 rounded border border-emerald-500/40">
                            {totalMin} min
                          </span>
                        )}
                      </div>

                      {/* Hover Play Button */}
                      <div className="self-center w-12 h-12 rounded-full bg-indigo-600/90 group-hover:bg-indigo-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition duration-300 border border-indigo-300">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Info */}
                  <div className={`p-3.5 flex items-center justify-between border-t ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
                  }`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span className={isDark ? 'text-slate-100' : 'text-gray-900'}>{group.hourLabel}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {downloadUrl && (
                        <button
                          onClick={(e) => handleStartDownload(e, downloadUrl, `OmniRecord_${camera.name}_${group.hourLabel.replace(/:/g, '-')}.mp4`)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border shadow-sm ${
                            isDark
                              ? 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border-emerald-700/60'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                          title="Download MP4 Recording"
                        >
                          <Download className={`w-3.5 h-3.5 ${downloadingItem ? 'animate-bounce text-emerald-500' : isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span>Download</span>
                        </button>
                      )}

                      <button className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-sm">
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View: Continuous Hourly Streams Table */
          <div className={`border rounded-xl overflow-hidden shadow-sm divide-y ${
            isDark ? 'bg-slate-900 border-slate-800 divide-slate-800' : 'bg-white border-gray-200 divide-gray-100'
          }`}>
            {hourGroups.map((group) => {
              const totalMin = Math.round(group.totalDurationSec / 60);
              const firstClip = group.clips[0];
              const thumbUrl = resolveRecordingThumbnailUrl(apiBaseUrl, firstClip, authToken);
              const mediaUrl = getVideoMediaUrl(firstClip);
              const downloadUrl = getVideoDownloadUrl(firstClip);

              return (
                <div
                  key={group.hourNum}
                  onClick={() => handleSelectRecording(firstClip)}
                  className={`p-4 flex items-center justify-between transition cursor-pointer group ${
                    isDark ? 'hover:bg-slate-800/60' : 'hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Video Thumbnail */}
                    <div className="w-24 h-14 bg-slate-900 rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center border border-gray-200">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
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
                      <div className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>{group.hourLabel}</span>
                      </div>
                      <div className="text-xs text-emerald-600 font-semibold mt-1">
                        {totalMin} min
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {downloadUrl && (
                      <button
                        onClick={(e) => handleStartDownload(e, downloadUrl, `OmniRecord_${camera.name}_${group.hourLabel.replace(/:/g, '-')}.mp4`)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border shadow-sm ${
                          isDark
                            ? 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border-emerald-700/60'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                        title="Download MP4 Video Stream"
                      >
                        <Download className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <span>Download MP4</span>
                      </button>
                    )}

                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Stream</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Main Screen Floating Download Status Badge & Progress UI */}
      {downloadingItem && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F121C]/95 border border-emerald-500/60 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-4 animate-bounce">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500 flex items-center justify-center text-emerald-400">
            <Download className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <span>Downloading MP4 Recording...</span>
            </span>
            <span className="text-[11px] font-mono text-gray-400 truncate max-w-[220px]">
              {downloadingItem}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
