import React, { useState, useEffect } from 'react';
import {
  X,
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
  Save
} from 'lucide-react';
import { getAppConfig, saveAppConfig, resetAppConfig, type AppConfig } from '../services/configService';
import { resolveApiUrl, loginToCupola } from '../services/apiService';

interface AdminConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (config: AppConfig) => void;
  theme?: 'light' | 'dark';
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  isOpen,
  onClose,
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
    if (isOpen) {
      setConfig(getAppConfig());
      setCupolaResult(null);
      setNvrResult(null);
      setGo2rtcResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    onClose();
  };

  const handleResetDefaults = () => {
    const reset = resetAppConfig();
    setConfig(reset);
    setCupolaResult({ success: true, msg: 'Configuration reset to factory defaults.' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`rounded-2xl max-w-2xl w-full border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Sleek Top Header Bar */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>System Administration & IP Configuration</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  PORTABLE
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Configure backend API endpoints, NVR IP addresses, and streaming gateways for deployment on any machine.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Filter */}
        <div className={`px-6 py-2 border-b flex items-center gap-2 text-xs font-semibold shrink-0 ${
          isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-gray-100/60 border-gray-200'
        }`}>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Settings
          </button>
          <button
            onClick={() => setActiveTab('cupola')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'cupola'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cupola 360</span>
          </button>
          <button
            onClick={() => setActiveTab('nvr')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'nvr'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hikvision NVR</span>
          </button>
          <button
            onClick={() => setActiveTab('go2rtc')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'go2rtc'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>go2rtc Gateway</span>
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Cupola 360 API Settings */}
          {(activeTab === 'all' || activeTab === 'cupola') && (
            <div className={`p-4 rounded-xl border space-y-4 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between border-b pb-2.5 border-slate-800">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Cupola 360 Backend Server</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutoLoginCupola}
                    disabled={testingCupola}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <LogIn className="w-3 h-3" />
                    Auto-Login
                  </button>
                  <button
                    onClick={handleTestCupola}
                    disabled={testingCupola}
                    className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg border border-indigo-500/40 text-[11px] font-semibold transition flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingCupola ? 'animate-spin' : ''}`} />
                    Test Cupola
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Cupola API Base URL</label>
                  <input
                    type="text"
                    value={config.cupolaApiBaseUrl}
                    onChange={(e) => handleChange('cupolaApiBaseUrl', e.target.value)}
                    placeholder="http://10.10.12.50:3000"
                    className={`w-full p-2.5 rounded-lg font-mono border focus:outline-none focus:ring-1 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Plant ID</label>
                  <input
                    type="text"
                    value={config.plantId}
                    onChange={(e) => handleChange('plantId', e.target.value)}
                    placeholder="6a38fb720ab1620742c32c96"
                    className={`w-full p-2.5 rounded-lg font-mono border focus:outline-none focus:ring-1 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold flex items-center gap-1 mb-1 text-xs">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Authentication Token (JWT)</span>
                </label>
                <input
                  type="password"
                  value={config.authToken}
                  onChange={(e) => handleChange('authToken', e.target.value)}
                  placeholder="Paste Bearer Token"
                  className={`w-full p-2.5 rounded-lg font-mono text-xs border focus:outline-none focus:ring-1 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-600'
                  }`}
                />
              </div>

              {cupolaResult && (
                <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
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
            <div className={`p-4 rounded-xl border space-y-4 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between border-b pb-2.5 border-slate-800">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-400">Hikvision NVR Network Settings</h3>
                </div>
                <button
                  onClick={handleTestNvr}
                  disabled={testingNvr}
                  className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-lg border border-emerald-500/40 text-[11px] font-semibold transition flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${testingNvr ? 'animate-spin' : ''}`} />
                  Test NVR ISAPI
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-1">
                  <label className="font-semibold block mb-1">NVR IP Address</label>
                  <input
                    type="text"
                    value={config.nvrIp}
                    onChange={(e) => handleChange('nvrIp', e.target.value)}
                    placeholder="10.10.12.2"
                    className={`w-full p-2.5 rounded-lg font-mono border focus:outline-none focus:ring-1 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">HTTP Port</label>
                  <input
                    type="text"
                    value={config.nvrHttpPort}
                    onChange={(e) => handleChange('nvrHttpPort', e.target.value)}
                    placeholder="80"
                    className={`w-full p-2.5 rounded-lg font-mono border focus:outline-none focus:ring-1 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">RTSP Port</label>
                  <input
                    type="text"
                    value={config.nvrRtspPort}
                    onChange={(e) => handleChange('nvrRtspPort', e.target.value)}
                    placeholder="554"
                    className={`w-full p-2.5 rounded-lg font-mono border focus:outline-none focus:ring-1 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">NVR Username</label>
                  <input
                    type="text"
                    value={config.nvrUsername}
                    onChange={(e) => handleChange('nvrUsername', e.target.value)}
                    placeholder="admin"
                    className={`w-full p-2.5 rounded-lg font-mono border focus:outline-none focus:ring-1 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">NVR Password</label>
                  <input
                    type="password"
                    value={config.nvrPassword}
                    onChange={(e) => handleChange('nvrPassword', e.target.value)}
                    placeholder="••••••••"
                    className={`w-full p-2.5 rounded-lg font-mono border focus:outline-none focus:ring-1 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {nvrResult && (
                <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
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
            <div className={`p-4 rounded-xl border space-y-4 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between border-b pb-2.5 border-slate-800">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">go2rtc Streaming Gateway</h3>
                </div>
                <button
                  onClick={handleTestGo2rtc}
                  disabled={testingGo2rtc}
                  className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-lg border border-amber-500/40 text-[11px] font-semibold transition flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${testingGo2rtc ? 'animate-spin' : ''}`} />
                  Test go2rtc
                </button>
              </div>

              <div className="text-xs">
                <label className="font-semibold block mb-1">go2rtc Gateway Server URL</label>
                <input
                  type="text"
                  value={config.go2rtcBaseUrl}
                  onChange={(e) => handleChange('go2rtcBaseUrl', e.target.value)}
                  placeholder="http://127.0.0.1:1984"
                  className={`w-full p-2.5 rounded-lg font-mono border focus:outline-none focus:ring-1 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-500' : 'bg-white border-gray-300 text-gray-900 focus:border-amber-600'
                  }`}
                />
                <p className="text-[10px] text-gray-500 mt-1">Used for WebRTC live feeds and RTSP video stream transcoding.</p>
              </div>

              {go2rtcResult && (
                <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  go2rtcResult.success ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-amber-950/40 border-amber-800 text-amber-300'
                }`}>
                  {go2rtcResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                  <span>{go2rtcResult.msg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <button
            onClick={handleResetDefaults}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-700'
            }`}
            title="Reset config parameters to default values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
