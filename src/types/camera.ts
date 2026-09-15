export interface IconPosition {
  x: number;
  y: number;
  z: number;
}

export interface CameraIcon {
  version: number;
  uuid: string;
  cameraPath: string; // e.g. "RTMP_32"
  sourceType: string;
  iconType: string;
  position: IconPosition;
  scale: number;
  opacity: number;
  visible: boolean;
}

export interface Camera {
  _id: string;
  name: string; // e.g. "Reception_RTMP_30"
  chipid: string | null;
  ip: string;
  port: string;
  uri: string;
  relayUri: string;
  x: number; // 0..1 coordinate on 2D floorplan
  y: number; // 0..1 coordinate on 2D floorplan
  vfov: number;
  path: string;
  icons: CameraIcon[];
  rotateSpeed: number;
  rotateDirection: number;
  basePosition: number;
  type?: '360' | 'rtsp';
  panoramaUrl?: string;
  thumbnailUrl?: string;
  isOnline?: boolean;
  recording?: boolean;
}

export interface License {
  success: boolean;
  company: string;
  expiredAt: string | null;
  message: string;
}

export interface PlantData {
  _id: string;
  name: string; // e.g. "UAE-OFFICE"
  originFile: string;
  renderFile: string;
  originKey: string;
  renderKey: string;
  priority: number;
  group: string | null;
  pinTime: string | null;
  updateTime: string;
  createTime: string;
  cameras: Camera[];
  _debugRecordingsFetch?: string;
}

export interface ApiResponse {
  success: boolean;
  errors: string[];
  errfor: Record<string, any>;
  license: License;
  data: PlantData;
}

export interface StickyNote {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  date: string;
  text: string;
  author: string;
  color: 'yellow' | 'cyan' | 'purple' | 'green';
}

export interface RecordingItem {
  _id: string;
  key?: string;
  cameraPath?: string;
  createTime?: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
  lastSeen?: string;
  videoUrl?: string;
  videoPath?: string;
  thumbnailPath?: string;
  osdEvents?: any[];
  scanned?: boolean;
}

export interface Neighbors {
  previous: RecordingItem | null;
  next: RecordingItem | null;
}

export interface RecordingsApiResponse {
  success: boolean;
  errors?: string[];
  errfor?: Record<string, any>;
  license?: License;
  data: RecordingItem[];
  events?: any[];
  neighbors?: Neighbors;
}

