import React, { useState, useEffect } from 'react';
import type { Camera, RecordingItem } from '../types/camera';
import { fetchCameraRecordings } from '../services/apiService';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Video,
  Play,
  Film,
  HardDrive,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface CameraRecordingsScreenProps {
  camera: Camera;
  currentDate: string;
  apiBaseUrl: string;
  authToken: string;
  onBackToGrid: () => void;
  onSelectRecording: (recording: RecordingItem) => void;
}

export const CameraRecordingsScreen: React.FC<CameraRecordingsScreenProps> = ({
  camera,
  currentDate,
  apiBaseUrl,
  authToken,
  onBackToGrid,
  onSelectRecording,
}) => {
  // Format date to YYYY/MM/DD for API
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // Quick Date presets (Today, Yesterday, 2 days ago, etc.)
  const handleDateChange = (newDate: string) => {
    // Convert YYYY-MM-DD from input to YYYY/MM/DD
    const formatted = newDate.replace(/-/g, '/');
    setSelectedDate(formatted);
  };

  const formattedInputDate = selectedDate.split('/').join('-');

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
              <span className="text-xs text-gray-500 font-mono">
                {camera.relayUri}
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

      {/* Sub-Header / Summary Stats */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
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
                Camera Type:{' '}
                <strong className="text-gray-900 font-bold uppercase">{camera.type} 360°</strong>
              </span>
            </div>
          </div>

          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Storage Stream Synchronized
          </span>
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
              There are no recorded video clips archived for this camera on the selected date. Please pick another date above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Recording Clips ({recordings.length})
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

                return (
                  <div
                    key={rec._id}
                    onClick={() => onSelectRecording(rec)}
                    className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between cursor-pointer hover:border-indigo-500 hover:shadow-lg transition group relative overflow-hidden"
                  >
                    {/* Top Accent Pill */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {startTimeStr}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                        {formattedDuration}
                      </span>
                    </div>

                    {/* Content Preview */}
                    <div className="my-2 bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
                      <div className="text-xs text-gray-700 flex justify-between">
                        <span className="text-gray-500">Camera:</span>
                        <span className="font-semibold">{camera.name}</span>
                      </div>
                      <div className="text-xs text-gray-700 flex justify-between">
                        <span className="text-gray-500">Stream Key:</span>
                        <span className="font-mono text-[11px] text-gray-600 truncate max-w-[160px]">{rec.key || rec._id}</span>
                      </div>
                    </div>

                    {/* Footer Action */}
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
