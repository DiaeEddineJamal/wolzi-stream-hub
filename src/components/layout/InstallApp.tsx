import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, EllipsisVertical, MonitorDown, PlusSquare, Share, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { promptInstall, useInstall, type InstallRoute } from '@/lib/install';

const DISMISS_KEY='admax-install-dismissed',DISMISS_DAYS=14;
const steps:Record<Exclude<InstallRoute,'prompt'>,{icon:typeof Share;text:React.ReactNode}[]>={
  ios:[{icon:Share,text:<>Tap <strong>Share</strong> in your browser’s toolbar (Safari: bottom bar, Chrome/Edge/Firefox: next to the address bar).</>},{icon:PlusSquare,text:<>Scroll and choose <strong>Add to Home Screen</strong>.</>},{icon:Download,text:<>Tap <strong>Add</strong>. A&D MAX opens full screen from your Home Screen.</>}],
  'android-menu':[{icon:EllipsisVertical,text:<>Open your browser menu <strong>⋮</strong>.</>},{icon:Download,text:<>Choose <strong>Install</strong> or <strong>Add to Home screen</strong>.</>},{icon:PlusSquare,text:<>Confirm. A&D MAX appears with your other apps.</>}],
  'mac-safari':[{icon:Share,text:<>In the menu bar, choose <strong>File</strong>, or tap <strong>Share</strong> in the toolbar.</>},{icon:PlusSquare,text:<>Choose <strong>Add to Dock</strong>.</>},{icon:Download,text:<>Click <strong>Add</strong>. A&D MAX opens in its own window.</>}],
  'desktop-menu':[{icon:MonitorDown,text:<>Click the <strong>install icon</strong> at the right of the address bar.</>},{icon:EllipsisVertical,text:<>Or open the browser menu and choose <strong>Install A&D MAX</strong> (in Edge: Apps → Install this site as an app).</>},{icon:Download,text:<>Confirm. A&D MAX opens in its own window.</>}],
  'desktop-firefox':[{icon:MonitorDown,text:<>Firefox on computers can’t install web apps yet.</>},{icon:Download,text:<>Open this page in <strong>Chrome</strong>, <strong>Edge</strong> or <strong>Safari</strong> to install A&D MAX.</>},{icon:PlusSquare,text:<>On your phone, every browser can add A&D MAX to the Home Screen.</>}],
};

export default function InstallApp(){
  const {installed,route}=useInstall(),{pathname}=useLocation();
  const [open,setOpen]=useState(false),[banner,setBanner]=useState(false);
  useEffect(()=>{const show=()=>setOpen(true);window.addEventListener('admax-install',show);return()=>window.removeEventListener('admax-install',show);},[]);
  // Phones only, after a short visit, never during playback, and quiet for two weeks after dismissal.
  useEffect(()=>{
    if(installed||pathname.startsWith('/watch')||!window.matchMedia('(max-width:767px)').matches)return setBanner(false);
    try{if(Date.now()-Number(localStorage.getItem(DISMISS_KEY)||0)<DISMISS_DAYS*864e5)return;}catch{/* Storage blocked: still offer it. */}
    const timer=setTimeout(()=>setBanner(true),12000);return()=>clearTimeout(timer);
  },[installed,pathname]);
  const dismiss=()=>{setBanner(false);try{localStorage.setItem(DISMISS_KEY,String(Date.now()));}catch{/* Banner simply returns next visit. */}};
  const install=async()=>{if(route==='prompt'){setBanner(false);await promptInstall();}else setOpen(true);};
  if(installed)return null;
  return <>
    {banner&&<aside className="install-banner" aria-label="Install the app"><img src="/icons/icon-192.png" alt="" width={44} height={44}/><div><strong>Get the A&D MAX app</strong><span>Full screen, one tap from your Home Screen.</span></div><Button size="sm" onClick={()=>void install()}>Install</Button><button className="install-banner-close" onClick={dismiss} aria-label="Not now"><X size={16}/></button></aside>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="glass-dialog install-dialog">
      <img className="install-icon" src="/icons/icon-192.png" alt="" width={72} height={72}/>
      <DialogHeader><DialogTitle>Install A&D MAX</DialogTitle><DialogDescription>Full screen, no browser bars, and one tap from your Home Screen or dock.</DialogDescription></DialogHeader>
      {route==='prompt'?<Button className="w-full" onClick={()=>{setOpen(false);void promptInstall();}}><Download size={16}/>Install app</Button>
        :<ol className="install-steps">{steps[route].map(({icon:Icon,text},i)=><li key={i}><span><Icon size={18}/></span><p>{text}</p></li>)}</ol>}
    </DialogContent></Dialog>
  </>;
}
