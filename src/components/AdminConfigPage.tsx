import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ShieldCheck,
  Server,
  Video,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  LogIn,
  RotateCcw,
  Save,
  Globe,
  Lock
} from 'lucide-react';
import { getAppConfig, saveAppConfig, resetAppConfig, type AppConfig } from '../services/configService';
import { resolveApiUrl, loginToCupola } from '../services/apiService';

interface AdminConfigPageProps {
  onBackToDashboard: () => void;
  onConfigSaved: (config: AppConfig) => void;
  theme?: 'light' | 'dark';
}

export const AdminConfigPage: React.FC<AdminConfigPageProps> = ({
  onBackToDashboard,
  onConfigSaved,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [config, setConfig] = useState<AppConfig>(getAppConfig());
  const [activeTab, setActiveTab] = useState<'all' | 'cupola' | 'nvr' | 'go2rtc'>('all');

  const [testingCupola, setTestingCupola] = useState(false);
  const [cupolaResult, setCupolaResult] = useState<{ success: boolean; msg: string } | null>(null);

  const [testingNvr, setTestingNvr] = useState(false);
  const [nvrResult, setNvrResult] = useState<{ success: boolean; msg: string } | null>(null);

  const [testingGo2rtc, setTestingGo2rtc] = useState(false);
  const [go2rtcResult, setGo2rtcResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    setConfig(getAppConfig());
  }, []);

  const handleChange = (field: keyof AppConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleTestCupola = async () => {
    setTestingCupola(true);
    setCupolaResult(null);
    const testUrl = resolveApiUrl(config.cupolaApiBaseUrl, `/2/account/plant/${config.plantId}/?videoToken=true`);

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500);
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (config.authToken.trim()) {
        headers['Authorization'] = `Bearer ${config.authToken.trim()}`;
        headers['x-access-token'] = config.authToken.trim();
      }

      const res = await fetch(testUrl, { method: 'GET', headers, credentials: 'same-origin', signal: controller.signal });
      clearTimeout(id);

      if (res.ok) {
        setCupolaResult({ success: true, msg: `Connected successfully to Cupola backend (${config.cupolaApiBaseUrl})!` });
      } else {
        setCupolaResult({ success: false, msg: `Cupola server returned status ${res.status} (${res.statusText || 'Unauthorized'})` });
      }
    } catch (err) {
      setCupolaResult({ success: false, msg: `Unreachable: Could not connect to Cupola server at ${config.cupolaApiBaseUrl}` });
    } finally {
      setTestingCupola(false);
    }
  };

  const handleAutoLoginCupola = async () => {
    setTestingCupola(true);
    setCupolaResult(null);
    try {
      const freshToken = await loginToCupola(config.cupolaApiBaseUrl, 'admin', 'qwer1234');
      if (freshToken) {
        setConfig((prev) => ({ ...prev, authToken: freshToken }));
        setCupolaResult({ success: true, msg: 'Auto-authentication successful! Fresh JWT token obtained.' });
      } else {
        setCupolaResult({ success: false, msg: 'Auto-login failed. Verify server URL and credentials.' });
      }
    } catch (e) {
      setCupolaResult({ success: false, msg: 'Error authenticating with Cupola backend.' });
    } finally {
      setTestingCupola(false);
    }
  };

  const handleTestNvr = async () => {
    setTestingNvr(true);
    setNvrResult(null);

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('/api/nvr/ISAPI/System/deviceInfo', {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(id);

      if (res.ok) {
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'application/xml');
        const devName = doc.getElementsByTagName('deviceName')[0]?.textContent || 'Hikvision NVR';
        setNvrResult({ success: true, msg: `NVR ISAPI Connected! Device: ${devName} (${config.nvrIp})` });
      } else {
        setNvrResult({ success: false, msg: `NVR returned HTTP ${res.status}. Check credentials & proxy.` });
      }
    } catch (err) {
      setNvrResult({ success: false, msg: `Could not reach Hikvision NVR at ${config.nvrIp}:${config.nvrHttpPort}` });
    } finally {
      setTestingNvr(false);
    }
  };

  const handleTestGo2rtc = async () => {
    setTestingGo2rtc(true);
    setGo2rtcResult(null);

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('/api/streams', { method: 'GET', signal: controller.signal });
      clearTimeout(id);

      if (res.ok) {
        setGo2rtcResult({ success: true, msg: `go2rtc Streaming Gateway active on port 1984!` });
      } else {
        setGo2rtcResult({ success: false, msg: `go2rtc gateway returned status ${res.status}` });
      }
    } catch (err) {
      setGo2rtcResult({ success: false, msg: `go2rtc server unreachable on ${config.go2rtcBaseUrl}` });
    } finally {
      setTestingGo2rtc(false);
    }
  };

  const handleSave = () => {
    const updated = saveAppConfig(config);
    onConfigSaved(updated);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
    onBackToDashboard();
  };

  const handleResetDefaults = () => {
    const reset = resetAppConfig();
    setConfig(reset);
    setCupolaResult({ success: true, msg: 'Configuration reset to factory defaults.' });
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Sleek Top Admin Header Bar */}
      <header className={`border-b px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md transition-colors ${
        isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.pushState({}, '', '/');
              }
              onBackToDashboard();
            }}
            className={`px-3.5 py-1.5 rounded-xl transition border flex items-center gap-1.5 text-xs font-semibold ${
              isDark
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <div className={`h-4 w-px ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}></div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold flex items-center gap-2">
                <span>Admin System Configuration</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  /admin
                </span>
              </h1>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Manage server IP endpoints, camera credentials, and streaming proxies.
              </p>
            </div>
          </div>
        </div>

        {/* Top Save & Reset Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply</span>
          </button>
        </div>
      </header>

      {/* Main Form Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Navigation Section Tabs */}
        <div className={`p-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Configurations
          </button>
          <button
            onClick={() => setActiveTab('cupola')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'cupola'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Server className="w-4 h-4 text-indigo-400" />
            <span>Cupola 360 Backend</span>
          </button>
          <button
            onClick={() => setActiveTab('nvr')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'nvr'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Video className="w-4 h-4 text-emerald-400" />
            <span>Hikvision NVR</span>
          </button>
          <button
            onClick={() => setActiveTab('go2rtc')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'go2rtc'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Radio className="w-4 h-4 text-amber-400" />
            <span>go2rtc Proxy Gateway</span>
          </button>
        </div>

        {/* Section 1: Cupola 360 API Settings */}
        {(activeTab === 'all' || activeTab === 'cupola') && (
          <div className={`p-6 rounded-2xl border space-y-5 shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-indigo-400" />
                <div>
                  <h2 className="font-bold text-sm uppercase tracking-wider text-indigo-400">Cupola 360 Backend Server</h2>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Configure main API server host, Plant ID, and JWT auth tokens.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoLoginCupola}
                  disabled={testingCupola}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Auto-Fetch Token
                </button>
                <button
                  onClick={handleTestCupola}
                  disabled={testingCupola}
                  className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-xl border border-indigo-500/40 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingCupola ? 'animate-spin' : ''}`} />
                  Test Cupola Connection
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="font-bold block mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cupola API Base URL</span>
                </label>
                <input
                  type="text"
                  value={config.cupolaApiBaseUrl}
                  onChange={(e) => handleChange('cupolaApiBaseUrl', e.target.value)}
                  placeholder="e.g. http://10.10.12.50:3000"
                  className={`w-full p-3 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-indigo-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-indigo-500'
                  }`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Default API Host: http://10.10.12.50:3000</p>
              </div>

              <div>
                <label className="font-bold block mb-1.5">Plant ID</label>
                <input
                  type="text"
                  value={config.plantId}
                  onChange={(e) => handleChange('plantId', e.target.value)}
                  placeholder="e.g. 6a38fb720ab1620742c32c96"
                  className={`w-full p-3 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-indigo-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-indigo-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="font-bold flex items-center gap-1.5 mb-1.5 text-xs">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>Authentication Bearer Token (JWT)</span>
              </label>
              <input
                type="password"
                value={config.authToken}
                onChange={(e) => handleChange('authToken', e.target.value)}
                placeholder="Paste Bearer Token"
                className={`w-full p-3 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-indigo-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-indigo-500'
                }`}
              />
            </div>

            {cupolaResult && (
              <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
                cupolaResult.success ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-amber-950/40 border-amber-800 text-amber-300'
              }`}>
                {cupolaResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                <span>{cupolaResult.msg}</span>
              </div>
            )}
          </div>
        )}

        {/* Section 2: Hikvision NVR Settings */}
        {(activeTab === 'all' || activeTab === 'nvr') && (
          <div className={`p-6 rounded-2xl border space-y-5 shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <div className="flex items-center gap-2.5">
                <Video className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="font-bold text-sm uppercase tracking-wider text-emerald-400">Hikvision NVR IP & Port Settings</h2>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Set IP address, HTTP port, RTSP port, and login credentials for NVR.</p>
                </div>
              </div>
              <button
                onClick={handleTestNvr}
                disabled={testingNvr}
                className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-xl border border-emerald-500/40 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingNvr ? 'animate-spin' : ''}`} />
                Test NVR ISAPI
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="md:col-span-1">
                <label className="font-bold block mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NVR IP Address</span>
                </label>
                <input
                  type="text"
                  value={config.nvrIp}
                  onChange={(e) => handleChange('nvrIp', e.target.value)}
                  placeholder="e.g. 10.10.12.2"
                  className={`w-full p-3 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1.5">HTTP Port</label>
                <input
                  type="text"
                  value={config.nvrHttpPort}
                  onChange={(e) => handleChange('nvrHttpPort', e.target.value)}
                  placeholder="80"
                  className={`w-full p-3 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1.5">RTSP Port</label>
                <input
                  type="text"
                  value={config.nvrRtspPort}
                  onChange={(e) => handleChange('nvrRtspPort', e.target.value)}
                  placeholder="554"
                  className={`w-full p-3 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="font-bold block mb-1.5">NVR Username</label>
                <input
                  type="text"
                  value={config.nvrUsername}
                  onChange={(e) => handleChange('nvrUsername', e.target.value)}
                  placeholder="admin"
                  className={`w-full p-3 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NVR Password</span>
                </label>
                <input
                  type="password"
                  value={config.nvrPassword}
                  onChange={(e) => handleChange('nvrPassword', e.target.value)}
                  placeholder="••••••••"
                  className={`w-full p-3 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-emerald-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>

            {nvrResult && (
              <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
                nvrResult.success ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-amber-950/40 border-amber-800 text-amber-300'
              }`}>
                {nvrResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                <span>{nvrResult.msg}</span>
              </div>
            )}
          </div>
        )}

        {/* Section 3: go2rtc Streaming Gateway */}
        {(activeTab === 'all' || activeTab === 'go2rtc') && (
          <div className={`p-6 rounded-2xl border space-y-5 shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <div className="flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="font-bold text-sm uppercase tracking-wider text-amber-400">go2rtc Streaming Proxy Server</h2>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Used for zero-latency WebRTC streams and RTSP MP4 transcoding.</p>
                </div>
              </div>
              <button
                onClick={handleTestGo2rtc}
                disabled={testingGo2rtc}
                className="px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-xl border border-amber-500/40 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingGo2rtc ? 'animate-spin' : ''}`} />
                Test go2rtc
              </button>
            </div>

            <div className="text-xs">
              <label className="font-bold block mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>go2rtc Gateway Base URL</span>
              </label>
              <input
                type="text"
                value={config.go2rtcBaseUrl}
                onChange={(e) => handleChange('go2rtcBaseUrl', e.target.value)}
                placeholder="e.g. http://127.0.0.1:1984"
                className={`w-full p-3 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-amber-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-amber-500'
                }`}
              />
            </div>

            {go2rtcResult && (
              <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
                go2rtcResult.success ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-amber-950/40 border-amber-800 text-amber-300'
              }`}>
                {go2rtcResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                <span>{go2rtcResult.msg}</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
