import type { ApiResponse, PlantData, Camera, RecordingItem, Neighbors, RecordingsApiResponse } from '../types/camera';
import { createProceduralPanorama, createProceduralFloorplan } from '../utils/panoramaGenerator';

const DEFAULT_PLANT_ID = '6a38fb720ab1620742c32c96';
const DEFAULT_API_BASE = 'http://10.10.12.50:3000';

// 8 exact camera definitions matching the design mockup image 1:1
const MOCK_CAMERAS_RAW: Partial<Camera & { locationName: string }>[] = [
  {
    _id: '6a38fb8f0ab1620742c32d40',
    name: 'Reception_RTMP_30',
    locationName: 'Reception',
    relayUri: 'RTMP_30',
    x: 0.15435,
    y: 0.44584,
    path: 'RTMP_30',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: 180,
    type: '360',
    icons: [],
  },
  {
    _id: '6a39054e2f873e8a9a5366f8',
    name: 'Workstation_Pod_A_RTMP_30',
    locationName: 'Workstation Pods A',
    relayUri: 'RTMP_30',
    x: 0.4148,
    y: 0.1020,
    path: 'RTMP_30',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: -180,
    type: '360',
    icons: [],
  },
  {
    _id: '6a391f495fbfdae53fda9b33',
    name: 'Executive_Boardroom_RTMP_30',
    locationName: 'Executive Boardroom',
    relayUri: 'RTMP_30',
    x: 0.4107,
    y: 0.7255,
    path: 'RTMP_30',
    rotateSpeed: 2,
    rotateDirection: -1,
    basePosition: 180,
    type: '360',
    icons: [],
  },
  {
    _id: '6a3923485fbfdae53fda9fbf',
    name: 'LED_Command_RTMP_30',
    locationName: 'LED Command Wall',
    relayUri: 'RTMP_30',
    x: 0.5733,
    y: 0.4146,
    path: 'RTMP_30',
    rotateSpeed: 2,
    rotateDirection: -1,
    basePosition: -88,
    type: '360',
    icons: [],
  },
  {
    _id: '6a3bae337e120cca57c40032',
    name: 'Pantry_RTMP_30',
    locationName: 'Pantry & Lounge',
    relayUri: 'RTMP_30',
    x: 0.2498,
    y: 0.3697,
    path: 'RTMP_30',
    rotateSpeed: 2,
    rotateDirection: -1,
    basePosition: 98,
    type: '360',
    icons: [],
  },
  {
    _id: '6a354cc97e120cca57eb21b9',
    name: 'Corridor_RTMP_30',
    locationName: 'Main Corridor',
    relayUri: 'RTMP_30',
    x: 0.4852,
    y: 0.3812,
    path: 'RTMP_30',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: 0,
    type: '360',
    icons: [],
  },
  {
    _id: '6a564cc97e120cca57eb21c0',
    name: 'Server_Room_RTMP_30',
    locationName: 'Server Room',
    relayUri: 'RTMP_30',
    x: 0.4146,
    y: 0.5447,
    path: 'RTMP_30',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: -89,
    type: '360',
    icons: [],
  },
  {
    _id: '6a564cc97e120cca57eb21c1',
    name: 'Parking_RTMP_30',
    locationName: 'Parking Area',
    relayUri: 'RTMP_30',
    x: 0.4136,
    y: 0.4348,
    path: 'RTMP_30',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: 0,
    type: '360',
    icons: [],
  },
];

