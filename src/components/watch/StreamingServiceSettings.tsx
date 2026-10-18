import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeServiceUrl, requestJson } from '@/integrations/api/stremio';
import { useLocalStorage } from '@/hooks/useLocalStorage';
export default function StreamingServiceSettings(){
  const [service,setService]=useLocalStorage<string>('admax-streaming-service','');
  const [url,setUrl]=useState(typeof service==='string'&&service?service:'/streaming-service');
  const [busy,setBusy]=useState(false),[status,setStatus]=useState('');
  const connect=async(e:React.FormEvent)=>{
    e.preventDefault();setBusy(true);setStatus('Checking your service…');
    try{const base=normalizeServiceUrl(url);z.object({values:z.record(z.unknown())}).parse(await requestJson(base+'/settings',undefined,true));setService(base);setStatus('Service connected. Torrent and proxy-header sources can use this service.');}
    catch{setStatus('Could not connect. Start Stremio Service, check the address, and allow this website’s origin in its CORS settings.');}
    finally{setBusy(false);}
  };
  return <section id="streaming-service" className="settings-panel mb-9"><p className="eyebrow">OPTIONAL · FOR SERVICE-BASED SOURCES</p><h2 className="mb-3 text-xl">Connect your streaming service</h2><p className="mb-5 max-w-3xl text-xs leading-7 text-muted-foreground">Like Stremio Web, torrent and custom-header add-ons need a running companion service. Use /streaming-service with the local preview relay, or an HTTPS service configured for this website. The player can convert incompatible formats through that service.</p><form className="flex flex-col gap-3 sm:flex-row" onSubmit={connect}><Input aria-label="Streaming service URL" value={url} onChange={e=>setUrl(e.target.value)} placeholder="/streaming-service"/><Button disabled={busy||!url.trim()}>{busy?'Checking…':'Connect service'}</Button>{service&&<Button type="button" variant="secondary" onClick={()=>{setService('');setUrl('');setStatus('Service disconnected.');}}>Disconnect</Button>}</form>{status&&<p className="mt-4 text-xs text-muted-foreground" role="status">{status}</p>}<p className="mt-4 text-xs text-muted-foreground"><a className="underline" href="https://www.stremio.com/downloads" target="_blank" rel="noreferrer">Get Stremio Service</a> · Your service must be running on the computer hosting the local preview, or reachable over HTTPS.</p></section>;
}
