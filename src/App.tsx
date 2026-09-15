import { useState, useEffect, useMemo } from 'react';
import type { PlantData, Camera, StickyNote, RecordingItem } from './types/camera';
import { fetchPlantData } from './services/apiService';
import { Header } from './components/Header';
import { RecordingGrid } from './components/RecordingGrid';
import { Panorama360Viewer } from './components/Panorama360Viewer';
import { CameraRecordingsScreen } from './components/CameraRecordingsScreen';
import { StickyNotesDrawer } from './components/StickyNotesDrawer';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import {
  Radio,
  Compass,
  Video,
  Layers
} from 'lucide-react';

export function App() {
  const [plantData, setPlantData] = useState<PlantData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('http://10.10.12.50:3000');
  const [plantId, setPlantId] = useState<string>('6a38fb720ab1620742c32c96');
  const [authToken, setAuthToken] = useState<string>('');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('omni_theme') as 'light' | 'dark') || 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('omni_theme', next);
      return next;
    });
  };

  const [currentDate, setCurrentDate] = useState<string>(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd}`;
  });
  const [selectedSite, setSelectedSite] = useState<string>('UAE-OFFICE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [cameraTypeFilter, setCameraTypeFilter] = useState<'all' | '360' | 'rtsp'>('all');

  // Multi-page navigation state
  const [pageScreen, setPageScreen] = useState<'grid' | 'recordings' | 'viewer'>('grid');
  const [activeCamera, setActiveCamera] = useState<Camera | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<RecordingItem | null>(null);

  const [isStickyNotesOpen, setIsStickyNotesOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([
    {
      id: 'n-1',
      cameraId: '6a354cc97e120cca57eb21b9',
      cameraName: 'WorkStation_RTMP_35',
      timestamp: '09:12:45',
      date: '2026-09-12',
      text: 'Routine patrol sweep complete. All workstations clear.',
      author: 'Patrol Operator',
      color: 'yellow',
    },
  ]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchPlantData(apiBaseUrl, plantId, authToken).then((data) => {
      if (isMounted) {
        setPlantData(data);
        setLoading(false);
        setIsLiveConnected(data._id === plantId);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, plantId, authToken]);

  const filteredCameras = useMemo(() => {
    if (!plantData) return [];
    return plantData.cameras.filter((cam) => {
      const matchesSearch =
        cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.relayUri.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.path.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        cameraTypeFilter === 'all' ||
        (cameraTypeFilter === '360' && cam.type === '360') ||
        (cameraTypeFilter === 'rtsp' && cam.type === 'rtsp');

      return matchesSearch && matchesType;
    });
  }, [plantData, searchQuery, cameraTypeFilter]);

  const handleAddStickyNote = (note: Omit<StickyNote, 'id'>) => {
    const newNote: StickyNote = {
      ...note,
      id: `n-${Date.now()}`,
    };
    setStickyNotes((prev) => [newNote, ...prev]);
  };

  const handleDeleteStickyNote = (id: string) => {
    setStickyNotes((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-700">
        <Radio className="w-8 h-8 text-indigo-600 animate-pulse mb-3" />
        <h2 className="text-sm font-semibold text-gray-700">
          Loading OmniRecord...
        </h2>
      </div>
    );
  }

  // Page 2: Day-Wise Recordings Screen
  if (pageScreen === 'recordings' && activeCamera) {
    return (
      <CameraRecordingsScreen
        camera={activeCamera}
        currentDate={currentDate}
        onDateChange={(newDate) => setCurrentDate(newDate)}
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        theme={theme}
        activeRecording={selectedRecording}
        onBackToGrid={() => {
          setPageScreen('grid');
          setActiveCamera(null);
        }}
        onSelectRecording={(recording) => {
          setSelectedRecording(recording);
          setPageScreen('viewer');
        }}
      />
    );
  }

  // Page 3: 360 Viewer Page
  if (pageScreen === 'viewer' && activeCamera && plantData) {
    return (
      <Panorama360Viewer
        camera={activeCamera}
        activeRecording={selectedRecording}
        allCameras={plantData.cameras}
        renderFile={plantData.renderFile}
        onClose={() => {
          setPageScreen('grid');
          setActiveCamera(null);
          setSelectedRecording(null);
        }}
        onBackToRecordings={() => {
          setPageScreen('recordings');
        }}
        onSelectCamera={(cam) => {
          setActiveCamera(cam);
          setPageScreen('recordings');
        }}
        currentDate={currentDate}
        onOpenStickyNotes={() => setIsStickyNotesOpen(true)}
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
      />
    );
  }

  // Page 1: Main Camera Overview & Grid Page
  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        selectedSite={selectedSite}
        onSiteChange={setSelectedSite}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        liveStatus={isLiveConnected}
        totalCameras={plantData?.cameras.length || 0}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-5 flex flex-col gap-4">
        {/* Simple Category Tabs */}
        <div className={`flex items-center justify-between border-b pb-3 ${
          theme === 'dark' ? 'border-slate-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCameraTypeFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                cameraTypeFilter === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800'
                  : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Cameras ({plantData?.cameras.length})</span>
            </button>

            <button
              onClick={() => setCameraTypeFilter('360')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                cameraTypeFilter === '360'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800'
                  : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>360° Patrol ({plantData?.cameras.filter((c) => c.type === '360').length})</span>
            </button>

            <button
              onClick={() => setCameraTypeFilter('rtsp')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                cameraTypeFilter === 'rtsp'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800'
                  : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>RTSP Feeds ({plantData?.cameras.filter((c) => c.type === 'rtsp').length})</span>
            </button>
          </div>

          <span className={`text-xs hidden sm:inline ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
            Plant ID: <span className="font-mono">{plantData?._id}</span>
          </span>
        </div>

        {/* View Mode Content */}
        <RecordingGrid
          cameras={filteredCameras}
          onSelectCamera={(cam) => {
            setActiveCamera(cam);
            setPageScreen('recordings');
          }}
          onSelectLiveCamera={(cam) => {
            setActiveCamera(cam);
            setSelectedRecording(null);
            setPageScreen('viewer');
          }}
          currentDate={currentDate}
          selectedSite={selectedSite}
          viewMode={viewMode}
          theme={theme}
          onAddStickyNote={(cam) => {
            setActiveCamera(cam);
            setIsStickyNotesOpen(true);
          }}
        />
      </main>

      {/* Sticky Notes Drawer */}
      <StickyNotesDrawer
        isOpen={isStickyNotesOpen}
        onClose={() => setIsStickyNotesOpen(false)}
        stickyNotes={stickyNotes}
        onAddNote={handleAddStickyNote}
        onDeleteNote={handleDeleteStickyNote}
        cameras={plantData?.cameras || []}
        activeCamera={activeCamera}
        currentDate={currentDate}
      />

      {/* API Settings Modal */}
      <ApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiBaseUrl={apiBaseUrl}
        plantId={plantId}
        authToken={authToken}
        onSave={(url, pid, token) => {
          setApiBaseUrl(url);
          setPlantId(pid);
          setAuthToken(token);
        }}
        isLiveConnected={isLiveConnected}
      />
    </div>
  );
}
