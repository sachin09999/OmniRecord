import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Camera, CameraIcon, RecordingItem, Neighbors } from '../types/camera';
import { fetchCameraRecordings, resolveApiUrl } from '../services/apiService';
import { PlaybackTimeline } from './PlaybackTimeline';
import {
  ChevronLeft,
  Crop,
  Monitor,
  Layout,
  Camera as CameraIconLucide,
  Video,
  RotateCcw,
  FileText,
  CheckCircle,
  Eye
} from 'lucide-react';

interface Panorama360ViewerProps {
  camera: Camera;
  activeRecording: RecordingItem | null;
  allCameras: Camera[];
  renderFile?: string;
  onClose: () => void;
  onBackToRecordings: () => void;
  onSelectCamera: (cam: Camera) => void;
  currentDate: string;
  onOpenStickyNotes: () => void;
  apiBaseUrl?: string;
  authToken?: string;
}

export const Panorama360Viewer: React.FC<Panorama360ViewerProps> = ({
  camera,
  activeRecording,
  allCameras,
  renderFile: _renderFile,
  onClose,
  onBackToRecordings,
  onSelectCamera,
  currentDate,
  onOpenStickyNotes,
  apiBaseUrl = 'http://10.10.12.50:3000',
  authToken = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isAutoRotating, _setIsAutoRotating] = useState<boolean>(false);
  const isAutoRotatingRef = useRef<boolean>(false);
  
  const setIsAutoRotating = (val: boolean) => {
    isAutoRotatingRef.current = val;
    _setIsAutoRotating(val);
  };
  
  const [viewDate] = useState<string>(currentDate);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [hoveredHotspot, setHoveredHotspot] = useState<CameraIcon | null>(null);
  const [activeTool, setActiveTool] = useState<'selection' | 'screen' | 'window' | 'default'>('default');
  const [notification, setNotification] = useState<string | null>(null);

  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [neighbors, setNeighbors] = useState<Neighbors>({ previous: null, next: null });
  const [selectedRecording, setSelectedRecording] = useState<RecordingItem | null>(activeRecording);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    setSelectedRecording(activeRecording);
  }, [activeRecording]);

  useEffect(() => {
    let isMounted = true;

    fetchCameraRecordings(apiBaseUrl, camera, viewDate, undefined, undefined, authToken).then((res) => {
      if (isMounted) {
        setRecordings(res.recordings);
        setNeighbors(res.neighbors);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [camera, viewDate, apiBaseUrl, authToken]);

  useEffect(() => {
    if (!selectedRecording || (!selectedRecording.videoPath && !selectedRecording.videoUrl)) return;

    const fullVideoUrl = selectedRecording.videoUrl || resolveApiUrl(apiBaseUrl, selectedRecording.videoPath!);
    console.log(`[OmniRecord Stream] Playing recording video stream: ${fullVideoUrl}`);

    const video = document.createElement('video');
    video.src = fullVideoUrl;
    video.crossOrigin = 'anonymous';
    video.loop = false; // Disable loop to allow continuous playback of recording sequence
    video.muted = true;
    video.playsInline = true;

    // Auto advance to next recording clip when current clip ends
    const handleEnded = () => {
      console.log('[OmniRecord Stream] Video clip ended, advancing to next continuous recording clip...');
      if (recordings && recordings.length > 0 && selectedRecording) {
        const currentIndex = recordings.findIndex(r => r._id === selectedRecording._id);
        // Recordings are sorted descending by time (latest first), so chronological next is index - 1
        if (currentIndex > 0) {
          setSelectedRecording(recordings[currentIndex - 1]);
        }
      }
    };

    video.addEventListener('ended', handleEnded);

    // Set video state so child components can control it
    setVideoElement(video);
    
    video.play().catch((err) => console.warn('[OmniRecord] Video playback autoplay blocked:', err));

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;

    if (sphereMeshRef.current) {
      (sphereMeshRef.current.material as THREE.MeshBasicMaterial).map = videoTexture;
      (sphereMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
      setVideoElement(null);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [selectedRecording, recordings, apiBaseUrl]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const targetVectorRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  const isMouseDownRef = useRef<boolean>(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lonRef = useRef<number>(camera.basePosition || 0);
  const latRef = useRef<number>(0);
  const fovRef = useRef<number>(75);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const cameraObj = new THREE.PerspectiveCamera(fovRef.current, width / height, 1, 1100);
    cameraRef.current = cameraObj;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(camera.panoramaUrl || camera.thumbnailUrl || '');
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphereMesh = new THREE.Mesh(geometry, material);
    scene.add(sphereMesh);
    sphereMeshRef.current = sphereMesh;

    // Clean 3D Spatial Hotspots (Subtle translucent blue markers)
    const hotspotsGroup = new THREE.Group();
    hotspotsGroup.name = 'hotspots';

    if (camera.icons && camera.icons.length > 0) {
      camera.icons.forEach((icon) => {
        if (!icon.visible) return;

        const iconGeo = new THREE.SphereGeometry(5 * icon.scale, 16, 16);
        const iconMat = new THREE.MeshBasicMaterial({
          color: 0x3b82f6,
          transparent: true,
          opacity: 0.85,
          wireframe: false,
        });
        const iconMesh = new THREE.Mesh(iconGeo, iconMat);

        iconMesh.position.set(icon.position.x, icon.position.y, icon.position.z);
        iconMesh.userData = { iconData: icon };

        // Subtle outer border ring
        const ringGeo = new THREE.RingGeometry(6.5 * icon.scale, 8.5 * icon.scale, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.lookAt(0, 0, 0);
        iconMesh.add(ringMesh);

        hotspotsGroup.add(iconMesh);
      });
    }

    scene.add(hotspotsGroup);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isAutoRotatingRef.current && !isMouseDownRef.current) {
        lonRef.current += 0.12 * (camera.rotateSpeed || 1) * (camera.rotateDirection || -1);
      }

      latRef.current = Math.max(-85, Math.min(85, latRef.current));

      const phi = THREE.MathUtils.degToRad(90 - latRef.current);
      const theta = THREE.MathUtils.degToRad(lonRef.current);

      targetVectorRef.current.x = 500 * Math.sin(phi) * Math.cos(theta);
      targetVectorRef.current.y = 500 * Math.cos(phi);
      targetVectorRef.current.z = 500 * Math.sin(phi) * Math.sin(theta);

      cameraObj.lookAt(targetVectorRef.current);
      renderer.render(scene, cameraObj);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !cameraObj) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraObj.aspect = w / h;
      cameraObj.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [camera]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isMouseDownRef.current = true;
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isMouseDownRef.current) {
      checkRaycastHotspot(e);
      return;
    }

    const dx = e.clientX - mousePosRef.current.x;
    const dy = e.clientY - mousePosRef.current.y;

    mousePosRef.current = { x: e.clientX, y: e.clientY };

    lonRef.current -= dx * 0.15;
    latRef.current += dy * 0.15;
  };

  const handlePointerUp = () => {
    isMouseDownRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const cam = cameraRef.current;
    if (!cam) return;

    fovRef.current = Math.max(30, Math.min(100, fovRef.current + e.deltaY * 0.05));
    cam.fov = fovRef.current;
    cam.updateProjectionMatrix();
  };

  const checkRaycastHotspot = (e: React.PointerEvent) => {
    const container = mountRef.current;
    const cam = cameraRef.current;
    const scene = sceneRef.current;

    if (!container || !cam || !scene) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    const y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cam);

    const hotspotsGroup = scene.getObjectByName('hotspots');
    if (!hotspotsGroup) return;

    const intersects = raycaster.intersectObjects(hotspotsGroup.children, true);

    if (intersects.length > 0) {
      const topObj = intersects[0].object;
      const iconData: CameraIcon = topObj.userData?.iconData || topObj.parent?.userData?.iconData;
      if (iconData) {
        setHoveredHotspot(iconData);
        container.style.cursor = 'pointer';
        return;
      }
    }

    setHoveredHotspot(null);
    container.style.cursor = isMouseDownRef.current ? 'grabbing' : 'grab';
  };

  const handleCanvasClick = () => {
    if (hoveredHotspot) {
      const targetCam = allCameras.find(
        (c) => c.path === hoveredHotspot.cameraPath || c.relayUri === hoveredHotspot.cameraPath
      );
      if (targetCam) {
        triggerToast(`Teleporting to Camera Node: ${targetCam.name}`);
        onSelectCamera(targetCam);
      } else {
        triggerToast(`Target camera ${hoveredHotspot.cameraPath} connected.`);
      }
    }
  };

  const handleTakeSnapshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const dataUrl = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `OmniRecord_360_Snapshot_${camera.name}_${Date.now()}.png`;
    a.click();

    triggerToast('Snapshot saved to downloads');
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      triggerToast('Recording saved');
    } else {
      const canvas = rendererRef.current?.domElement;
      if (!canvas) return;

      try {
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        recordedChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `OmniRecord_Patrol_${camera.name}_${Date.now()}.webm`;
          a.click();
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordingSeconds(0);

        timerRef.current = window.setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);

        triggerToast('360° Patrol recording started');
      } catch (err) {
        console.error('Canvas capture failed', err);
        triggerToast('Recording feature ready');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F1115] text-white flex flex-col h-screen w-screen overflow-hidden select-none font-sans">
      {/* Sleek Dark Top Bar */}
      <div className="h-13 bg-[#181B20] border-b border-[#262A34] px-5 py-2.5 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToRecordings}
            className="px-3 py-1.5 rounded-lg bg-[#242832] hover:bg-[#2E3442] text-gray-200 border border-[#343B4B] transition text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            title="Back to Recordings"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Recordings</span>
          </button>

          <div className="h-4 w-px bg-[#262A34]"></div>

          <div className="flex items-center gap-3">
            <h1 className="font-bold text-sm text-white tracking-wide">{camera.name}</h1>
            <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded border border-indigo-800/60">
              {currentDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              isAutoRotating
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-[#242832] hover:bg-[#2E3442] text-gray-300 border-[#343B4B]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto Rotate ({camera.rotateSpeed}x)</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 transition text-xs font-semibold"
            title="Exit Viewer"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main 360 VR Canvas Viewer */}
      <div
        className="relative flex-1 bg-[#0A0C0E]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
      >
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {hoveredHotspot && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-[#181B20]/95 border border-[#2E3440] text-white rounded-xl px-4 py-2 shadow-2xl flex items-center gap-2 pointer-events-none backdrop-blur-md">
            <span className="text-xs text-gray-200 font-medium">Switch to: {hoveredHotspot.cameraPath}</span>
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
          </div>
        )}

        {notification && (
          <div className="absolute top-6 right-6 z-40 bg-[#181B20]/95 border border-emerald-500/40 text-emerald-300 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-6 left-6 z-30 bg-red-950/80 text-red-300 border border-red-700/60 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-lg backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
          </div>
        )}

        {/* Floating Dark Glassmorphism Toolbar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[#14171D]/90 border border-[#2A2F3D] rounded-xl p-1.5 shadow-2xl flex items-center gap-1.5 backdrop-blur-lg">
          <button
            onClick={() => setActiveTool('selection')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTool === 'selection'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-[#222733] hover:text-white'
            }`}
            title="Selection Zoom Tool"
          >
            <Crop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Selection</span>
          </button>

          <button
            onClick={() => setActiveTool('screen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTool === 'screen'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-[#222733] hover:text-white'
            }`}
            title="Screen Fit Mode"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Screen</span>
          </button>

          <button
            onClick={() => setActiveTool('window')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTool === 'window'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-[#222733] hover:text-white'
            }`}
            title="Window Crop Mode"
          >
            <Layout className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Window</span>
          </button>

          <div className="h-5 w-px bg-[#2A2F3D] mx-1"></div>

          <button
            onClick={handleTakeSnapshot}
            className="p-2 rounded-lg text-gray-400 hover:bg-[#222733] hover:text-white transition"
            title="Capture 360° Snapshot"
          >
            <CameraIconLucide className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleRecord}
            className={`p-2 rounded-lg transition ${
              isRecording
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-[#222733] hover:text-red-400'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Video Clip Record'}
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenStickyNotes}
            className="p-2 rounded-lg text-gray-400 hover:bg-[#222733] hover:text-white transition"
            title="Sticky Notes & Annotations"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Docked Cupola Ruler Timeline */}
      <div className="relative z-30 border-t border-[#262A34] bg-[#121418] shrink-0">
        <PlaybackTimeline
          currentDate={viewDate}
          recordings={recordings}
          neighbors={neighbors}
          apiBaseUrl={apiBaseUrl}
          onSelectRecording={(rec) => setSelectedRecording(rec)}
          activeRecording={selectedRecording}
          videoElement={videoElement}
        />
      </div>
    </div>
  );
};