export async function fetchPlantData(
  apiBaseUrl: string = DEFAULT_API_BASE,
  plantId: string = DEFAULT_PLANT_ID
): Promise<PlantData> {
  const targetUrl = `${apiBaseUrl}/2/account/plant/${plantId}/?videoToken=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: ApiResponse = await res.json();
      if (data.success && data.data) {
        return augmentPlantData(data.data, apiBaseUrl);
      }
    }
  } catch (err) {
    console.warn(`[OmniRecord] Live API unreachable (${targetUrl}). Serving mockup plant dataset.`);
  }

  return getMockPlantData(plantId, apiBaseUrl);
}

function augmentPlantData(rawPlant: PlantData, apiBaseUrl: string): PlantData {
  const augmentedCameras: Camera[] = rawPlant.cameras.map((cam) => {
    const is360 = cam.name.includes('RTMP') || !cam.relayUri.startsWith('rtsp');
    const imagePath = (cam as any).originFile || (cam as any).renderFile;
    const fullImageUrl = imagePath ? `${apiBaseUrl}${imagePath}` : createProceduralPanorama(cam.name, cam.relayUri);

    return {
      ...cam,
      chipid: cam.chipid || null,
      ip: cam.ip || '',
      port: cam.port || '80',
      uri: cam.uri || '',
      vfov: cam.vfov || 0,
      type: is360 ? '360' : 'rtsp',
      panoramaUrl: fullImageUrl,
      thumbnailUrl: fullImageUrl,
      isOnline: true,
    };
  });

  return {
    ...rawPlant,
    renderFile: createProceduralFloorplan(),
    cameras: augmentedCameras,
  };
}

export function getMockPlantData(plantId: string = DEFAULT_PLANT_ID, _apiBaseUrl: string = DEFAULT_API_BASE): PlantData {
  const floorplanUrl = createProceduralFloorplan();

  const cameras: Camera[] = MOCK_CAMERAS_RAW.map((raw) => {
    const name = raw.name || 'Camera';
    const relayUri = raw.relayUri || 'RTMP_30';
    const is360 = raw.type === '360';
    const panoUrl = createProceduralPanorama(name, relayUri);

    return {
      _id: raw._id || Math.random().toString(36).substr(2, 9),
      name,
      chipid: null,
      ip: raw.ip || '10.10.12.50',
      port: '80',
      relayUri,
      x: raw.x || 0.5,
      y: raw.y || 0.5,
      vfov: 0,
      path: raw.path || relayUri,
      icons: raw.icons || [],
      rotateSpeed: raw.rotateSpeed || 1,
      rotateDirection: raw.rotateDirection || -1,
      basePosition: raw.basePosition || 0,
      type: is360 ? '360' : 'rtsp',
      panoramaUrl: panoUrl,
      thumbnailUrl: panoUrl,
      isOnline: true,
      uri: raw.locationName || name.split('_')[0],
    };
  });

  return {
    _id: plantId,
    name: 'UAE-OFFICE',
    originFile: '',
    renderFile: floorplanUrl,
    originKey: '',
    renderKey: '',
    priority: 0,
    group: null,
    pinTime: null,
    updateTime: new Date().toISOString(),
    createTime: '2026-06-22T09:08:02.125Z',
    cameras,
  };
}

export function calculateTimeRange(dateStr: string): { startTime: string; endTime: string } {
  const normalizedDate = dateStr.replace(/\//g, '-');
  const d = new Date(normalizedDate);

  if (isNaN(d.getTime())) {
    return {
      startTime: '2026-09-10T20:00:00.000Z',
      endTime: '2026-09-11T19:59:59.999Z',
    };
  }

  const prevDay = new Date(d);
  prevDay.setUTCDate(prevDay.getUTCDate() - 1);
  const startTime = `${prevDay.toISOString().split('T')[0]}T20:00:00.000Z`;
  const endTime = `${normalizedDate}T19:59:59.999Z`;

  return { startTime, endTime };
}

export interface FetchRecordingsResult {
  recordings: RecordingItem[];
  events: any[];
  neighbors: Neighbors;
  rawResponse?: RecordingsApiResponse;
}

export function extractCameraPath(camOrPath: string | Partial<Camera>): string {
  if (typeof camOrPath === 'string') {
    const match = camOrPath.match(/RTMP_\d+/i);
    if (match) return match[0].toUpperCase();
    return camOrPath;
  }
  if (camOrPath.relayUri && camOrPath.relayUri.startsWith('RTMP_')) return camOrPath.relayUri;
  if (camOrPath.path && camOrPath.path.startsWith('RTMP_')) return camOrPath.path;
  if (camOrPath.name) {
    const match = camOrPath.name.match(/RTMP_\d+/i);
    if (match) return match[0].toUpperCase();
  }
  return camOrPath.relayUri || camOrPath.path || camOrPath.name || 'RTMP_30';
}

export async function fetchCameraRecordings(
  apiBaseUrl: string = DEFAULT_API_BASE,
  cameraPathInput: string | Partial<Camera> = 'RTMP_30',
  dateStr: string = '2026-09-11',
  customStartTime?: string,
  customEndTime?: string
): Promise<FetchRecordingsResult> {
  const { startTime, endTime } = customStartTime && customEndTime
    ? { startTime: customStartTime, endTime: customEndTime }
    : calculateTimeRange(dateStr);

  const cleanPath = extractCameraPath(cameraPathInput);
  const targetUrl = `${apiBaseUrl}/1/account/recordings?cameraPath=${encodeURIComponent(cleanPath)}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&includeNeighbors=true`;

  console.log(`[OmniRecord API] Fetching recordings: GET ${targetUrl}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const resp: RecordingsApiResponse = await res.json();
      const items: RecordingItem[] = [...(resp.data || [])];

      if (resp.neighbors?.previous) {
        items.unshift(resp.neighbors.previous);
      }
      if (resp.neighbors?.next) {
        items.push(resp.neighbors.next);
      }

      return {
        recordings: items,
        events: resp.events || [],
        neighbors: resp.neighbors || { previous: null, next: null },
        rawResponse: resp,
      };
    }
  } catch (err) {
    console.warn(`[OmniRecord] Recordings API unreachable (${targetUrl}):`, err);
  }

  // Fallback data if API offline / empty response (no fake videoPath to avoid 401 errors)
  const fallbackRecordings: RecordingItem[] = [
    {
      _id: 'rec-fallback-1',
      cameraPath: cleanPath,
      startTime: `${dateStr.replace(/\//g, '-')}T04:00:00.000Z`,
      endTime: `${dateStr.replace(/\//g, '-')}T07:30:00.000Z`,
      duration: 12600,
    },
    {
      _id: 'rec-fallback-2',
      cameraPath: cleanPath,
      startTime: `${dateStr.replace(/\//g, '-')}T09:00:00.000Z`,
      endTime: `${dateStr.replace(/\//g, '-')}T12:45:00.000Z`,
      duration: 13500,
    },
    {
      _id: 'rec-fallback-3',
      cameraPath: cleanPath,
      startTime: `${dateStr.replace(/\//g, '-')}T14:15:00.000Z`,
      endTime: `${dateStr.replace(/\//g, '-')}T18:00:00.000Z`,
      duration: 13500,
    },
  ];

  return {
    recordings: fallbackRecordings,
    events: [],
    neighbors: { previous: null, next: null },
  };
}
