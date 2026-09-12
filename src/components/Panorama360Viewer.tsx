import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Camera, CameraIcon, RecordingItem, Neighbors } from '../types/camera';
import { fetchCameraRecordings } from '../services/apiService';
import { FloorplanMinimap } from './FloorplanMinimap';
import { PlaybackTimeline } from './PlaybackTimeline';
import {
  ChevronLeft,
  Settings,
  Crop,
  Monitor,
  Layout,
  Camera as CameraIconLucide,
  Video,
  Play,
  RotateCcw,
  FileText,
  CheckCircle,
  Eye
} from 'lucide-react';

interface Panorama360ViewerProps {
  camera: Camera;
  allCameras: Camera[];
  renderFile: string;
  onClose: () => void;
  onSelectCamera: (cam: Camera) => void;
  currentDate: string;
  onOpenStickyNotes: () => void;
  apiBaseUrl?: string;
}

export const Panorama360Viewer: React.FC<Panorama360ViewerProps> = ({
  camera,
  allCameras,
  renderFile,
  onClose,
  onSelectCamera,
  currentDate,
  onOpenStickyNotes,
  apiBaseUrl = 'http://10.10.12.50:3000',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [currentYaw, setCurrentYaw] = useState<number>(camera.basePosition || 0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [showTimeline, setShowTimeline] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [hoveredHotspot, setHoveredHotspot] = useState<CameraIcon | null>(null);
  const [activeTool, setActiveTool] = useState<'selection' | 'screen' | 'window' | 'default'>('default');
  const [minimapExpanded, setMinimapExpanded] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [neighbors, setNeighbors] = useState<Neighbors>({ previous: null, next: null });
  const [isFetchingRecordings, setIsFetchingRecordings] = useState<boolean>(false);
  const [activeRecording, setActiveRecording] = useState<RecordingItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsFetchingRecordings(true);

    const targetPath = camera.path || camera.relayUri || camera.name;
    fetchCameraRecordings(apiBaseUrl, targetPath, currentDate).then((res) => {
      if (isMounted) {
        setRecordings(res.recordings);
        setNeighbors(res.neighbors);
        setIsFetchingRecordings(false);
        if (res.recordings.length > 0) {
          setActiveRecording(res.recordings[0]);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [camera, currentDate, apiBaseUrl]);

  useEffect(() => {
    if (!activeRecording || (!activeRecording.videoPath && !activeRecording.videoUrl)) return;

    const fullVideoUrl = activeRecording.videoUrl || `${apiBaseUrl}${activeRecording.videoPath}`;
    console.log(`[OmniRecord Stream] Playing recording video stream: ${fullVideoUrl}`);

    const video = document.createElement('video');
    video.src = fullVideoUrl;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.play().catch((err) => console.warn('[OmniRecord] Video playback autoplay blocked:', err));

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;

    if (sphereMeshRef.current) {
      (sphereMeshRef.current.material as THREE.MeshBasicMaterial).map = videoTexture;
      (sphereMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [activeRecording, apiBaseUrl]);

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

      if (isAutoRotating && !isMouseDownRef.current) {
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

      const normYaw = ((lonRef.current % 360) + 360) % 360;
      setCurrentYaw(normYaw);
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
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Top Bar */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition border border-slate-700"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-100">
              Cupola 360 Patrol
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white uppercase">
              HISTORY
            </span>

            {isFetchingRecordings ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                Fetching Stream API...
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                GET Recordings OK ({recordings.length})
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block"></div>

          <div className="text-xs font-medium text-slate-300 hidden sm:flex items-center gap-2">
            <span className="text-blue-400">{camera.name}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-slate-400">{currentDate}</span>
            {activeRecording?.key && (
              <>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-cyan-400 text-[11px]">{activeRecording.key}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              isAutoRotating
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Auto-Rotate ({camera.rotateSpeed}x)</span>
          </button>

          <button
            className="p-1.5 text-slate-400 hover:text-slate-200 transition"
            title="Camera Stream Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 360 VR Canvas Viewer */}
      <div
        className="relative flex-1 bg-slate-950"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
      >
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {hoveredHotspot && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 shadow-xl flex items-center gap-2 pointer-events-none">
            <span className="text-xs text-slate-300 font-medium">Switch to: {hoveredHotspot.cameraPath}</span>
            <Eye className="w-3.5 h-3.5 text-blue-400" />
          </div>
        )}

        {notification && (
          <div className="absolute top-14 right-4 z-40 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-medium shadow-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-4 left-4 z-30 bg-red-950/90 text-red-300 border border-red-800 px-3 py-1.5 rounded-full text-xs font-mono font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
          </div>
        )}

        <div className="absolute bottom-16 left-4 z-30">
          <FloorplanMinimap
            cameras={allCameras}
            currentCamera={camera}
            onSelectCamera={onSelectCamera}
            renderFile={renderFile}
            currentYaw={currentYaw}
            isExpanded={minimapExpanded}
            onToggleExpand={() => setMinimapExpanded(!minimapExpanded)}
          />
        </div>

        {/* Floating Toolbar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 shadow-xl flex items-center gap-2">
          <button
            onClick={() => setActiveTool('selection')}
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              activeTool === 'selection'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Selection Zoom Tool"
          >
            <Crop className="w-4 h-4" />
            <span className="hidden sm:inline">Selection</span>
          </button>

          <button
            onClick={() => setActiveTool('screen')}
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              activeTool === 'screen'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Screen Fit Mode"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Screen</span>
          </button>

          <button
            onClick={() => setActiveTool('window')}
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              activeTool === 'window'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Window Crop Mode"
          >
            <Layout className="w-4 h-4" />
            <span className="hidden sm:inline">Window</span>
          </button>

          <div className="h-5 w-px bg-slate-800 mx-0.5"></div>

          <button
            onClick={handleTakeSnapshot}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="Capture 360° Snapshot"
          >
            <CameraIconLucide className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleRecord}
            className={`p-2 rounded-lg transition ${
              isRecording
                ? 'bg-red-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-red-400'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Video Clip Record'}
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider flex items-center gap-1.5 transition ${
              showTimeline
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>PLAY BACK</span>
          </button>

          <button
            onClick={onOpenStickyNotes}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition"
            title="Sticky Notes & Patrol Annotations"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showTimeline && (
        <div className="relative z-20 border-t border-slate-800 bg-slate-900">
          <PlaybackTimeline
            currentDate={currentDate}
            recordings={recordings}
            neighbors={neighbors}
            apiBaseUrl={apiBaseUrl}
            onSelectRecording={(rec) => setActiveRecording(rec)}
          />
        </div>
      )}
    </div>
  );
};
