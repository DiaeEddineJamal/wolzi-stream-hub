import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeServiceUrl } from '@/integrations/api/stremio';
import { LOCAL_SERVICE, serviceReachable, useStreamingService } from '@/hooks/useStreamingService';
export default function StreamingServiceSettings(){
  const {service:active,saved:service,setSaved:setService}=useStreamingService(),queryClient=useQueryClient();
  const [url,setUrl]=useState(typeof service==='string'&&service&&service!=='off'?service:LOCAL_SERVICE);
  const [busy,setBusy]=useState(false),[status,setStatus]=useState('');
  const connect=async(e:React.FormEvent)=>{
    e.preventDefault();setBusy(true);setStatus('Checking your service…');
    try{const base=normalizeServiceUrl(url);if(!await serviceReachable(base))throw new Error();setService(base);void queryClient.invalidateQueries({queryKey:['streaming-service']});setStatus('Service connected. Torrent sources and format conversion can use it.');}
    catch{setStatus('Could not reach the service. Start Stremio Service on this computer and check the address.');}
    finally{setBusy(false);}
  };
  return <section id="streaming-service" className="settings-panel mb-9"><p className="eyebrow">OPTIONAL · FOR TORRENT SOURCES</p><h2 className="mb-3 text-xl">Connect your streaming service</h2><p className="mb-5 max-w-3xl text-xs leading-7 text-muted-foreground">Like Stremio Web, torrent add-ons and format conversion need Stremio Service running on your computer. A&D MAX finds it automatically at {LOCAL_SERVICE}; your browser may ask once to allow access to devices on your local network. Direct and header-based sources play without it.</p><p className="mb-4 text-xs" role="status">{active?<>Connected: <code>{active}</code></>:'Not detected on this computer.'}</p><form className="flex flex-col gap-3 sm:flex-row" onSubmit={connect}><Input aria-label="Streaming service URL" value={url} onChange={e=>setUrl(e.target.value)} placeholder={LOCAL_SERVICE}/><Button disabled={busy||!url.trim()}>{busy?'Checking…':'Connect service'}</Button>{service!=='off'&&<Button type="button" variant="secondary" onClick={()=>{setService('off');setStatus('Service disconnected. Connect again to re-enable automatic detection.');}}>Disconnect</Button>}</form>{status&&<p className="mt-4 text-xs text-muted-foreground" role="status">{status}</p>}<p className="mt-4 text-xs text-muted-foreground"><a className="underline" href="https://www.stremio.com/downloads" target="_blank" rel="noreferrer">Get Stremio Service</a> · Converted streams use your browser's built-in HLS player (Chrome, Edge, Safari). In Firefox, torrents in MP4/WebM play; other formats need conversion.</p></section>;
}
