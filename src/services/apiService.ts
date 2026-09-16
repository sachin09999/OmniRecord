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
    _id: 'nvr-camera-001',
    name: 'Main_Entrance_NVR_1',
    locationName: 'Main Entrance',
    relayUri: 'NVR_1',
    x: 0.18,
    y: 0.55,
    path: 'NVR_1',
    rotateSpeed: 0,
    rotateDirection: 0,
    basePosition: 0,
    type: 'nvr',
    nvrChannelId: '1',
    icons: [],
  },
  {
    _id: 'nvr-camera-002',
    name: 'Lobby_NVR_2',
    locationName: 'Lobby Area',
    relayUri: 'NVR_2',
    x: 0.25,
    y: 0.60,
    path: 'NVR_2',
    rotateSpeed: 0,
    rotateDirection: 0,
    basePosition: 0,
    type: 'nvr',
    nvrChannelId: '2',
    icons: [],
  },
  {
    _id: 'nvr-camera-003',
    name: 'Back_Exit_NVR_3',
    locationName: 'Back Exit',
    relayUri: 'NVR_3',
    x: 0.80,
    y: 0.85,
    path: 'NVR_3',
    rotateSpeed: 0,
    rotateDirection: 0,
    basePosition: 0,
    type: 'nvr',
    nvrChannelId: '3',
    icons: [],
  },
  {
    _id: 'nvr-camera-004',
    name: 'Parking_Gate_NVR_4',
    locationName: 'Parking Gate',
    relayUri: 'NVR_4',
    x: 0.50,
    y: 0.10,
    path: 'NVR_4',
    rotateSpeed: 0,
    rotateDirection: 0,
    basePosition: 0,
    type: 'nvr',
    nvrChannelId: '4',
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

export function resolveApiUrl(baseUrl: string, path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (typeof window !== 'undefined') {
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isStandardProxyPath = cleanPath.startsWith('/1/') || cleanPath.startsWith('/2/') || cleanPath.startsWith('/static/');
    const isCrossOrigin10 = baseUrl.includes('10.10.12.50:3000') && !window.location.host.includes('10.10.12.50:3000');

    if (isCrossOrigin10 || (isLocalDev && isStandardProxyPath) || baseUrl === '' || baseUrl === '/') {
      return cleanPath;
    }
  }

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBase}${cleanPath}`;
}

export const DEFAULT_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGM4YjNhNTRlZDg0ZTM3NzM1ZDU0ZDYiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBhc3BlZWQtZm9vLmNvbSIsInJvbGVzIjp7ImFkbWluIjp7Il9pZCI6IjY0YzhiM2E1MDE2ZGUyM2ZiMTI3YjM4YyIsImdyb3VwcyI6WyJyb290Il19LCJhY2NvdW50IjoiNjRjOGIzYTUwMTZkZTIzZmIxMjdiMzkyIn0sImdyb3VwcyI6W10sImlhdCI6MTc4OTQ1MTk5MCwiZXhwIjoxNzkwNzQ3OTkwfQ.rOpYqVkeBnbHSui47pLT6j87dQRPXD9wVSRKYOA1cvE';
let cachedAuthToken: string = DEFAULT_JWT_TOKEN;

export async function loginToCupola(
  apiBaseUrl: string = DEFAULT_API_BASE,
  username: string = 'admin',
  password: string = 'qwer1234'
): Promise<string | null> {
  const targetUrl = resolveApiUrl(apiBaseUrl, '/1/login');
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'same-origin',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data?.token) {
        cachedAuthToken = data.data.token;
        console.log('[OmniRecord Auth] Successfully authenticated with Cupola 360 backend!');
        return data.data.token;
      }
    }
  } catch (err) {
    console.warn('[OmniRecord Auth] Login request failed:', err);
  }
  return null;
}

export async function fetchPlantData(
  apiBaseUrl: string = DEFAULT_API_BASE,
  plantId: string = DEFAULT_PLANT_ID,
  authToken: string = ''
): Promise<PlantData> {
  let activeToken = authToken || cachedAuthToken;
  let targetUrl = resolveApiUrl(apiBaseUrl, `/2/account/plant/${plantId}/?videoToken=true`);

  const getHeaders = (tok: string) => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tok) {
      h['Authorization'] = `Bearer ${tok}`;
      h['x-access-token'] = tok;
    }
    return h;
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    let res = await fetch(targetUrl, {
      method: 'GET',
      headers: getHeaders(activeToken),
      credentials: 'same-origin',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // If 401 Unauthorized, attempt auto-login
    if (res.status === 401) {
      console.log('[OmniRecord Auth] Token expired or 401 returned. Attempting auto-login (/1/login)...');
      const freshToken = await loginToCupola(apiBaseUrl, 'admin', 'qwer1234');
      if (freshToken) {
        activeToken = freshToken;
        targetUrl = resolveApiUrl(apiBaseUrl, `/2/account/plant/${plantId}/?videoToken=true`);
        res = await fetch(targetUrl, {
          method: 'GET',
          headers: getHeaders(activeToken),
          credentials: 'same-origin',
        });
      }
    }

    if (res.ok) {
      const data: ApiResponse = await res.json();
      if (data.data) {
        let validCameraPaths = new Set<string>();
        let cameraThumbMap = new Map<string, string>();

        try {
          // Calculate time range (last 24 hours) for the recordings query
          const prevDay = new Date();
          prevDay.setUTCDate(prevDay.getUTCDate() - 1);
          const startTime = `${prevDay.toISOString().split('T')[0]}T20:00:00.000Z`;
          const endTime = `${new Date().toISOString().split('T')[0]}T19:59:59.999Z`;

          const recUrl = resolveApiUrl(apiBaseUrl, `/1/account/recordings?plantId=${plantId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&videoToken=true`);
          const recRes = await fetch(recUrl, { headers: getHeaders(activeToken), credentials: 'same-origin' });

          if (recRes.ok) {
            const recData = await recRes.json();
            if (recData.data && Array.isArray(recData.data)) {
              recData.data.forEach((r: any) => {
                if (r.cameraPath) validCameraPaths.add(r.cameraPath);
                if (r.path) validCameraPaths.add(r.path);
                if (r.name) validCameraPaths.add(r.name);

                if (r._id) {
                  const key = r.cameraPath || r.path || r.name;
                  if (key && !cameraThumbMap.has(key)) {
                    cameraThumbMap.set(key, resolveRecordingThumbnailUrl(apiBaseUrl, r, activeToken));
                  }
                }
              });
            }
          }
        } catch (e: any) {
          console.warn('[OmniRecord] Failed to fetch recordings to filter cameras', e);
        }
        return await augmentPlantData(data.data, apiBaseUrl, validCameraPaths, cameraThumbMap);
      }
    }
  } catch (err) {
    console.warn(`[OmniRecord] Live plant API detail request unreachable (${targetUrl}). Checking plants catalog...`);
  }

  // Fallback: Check public catalog endpoint /2/account/plants/
  try {
    const catalogUrl = resolveApiUrl(apiBaseUrl, '/2/account/plants/');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(catalogUrl, {
      method: 'GET',
      headers: getHeaders(activeToken),
      credentials: 'same-origin',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const catalogData = await res.json();
      if (catalogData.success && Array.isArray(catalogData.data)) {
        const found = catalogData.data.find((p: any) => p._id === plantId || p.name === 'UAE-OFFICE') || catalogData.data[0];
        if (found) {
          const mock = getMockPlantData(found._id || plantId, apiBaseUrl);
          if (found.renderFile) {
            mock.renderFile = resolveApiUrl(apiBaseUrl, found.renderFile);
          }
          if (found.name) {
            mock.name = found.name;
          }
          return mock;
        }
      }
    }
  } catch (err) {
    console.warn('[OmniRecord] Catalog API unreachable. Serving mockup dataset.');
  }

  return getMockPlantData(plantId, apiBaseUrl);
}

async function fetchActualNvrCameras(apiBaseUrl: string): Promise<Camera[]> {
  const nvrCameras: Camera[] = [];
  try {
    const authString = btoa(`admin:16@SnV?cR1`);
    const res = await fetch(resolveApiUrl(apiBaseUrl, '/api/nvr/ISAPI/System/Video/inputs/channels'), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });
    
    if (res.ok) {
      const xmlText = await res.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
      const channels = xmlDoc.getElementsByTagName('VideoInputChannel');
      
      for (let i = 0; i < channels.length; i++) {
        const chan = channels[i];
        const id = chan.getElementsByTagName('id')[0]?.textContent;
        const name = chan.getElementsByTagName('name')[0]?.textContent || `Camera ${id}`;
        
        if (id) {
          nvrCameras.push({
            _id: `nvr-camera-${id}`,
            name: name.replace(/\s+/g, '_'),
            locationName: name,
            relayUri: `NVR_${id}`,
            x: 0.5 + (Math.random() * 0.4 - 0.2),
            y: 0.5 + (Math.random() * 0.4 - 0.2),
            path: `NVR_${id}`,
            rotateSpeed: 0,
            rotateDirection: 0,
            basePosition: 0,
            type: 'nvr',
            nvrChannelId: id,
            icons: [],
            isOnline: true,
            recording: true,
            uri: name,
            // satisfy Camera interface
            chipid: null,
            ip: '10.10.12.2',
            port: '80',
            vfov: 0
          } as unknown as Camera);
        }
      }
    }
  } catch (err) {
    console.warn('[OmniRecord] Failed to fetch actual NVR cameras', err);
  }
  return nvrCameras;
}

async function augmentPlantData(
  rawPlant: PlantData,
  apiBaseUrl: string,
  validCameraPaths?: Set<string>,
  cameraThumbMap?: Map<string, string>
): Promise<PlantData> {
  // Log the first camera to help debug what properties are available
  if (rawPlant.cameras && rawPlant.cameras.length > 0) {
    console.log('[OmniRecord] First camera data from API:', rawPlant.cameras[0]);
  }

  const mapCamera = (cam: any): Camera => {
    const is360 = cam.name.includes('RTMP') || (cam.relayUri && !cam.relayUri.startsWith('rtsp'));
    const imagePath = cam.originFile || cam.renderFile;
    const recThumb = cameraThumbMap ? (cameraThumbMap.get(cam.path) || cameraThumbMap.get(cam.name) || cameraThumbMap.get(cam.relayUri)) : undefined;
    const fullImageUrl = recThumb || (imagePath ? `${apiBaseUrl}${imagePath}` : createProceduralPanorama(cam.name, cam.relayUri));

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
  };

  let augmentedCameras: Camera[] = rawPlant.cameras
    .filter((cam: any) => {
      // If we successfully fetched valid recordings, use them exclusively to filter!
      if (validCameraPaths && validCameraPaths.size > 0) {
        return validCameraPaths.has(cam.path) || validCameraPaths.has(cam.name) || validCameraPaths.has(cam.relayUri);
      }
      
      // Fallback relaxed filter if recordings API failed or returned empty
      return cam.recording == true || 
             cam.recording === 1 || 
             cam.recording === 'true' || 
             cam.hasRecordings == true || 
             cam.isRecording == true;
    })
    .map(mapCamera);

  // Fallback: If the filter removed everything (e.g. the property name is different), show all cameras so the app isn't broken.
  if (augmentedCameras.length === 0 && rawPlant.cameras.length > 0) {
    console.warn('[OmniRecord] The recording filter removed all cameras! Falling back to showing all cameras.');
    augmentedCameras = rawPlant.cameras.map(mapCamera);
  }

  // Inject actual NVR cameras from the Hikvision API!
  let actualNvrCameras = await fetchActualNvrCameras(apiBaseUrl);
  if (actualNvrCameras.length === 0) {
    console.log('[OmniRecord] No real NVR cameras found, falling back to mock ones for UI testing.');
    actualNvrCameras = getMockPlantData('mock', apiBaseUrl).cameras.filter((c) => c.type === 'nvr');
  } else {
    console.log(`[OmniRecord] Successfully fetched ${actualNvrCameras.length} REAL cameras from NVR!`);
  }
  
  augmentedCameras = [...augmentedCameras, ...actualNvrCameras];

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
      type: raw.type || (is360 ? '360' : 'rtsp'),
      nvrChannelId: raw.nvrChannelId,
      panoramaUrl: panoUrl,
      thumbnailUrl: panoUrl,
      isOnline: true,
      recording: true,
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
  if (!dateStr) {
    const today = new Date().toISOString().split('T')[0];
    return {
      startTime: `${today}T00:00:00.000Z`,
      endTime: `${today}T23:59:59.999Z`,
    };
  }

  const parts = dateStr.split(/[\/\-]/);
  let year = 2026, month = 9, day = 12;

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD or YYYY/MM/DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      // MM/DD/YYYY
      month = parseInt(parts[0], 10);
      day = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  }

  const d = new Date(Date.UTC(year, month - 1, day));
  const yyyy = isNaN(d.getTime()) ? 2026 : d.getUTCFullYear();
  const mm = isNaN(d.getTime()) ? '09' : String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = isNaN(d.getTime()) ? '12' : String(d.getUTCDate()).padStart(2, '0');
  const isoCurrentDay = `${yyyy}-${mm}-${dd}`;

  const startTime = `${isoCurrentDay}T00:00:00.000Z`;
  const endTime = `${isoCurrentDay}T23:59:59.999Z`;

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

  // 1. Check if name contains RTMP_XX
  if (camOrPath.name) {
    const match = camOrPath.name.match(/RTMP_\d+/i);
    if (match) return match[0].toUpperCase();
  }

  // 2. Check if path contains RTMP_XX or starts with RTMP_
  if (camOrPath.path) {
    const match = camOrPath.path.match(/RTMP_\d+/i);
    if (match) return match[0].toUpperCase();
    if (camOrPath.path.startsWith('RTMP_')) return camOrPath.path;
  }

  // 3. Check relayUri
  if (camOrPath.relayUri) {
    const match = camOrPath.relayUri.match(/RTMP_\d+/i);
    if (match) return match[0].toUpperCase();
    if (camOrPath.relayUri.startsWith('RTMP_')) return camOrPath.relayUri;
  }

  return camOrPath.name || camOrPath.path || camOrPath.relayUri || 'RTMP_30';
}

export async function fetchCameraRecordings(
  apiBaseUrl: string = DEFAULT_API_BASE,
  cameraPathInput: string | Partial<Camera> = 'RTMP_30',
  dateStr: string = '2026-09-11',
  customStartTime?: string,
  customEndTime?: string,
  authToken: string = ''
): Promise<FetchRecordingsResult> {
  const { startTime, endTime } = customStartTime && customEndTime
    ? { startTime: customStartTime, endTime: customEndTime }
    : calculateTimeRange(dateStr);

  const cleanPath = extractCameraPath(cameraPathInput);
  let activeToken = authToken || cachedAuthToken;
  let targetUrl = resolveApiUrl(
    apiBaseUrl,
    `/1/account/recordings?cameraPath=${encodeURIComponent(cleanPath)}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&includeNeighbors=true&videoToken=true`
  );

  console.log(`[OmniRecord API] Fetching recordings: GET ${targetUrl}`);

  const getHeaders = (tok: string) => {
    const h: Record<string, string> = { 'Accept': 'application/json' };
    if (tok) {
      h['Authorization'] = `Bearer ${tok}`;
      h['x-access-token'] = tok;
    }
    return h;
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let res = await fetch(targetUrl, {
      method: 'GET',
      headers: getHeaders(activeToken),
      credentials: 'same-origin',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 401) {
      console.log('[OmniRecord Auth] Recordings token expired. Attempting auto-login (/1/login)...');
      const freshToken = await loginToCupola(apiBaseUrl, 'admin', 'qwer1234');
      if (freshToken) {
        activeToken = freshToken;
        targetUrl = resolveApiUrl(
          apiBaseUrl,
          `/1/account/recordings?cameraPath=${encodeURIComponent(cleanPath)}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&includeNeighbors=true&videoToken=true`
        );
        res = await fetch(targetUrl, {
          method: 'GET',
          headers: getHeaders(activeToken),
          credentials: 'same-origin',
          referrerPolicy: 'no-referrer',
        });
      }
    }

    if (res.ok) {
      const resp: RecordingsApiResponse = await res.json();
      const rawData = resp.data || [];

      // Combine rawData and neighbors using Map to deduplicate by _id
      const itemsMap = new Map<string, RecordingItem>();

      rawData.forEach((item: RecordingItem) => {
        if (item && item._id) {
          itemsMap.set(item._id, item);
        }
      });

      if (resp.neighbors?.previous && resp.neighbors.previous._id) {
        itemsMap.set(resp.neighbors.previous._id, resp.neighbors.previous);
      }
      if (resp.neighbors?.next && resp.neighbors.next._id) {
        itemsMap.set(resp.neighbors.next._id, resp.neighbors.next);
      }

      const items = Array.from(itemsMap.values());

      // Populate official Cupola 360 recording thumbnail URL
      items.forEach((item) => {
        if (!item.thumbnailUrl) {
          item.thumbnailUrl = resolveRecordingThumbnailUrl(apiBaseUrl, item, activeToken);
        }
      });

      // Sort recordings chronologically descending (latest recording first)
      items.sort((a, b) => {
        const timeA = new Date(a.startTime || a.createTime || 0).getTime();
        const timeB = new Date(b.startTime || b.createTime || 0).getTime();
        return timeB - timeA;
      });

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

  return {
    recordings: [],
    events: [],
    neighbors: { previous: null, next: null },
  };
}

export function resolveRecordingThumbnailUrl(
  apiBaseUrl: string,
  rec?: Partial<RecordingItem>,
  token: string = ''
): string {
  if (!rec) return '';
  if (rec.thumbnailUrl) {
    if (rec.thumbnailUrl.startsWith('http') || rec.thumbnailUrl.startsWith('data:')) return rec.thumbnailUrl;
    return resolveApiUrl(apiBaseUrl, rec.thumbnailUrl);
  }
  if (rec.thumbnailPath) {
    return resolveApiUrl(apiBaseUrl, rec.thumbnailPath);
  }
  if (rec._id) {
    const activeToken = token || cachedAuthToken;
    const cleanToken = activeToken ? `?token=${encodeURIComponent(activeToken)}` : '';
    const path = `/1/recording/${rec._id}/thumbnail${cleanToken}`;
    return resolveApiUrl(apiBaseUrl, path);
  }
  return '';
}

/**
 * Downloads a video stream/clip directly in-place as MP4 blob
 * without ever navigating the browser window or opening external tabs.
 */
export async function downloadVideoFile(url: string, filename: string): Promise<boolean> {
  const cleanFilename = filename.endsWith('.mp4') ? filename : `${filename}.mp4`;

  try {
    console.log(`[OmniRecord Download] Initiating in-place MP4 download for: ${url}`);
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const mp4Blob = new Blob([blob], { type: 'video/mp4' });
    const objectUrl = URL.createObjectURL(mp4Blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = objectUrl;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    }, 200);

    return true;
  } catch (err) {
    console.warn('[OmniRecord Download] In-place fetch failed, using fallback anchor:', err);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
    }, 200);
    return false;
  }
}
