import React, { useEffect, useRef } from 'react';
import type { Camera } from '../types/camera';
import { Compass, Maximize2, Minimize2 } from 'lucide-react';

interface FloorplanMinimapProps {
  cameras: Camera[];
  currentCamera: Camera;
  onSelectCamera: (cam: Camera) => void;
  renderFile: string;
  currentYaw: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const FloorplanMinimap: React.FC<FloorplanMinimapProps> = ({
  cameras,
  currentCamera,
  onSelectCamera,
  renderFile,
  currentYaw,
  isExpanded = false,
  onToggleExpand,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const img = new Image();
    img.src = renderFile;
    img.onload = () => {
      drawMinimap(ctx, img, width, height);
    };
    img.onerror = () => {
      drawMinimap(ctx, null, width, height);
    };

    if (img.complete) {
      drawMinimap(ctx, img, width, height);
    }
  }, [renderFile, cameras, currentCamera, currentYaw]);

  const drawMinimap = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | null,
    w: number,
    h: number
  ) => {
    ctx.clearRect(0, 0, w, h);

    if (img && img.width > 0) {
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(0, 0, w, h);

    const activeX = currentCamera.x * w;
    const activeY = currentCamera.y * h;

    ctx.save();
    ctx.translate(activeX, activeY);

    const fov = 70 * (Math.PI / 180);
    const yawRad = (currentYaw * Math.PI) / 180;
    const startAngle = yawRad - fov / 2;
    const endAngle = yawRad + fov / 2;
    const radarRadius = Math.max(w, h) * 0.35;

    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, radarRadius);
    grad.addColorStop(0, 'rgba(79, 70, 229, 0.6)');
    grad.addColorStop(0.6, 'rgba(79, 70, 229, 0.2)');
    grad.addColorStop(1, 'rgba(79, 70, 229, 0)');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radarRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(79, 70, 229, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    cameras.forEach((cam) => {
      const cx = cam.x * w;
      const cy = cam.y * h;
      const isCurrent = cam._id === currentCamera._id;

      if (isCurrent) {
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, isCurrent ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? '#10b981' : cam.type === '360' ? '#4f46e5' : '#94a3b8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (isCurrent || w > 300) {
        ctx.fillStyle = isCurrent ? '#10b981' : '#475569';
        ctx.font = isCurrent ? 'bold 10px "Inter", sans-serif' : '9px "Inter", sans-serif';
        ctx.fillText(cam.name.split('_')[0], cx + 8, cy + 3);
      }
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    let closestCam = cameras[0];
    let minDistance = Infinity;

    cameras.forEach((cam) => {
      const dx = cam.x - clickX;
      const dy = cam.y - clickY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        closestCam = cam;
      }
    });

    if (closestCam && minDistance < 0.15) {
      onSelectCamera(closestCam);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden border border-gray-200 shadow-2xl transition-all duration-200 relative ${
        isExpanded ? 'w-80 h-64' : 'w-56 h-40'
      }`}
      onClick={onToggleExpand && !isExpanded ? onToggleExpand : undefined}
    >
      {!isExpanded && (
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <div className="bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-semibold text-gray-700 flex items-center gap-1 border border-gray-200 shadow-sm">
            <Compass className="w-3 h-3 text-indigo-500" />
            <span>Map</span>
          </div>
          {onToggleExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-900 transition border border-gray-200"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {isExpanded && onToggleExpand && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-50 rounded-lg text-gray-600 hover:text-gray-900 transition shadow-md border border-gray-200"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      )}

      <div className="relative w-full h-full bg-white">
        <canvas
          ref={canvasRef}
          width={isExpanded ? 320 : 224}
          height={isExpanded ? 230 : 136}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-pointer"
        />

        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-mono text-gray-600 border border-gray-200 shadow-sm">
          Yaw: {Math.round(currentYaw)}°
        </div>
      </div>
    </div>
  );
};
