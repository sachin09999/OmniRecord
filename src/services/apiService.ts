import type { ApiResponse, PlantData, Camera } from '../types/camera';
import { createProceduralPanorama, createProceduralFloorplan } from '../utils/panoramaGenerator';

// Default configuration from user request
const DEFAULT_PLANT_ID = '6a38fb720ab1620742c32c96';
const DEFAULT_API_BASE = 'http://10.10.12.50:3000';

// Raw camera definitions matching exact payload provided by user
const MOCK_CAMERAS_RAW: Partial<Camera>[] = [
  {
    _id: '6a38fb8f0ab1620742c32d40',
    name: 'Reception_RTMP_30',
    relayUri: 'RTMP_30',
    x: 0.15435,
    y: 0.44584,
    path: 'RTMP_30',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: 180,
    type: '360',
    icons: [
      {
        version: 1,
        uuid: '1da87c2e-5938-4259-a089-82dbec93df38',
        cameraPath: 'RTMP_32',
        sourceType: 'default',
        iconType: 'flat-0',
        position: { x: -110.18, y: -139.68, z: 27.33 },
        scale: 1.09,
        opacity: 1,
        visible: true,
      },
      {
        version: 1,
        uuid: '61d894f8-7316-4c16-84a5-21fb115b165e',
        cameraPath: 'RTMP_31',
        sourceType: 'default',
        iconType: 'flat-0',
        position: { x: 155.41, y: -64.62, z: 63.80 },
        scale: 1,
        opacity: 0.8,
        visible: true,
      },
    ],
  },
  {
    _id: '6a39054e2f873e8a9a5366f8',
    name: 'LedWall_RTMP_31',
    relayUri: 'RTMP_31',
    x: 0.4148,
    y: 0.1020,
    path: 'RTMP_31',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: -180,
    type: '360',
    icons: [
      {
        version: 1,
        uuid: '3f3062cd-8719-4447-bbd0-cbdf1087de0f',
        cameraPath: 'RTMP_32',
        sourceType: 'default',
        iconType: 'flat-0',
        position: { x: 14.77, y: -87.45, z: -156.63 },
        scale: 0.65,
        opacity: 1,
        visible: true,
      },
      {
        version: 1,
        uuid: '3a6c897f-f357-43d0-be12-a7b0e4467b4d',
        cameraPath: 'RTMP_33',
        sourceType: 'default',
        iconType: 'flat-0',
        position: { x: 106.66, y: -112.33, z: -91.67 },
        scale: 0.65,
        opacity: 1,
        visible: true,
      },
      {
        version: 1,
        uuid: '523f12d2-9567-4120-aba3-67b8ff796798',
        cameraPath: 'RTMP_34',
        sourceType: 'default',
        iconType: 'flat-0',
        position: { x: -79.99, y: -119.11, z: -108.69 },
        scale: 0.65,
        opacity: 1,
        visible: true,
      },
    ],
  },
  {
    _id: '6a391f495fbfdae53fda9b33',
    name: 'Leaders_RTMP_32',
    relayUri: 'RTMP_32',
    x: 0.4107,
    y: 0.7255,
    path: 'RTMP_32',
    rotateSpeed: 2,
    rotateDirection: -1,
    basePosition: 180,
    type: '360',
    icons: [
      {
        version: 1,
        uuid: '668f5507-9c5a-4e8d-b870-3eb9cad489db',
        cameraPath: 'RTMP_30',
        sourceType: 'default',
        iconType: 'flat-0',
        position: { x: 127.74, y: -115.06, z: 53.31 },
        scale: 1,
        opacity: 0.8,
        visible: true,
      },
      {
        version: 1,
        uuid: '13567428-b302-4b27-9e69-b3346ad2eb67',
        cameraPath: 'RTMP_33',
        sourceType: 'default',
        iconType: 'flat-0',
        position: { x: 91.54, y: -90.16, z: 126.05 },
        scale: 0.94,
        opacity: 1,
        visible: true,
      },
    ],
  },
  {
    _id: '6a3923485fbfdae53fda9fbf',
    name: 'DemoTable_RTMP_34',
    relayUri: 'RTMP_34',
    x: 0.5733,
    y: 0.4146,
    path: 'RTMP_34',
    rotateSpeed: 2,
    rotateDirection: -1,
    basePosition: -88,
    type: '360',
    icons: [
      {
        version: 1,
        uuid: 'b4249e60-c4a7-4b90-88a4-cbecdca65035',
        cameraPath: 'RTMP_31',
        sourceType: 'default',
        iconType: 'flat-0',
        position: { x: -130.0, y: -94.28, z: 81.28 },
        scale: 0.74,
        opacity: 1,
        visible: true,
      },
      {
        version: 1,
        uuid: '4a9151ea-7a07-4be5-9814-44a0cd816493',
        cameraPath: 'RTMP_35',
        sourceType: 'default',
        iconType: 'flat-0',
        position: { x: -7.04, y: -83.25, z: 159.43 },
        scale: 0.75,
        opacity: 1,
        visible: true,
      },
    ],
  },
  {
    _id: '6a3bae337e120cca57c40032',
    name: 'GlobalWall_RTMP_33',
    relayUri: 'RTMP_33',
    x: 0.2498,
    y: 0.3697,
    path: 'RTMP_33',
    rotateSpeed: 2,
    rotateDirection: -1,
    basePosition: 98,
    type: '360',
    icons: [
      {
        version: 1,
        uuid: '0b19c122-7433-4b1d-8177-ea39554e8565',
        cameraPath: 'RTMP_32',
        sourceType: 'default',
        iconType: 'flat-0',
        position: { x: -127.8, y: -100.0, z: 77.8 },
        scale: 0.71,
        opacity: 1,
        visible: true,
      },
      {
        version: 1,
        uuid: '88cf5854-9341-4675-98c3-e64a79a61613',
        cameraPath: 'RTMP_31',
        sourceType: 'default',
        iconType: 'flat-0',
        position: { x: 124.23, y: -82.51, z: 100.78 },
        scale: 0.79,
        opacity: 1,
        visible: true,
      },
    ],
  },
  {
    _id: '6a354cc97e120cca57eb21b9',
    name: 'WorkStation_RTMP_35',
    relayUri: 'RTMP_35',
    x: 0.4852,
    y: 0.3812,
    path: 'RTMP_35',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: 0,
    type: '360',
    icons: [
      {
        version: 1,
        uuid: '368ab0b2-2035-438e-91b4-32ff58e6a9e0',
        cameraPath: 'RTMP_34',
        sourceType: 'default',
        iconType: 'flat-0',
        position: { x: 17.97, y: -139.26, z: -112.61 },
        scale: 0.68,
        opacity: 1,
        visible: true,
      },
    ],
  },
  {
    _id: '6a564cc97e120cca57eb21c0',
    name: 'RTMP_36 3D',
    relayUri: 'RTMP_36',
    x: 0.4146,
    y: 0.5447,
    path: 'RTMP_36',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: -89,
    type: '360',
    icons: [],
  },
  {
    _id: '6a564cc97e120cca57eb21c1',
    name: 'RTMP_37 3D',
    relayUri: 'RTMP_37',
    x: 0.4136,
    y: 0.4348,
    path: 'RTMP_37',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: 0,
    type: '360',
    icons: [],
  },
  // RTSP IP Cameras matching prompt
  {
    _id: '6a4396117e120cca57d24c8b',
    name: 'IP-CAM-10',
    relayUri: 'rtsp://admin:2%406S%3FcIpR2@10.10.12.10:554/stream1',
    x: 0.1978,
    y: 0.1789,
    path: 'b4f0e750-22cc-455f-8cbf-b7d5081976ae',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: 0,
    type: 'rtsp',
    icons: [],
  },
  {
    _id: '6a3bc0b47e120cca57c43793',
    name: 'IP-CAM-11',
    relayUri: 'rtsp://admin:2%406S%3FcIpR2@10.10.12.11:554/stream1',
    x: 0.1344,
    y: 0.5740,
    path: '1415c1aa-32ce-4e29-b3f9-625282677ab8',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: 0,
    type: 'rtsp',
    icons: [],
  },
  {
    _id: '6a3bc3537e120cca57c43e65',
    name: 'IP-CAM-12',
    relayUri: 'rtsp://admin:2%406S%3FcIpR2@10.10.12.12:554/stream1',
    x: 0.5830,
    y: 0.0889,
    path: '217fd270-6369-4a58-a2a3-c52ece95940a',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: 0,
    type: 'rtsp',
    icons: [],
  },
  {
    _id: '6a3bc3537e120cca57c43e66',
    name: 'IP-CAM-13',
    relayUri: 'rtsp://admin:2%406S%3FcIpR2@10.10.12.13:554/stream1',
    x: 0.2738,
    y: 0.1302,
    path: '78b2aab6-54f6-4f5a-959d-e3576230eab8',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: 0,
    type: 'rtsp',
    icons: [],
  },
  {
    _id: '6a3bc3537e120cca57c43e67',
    name: 'IP-CAM-14',
    relayUri: 'rtsp://admin:2%406S%3FcIpR2@10.10.12.14:554/stream1',
    x: 0.5716,
    y: 0.3318,
    path: '5f18be11-80f8-4840-be87-aac7f7e086e2',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: 0,
    type: 'rtsp',
    icons: [],
  },
  {
    _id: '6a3bc3537e120cca57c43e68',
    name: 'IP-CAM-15',
    relayUri: 'rtsp://admin:2%406S%3FcIpR2@10.10.12.15:554/stream1',
    x: 0.2498,
    y: 0.3173,
    path: '85224f74-abdf-448d-9ffb-3d1297c7ba60',
    rotateSpeed: 1,
    rotateDirection: -1,
    basePosition: 0,
    type: 'rtsp',
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
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: ApiResponse = await res.json();
      if (data.success && data.data) {
        return augmentPlantData(data.data);
      }
    }
  } catch (err) {
    console.warn(`[OmniRecord] Live API unreachable (${targetUrl}), activating Cupola offline mock engine.`);
  }

  return getMockPlantData(plantId);
}

