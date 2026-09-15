import React, { useState, useEffect, useMemo } from 'react';
import type { Camera, RecordingItem } from '../types/camera';
import { fetchCameraRecordings, extractCameraPath } from '../services/apiService';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Video,
  Play,
  Film,
  RefreshCw,
  AlertCircle,
  Layers,
  List
} from 'lucide-react';

interface CameraRecordingsScreenProps {
  camera: Camera;
  currentDate: string;
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
  apiBaseUrl,
  authToken,
  onBackToGrid,
  onSelectRecording,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'grouped' | 'all'>('grouped');

  const activeCameraPath = extractCameraPath(camera);

  const loadRecordings = (dateStr: string) => {
    setLoading(true);
    setError(null);

    fetchCameraRecordings(apiBaseUrl, camera, dateStr, undefined, undefined, authToken)
      .then((res) => {
        setRecordings(res.recordings);
        setLoading(false);
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
    const formatted = newDate.replace(/-/g, '/');
    setSelectedDate(formatted);
  };

  const formattedInputDate = selectedDate.split('/').join('-');

  // Group 1-minute recordings into continuous Hour Blocks
  const hourGroups = useMemo(() => {
    const map = new Map<number, RecordingItem[]>();
    recordings.forEach((rec) => {
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

    groups.sort((a, b) => b.hourNum - a.hourNum);
    return groups;
  }, [recordings]);

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

        {/* Date Selector & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="date"
              value={formattedInputDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => loadRecordings(selectedDate)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition border border-gray-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Header Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <Film className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-gray-900">{recordings.length} Recordings</span>
            </div>

            <span className="text-gray-300">•</span>

            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-gray-900">{hourGroups.length} Hours Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
              <button
                onClick={() => setViewType('grouped')}
                className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                  viewType === 'grouped'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Hourly Blocks</span>
              </button>

              <button
                onClick={() => setViewType('all')}
                className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                  viewType === 'all'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Clips</span>
              </button>
            </div>

            {/* Play All Button */}
            {recordings.length > 0 && !loading && (
              <button
                onClick={() => onSelectRecording(recordings[0])}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Full Day</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Recordings Content Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-pulse space-y-3"
              >
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-100 rounded-lg"></div>
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
        ) : recordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-gray-200 border-dashed text-center my-8 shadow-sm">
            <Video className="w-10 h-10 text-gray-300 mb-2" />
            <h3 className="text-sm font-semibold text-gray-700">No Recordings Found</h3>
            <p className="text-xs text-gray-400 mt-1">No video archive available for {selectedDate}.</p>
          </div>
        ) : viewType === 'grouped' ? (
          /* Hour Grouped View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hourGroups.map((group) => {
              const totalMin = Math.round(group.totalDurationSec / 60);
              const firstClip = group.clips[0];

              return (
                <div
                  key={group.hourNum}
                  onClick={() => onSelectRecording(firstClip)}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between cursor-pointer hover:border-indigo-500 hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      {group.hourLabel}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {group.clips.length} clips • {totalMin}m
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Continuous Stream</span>
                    <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Individual Clips View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordings.map((rec) => {
              const startTimeStr = rec.startTime
                ? new Date(rec.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Recorded Stream';

              const durationSec = Math.round(rec.duration || 60);
              const streamKeyDisplay = rec.key || (rec.videoPath ? rec.videoPath.split('/').pop() : rec.cameraPath || rec._id);

              return (
                <div
                  key={rec._id}
                  onClick={() => onSelectRecording(rec)}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between cursor-pointer hover:border-indigo-500 hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {startTimeStr}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{durationSec}s</span>
                  </div>

                  <div className="text-[11px] font-mono text-gray-400 truncate my-1" title={streamKeyDisplay}>
                    {streamKeyDisplay}
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400">{rec._id.substring(0, 8)}</span>
                    <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
