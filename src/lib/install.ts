import { useSyncExternalStore } from 'react';

// Chromium browsers (Chrome, Edge, Samsung Internet, Opera) fire beforeinstallprompt; capture it as early as possible.
interface InstallPromptEvent extends Event { prompt:()=>Promise<void>; userChoice:Promise<{outcome:'accepted'|'dismissed'}>; }
let deferred:InstallPromptEvent|null=null;
const listeners=new Set<()=>void>();
const notify=()=>listeners.forEach(fn=>fn());
const standalone=()=>typeof window!=='undefined'&&(window.matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone===true);
let installed=standalone();
if(typeof window!=='undefined'){
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event as InstallPromptEvent;notify();});
  window.addEventListener('appinstalled',()=>{deferred=null;installed=true;notify();});
}

// Which install path this browser supports; every other browser gets step-by-step instructions.
export type InstallRoute='prompt'|'ios'|'android-menu'|'mac-safari'|'desktop-firefox'|'desktop-menu';
function route():InstallRoute{
  if(deferred)return 'prompt';
  const ua=navigator.userAgent;
  if(/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return 'ios';
  if(/Android/.test(ua))return 'android-menu';
  if(/Firefox/.test(ua))return 'desktop-firefox';
  if(/Safari/.test(ua)&&!/Chrome|Chromium|Edg|OPR/.test(ua))return 'mac-safari';
  return 'desktop-menu';
}

const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
let snapshot={installed,route:'desktop-menu' as InstallRoute};
const read=()=>{const next={installed,route:route()};if(next.installed!==snapshot.installed||next.route!==snapshot.route)snapshot=next;return snapshot;};
export function useInstall(){return useSyncExternalStore(subscribe,read,()=>snapshot);}

export async function promptInstall(){
  if(!deferred)return false;
  const event=deferred;deferred=null;notify();
  await event.prompt();
  return (await event.userChoice).outcome==='accepted';
}
export const openInstall=()=>window.dispatchEvent(new Event('admax-install'));
