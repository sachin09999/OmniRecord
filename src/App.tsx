import { useState, useEffect, useMemo } from 'react';
import type { PlantData, Camera, StickyNote } from './types/camera';
import { fetchPlantData } from './services/apiService';
import { Header } from './components/Header';
import { RecordingGrid } from './components/RecordingGrid';
import { Panorama360Viewer } from './components/Panorama360Viewer';
import { FloorplanMinimap } from './components/FloorplanMinimap';
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

  const [currentDate, setCurrentDate] = useState<string>('2026/09/12');
  const [selectedSite, setSelectedSite] = useState<string>('UAE-OFFICE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [cameraTypeFilter, setCameraTypeFilter] = useState<'all' | '360' | 'rtsp'>('all');

  const [activeCamera, setActiveCamera] = useState<Camera | null>(null);
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
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-slate-200">
        <Radio className="w-8 h-8 text-blue-500 animate-pulse mb-3" />
        <h2 className="text-sm font-semibold text-slate-200">
          Loading OmniRecord...
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-5 flex flex-col gap-4">
        
        {/* DEBUG BANNER FOR SCREENSHOT */}
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg text-[10px] font-mono break-all mb-4 shadow-lg shadow-red-900/20">
          <strong>DEBUG (Please screenshot this block):</strong><br />
          {plantData?._debugRecordingsFetch && (
            <div className="text-cyan-300 mb-2">Recordings API Fetch: {plantData._debugRecordingsFetch}</div>
          )}
          {plantData?.cameras && plantData.cameras.length > 0 ? (
            Object.keys(plantData.cameras[0]).filter(k => !['icons', 'x', 'y', 'panoramaUrl', 'thumbnailUrl'].includes(k)).map(key => (
              <span key={key} className="mr-3">
                <strong className="text-white">{key}:</strong> {String((plantData.cameras[0] as any)[key])}
              </span>
            ))
          ) : 'No cameras loaded yet.'}
        </div>

        {/* Simple Category Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCameraTypeFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                cameraTypeFilter === 'all'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Cameras ({plantData?.cameras.length})</span>
            </button>

            <button
              onClick={() => setCameraTypeFilter('360')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                cameraTypeFilter === '360'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>360° Patrol ({plantData?.cameras.filter((c) => c.type === '360').length})</span>
            </button>

            <button
              onClick={() => setCameraTypeFilter('rtsp')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                cameraTypeFilter === 'rtsp'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>RTSP Feeds ({plantData?.cameras.filter((c) => c.type === 'rtsp').length})</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            Plant ID: <span className="font-mono text-slate-300">{plantData?._id}</span>
          </span>
        </div>

        {/* View Mode Content */}
        {viewMode === 'map' ? (
          <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 flex flex-col items-center gap-3">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-400" /> 2D Plant Floorplan Overview
              </h3>
              <span className="text-xs text-slate-400">Click any camera pin to view camera</span>
            </div>

            <div className="w-full max-w-4xl h-[480px]">
              <FloorplanMinimap
                cameras={filteredCameras}
                currentCamera={filteredCameras[0] || plantData?.cameras[0]}
                onSelectCamera={(cam) => setActiveCamera(cam)}
                renderFile={plantData?.renderFile || ''}
                currentYaw={180}
                isExpanded={true}
              />
            </div>
          </div>
        ) : (
          <RecordingGrid
            cameras={filteredCameras}
            onSelectCamera={(cam) => setActiveCamera(cam)}
            currentDate={currentDate}
            selectedSite={selectedSite}
            viewMode={viewMode}
            onAddStickyNote={(cam) => {
              setActiveCamera(cam);
              setIsStickyNotesOpen(true);
            }}
          />
        )}
      </main>

      {/* 360 VR Player Modal */}
      {activeCamera && plantData && (
        <Panorama360Viewer
          camera={activeCamera}
          allCameras={plantData.cameras}
          renderFile={plantData.renderFile}
          onClose={() => setActiveCamera(null)}
          onSelectCamera={(cam) => setActiveCamera(cam)}
          currentDate={currentDate}
          onOpenStickyNotes={() => setIsStickyNotesOpen(true)}
          apiBaseUrl={apiBaseUrl}
          authToken={authToken}
        />
      )}

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
