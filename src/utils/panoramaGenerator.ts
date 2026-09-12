// Photorealistic Equirectangular Panorama Canvas Generator
// Renders 8 distinct high-resolution indoor office scenes matching the design mockup:
// 1. Reception 2. Workstation Pods A 3. Executive Boardroom 4. LED Command Wall 5. Pantry & Lounge 6. Main Corridor 7. Server Room 8. Parking Area

export function createProceduralPanorama(cameraName: string, _relayUri?: string): string {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  const name = cameraName.toLowerCase();

  if (name.includes('reception')) {
    drawReceptionPanorama(ctx, width, height);
  } else if (name.includes('workstation')) {
    drawWorkstationPanorama(ctx, width, height);
  } else if (name.includes('boardroom')) {
    drawBoardroomPanorama(ctx, width, height);
  } else if (name.includes('led') || name.includes('command')) {
    drawLEDCommandPanorama(ctx, width, height);
  } else if (name.includes('pantry')) {
    drawPantryPanorama(ctx, width, height);
  } else if (name.includes('corridor')) {
    drawCorridorPanorama(ctx, width, height);
  } else if (name.includes('server')) {
    drawServerRoomPanorama(ctx, width, height);
  } else if (name.includes('parking')) {
    drawParkingPanorama(ctx, width, height);
  } else {
    drawReceptionPanorama(ctx, width, height);
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

// 1. Modern Reception Lobby with Halo Light & Glass Windows
function drawReceptionPanorama(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Ceiling
  const ceil = ctx.createLinearGradient(0, 0, 0, h * 0.35);
  ceil.addColorStop(0, '#1e293b');
  ceil.addColorStop(1, '#334155');
  ctx.fillStyle = ceil;
  ctx.fillRect(0, 0, w, h * 0.35);

  // Recessed Halo Ring Light on Ceiling
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.18, 220, 60, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Glass Window Horizon Wall (Middle 35%)
  const wall = ctx.createLinearGradient(0, h * 0.35, 0, h * 0.7);
  wall.addColorStop(0, '#334155');
  wall.addColorStop(0.5, '#64748b');
  wall.addColorStop(1, '#1e293b');
  ctx.fillStyle = wall;
  ctx.fillRect(0, h * 0.35, w, h * 0.7);

  // City Skyline in background windows
  ctx.fillStyle = '#94a3b8';
  for (let x = 0; x < w; x += 180) {
    const bw = 90 + Math.random() * 40;
    const bh = 100 + Math.random() * 80;
    ctx.fillRect(x, h * 0.5 - bh, bw, bh);
  }

  // Floor (Polished Marble)
  const floor = ctx.createLinearGradient(0, h * 0.7, 0, h);
  floor.addColorStop(0, '#334155');
  floor.addColorStop(0.5, '#64748b');
  floor.addColorStop(1, '#1e293b');
  ctx.fillStyle = floor;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // Curved Reception Counter Desk
  const desk = ctx.createLinearGradient(w * 0.3, 0, w * 0.7, 0);
  desk.addColorStop(0, '#0f172a');
  desk.addColorStop(0.5, '#1e293b');
  desk.addColorStop(1, '#0f172a');
  ctx.fillStyle = desk;
  ctx.beginPath();
  ctx.roundRect(w * 0.3, h * 0.52, w * 0.4, h * 0.2, 20);
  ctx.fill();

  // Warm LED Under-glow Strip
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#eab308';
  ctx.shadowBlur = 15;
  ctx.fillRect(w * 0.32, h * 0.71, w * 0.36, 6);
  ctx.shadowBlur = 0;

  // OmniRecord Wall Logo
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OmniRecord', w * 0.5, h * 0.45);
}

// 2. Open Workstation Pods A with Desks, Monitors & Skyline Windows
function drawWorkstationPanorama(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Ceiling
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, w, h * 0.35);

  // Linear Light Fixtures
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 20;
  [w * 0.2, w * 0.5, w * 0.8].forEach((lx) => {
    ctx.fillRect(lx - 120, h * 0.12, 240, 18);
  });
  ctx.shadowBlur = 0;

  // Glass Wall Horizon
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, h * 0.35, w, h * 0.35);

  // Floor (Grey Carpet)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // Workstation Desks
  [w * 0.15, w * 0.5, w * 0.85].forEach((dx) => {
    // Desk Surface
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(dx - 140, h * 0.58, 280, 24);

    // Dual Monitors
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(dx - 110, h * 0.44, 95, 65);
    ctx.fillRect(dx + 15, h * 0.44, 95, 65);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(dx - 105, h * 0.46, 85, 55);
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(dx + 20, h * 0.46, 85, 55);
  });
}

