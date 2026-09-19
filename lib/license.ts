"use client";
import { useState, useEffect } from 'react';

export interface LicenseData {
  licenseKey: string;
  type: string; // lifetime, annual, monthly, trial
  status: string; // active, expired, revoked
  deviceLimit?: number;
  activations?: number;
  expiresAt?: string | null;
  activatedAt?: string;
}

const STORAGE_KEY = 'mailflow_active_license';
const DEVICE_KEY = 'mailflow_device_id';

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'dev_fallback';
  }
}

export function getStoredLicense(): LicenseData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.expiresAt) {
      if (new Date(parsed.expiresAt).getTime() < Date.now()) {
        return null; // expired
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export function storeLicense(license: LicenseData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(license));
  window.dispatchEvent(new Event('mailflow_license_changed'));
}

export function clearStoredLicense(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('mailflow_license_changed'));
}

export async function activateLicenseKey(rawKey: string): Promise<{ success: boolean; error?: string; license?: LicenseData }> {
  const cleanKey = rawKey.trim().toUpperCase();
  if (!cleanKey) {
    return { success: false, error: 'Please enter a license key' };
  }

  const deviceId = getOrCreateDeviceId();
  try {
    const res = await fetch('/api/license/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: cleanKey, deviceId, deviceName: 'Current Device' }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.license) {
      storeLicense(data.license);
      return { success: true, license: data.license };
    }
    return { success: false, error: data.error || 'Failed to activate license key' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error activating license' };
  }
}

export async function deactivateLicense(): Promise<{ success: boolean; error?: string }> {
  const current = getStoredLicense();
  const deviceId = getOrCreateDeviceId();
  if (current?.licenseKey) {
    try {
      await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: current.licenseKey, deviceId, action: 'deactivate' }),
      });
    } catch (e) {
      console.warn('Deactivate API warning:', e);
    }
  }
  clearStoredLicense();
  return { success: true };
}

export function useLicense() {
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const syncAndVerify = async () => {
      const stored = getStoredLicense();
      if (!mounted) return;
      setLicense(stored);
      setLoading(false);

      if (stored?.licenseKey) {
        try {
          const res = await fetch(`/api/license/activate?key=${encodeURIComponent(stored.licenseKey)}`);
          const data = await res.json();
          if (!mounted) return;

          if (!res.ok || !data.valid) {
            // License was revoked or expired on server
            clearStoredLicense();
            setLicense(null);
          } else if (data.license) {
            const updated = {
              ...stored,
              ...data.license,
            };
            storeLicense(updated);
            setLicense(updated);
          }
        } catch (e) {
          console.warn('Failed background license check:', e);
        }
      }
    };

    syncAndVerify();

    const handleLocalChange = () => {
      setLicense(getStoredLicense());
    };

    window.addEventListener('mailflow_license_changed', handleLocalChange);
    window.addEventListener('storage', handleLocalChange);

    return () => {
      mounted = false;
      window.removeEventListener('mailflow_license_changed', handleLocalChange);
      window.removeEventListener('storage', handleLocalChange);
    };
  }, []);

  const isPro = !!license && license.status === 'active';

  return {
    license,
    isPro,
    loading,
    setLicense: storeLicense,
    clearLicense: clearStoredLicense,
    deactivate: deactivateLicense,
    activate: activateLicenseKey,
  };
}
