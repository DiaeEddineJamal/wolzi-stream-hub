import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Globe, Plus, Puzzle } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useAddons } from '@/hooks/useAddons';
import { openServiceSetup, useStreamingService } from '@/hooks/useStreamingService';
import { addonCatalog, httpsUrl, installAddon, type InstalledAddon } from '@/integrations/api/stremio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DeleteButton } from '@/components/vendor/delete-button';
import LoadingState from '@/components/primitives/LoadingState';
import StreamingServiceSettings from '@/components/watch/StreamingServiceSettings';
import MediaCard from '@/components/home/MediaCard';
import { toast } from 'sonner';
const CINEMETA='https://v3-cinemeta.strem.io/manifest.json';
function CatalogPreview({addon,catalog}:{addon:InstalledAddon;catalog:InstalledAddon['manifest']['catalogs'][number]}){
  const result=useQuery({queryKey:['addon-catalog',addon.transportUrl,catalog.type,catalog.id],queryFn:({signal})=>addonCatalog(addon,catalog.type,catalog.id,signal)});
  return <section className="content-section"><header className="section-heading"><div><p className="eyebrow">{addon.manifest.name}</p><h2>{catalog.name || catalog.id}</h2></div></header>
    {result.isPending?<LoadingState label="Opening this catalog"/>:result.isError?<div className="settings-panel"><p className="mb-3 text-sm text-muted-foreground">This catalog couldn’t be reached. The add-on must allow browser requests.</p><Button variant="secondary" onClick={()=>result.refetch()}>Try again</Button></div>:<div className="catalog-grid">{result.data.slice(0,12).map(item=>{
      let poster='/poster-placeholder.svg';try{poster=httpsUrl(item.poster);}catch{ /* Use the local placeholder for unsafe artwork URLs. */ }
      return <MediaCard key={item.id} id={item.id} title={item.name} posterUrl={poster} mediaType={item.type==='movie'?'movie':'tv'} year={item.releaseInfo} detailTo={`/addons/${encodeURIComponent(addon.manifest.id)}/${encodeURIComponent(item.type)}/${encodeURIComponent(item.id)}`} playTo={`/addons/${encodeURIComponent(addon.manifest.id)}/${encodeURIComponent(item.type)}/${encodeURIComponent(item.id)}`} />;
    })}</div>}
  </section>;
}
export default function Addons(){
  const {addons,install,remove,toggle}=useAddons();
  const {service}=useStreamingService();
  const [url,setUrl]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const add=async(value:string)=>{setBusy(true);setError('');try{const addon=await installAddon(value);install(addon);setUrl('');toast.success(`${addon.manifest.name} installed`);if(!service&&addon.manifest.resources.some(r=>(typeof r==='string'?r:r.name)==='stream'))openServiceSetup();}catch(e){setError(e instanceof Error&&e.name!=='ZodError'?e.message:'This endpoint did not return a valid Stremio manifest.');}finally{setBusy(false);}};
  const previews=addons.filter(a=>a.enabled).flatMap(addon=>addon.manifest.catalogs.filter(c=>!c.extra?.some(e=>e.isRequired)).map(catalog=>({addon,catalog})));
  return <MainLayout><div className="page-shell"><header className="catalog-header"><div><p className="eyebrow">MORE WAYS TO DISCOVER</p><h1>Your world. Expanded.</h1><p>Connect Stremio-compatible add-ons to bring your catalogs and sources together.</p></div><Puzzle className="hidden text-muted-foreground md:block" size={36}/></header>
    <section className="settings-panel mb-9"><h2 className="mb-2 text-xl">Bring an add-on</h2><p className="mb-5 text-xs leading-6 text-muted-foreground">Paste its HTTPS manifest address or stremio:// link. Install only add-ons you trust: they receive requests for the titles you open. Your configuration stays in this browser.</p>
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={e=>{e.preventDefault();add(url);}}><Input aria-label="Add-on manifest URL" placeholder="https://your-addon.example/manifest.json" value={url} onChange={e=>setUrl(e.target.value)} disabled={busy}/><Button type="submit" disabled={busy||!url.trim()}><Plus size={17}/>Install add-on</Button></form>
      {busy&&<div className="mt-5"><LoadingState label="Reading manifest"/></div>}{error&&<p className="mt-4 text-xs text-red-300" role="alert">{error} Check the address and its CORS support, then try again.</p>}
    </section>
    <div className="mb-10"><div className="flex items-center justify-between"><h2 className="text-xl">Installed add-ons</h2><span className="text-xs text-muted-foreground">{addons.length} installed</span></div>
      {addons.length?addons.map(addon=><article className="addon-card" key={addon.manifest.id}><div className="addon-badge"><Puzzle size={23}/></div><div><h2>{addon.manifest.name} <span className="text-xs text-muted-foreground">v{addon.manifest.version}</span></h2><p>{addon.manifest.description || 'Stremio-compatible add-on'}</p>{addon.manifest.resources.map((r,i)=><span className="addon-resource" key={i}>{typeof r==='string'?r:r.name}</span>)}</div><div className="addon-controls"><Switch aria-label={`Enable ${addon.manifest.name}`} checked={addon.enabled} onCheckedChange={()=>{try{toggle(addon.manifest.id);}catch{toast.error('Could not save this preference.');}}}/><DeleteButton onConfirm={()=>{try{remove(addon.manifest.id);toast.success('Add-on removed');}catch{toast.error('Could not remove this add-on.');}}}/></div></article>):<div className="empty-state"><Puzzle size={30} className="text-muted-foreground"/><h2>A little more possibility.</h2><p>Add a manifest above, or start with Cinemeta, Stremio’s official movie and series catalog.</p><Button variant="secondary" disabled={busy} onClick={()=>add(CINEMETA)}><Globe size={16}/>Add Cinemeta catalog</Button></div>}
    </div>
    <StreamingServiceSettings/>
    {previews.map(({addon,catalog})=><CatalogPreview key={addon.manifest.id+catalog.type+catalog.id} addon={addon} catalog={catalog}/>)}
    <div className="settings-panel"><h2 className="mb-3 text-lg">A player for the open web.</h2><p className="max-w-3xl text-xs leading-7 text-muted-foreground">Catalogs, metadata, streams, and WebVTT subtitle resources use the Stremio HTTP protocol. Direct HTTPS videos play here when your browser supports their format. Torrent sources, custom proxy headers, and desktop-only formats need a separate compatible streaming service. Some catalogs require configuration or search parameters and won’t appear in these previews.</p><a className="view-all mt-4" href="https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/protocol.md" target="_blank" rel="noreferrer">About the add-on protocol <ArrowUpRight size={14}/></a></div>
  </div></MainLayout>;
}
