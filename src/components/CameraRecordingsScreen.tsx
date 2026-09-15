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
  HardDrive,
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
        setError('Failed to fetch camera recordings. Please try again.');
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
        hourLabel: `${formattedHr}:00 - ${nextHr}:00 UTC`,
        hourNum: hr,
        clips,
        totalDurationSec,
      });
    });

    groups.sort((a, b) => b.hourNum - a.hourNum);
    return groups;
  }, [recordings]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Top Header / Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToGrid}
            className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition border border-gray-200 flex items-center gap-1.5 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Cameras</span>
          </button>

          <div className="h-6 w-px bg-gray-200"></div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                Day-Wise Recordings
              </span>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {activeCameraPath}
              </span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 mt-0.5 flex items-center gap-2">
              {camera.name}
            </h1>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-gray-700">Select Date:</span>
            <input
              type="date"
              value={formattedInputDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => loadRecordings(selectedDate)}
            className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition border border-gray-200"
            title="Refresh Recordings List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary Continuous Stream Banner */}
      {recordings.length > 0 && !loading && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-6 py-4 shadow-md border-b border-indigo-700">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Continuous Full-Day Archival
                </span>
              </div>
              <h2 className="text-base font-black mt-0.5">
                Play Continuous 24-Hour Recording Stream ({recordings.length} Clips Clubbed)
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Automatically plays full-day sequence across the Cupola ruler timeline with seamless transitions.
              </p>
            </div>

            <button
              onClick={() => onSelectRecording(recordings[0])}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 shrink-0 transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play Full Day Stream</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-Header / Summary Stats */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-500" />
              <span>
                Total Recordings:{' '}
                <strong className="text-gray-900 font-bold">{recordings.length}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>
                Date:{' '}
                <strong className="text-gray-900 font-bold">{selectedDate}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-500" />
              <span>
                Camera Stream:{' '}
                <strong className="text-gray-900 font-bold uppercase">{activeCameraPath}</strong>
              </span>
            </div>
          </div>

          {/* View Type Filter Toggles */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
            <button
              onClick={() => setViewType('grouped')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewType === 'grouped'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Clubbed by Hour ({hourGroups.length})</span>
            </button>

            <button
              onClick={() => setViewType('all')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewType === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Individual Clips ({recordings.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Recordings Content Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm animate-pulse space-y-4"
              >
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-20 bg-gray-100 rounded-xl"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-200 text-center my-8 shadow-sm">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <h3 className="text-base font-bold text-gray-900">{error}</h3>
            <p className="text-xs text-gray-500 mt-1">Please check your network connection or backend API.</p>
            <button
              onClick={() => loadRecordings(selectedDate)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-500 transition"
            >
              Retry Loading
            </button>
          </div>
        ) : recordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-200 text-center my-8 shadow-sm">
            <Video className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-800">No Recordings Found for {selectedDate}</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              There are no recorded video clips archived for {activeCameraPath} on the selected date. Please pick another date above.
            </p>
          </div>
        ) : viewType === 'grouped' ? (
          /* Hour Grouped View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Clubbed Hour Blocks ({hourGroups.length} Active Hours)
              </h2>
              <span className="text-xs text-gray-500">Select any hour block to launch continuous playback</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {hourGroups.map((group) => {
                const totalMin = Math.round(group.totalDurationSec / 60);
                const firstClip = group.clips[0];

                return (
                  <div
                    key={group.hourNum}
                    onClick={() => onSelectRecording(firstClip)}
                    className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between cursor-pointer hover:border-indigo-500 hover:shadow-lg transition group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {group.hourLabel}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        {group.clips.length} Clips ({totalMin} min)
                      </span>
                    </div>

                    <div className="my-2 bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5 text-xs text-gray-700">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stream Source:</span>
                        <span className="font-semibold">{activeCameraPath}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Playback Mode:</span>
                        <span className="font-semibold text-indigo-600">Continuous Auto-Advance</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 font-medium">Click to Play Hour</span>
                      <button className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 group-hover:scale-105">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Hour Stream</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Individual Clips View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Individual Recording Clips ({recordings.length})
              </h2>
              <span className="text-xs text-gray-500">Click any card to play in 360° viewer</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recordings.map((rec) => {
                const startTimeStr = rec.startTime
                  ? new Date(rec.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Recorded Stream';

                const durationSec = Math.round(rec.duration || 60);
                const durationMin = Math.floor(durationSec / 60);
                const durationRemSec = durationSec % 60;
                const formattedDuration = `${durationMin > 0 ? `${durationMin}m ` : ''}${durationRemSec}s`;

                const streamKeyDisplay = rec.key || (rec.videoPath ? rec.videoPath.split('/').pop() : rec.cameraPath || rec._id);

                return (
                  <div
                    key={rec._id}
                    onClick={() => onSelectRecording(rec)}
                    className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between cursor-pointer hover:border-indigo-500 hover:shadow-lg transition group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {startTimeStr}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                        {formattedDuration}
                      </span>
                    </div>

                    <div className="my-2 bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
                      <div className="text-xs text-gray-700 flex justify-between">
                        <span className="text-gray-500">Camera:</span>
                        <span className="font-semibold">{rec.cameraPath || camera.name}</span>
                      </div>
                      <div className="text-xs text-gray-700 flex justify-between">
                        <span className="text-gray-500">Stream Key:</span>
                        <span className="font-mono text-[11px] text-gray-600 truncate max-w-[170px]" title={streamKeyDisplay}>
                          {streamKeyDisplay}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-gray-400">ID: {rec._id.substring(0, 8)}...</span>
                      <button className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 group-hover:scale-105">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play 360° Patrol</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