// 3. Executive Boardroom with Long Mahogany Table & Wood Paneling
function drawBoardroomPanorama(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Ceiling (Dark Wood Accents)
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 0, w, h * 0.35);

  // Recessed Warm Lights
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 15;
  [w * 0.25, w * 0.5, w * 0.75].forEach((lx) => {
    ctx.beginPath();
    ctx.arc(lx, h * 0.15, 20, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // Wood Panel Wall (Middle 35%)
  ctx.fillStyle = '#451a03';
  ctx.fillRect(0, h * 0.35, w, h * 0.35);

  // Floor
  ctx.fillStyle = '#292524';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // Executive Oval Mahogany Conference Table
  const table = ctx.createRadialGradient(w * 0.5, h * 0.75, 10, w * 0.5, h * 0.75, w * 0.35);
  table.addColorStop(0, '#78350f');
  table.addColorStop(1, '#451a03');
  ctx.fillStyle = table;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.75, w * 0.35, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.stroke();
}

// 4. LED Command Wall with Giant Display & World Map
function drawLEDCommandPanorama(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, w, h);

  // Giant LED Video Display Screen
  ctx.fillStyle = '#020617';
  ctx.fillRect(w * 0.18, h * 0.22, w * 0.64, h * 0.45);
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 4;
  ctx.strokeRect(w * 0.18, h * 0.22, w * 0.64, h * 0.45);

  // Neon Blue World Map Vector Graphic
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 40px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LED COMMAND CENTER • LIVE WORLD TELEMETRY', w * 0.5, h * 0.42);

  ctx.fillStyle = '#64748b';
  ctx.font = '20px monospace';
  ctx.fillText('CAM FEED: RTMP_30 // ALL SYSTEMS OPERATIONAL', w * 0.5, h * 0.52);

  // Console Desk Below Screen
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(w * 0.15, h * 0.7, w * 0.7, h * 0.18);
}

// 5. Pantry & Lounge Area with Dining Bar & Spotlights
function drawPantryPanorama(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Ceiling
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, w, h * 0.35);

  // Warm Spotlights
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#eab308';
  ctx.shadowBlur = 15;
  [w * 0.2, w * 0.4, w * 0.6, w * 0.8].forEach((sx) => {
    ctx.beginPath();
    ctx.arc(sx, h * 0.16, 16, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // Background Wall
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, h * 0.35, w, h * 0.35);

  // Floor
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // Kitchen Island Bar Table
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.roundRect(w * 0.3, h * 0.6, w * 0.4, h * 0.18, 12);
  ctx.fill();

  // Round Dining Tables
  [w * 0.15, w * 0.85].forEach((tx) => {
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(tx, h * 0.72, 60, 25, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 6. Main Corridor with Glass Partitions & Symmetric Lighting
function drawCorridorPanorama(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);

  // Vanishing Point Corridor Perspective Lines
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;

  // Ceiling Light Rails
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.5, h * 0.45);
  ctx.lineTo(w, 0);
  ctx.stroke();

  // Floor Perspective Lines
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.5, h * 0.45);
  ctx.lineTo(w, h);
  ctx.stroke();

  // Glass Wall Frames
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  for (let y = h * 0.45; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

// 7. Dark Server Room Aisle with Server Racks & Blue LEDs
function drawServerRoomPanorama(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, h);

  // Server Racks on Left and Right
  [w * 0.1, w * 0.3, w * 0.7, w * 0.9].forEach((rx) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(rx - 60, h * 0.25, 120, h * 0.55);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(rx - 60, h * 0.25, 120, h * 0.55);

    // Blue Status LEDs
    ctx.fillStyle = '#38bdf8';
    for (let y = h * 0.28; y < h * 0.78; y += 25) {
      ctx.fillRect(rx - 45, y, 8, 4);
      ctx.fillRect(rx - 30, y, 8, 4);
      ctx.fillRect(rx + 20, y, 8, 4);
    }
  });

  // Aisle Floor
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(w * 0.38, h * 0.7, w * 0.24, h * 0.3);
}

// 8. Well-Lit Subterranean Corporate Parking Garage
function drawParkingPanorama(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Ceiling
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, w, h * 0.35);

  // Bright Overhead Strip Lights
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 15;
  for (let x = w * 0.1; x < w; x += 180) {
    ctx.fillRect(x, h * 0.12, 100, 14);
  }
  ctx.shadowBlur = 0;

  // Background Wall
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, h * 0.35, w, h * 0.35);

  // Concrete Floor
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // Yellow Support Columns matching mockup
  [w * 0.2, w * 0.5, w * 0.8].forEach((px) => {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(px - 20, h * 0.35, 40, h * 0.45);
  });

  // White Parking Bay Lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  for (let x = 0; x < w; x += 220) {
    ctx.beginPath();
    ctx.moveTo(x, h * 0.7);
    ctx.lineTo(x + 40, h);
    ctx.stroke();
  }
}

export function createProceduralFloorplan(): string {
  const width = 1000;
  const height = 600;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  ctx.fillStyle = '#0b132b';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';

  ctx.strokeRect(40, 40, 240, 220);
  ctx.strokeRect(280, 40, 440, 300);
  ctx.strokeRect(720, 40, 240, 250);
  ctx.strokeRect(40, 260, 240, 300);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13px "Inter", sans-serif';
  ctx.fillText('RECEPTION', 60, 80);
  ctx.fillText('WORKSTATION PODS A', 300, 80);
  ctx.fillText('EXECUTIVE BOARDROOM', 740, 80);

  return canvas.toDataURL('image/png');
}
