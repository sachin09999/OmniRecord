import { useState, useEffect, useMemo } from 'react';
import type { PlantData, Camera, StickyNote, RecordingItem } from './types/camera';
import { fetchPlantData } from './services/apiService';
import { Header } from './components/Header';
import { RecordingGrid } from './components/RecordingGrid';
import { Panorama360Viewer } from './components/Panorama360Viewer';
import { StandardViewer } from './components/StandardViewer';
import { CameraRecordingsScreen } from './components/CameraRecordingsScreen';
import { FloatingStickyNote } from './components/FloatingStickyNote';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { ModernLoadingSpinner } from './components/ModernLoadingSpinner';
import {
  Compass,
  Video
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
  const [pageScreen, setPageScreen] = useState<'dashboard' | 'grid' | 'recordings' | 'viewer'>('dashboard');
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
        (cameraTypeFilter === 'rtsp' && (cam.type === 'rtsp' || cam.type === 'nvr'));

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
      <div className={`min-h-screen flex items-center justify-center transition-colors ${
        theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <ModernLoadingSpinner
          label="Initializing OmniRecord 360°"
          sublabel="Authenticating with Cupola Server"
          isDark={theme === 'dark'}
        />
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

  // Page 3: 360 Viewer Page (or Standard 2D Viewer for NVR)
  if (pageScreen === 'viewer' && activeCamera && plantData) {
    if (activeCamera.type === 'nvr') {
      return (
        <StandardViewer
          camera={activeCamera}
          activeRecording={selectedRecording}
          onClose={() => {
            setPageScreen('grid');
            setActiveCamera(null);
            setSelectedRecording(null);
          }}
          onBackToRecordings={() => {
            setPageScreen('recordings');
          }}
          currentDate={currentDate}
          onOpenStickyNotes={() => setIsStickyNotesOpen(true)}
        />
      );
    }
    
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
        {pageScreen === 'grid' && (
          <div className="flex items-center justify-between mb-2 mt-1">
            <button
              onClick={() => setPageScreen('dashboard')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm border transition ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200'
              }`}
            >
              <span className="text-lg leading-none">&larr;</span>
              <span>Back to Dashboard</span>
            </button>

            <span className={`text-xs hidden sm:inline ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
              Plant ID: <span className="font-mono">{plantData?._id}</span>
            </span>
          </div>
        )}

        {/* Dynamic Main Content: Dashboard vs Grid */}
        {pageScreen === 'dashboard' ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              {/* 360 Camera Card */}
              <div 
                onClick={() => {
                  setCameraTypeFilter('360');
                  setPageScreen('grid');
                }}
                className={`group relative overflow-hidden rounded-2xl cursor-pointer border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl flex flex-col ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-slate-700 hover:border-indigo-500 hover:shadow-indigo-500/20' 
                    : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-indigo-500/10'
                }`}
              >
                <div className="h-48 bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
                  <Compass className="w-24 h-24 text-indigo-400 opacity-20 absolute -right-4 -bottom-4 group-hover:scale-110 transition duration-500" />
                  <Compass className="w-16 h-16 text-indigo-300 group-hover:text-indigo-200 transition duration-300 z-10" />
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2">360° Patrol Cameras</h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                    View immersive, zero-latency 360-degree surveillance feeds with VR-style dragging and panning.
                  </p>
                  <div className="mt-6 flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-md">
                      {plantData?.cameras.filter((c) => c.type === '360').length || 0} Cameras
                    </span>
                  </div>
                </div>
              </div>

              {/* IP / Fixed Camera Card */}
              <div 
                onClick={() => {
                  setCameraTypeFilter('rtsp');
                  setPageScreen('grid');
                }}
                className={`group relative overflow-hidden rounded-2xl cursor-pointer border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl flex flex-col ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-slate-700 hover:border-emerald-500 hover:shadow-emerald-500/20' 
                    : 'bg-white border-gray-200 hover:border-emerald-400 hover:shadow-emerald-500/10'
                }`}
              >
                <div className="h-48 bg-gradient-to-br from-emerald-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
                  <Video className="w-24 h-24 text-emerald-400 opacity-20 absolute -right-4 -bottom-4 group-hover:scale-110 transition duration-500" />
                  <Video className="w-16 h-16 text-emerald-300 group-hover:text-emerald-200 transition duration-300 z-10" />
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2">Fixed IP Cameras (NVR)</h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                    Access standard 2D security cameras connected directly to the Hikvision NVR for crystal-clear monitoring.
                  </p>
                  <div className="mt-6 flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-bold bg-emerald-600 text-white rounded-md">
                      {plantData?.cameras.filter((c) => c.type === 'rtsp' || c.type === 'nvr').length || 0} Cameras
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </main>

      <FloatingStickyNote
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
