export interface AppConfig {
  // Cupola 360 API Settings
  cupolaApiBaseUrl: string;
  plantId: string;
  authToken: string;

  // Hikvision NVR Settings
  nvrIp: string;
  nvrHttpPort: string;
  nvrRtspPort: string;
  nvrUsername: string;
  nvrPassword: string;

  // go2rtc Gateway Settings
  go2rtcBaseUrl: string;
}

export const DEFAULT_CONFIG: AppConfig = {
  cupolaApiBaseUrl: 'http://10.10.12.50:3000',
  plantId: '6a38fb720ab1620742c32c96',
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGM4YjNhNTRlZDg0ZTM3NzM1ZDU0ZDYiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBhc3BlZWQtZm9vLmNvbSIsInJvbGVzIjp7ImFkbWluIjp7Il9pZCI6IjY0YzhiM2E1MDE2ZGUyM2ZmMTI3YjM4YyIsImdyb3VwcyI6WyJyb290Il19LCJhY2NvdW50IjoiNjRjOGIzYTUwMTZkZTIzZmIxMjdiMzkyIn0sImdyb3VwcyI6W10sImlhdCI6MTc4OTQ1MTk5MCwiZXhwIjoxNzkwNzQ3OTkwfQ.rOpYqVkeBnbHSui47pLT6j87dQRPXD9wVSRKYOA1cvE',
  nvrIp: '10.10.12.2',
  nvrHttpPort: '80',
  nvrRtspPort: '554',
  nvrUsername: 'admin',
  nvrPassword: '16@SnV?cR1',
  go2rtcBaseUrl: 'http://127.0.0.1:1984',
};

const CONFIG_STORAGE_KEY = 'omnirecord_app_config_v1';

export const getAppConfig = (): AppConfig => {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('[Config] Failed to load saved config from localStorage', err);
  }
  return DEFAULT_CONFIG;
};

export const saveAppConfig = (config: Partial<AppConfig>): AppConfig => {
  const current = getAppConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
    console.log('[Config] App configuration successfully updated and saved to localStorage:', updated);
  } catch (err) {
    console.error('[Config] Failed to save config to localStorage', err);
  }
  return updated;
};

export const resetAppConfig = (): AppConfig => {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    console.log('[Config] App configuration reset to factory defaults.');
  } catch (err) {
    console.error('[Config] Failed to reset config in localStorage', err);
  }
  return DEFAULT_CONFIG;
};

/**
 * Builds double-encoded password credentials string for go2rtc RTSP queries.
 * Example: `admin:16%2540SnV%253FcR1@`
 */
export const buildNvrRtspCredentials = (config: AppConfig = getAppConfig()): string => {
  const user = encodeURIComponent(config.nvrUsername);
  let pass = encodeURIComponent(config.nvrPassword);
  // Double-encode percent sign so go2rtc URL query parsing doesn't unescape @ prematurely
  pass = pass.replace(/%/g, '%25');
  return `${user}:${pass}`;
};
