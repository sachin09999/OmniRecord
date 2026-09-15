import React, { useState } from 'react';
import { X, Server, CheckCircle2, AlertTriangle, RefreshCw, Key, LogIn } from 'lucide-react';
import { resolveApiUrl, loginToCupola } from '../services/apiService';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl: string;
  plantId: string;
  authToken?: string;
  onSave: (baseUrl: string, plantId: string, authToken: string) => void;
  isLiveConnected?: boolean;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  apiBaseUrl,
  plantId,
  authToken = '',
  onSave,
}) => {
  const [url, setUrl] = useState(apiBaseUrl);
  const [pid, setPid] = useState(plantId);
  const [token, setToken] = useState(authToken);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const tokenQuery = token.trim() ? encodeURIComponent(token.trim()) : 'true';
    const testUrl = resolveApiUrl(url, `/2/account/plant/${pid}/?videoToken=${tokenQuery}`);

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token.trim()) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
        headers['x-access-token'] = token.trim();
      }

      const res = await fetch(testUrl, { method: 'GET', headers, credentials: 'same-origin', signal: controller.signal });
      clearTimeout(id);

      if (res.ok) {
        setTestResult({ success: true, msg: 'Connected to live Cupola 360 API server successfully!' });
      } else {
        setTestResult({
          success: false,
          msg: `Server returned status ${res.status} (${res.statusText || 'Unauthorized'}). Provide valid Auth/Video Token.`,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        msg: 'Connection failed or CORS blocked local network request. OmniRecord offline engine active.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAutoFetchToken = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const freshToken = await loginToCupola(url, 'admin', 'qwer1234');
      if (freshToken) {
        setToken(freshToken);
        setTestResult({ success: true, msg: 'Successfully fetched and applied new token from Cupola backend!' });
      } else {
        setTestResult({ success: false, msg: 'Failed to auto-fetch token. Ensure the backend is reachable and credentials are correct.' });
      }
    } catch (e) {
      setTestResult({ success: false, msg: 'Error fetching token from Cupola backend.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave(url, pid, token);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel bg-slate-950 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-sm text-slate-100">Cupola 360 API Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 block">API Base URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. http://10.10.12.50:3000"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Default: http://10.10.12.50:3000</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 block">Plant ID</label>
            <input
              type="text"
              value={pid}
              onChange={(e) => setPid(e.target.value)}
              placeholder="e.g. 6a38fb720ab1620742c32c96"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>Auth / Video Token (Optional)</span>
              </label>
              <button
                type="button"
                onClick={handleAutoFetchToken}
                disabled={isTesting}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition disabled:opacity-50"
              >
                <LogIn className="w-3 h-3" />
                Auto-Login
              </button>
            </div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste Bearer Token / API Key / Session Token"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Sent via Authorization header and videoToken parameter</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="font-semibold text-slate-400 block mb-1">Constructed Request URL:</span>
            <code className="text-[10px] text-cyan-400 break-all block font-mono">
              {url}/2/account/plant/{pid}/?videoToken={token.trim() ? encodeURIComponent(token.trim()) : 'true'}
            </code>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              )}
              <span>{testResult.msg}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/30 transition"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
