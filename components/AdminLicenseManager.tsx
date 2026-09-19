"use client";
import { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Lock,
  LogOut,
  ShieldCheck,
  Database,
  Search,
  AlertCircle,
  Loader2,
  UserCheck,
  RotateCcw
} from 'lucide-react';

interface LicenseRecord {
  id: string | number;
  licenseKey: string;
  type: string;
  status: string;
  deviceLimit: number;
  activations: number;
  label?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
}

interface DbStatus {
  status: string;
  isNeon: boolean;
  host: string;
  latencyMs: number | null;
}

export function AdminLicenseManager() {
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<string>('');

  // Login form state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // License Generator state
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [type, setType] = useState('lifetime');
  const [deviceLimit, setDeviceLimit] = useState(3);
  const [label, setLabel] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);

  async function checkSession() {
    setAuthChecking(true);
    try {
      const res = await fetch('/api/admin/me');
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        setAdminUser(data.username || 'admin');
        loadLicenses();
        loadStatus();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setAuthChecking(false);
    }
  }

  async function loadStatus() {
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) {
        const data = await res.json();
        if (data.database) {
          setDbStatus(data.database);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) return;

    setLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser.trim(), password: loginPass.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminUser(data.username);
        setLoginPass('');
        await loadLicenses();
        await loadStatus();
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch {
      setLoginError('Server error during authentication');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthenticated(false);
      setAdminUser('');
      setLicenses([]);
    }
  }

  async function loadLicenses() {
    setFetching(true);
    try {
      const res = await fetch('/api/license/generate');
      const data = await res.json();
      if (data.success && Array.isArray(data.licenses)) {
        setLicenses(data.licenses);
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }

  async function generateKey(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/license/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, deviceLimit, label }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedKey(data.license.licenseKey);
        setLabel('');
        setActionMessage({ type: 'success', text: `Generated new license key: ${data.license.licenseKey}` });
        await loadLicenses();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to generate license' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Error communicating with server' });
    } finally {
      setLoading(false);
    }
  }

  async function handleExecuteRevoke(lic: LicenseRecord) {
    setActionLoadingId(lic.id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/license/generate?id=${encodeURIComponent(lic.id)}&key=${encodeURIComponent(lic.licenseKey)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLicenses(prev => prev.map(l => l.id === lic.id ? { ...l, status: 'revoked' } : l));
        setConfirmRevokeId(null);
        setActionMessage({ type: 'success', text: `License key ${lic.licenseKey} has been revoked.` });
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to revoke key' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Error revoking key' });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleToggleStatus(lic: LicenseRecord, newStatus: 'active' | 'revoked') {
    setActionLoadingId(lic.id);
    setActionMessage(null);
    try {
      const res = await fetch('/api/license/generate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lic.id, key: lic.licenseKey, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLicenses(prev => prev.map(l => l.id === lic.id ? { ...l, status: newStatus } : l));
        setActionMessage({
          type: 'success',
          text: `License key ${lic.licenseKey} is now ${newStatus}.`,
        });
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to update license' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Error updating status' });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleResetActivations(lic: LicenseRecord) {
    setActionLoadingId(lic.id);
    setActionMessage(null);
    try {
      const res = await fetch('/api/license/generate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lic.id, key: lic.licenseKey, action: 'reset_activations' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLicenses(prev => prev.map(l => l.id === lic.id ? { ...l, activations: 0 } : l));
        setActionMessage({
          type: 'success',
          text: `Device activations for ${lic.licenseKey} reset to 0.`,
        });
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to reset device count' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Error resetting devices' });
    } finally {
      setActionLoadingId(null);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        if (!mounted) return;
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAdminUser(data.username || 'admin');
          loadLicenses();
          loadStatus();
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        if (mounted) setIsAuthenticated(false);
      } finally {
        if (mounted) setAuthChecking(false);
      }
    }

    initSession();
    return () => {
      mounted = false;
    };
  }, []);

  if (authChecking) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Unauthenticated Admin Login Screen
  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center p-6 bg-zinc-900/5">
        <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-xl p-8">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex items-center justify-center mx-auto mb-4 shadow-md">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-zinc-900">Admin Authentication</h1>
            <p className="text-xs text-zinc-500 mt-1">
              Protected area. Log in with your admin credentials to access the Neon license key generator.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                disabled={loggingIn}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                disabled={loggingIn}
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn || !loginUser || !loginPass}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-blue-400" />}
              {loggingIn ? 'Authenticating...' : 'Sign In as Admin'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-100 text-center">
            <span className="text-[11px] text-zinc-400">
              Configure credentials via ADMIN_PASSWORD & DATABASE_URL in environment settings.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Filter licenses by search term
  const filteredLicenses = licenses.filter((lic) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      lic.licenseKey.toLowerCase().includes(term) ||
      (lic.label && lic.label.toLowerCase().includes(term)) ||
      lic.type.toLowerCase().includes(term)
    );
  });

  // Authenticated Admin Dashboard
  return (
    <div className="p-8 h-full flex flex-col max-w-5xl mx-auto overflow-y-auto">
      {/* Top Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900">Admin License Management</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-blue-100 text-blue-800 border border-blue-200">
              Admin Only
            </span>
          </div>
          <p className="text-zinc-500 text-xs mt-1">
            Generate and manage software license keys. All keys persist to your Neon PostgreSQL database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Neon Database Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-zinc-50 text-xs text-zinc-700">
            <Database className={`w-4 h-4 ${dbStatus?.isNeon ? 'text-emerald-500' : 'text-zinc-400'}`} />
            <div>
              <span className="font-semibold block">
                {dbStatus?.isNeon ? 'Neon Database' : 'SQLite Local'}
              </span>
              <span className="text-[10px] text-zinc-500 block truncate max-w-[130px]">
                {dbStatus?.host || 'Active'}
              </span>
            </div>
          </div>

          {/* Admin User Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-zinc-50 text-xs text-zinc-700">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{adminUser}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 border rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
            title="Sign Out as Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Generator Form */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            Generate New License Key
          </h2>
          <span className="text-xs text-zinc-400">Stores directly to Neon</span>
        </div>

        <form onSubmit={generateKey} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">License Tier</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-blue-500"
            >
              <option value="lifetime">Lifetime License (No Expiry)</option>
              <option value="annual">Annual License (1 Year)</option>
              <option value="monthly">Monthly License (30 Days)</option>
              <option value="trial">14-Day Free Trial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Device Limit</label>
            <input
              type="number"
              min={1}
              max={50}
              value={deviceLimit}
              onChange={(e) => setDeviceLimit(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Customer / Order Reference</label>
            <input
              type="text"
              placeholder="e.g. Gumroad #5921 or customer@email.com"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Creating in Neon...' : 'Generate Standalone License'}
            </button>
          </div>
        </form>

        {generatedKey && (
          <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                License Generated & Saved to Database
              </div>
              <div className="font-mono text-xl font-bold text-emerald-950 tracking-wider select-all">
                {generatedKey}
              </div>
            </div>
            <button
              onClick={() => copyText(generatedKey)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shrink-0 shadow-sm"
            >
              {copiedKey === generatedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copiedKey === generatedKey ? 'Copied!' : 'Copy Key'}
            </button>
          </div>
        )}
      </div>

      {/* Generated Keys List */}
      <div className="bg-white rounded-xl border shadow-sm p-6 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-900">
              Active Database Records ({licenses.length})
            </h2>
            <button
              onClick={loadLicenses}
              disabled={fetching}
              className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-500 transition-colors"
              title="Refresh list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search keys, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 border rounded-lg text-xs outline-none focus:border-blue-500 w-64"
            />
          </div>
        </div>

        {actionMessage && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center justify-between mb-4 border ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs font-semibold ml-2 hover:opacity-75"
            >
              Dismiss
            </button>
          </div>
        )}

        {filteredLicenses.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-sm">
            {licenses.length === 0
              ? 'No license keys found in the Neon database. Generate your first key above.'
              : 'No keys match your search criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 px-3">License Key</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Device Usage</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLicenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-zinc-50">
                    <td className="py-3 px-3 font-mono font-medium text-zinc-900 flex items-center gap-2">
                      <span>{lic.licenseKey}</span>
                      <button
                        onClick={() => copyText(lic.licenseKey)}
                        className="text-zinc-400 hover:text-zinc-700"
                        title="Copy Key"
                      >
                        {copiedKey === lic.licenseKey ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3 capitalize text-zinc-700 text-xs font-medium">
                      {lic.type}
                    </td>
                    <td className="py-3 px-3 text-xs text-zinc-600">
                      <div className="flex items-center gap-2">
                        <span>
                          <span className="font-semibold">{lic.activations || 0}</span> / {lic.deviceLimit}
                        </span>
                        {(lic.activations || 0) > 0 && (
                          <button
                            onClick={() => handleResetActivations(lic)}
                            disabled={actionLoadingId === lic.id}
                            className="text-[10px] text-blue-600 hover:text-blue-800 underline font-medium"
                            title="Reset active device counter to 0"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                          lic.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {lic.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-zinc-500">{lic.label || '—'}</td>
                    <td className="py-3 px-3 text-right">
                      {confirmRevokeId === lic.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs text-red-700 font-semibold">Revoke?</span>
                          <button
                            onClick={() => handleExecuteRevoke(lic)}
                            disabled={actionLoadingId === lic.id}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-2 py-0.5 rounded shadow-sm disabled:opacity-50"
                          >
                            {actionLoadingId === lic.id ? '...' : 'Yes'}
                          </button>
                          <button
                            onClick={() => setConfirmRevokeId(null)}
                            disabled={actionLoadingId === lic.id}
                            className="text-xs bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-2 py-0.5 rounded font-medium"
                          >
                            No
                          </button>
                        </div>
                      ) : lic.status === 'active' ? (
                        <button
                          onClick={() => setConfirmRevokeId(lic.id)}
                          disabled={actionLoadingId === lic.id}
                          className="text-xs text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1"
                          title="Revoke license"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(lic, 'active')}
                          disabled={actionLoadingId === lic.id}
                          className="text-xs text-emerald-600 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                          title="Reactivate license"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