function augmentPlantData(rawPlant: PlantData): PlantData {
  const floorplanUrl = rawPlant.renderFile || createProceduralFloorplan();

  const augmentedCameras: Camera[] = rawPlant.cameras.map((cam) => {
    const is360 = cam.name.includes('RTMP') || !cam.relayUri.startsWith('rtsp');
    const panoUrl = createProceduralPanorama(cam.name, cam.relayUri);
    return {
      ...cam,
      chipid: cam.chipid || null,
      ip: cam.ip || '',
      port: cam.port || '80',
      uri: cam.uri || '',
      vfov: cam.vfov || 0,
      type: is360 ? '360' : 'rtsp',
      panoramaUrl: panoUrl,
      thumbnailUrl: panoUrl,
      isOnline: true,
    };
  });

  return {
    ...rawPlant,
    renderFile: floorplanUrl,
    cameras: augmentedCameras,
  };
}

export function getMockPlantData(plantId: string = DEFAULT_PLANT_ID): PlantData {
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
      uri: '',
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
    };
  });

  return {
    _id: plantId,
    name: 'UAE-OFFICE',
    originFile: '/static/plant/6a38fb720ab1620742c32c96/origin-1788244152557.jpg',
    renderFile: floorplanUrl,
    originKey: '6a38fb720ab1620742c32c96/origin-1788244152557.jpg',
    renderKey: '6a38fb720ab1620742c32c96/render-1788244152557.png',
    priority: 0,
    group: null,
    pinTime: null,
    updateTime: new Date().toISOString(),
    createTime: '2026-06-22T09:08:02.125Z',
    cameras,
  };
}
