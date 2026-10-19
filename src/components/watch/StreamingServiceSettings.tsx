import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, ExternalLink, Play, RefreshCw, Server } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { normalizeServiceUrl } from '@/integrations/api/stremio';
import { getServiceInstaller, LOCAL_SERVICE, openServiceSetup, serviceReachable, useStreamingService } from '@/hooks/useStreamingService';

const PROMPT_DISMISSED_KEY='admax-service-prompt-dismissed';

export function StremioServiceModal(){
  const {service,saved,setSaved,recheck,checking}=useStreamingService();
  const [open,setOpen]=useState(false);
  const [downloading,setDownloading]=useState(false);
  const installer=getServiceInstaller();

  useEffect(()=>{
    const show=(e:Event)=>{
      const auto=(e as CustomEvent<{auto?:boolean}>).detail?.auto;
      if(auto&&installer.platform==='mobile')return;
      if(saved==='off')setSaved('');
      setOpen(true);
      void recheck();
    };
    window.addEventListener('admax-service-setup',show);
    return()=>window.removeEventListener('admax-service-setup',show);
  },[recheck,saved,setSaved,installer.platform]);

  useEffect(()=>{
    if(!open)return;
    if(service){
      toast.success('Stremio Service connected! Torrent streams are ready.');
      setOpen(false);
      setDownloading(false);
      return;
    }
    const interval=setInterval(()=>{void recheck();},2500);
    return()=>clearInterval(interval);
  },[open,service,recheck]);

  const dismiss=()=>{
    setOpen(false);
    try{sessionStorage.setItem(PROMPT_DISMISSED_KEY,'1');}catch{/* Session storage optional */}
  };

  return <Dialog open={open} onOpenChange={next=>{if(!next)dismiss();else setOpen(true);}}>
    <DialogContent className="glass-dialog service-modal max-w-md">
      <DialogHeader className="service-modal-head">
        <div className="service-modal-icon">
          <Server size={20}/>
        </div>
        <DialogTitle className="text-center">Enable Torrent & Add-on Playback</DialogTitle>
        <DialogDescription className="text-center">
          {service?'Stremio Service is active and ready on this device.':installer.platform==='mobile'?'Built-in web servers play right in your mobile browser. Torrent add-ons use the Stremio app or a desktop service.':'Install or launch Stremio Service once so torrent add-ons like Torrentio play automatically—even after rebooting.'}
        </DialogDescription>
      </DialogHeader>

      <ol className="install-steps service-modal-steps">
        <li>
          <span><Download size={16}/></span>
          <p><strong>1. Download companion</strong><br/>{installer.platform==='mobile'?'Install the Stremio mobile app or use built-in web servers below.':`Get the official installer for ${installer.platform === 'windows' ? 'Windows' : installer.platform === 'mac' ? 'macOS' : 'Linux'}.`}</p>
        </li>
        <li>
          <span><Play size={16}/></span>
          <p><strong>2. Run once (auto-starts on boot)</strong><br/>Opens silently in the background and starts automatically with your PC.</p>
        </li>
        <li>
          <span>{service?<CheckCircle2 size={16}/>:<RefreshCw size={16} className={checking||downloading?'animate-spin':''}/>}</span>
          <p><strong>3. Auto-connects</strong><br/>{service?'Connected! Ready to stream.':'Waiting on 127.0.0.1:11470… Connects and closes automatically once started.'}</p>
        </li>
      </ol>

      <div className="service-modal-actions">
        <Button asChild className="w-full" onClick={()=>setDownloading(true)}>
          <a href={installer.url} download={installer.filename||undefined} target="_blank" rel="noopener noreferrer">
            <Download size={16}/>{installer.label}
          </a>
        </Button>
        <div className="service-modal-subactions">
          <Button type="button" variant="secondary" className="flex-1" asChild>
            <a href="stremio://">
              <ExternalLink size={14}/>Launch Stremio
            </a>
          </Button>
          <Button type="button" variant="secondary" className="flex-1" disabled={checking} onClick={()=>void recheck()}>
            <RefreshCw size={14} className={checking?'animate-spin':''}/>{checking?'Checking…':'Retry detection'}
          </Button>
        </div>
      </div>

      <DialogFooter className="sm:justify-center">
        <button type="button" className="service-modal-skip" onClick={dismiss}>Continue with built-in web servers only</button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

export default function StreamingServiceSettings(){
  const {service:active,saved:service,setSaved:setService}=useStreamingService(),queryClient=useQueryClient();
  const [url,setUrl]=useState(typeof service==='string'&&service&&service!=='off'?service:LOCAL_SERVICE);
  const [busy,setBusy]=useState(false),[status,setStatus]=useState('');
  const installer=getServiceInstaller();
  const connect=async(e:React.FormEvent)=>{
    e.preventDefault();setBusy(true);setStatus('Checking your service…');
    try{const base=normalizeServiceUrl(url);if(!await serviceReachable(base))throw new Error();setService(base);void queryClient.invalidateQueries({queryKey:['streaming-service']});setStatus('Service connected. Torrent sources and format conversion can use it.');}
    catch{setStatus('Could not reach the service. Start Stremio Service on this computer and check the address.');}
    finally{setBusy(false);}
  };
  return <section id="streaming-service" className="settings-panel mb-9"><p className="eyebrow">OPTIONAL · FOR TORRENT SOURCES</p><h2 className="mb-3 text-xl">Connect your streaming service</h2><p className="mb-5 max-w-3xl text-xs leading-7 text-muted-foreground">Like Stremio Web, torrent add-ons and format conversion need Stremio Service running on your computer. A&D MAX finds it automatically at {LOCAL_SERVICE}; your browser may ask once to allow access to devices on your local network. Direct and header-based sources play without it.</p><div className="mb-4 flex flex-wrap items-center gap-3 text-xs" role="status"><span>{active?<>Connected: <code>{active}</code></>:'Not detected on this computer.'}</span>{!active&&<Button type="button" size="sm" onClick={()=>openServiceSetup(false)}><Download size={14}/>Install / Setup Stremio Service</Button>}</div><form className="flex flex-col gap-3 sm:flex-row" onSubmit={connect}><Input aria-label="Streaming service URL" value={url} onChange={e=>setUrl(e.target.value)} placeholder={LOCAL_SERVICE}/><Button disabled={busy||!url.trim()}>{busy?'Checking…':'Connect service'}</Button>{service!=='off'&&<Button type="button" variant="secondary" onClick={()=>{setService('off');setStatus('Service disconnected. Connect again to re-enable automatic detection.');}}>Disconnect</Button>}</form>{status&&<p className="mt-4 text-xs text-muted-foreground" role="status">{status}</p>}<p className="mt-4 text-xs text-muted-foreground"><a className="underline" href={installer.url} target="_blank" rel="noreferrer">{installer.label}</a> · Converted streams use your browser's built-in HLS player (Chrome, Edge, Safari). In Firefox, torrents in MP4/WebM play; other formats need conversion.</p></section>;
}
