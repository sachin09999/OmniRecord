import React, { useEffect, useRef, useState } from 'react';
import type { Camera, RecordingItem } from '../types/camera';
import { PlaybackTimeline } from './PlaybackTimeline';
import { ModernLoadingSpinner } from './ModernLoadingSpinner';
import { fetchNvrRecordings } from '../services/nvrService';
import {
  ChevronLeft,
  FileText,
  CheckCircle,
  Clock
} from 'lucide-react';

interface StandardViewerProps {
  camera: Camera;
  activeRecording: RecordingItem | null;
  onClose: () => void;
  onBackToRecordings: () => void;
  currentDate: string;
  onOpenStickyNotes: () => void;
  apiBaseUrl?: string;
  authToken?: string;
}

export const StandardViewer: React.FC<StandardViewerProps> = ({
  camera,
  activeRecording,
  onClose,
  onBackToRecordings,
  currentDate,
  onOpenStickyNotes,
}) => {
  const [viewDate] = useState<string>(currentDate);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(!activeRecording);
  const [isWebRTCPlaying, setIsWebRTCPlaying] = useState<boolean>(false);
  
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<RecordingItem | null>(activeRecording);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch NVR recordings on mount
  useEffect(() => {
    const loadRecordings = async () => {
      if (!camera.nvrChannelId) return;
      
      const startOfDay = new Date(viewDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(viewDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const items = await fetchNvrRecordings(camera.nvrChannelId, startOfDay, endOfDay);
      setRecordings(items);
      
      if (!isLiveMode && !selectedRecording && items.length > 0) {
        setSelectedRecording(items[0]);
      }
    };
    
    loadRecordings();
  }, [camera.nvrChannelId, viewDate]);

  // Handle WebRTC Streaming via go2rtc for BOTH Live and Historical
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    let pc = new RTCPeerConnection();
    pcRef.current = pc;
    
    const startWebRTC = async () => {
      try {
        setIsWebRTCPlaying(false);
        
        // Hikvision RTSP channels usually require '01' suffix for main stream (e.g., '4' -> '401')
        const rawChan = camera.nvrChannelId || '1';
        const rtspChan = rawChan.length < 3 ? `${rawChan}01` : rawChan;
        
        let rtspUrl = '';
        if (isLiveMode) {
          // Live NVR stream
          rtspUrl = `rtsp://admin:16%40SnV%3FcR1@10.10.12.2:554/Streaming/Channels/${rtspChan}`;
        } else if (selectedRecording) {
          // Historical NVR playback stream (convert 2026-09-15T10:00:00Z to 20260915T100000Z)
          const startStr = selectedRecording.startTime?.replace(/[-:]/g, '') || '';
          const endStr = selectedRecording.endTime?.replace(/[-:]/g, '') || '';
          rtspUrl = `rtsp://admin:16%40SnV%3FcR1@10.10.12.2:554/Streaming/tracks/${rtspChan}?starttime=${startStr}&endtime=${endStr}`;
        } else {
          return;
        }

        // 2. Register stream with go2rtc dynamically
        const streamName = `nvr_${rawChan}_${isLiveMode ? 'live' : 'playback'}`;
        const putRes = await fetch(`/api/streams?src=${encodeURIComponent(rtspUrl)}&name=${encodeURIComponent(streamName)}`, {
          method: 'PUT'
        });
        if (!putRes.ok) {
          console.error('[NVR Viewer] Failed to register stream with go2rtc:', await putRes.text());
        }

        // 3. Negotiate WebRTC connection
        pc.addTransceiver('video', { direction: 'recvonly' });

        pc.ontrack = (event) => {
          if (video.srcObject !== event.streams[0]) {
            video.srcObject = event.streams[0];
            video.play().catch(e => console.warn('Autoplay prevented:', e));
          }
        };

        video.onplaying = () => {
          setIsWebRTCPlaying(true);
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const res = await fetch(`/api/webrtc?src=${encodeURIComponent(streamName)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: offer.type, sdp: offer.sdp || '' })
        });

        if (!res.ok) {
          throw new Error(`go2rtc returned HTTP ${res.status}: ${await res.text()}`);
        }
        
        const resText = await res.text();
        let sdpAnswer = resText;
        try {
          const json = JSON.parse(resText);
          if (json && json.sdp) sdpAnswer = json.sdp;
        } catch (e) {
          // ignore
        }
        
        await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer });
      } catch (err) {
        console.error('[NVR Viewer] WebRTC connection failed:', err);
      }
    };

    startWebRTC();

    return () => {
      if (pc) pc.close();
      video.pause();
      video.srcObject = null;
    };
  }, [isLiveMode, selectedRecording, camera]);

  const currentHourLabel = selectedRecording?.startTime 
    ? new Date(selectedRecording.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F1115] text-white flex flex-col h-screen w-screen overflow-hidden select-none font-sans">
      {/* Sleek Dark Top Bar */}
      <div className="h-13 bg-[#181B20] border-b border-[#262A34] px-5 py-2.5 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToRecordings}
            className="px-3 py-1.5 rounded-lg bg-[#242832] hover:bg-[#2E3442] text-gray-200 border border-[#343B4B] transition text-xs font-semibold flex items-center gap-1.5 shadow-sm"
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
            {isLiveMode ? (
              <span className="font-mono text-xs font-extrabold text-red-300 bg-red-950/80 px-2.5 py-0.5 rounded border border-red-800/60 flex items-center gap-1.5 shadow-sm animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>LIVE STREAM (REAL-TIME)</span>
              </span>
            ) : currentHourLabel ? (
              <span className="font-mono text-xs font-extrabold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1.5 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentHourLabel}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 transition text-xs font-semibold"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main 2D Video Player */}
      <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center">
        <video 
          ref={videoRef}
          className="w-full h-full object-contain"
          muted 
          playsInline 
        />

        {!isWebRTCPlaying && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0A0C0E]/40 backdrop-blur-sm pointer-events-none">
            <ModernLoadingSpinner label="Loading Stream..." sublabel="" />
          </div>
        )}

        {notification && (
          <div className="absolute top-6 right-6 z-40 bg-[#181B20]/95 border border-emerald-500/40 text-emerald-300 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Floating Dark Glassmorphism Toolbar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-[#14171D]/90 border border-[#2A2F3D] rounded-xl p-1.5 shadow-2xl flex items-center gap-1.5 backdrop-blur-lg">
          <button
            onClick={onOpenStickyNotes}
            className="px-3 py-1.5 rounded-lg text-gray-300 hover:bg-[#222733] hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title="Sticky Notes & Annotations"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Notes & Annotations</span>
          </button>
        </div>

        {/* Floating Bottom-Right Live/Recorded Toggle Badge */}
        <button
          onClick={() => {
            if (isLiveMode) {
              setIsLiveMode(false);
            } else {
              setIsLiveMode(true);
              triggerToast('Switched to Live Camera Stream');
            }
          }}
          className={`absolute bottom-6 right-6 z-40 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold transition-all duration-200 shadow-2xl flex items-center gap-1.5 backdrop-blur-md cursor-pointer border ${
            isLiveMode
              ? 'bg-red-600 text-white border-red-400 ring-2 ring-red-500/80 shadow-red-600/50 animate-pulse'
              : 'bg-[#4F46E5] text-white border-indigo-400 shadow-indigo-600/50 hover:bg-indigo-500'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-white animate-ping' : 'bg-white'}`} />
          <span>{isLiveMode ? 'LIVE' : 'RECORDED'}</span>
        </button>
      </div>

      {/* Docked Timeline */}
      {!isLiveMode && (
        <div className="relative z-30 border-t border-[#262A34] bg-[#121418] shrink-0">
          <PlaybackTimeline
            currentDate={viewDate}
            recordings={recordings}
            neighbors={{ previous: null, next: null }}
            onSelectRecording={(rec) => {
              setSelectedRecording(rec);
              setIsLiveMode(false);
            }}
            activeRecording={selectedRecording}
            videoElement={videoRef.current}
          />
        </div>
      )}
    </div>
  );
};
