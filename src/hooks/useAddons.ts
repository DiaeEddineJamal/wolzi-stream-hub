import { useSyncExternalStore } from 'react';
import { manifestSchema, normalizeManifestUrl, type InstalledAddon } from '@/integrations/api/stremio';
const KEY = 'admax-addons';
let raw: string | null = null;
let value: InstalledAddon[] = [];
function snapshot() {
  try {
    const next = localStorage.getItem(KEY);
    if (raw !== next) {
      raw = next;
      const parsed = JSON.parse(next || '[]');
      value = Array.isArray(parsed) ? parsed.flatMap(item => {
        try { return [{manifest:manifestSchema.parse(item.manifest),transportUrl:normalizeManifestUrl(item.transportUrl),enabled:item.enabled === true}]; } catch { return []; }
      }) : [];
    }
  } catch { raw = null; }
  return value;
}
function subscribe(fn: () => void) {
  window.addEventListener('admax-addons',fn); window.addEventListener('storage',fn);
  return () => {window.removeEventListener('admax-addons',fn);window.removeEventListener('storage',fn);};
}
export function useAddons() {
  const addons = useSyncExternalStore(subscribe,snapshot);
  const save = (next: InstalledAddon[]) => {
    localStorage.setItem(KEY,JSON.stringify(next)); window.dispatchEvent(new Event('admax-addons'));
  };
  return { addons, install: (addon: InstalledAddon) => save([...snapshot().filter(a => a.manifest.id !== addon.manifest.id),addon]),
    remove: (id:string) => save(snapshot().filter(a => a.manifest.id !== id)),
    toggle: (id:string) => save(snapshot().map(a => a.manifest.id === id ? {...a,enabled:!a.enabled} : a)) };
}
