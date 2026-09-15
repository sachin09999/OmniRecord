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
        return augmentPlantData(data.data, apiBaseUrl, validCameraPaths, cameraThumbMap);
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

function augmentPlantData(
  rawPlant: PlantData,
  apiBaseUrl: string,
  validCameraPaths?: Set<string>,
  cameraThumbMap?: Map<string, string>
): PlantData {
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

  const prevDay = new Date(d);
  prevDay.setUTCDate(prevDay.getUTCDate() - 1);
  const prevYyyy = isNaN(prevDay.getTime()) ? 2026 : prevDay.getUTCFullYear();
  const prevMm = isNaN(prevDay.getTime()) ? '09' : String(prevDay.getUTCMonth() + 1).padStart(2, '0');
  const prevDd = isNaN(prevDay.getTime()) ? '11' : String(prevDay.getUTCDate()).padStart(2, '0');
  const isoPrevDay = `${prevYyyy}-${prevMm}-${prevDd}`;

  const startTime = `${isoPrevDay}T20:00:00.000Z`;
  const endTime = `${isoCurrentDay}T19:59:59.999Z`;

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
