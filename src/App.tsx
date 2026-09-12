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
  Database,
  CheckCircle2,
  Layers
} from 'lucide-react';

export function App() {
  const [plantData, setPlantData] = useState<PlantData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('http://10.10.12.50:3000');
  const [plantId, setPlantId] = useState<string>('6a38fb720ab1620742c32c96');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // UI state matching Cupola 360 Patrol History
  const [currentDate, setCurrentDate] = useState<string>('2026/09/12');
  const [selectedSite, setSelectedSite] = useState<string>('UAE-OFFICE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [cameraTypeFilter, setCameraTypeFilter] = useState<'all' | '360' | 'rtsp'>('all');

  // Selected camera for 360 viewer modal
  const [activeCamera, setActiveCamera] = useState<Camera | null>(null);

  // Sticky notes & modals
  const [isStickyNotesOpen, setIsStickyNotesOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([
    {
      id: 'n-1',
      cameraId: '6a354cc97e120cca57eb21b9',
      cameraName: 'WorkStation_RTMP_35',
      timestamp: '09:12:45',
      date: '2026-09-12',
      text: 'Routine patrol sweep complete. All workstations secured and clear.',
      author: 'Security Lead',
      color: 'yellow',
    },
    {
      id: 'n-2',
      cameraId: '6a38fb8f0ab1620742c32d40',
      cameraName: 'Reception_RTMP_30',
      timestamp: '08:45:10',
      date: '2026-09-12',
      text: 'Visitor log verified at front reception desk.',
      author: 'Patrol Officer',
      color: 'cyan',
    },
  ]);

  // Load Plant Data on mount or when API config changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchPlantData(apiBaseUrl, plantId).then((data) => {
      if (isMounted) {
        setPlantData(data);
        setLoading(false);
        setIsLiveConnected(data._id === plantId);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, plantId]);

  // Filtered cameras based on search and camera type
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
      <div className="min-h-screen bg-[#070A11] flex flex-col items-center justify-center text-slate-200">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30 animate-pulse border border-cyan-300/40">
            <Radio className="w-8 h-8 text-cyan-200 animate-spin-slow" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        </div>
        <h2 className="text-xl font-black bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent tracking-wide">
          OmniRecord Patrol Engine
        </h2>
        <p className="text-xs text-slate-400 mt-2 font-mono">
          Fetching Cupola 360° Plant feeds & 3D Spatial Nodes ({selectedSite})...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar Header */}
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

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Plant Overview Banner matching Cupola 360+ Patrol HISTORY */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/20">
              <Database className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-100">{selectedSite} Patrol Center</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Plant Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Plant ID: <span className="text-cyan-300">{plantData?._id}</span> | Updated: {currentDate} 09:12:38
              </p>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setCameraTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                cameraTypeFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All ({plantData?.cameras.length})</span>
            </button>

            <button
              onClick={() => setCameraTypeFilter('360')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                cameraTypeFilter === '360'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>360° Patrol ({plantData?.cameras.filter((c) => c.type === '360').length})</span>
            </button>

            <button
              onClick={() => setCameraTypeFilter('rtsp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                cameraTypeFilter === 'rtsp'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>RTSP Feeds ({plantData?.cameras.filter((c) => c.type === 'rtsp').length})</span>
            </button>
          </div>
        </div>

        {/* View Content: Grid / List vs 2D CAD Floorplan Map Mode */}
        {viewMode === 'map' ? (
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 bg-slate-950 flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <Compass className="w-4 h-4" /> 2D Plant Floorplan Radar Overview
              </h3>
              <span className="text-xs text-slate-400">Click any camera pin to launch 360° Player</span>
            </div>

            <div className="w-full max-w-4xl h-[500px]">
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
            viewMode={viewMode}
            onAddStickyNote={(cam) => {
              setActiveCamera(cam);
              setIsStickyNotesOpen(true);
            }}
          />
        )}
      </main>

      {/* 360 VR WebGL Viewer Fullscreen Modal */}
      {activeCamera && plantData && (
        <Panorama360Viewer
          camera={activeCamera}
          allCameras={plantData.cameras}
          renderFile={plantData.renderFile}
          onClose={() => setActiveCamera(null)}
          onSelectCamera={(cam) => setActiveCamera(cam)}
          currentDate={currentDate}
          onOpenStickyNotes={() => setIsStickyNotesOpen(true)}
        />
      )}

      {/* Sticky Notes Annotations Drawer */}
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
        onSave={(url, pid) => {
          setApiBaseUrl(url);
          setPlantId(pid);
        }}
        isLiveConnected={isLiveConnected}
      />
    </div>
  );
}
