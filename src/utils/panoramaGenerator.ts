// Photorealistic Equirectangular Panorama & Floorplan Canvas Generator
// Renders clean, elegant, professional architectural interiors (Reception, Workstation, Boardroom, LED Wall, etc.)

export function createProceduralPanorama(cameraName: string, relayUri: string): string {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  const nameLower = cameraName.toLowerCase();
  let roomTheme = 'office';
  if (nameLower.includes('reception')) roomTheme = 'reception';
  else if (nameLower.includes('workstation')) roomTheme = 'workstation';
  else if (nameLower.includes('ledwall')) roomTheme = 'ledwall';
  else if (nameLower.includes('leaders')) roomTheme = 'boardroom';
  else if (nameLower.includes('demotable')) roomTheme = 'demotable';
  else if (nameLower.includes('globalwall')) roomTheme = 'globalwall';

  // 1. Ceiling (Top 35%): Soft off-white architectural acoustic ceiling panels
  const ceilGrad = ctx.createLinearGradient(0, 0, 0, height * 0.35);
  ceilGrad.addColorStop(0, '#1e293b');
  ceilGrad.addColorStop(0.5, '#334155');
  ceilGrad.addColorStop(1, '#475569');
  ctx.fillStyle = ceilGrad;
  ctx.fillRect(0, 0, width, height * 0.35);

  // Ceiling Recessed Architectural Soft Lights (Warm White / Neutral Daylight)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
  ctx.shadowBlur = 15;

  [width * 0.15, width * 0.38, width * 0.62, width * 0.85].forEach((cx) => {
    // Linear ceiling light strip
    ctx.beginPath();
    ctx.roundRect(cx - 100, height * 0.12, 200, 25, 12);
    ctx.fill();
  });
  ctx.shadowBlur = 0; // Reset shadow

  // 2. Walls (Middle 35%): Elegant dark oak wood paneling & frosted glass partitions
  const wallGrad = ctx.createLinearGradient(0, height * 0.35, 0, height * 0.7);
  wallGrad.addColorStop(0, '#1e293b');
  wallGrad.addColorStop(0.5, '#0f172a');
  wallGrad.addColorStop(1, '#020617');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, height * 0.35, width, height * 0.35);

  // Vertical Architectural Wall Panel Columns (Warm Oak Wood Texture)
  for (let x = 0; x < width; x += 320) {
    // Wood panel fill
    const woodGrad = ctx.createLinearGradient(x, 0, x + 280, 0);
    woodGrad.addColorStop(0, '#1e1b18');
    woodGrad.addColorStop(0.5, '#2d241e');
    woodGrad.addColorStop(1, '#1b1714');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(x, height * 0.35, 280, height * 0.35);

    // Subtle metallic vertical divider strip
    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.fillRect(x + 280, height * 0.35, 40, height * 0.35);
  }

  // 3. Floor (Bottom 30%): Polished Grey Granite / Italian Marble Floor
  const floorGrad = ctx.createLinearGradient(0, height * 0.7, 0, height);
  floorGrad.addColorStop(0, '#0f172a');
  floorGrad.addColorStop(0.3, '#1e293b');
  floorGrad.addColorStop(1, '#0b0f19');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, height * 0.7, width, height * 0.3);

  // Soft reflective floor tiles grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x, height * 0.7);
    ctx.lineTo(x + (x - width / 2) * 0.7, height);
    ctx.stroke();
  }

  // 4. Room-Specific Furniture & Features
  if (roomTheme === 'reception') {
    // Modern White Marble Reception Desk
    const deskGrad = ctx.createLinearGradient(width * 0.35, 0, width * 0.65, 0);
    deskGrad.addColorStop(0, '#e2e8f0');
    deskGrad.addColorStop(0.5, '#f8fafc');
    deskGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = deskGrad;
    ctx.beginPath();
    ctx.roundRect(width * 0.35, height * 0.55, width * 0.3, height * 0.16, 12);
    ctx.fill();

    // Soft warm LED under-desk lighting strip
    ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.fillRect(width * 0.36, height * 0.7, width * 0.28, 4);

    // Wall Signage
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 32px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UAE OFFICE • RECEPTION', width * 0.5, height * 0.44);
  } else if (roomTheme === 'workstation') {
    // Ergonomic Office Workstation Pods
    [width * 0.15, width * 0.48, width * 0.8].forEach((wx) => {
      // Wood Desk Top
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(wx - 130, height * 0.58, 260, 36, 6);
      ctx.fill();

      // Monitors with clean UI screen displays
      ctx.fillStyle = '#090d16';
      ctx.fillRect(wx - 110, height * 0.44, 100, 62);
      ctx.fillRect(wx + 10, height * 0.44, 100, 62);

      // Clean display background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(wx - 106, height * 0.46, 92, 54);
      ctx.fillRect(wx + 14, height * 0.46, 92, 54);

      // Monitor graphs / text mockup
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(wx - 98, height * 0.5, 40, 6);
      ctx.fillRect(wx - 98, height * 0.54, 70, 4);
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(wx + 22, height * 0.5, 50, 6);
      ctx.fillRect(wx + 22, height * 0.54, 65, 4);
    });
  } else if (roomTheme === 'boardroom') {
    // Executive Mahogany Conference Table
    const tableGrad = ctx.createRadialGradient(width * 0.5, height * 0.75, 20, width * 0.5, height * 0.75, width * 0.3);
    tableGrad.addColorStop(0, '#451a03');
    tableGrad.addColorStop(0.7, '#270e02');
    tableGrad.addColorStop(1, '#170701');
    ctx.fillStyle = tableGrad;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.76, width * 0.32, height * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 32px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LEADERS BOARDROOM 360°', width * 0.5, height * 0.44);
  } else if (roomTheme === 'ledwall') {
    // High-Resolution Command Center Video Wall Screen
    ctx.fillStyle = '#020617';
    ctx.fillRect(width * 0.22, height * 0.36, width * 0.56, height * 0.31);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(width * 0.22, height * 0.36, width * 0.56, height * 0.31);

    // Clean Corporate Telemetry Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 36px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COMMAND WALL • LIVE TELEMETRY', width * 0.5, height * 0.46);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 20px "Inter", sans-serif';
    ctx.fillText(`CAM FEED: ${relayUri} | STATUS: OPERATIONAL`, width * 0.5, height * 0.54);
  } else {
    // Clean corporate hallway / generic room
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 32px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${cameraName.replace(/_/g, ' ')}`, width * 0.5, height * 0.48);
  }

  // Camera Overlay Clean Timestamp Info
  ctx.fillStyle = '#38bdf8';
  ctx.font = '500 16px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`CAMERA: ${cameraName} (${relayUri})`, 40, 50);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`TIMESTAMP: 2026-09-12 09:12:45 UTC`, 40, 76);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function createProceduralFloorplan(): string {
  const width = 1000;
  const height = 600;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Clean charcoal slate background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Subtle CAD Blueprint Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Plant Exterior Walls
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Interior Room Partitions
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';

  // Reception
  ctx.strokeRect(40, 40, 240, 220);
  // Workstation
  ctx.strokeRect(280, 40, 440, 300);
  // Boardroom
  ctx.strokeRect(720, 40, 240, 250);
  // Global Wall
  ctx.strokeRect(40, 260, 240, 300);
  // Demo Table
  ctx.strokeRect(280, 340, 440, 220);
  // LED Wall
  ctx.strokeRect(720, 290, 240, 270);

  // Room Name Labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13px "Inter", sans-serif';
  ctx.fillText('RECEPTION', 60, 80);
  ctx.fillText('WORKSTATION ZONE', 300, 80);
  ctx.fillText('BOARDROOM', 740, 80);
  ctx.fillText('GLOBAL WALL', 60, 300);
  ctx.fillText('DEMO AREA', 300, 370);
  ctx.fillText('LED WALL', 740, 320);

  return canvas.toDataURL('image/png');
}
