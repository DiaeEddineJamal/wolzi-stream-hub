import { useMemo, useState } from 'react';
import { Check, ExternalLink, Layers, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ChoiceSelect } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import LoadingState from '@/components/primitives/LoadingState';
import type { StreamChoice } from '@/integrations/api/stremio';
interface Props { sources: StreamChoice[]; activeId?: string; onSelect: (id:string)=>void; loading?: boolean; errors?: string[]; onRetry?:()=>void }

export type QualityTier = '4k' | '1080' | '720' | '480' | '360' | 'auto';

export const QUALITY_BADGES: Record<QualityTier, { label: string; short: string; icon?: string }> = {
  '4k': { label: '4K Ultra HD', short: '4K', icon: '/badges/4k.png' },
  '1080': { label: 'Full HD 1080p', short: '1080p', icon: '/badges/1080p.png' },
  '720': { label: 'HD 720p', short: '720p', icon: '/badges/720p.png' },
  '480': { label: 'SD 480p', short: '480p', icon: '/badges/480p.png' },
  '360': { label: 'Data Saver 360p', short: '360p', icon: '/badges/360p.png' },
  'auto': { label: 'Adaptive / Multi-Quality', short: 'AUTO', icon: undefined },
};

export function detectQualityTier(text: string): QualityTier {
  const lower = text.toLowerCase();
  if (/\b(4k|2160p?|uhd)\b/.test(lower)) return '4k';
  if (/\b(1080p?|fhd|full\s*hd)\b/.test(lower)) return '1080';
  if (/\b(720p?|hd)\b/.test(lower)) return '720';
  if (/\b(480p?|576p?|sd|dvdrip|webrip|cam)\b/.test(lower)) return '480';
  if (/\b(360p?|240p?|ld)\b/.test(lower)) return '360';
  return 'auto';
}

export function matchesQualityFilter(text: string, filter: string, isProvider = false) {
  if (filter === 'all') return true;
  if (filter === 'providers') return isProvider;
  const tier = detectQualityTier(text);
  if (tier === filter) return true;
  // Adaptive HLS provider streams contain multi-bitrate ladders (1080p/720p/480p/360p)
  if (tier === 'auto' && isProvider && ['1080', '720', '480', '360'].includes(filter)) return true;
  return false;
}

export function extractProviderLabel(source: StreamChoice): string {
  if (source.provider) {
    const head = source.name.split('·')[0].trim();
    return head || source.provider;
  }
  const head = source.name.split(/[\n·|-]/)[0].trim();
  return head || 'Add-on';
}

export function SourcePicker({sources,activeId,onSelect,loading,errors=[],onRetry}:Props){
  const [query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[providerFilter,setProviderFilter]=useState('all');

  const providersList=useMemo(()=>{
    const map=new Map<string,{id:string;label:string;count:number;ready:number}>();
    sources.forEach(s=>{
      const key=s.provider||extractProviderLabel(s).toLowerCase();
      const label=extractProviderLabel(s);
      const entry=map.get(key)||{id:key,label,count:0,ready:0};
      entry.count++;
      if(s.kind==='video'&&s.availability!=='failed')entry.ready++;
      map.set(key,entry);
    });
    return Array.from(map.values()).sort((a,b)=>b.ready-a.ready||b.count-a.count);
  },[sources]);

  const visible=useMemo(()=>sources.filter(s=>{
    const text=(s.name+' '+(s.description||'')+' '+(s.url||'')).toLowerCase();
    const provKey=s.provider||extractProviderLabel(s).toLowerCase();
    const matchesProv=providerFilter==='all'||provKey===providerFilter;
    return matchesProv && text.includes(query.toLowerCase()) && matchesQualityFilter(text,filter,!!s.provider);
  }),[sources,query,filter,providerFilter]);

  return <section className="source-picker" aria-label="Playback sources">
    <header>
      <div className="flex items-center justify-between">
        <h2>Sources <span>{sources.length}</span></h2>
        <div className="flex items-center gap-2">
          {onRetry&&<button type="button" className="source-header-btn" onClick={onRetry} aria-label="Refresh sources"><RefreshCw size={14} className={loading?'animate-spin':''}/></button>}
          <Link to="/addons" className="source-header-btn" aria-label="Manage add-ons"><ExternalLink size={14}/></Link>
        </div>
      </div>
      <p className="source-summary">{sources.filter(s=>s.kind==='video'&&s.availability!=='failed').length} playable streams · {providersList.length} servers{sources.some(s=>s.availability==='checking')?` · ${sources.filter(s=>s.availability==='checking').length} checking`:''}</p>
      <div className="source-search"><Search size={14}/><input aria-label="Filter sources" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search server, codec, or resolution…"/></div>
      <div className="source-filter-controls">
        <label><span>Quality</span><ChoiceSelect label="Filter by resolution" value={filter} onValueChange={setFilter} options={[{value:'all',label:'Any quality'},...(['4k','1080','720','480','360'] as QualityTier[]).map(tier=>({value:tier,label:QUALITY_BADGES[tier].label}))]}/></label>
        <label><span>Server</span><ChoiceSelect label="Filter by provider" value={providerFilter} onValueChange={setProviderFilter} options={[{value:'all',label:'All servers'},...providersList.map(p=>({value:p.id,label:`${p.label} (${p.count})`}))]}/></label>
      </div>
      <div className="source-filter-status"><span>{visible.length} matching {visible.length===1?'stream':'streams'}</span>{(filter!=='all'||providerFilter!=='all'||query)&&<button type="button" onClick={()=>{setFilter('all');setProviderFilter('all');setQuery('');}}>Clear filters</button>}</div>
    </header>
    <div className="source-scroll">
      {loading&&<div className="px-3 py-3"><LoadingState label="Scanning watch-chain servers"/></div>}
      {visible.map(s=>{
        const tier=detectQualityTier(s.name+' '+(s.description||'')+' '+(s.url||''));
        const badge=QUALITY_BADGES[tier];
        const provLabel=extractProviderLabel(s);
        return <button key={s.id} className={`source-result ${s.id===activeId?'active':''}`} disabled={s.kind==='unsupported'&&!!s.availability} onClick={()=>onSelect(s.id)} aria-pressed={s.id===activeId}>
          <div className="source-result-heading">
            <div className="source-result-title">
              {badge.icon&&<img src={badge.icon} alt={badge.short} className="source-item-badge"/>}
              <strong>{s.name}</strong>
            </div>
            {s.id===activeId?<Check size={15}/>:<Layers size={14}/>}
          </div>
          {s.description&&<p>{s.description}</p>}
          <div className="source-result-meta">
            <span className="source-provider-tag">{provLabel} · {badge.label}</span>
            <span className={s.availability==='ready'?'source-ready':s.availability==='reachable'?'source-reachable':undefined}>
              {s.availability==='ready'?'Playing / Ready':s.availability==='failed'?'Unavailable':s.availability==='checking'?'Checking…':s.availability==='timeout'?'Timed out':s.kind==='video'?(s.availability==='reachable'?'Verified stream':'Direct play'):s.kind==='external'?'External':'Needs service'}
            </span>
          </div>
        </button>;
      })}
      {!visible.length&&!loading&&<p className="p-5 text-xs leading-6 text-muted-foreground">No matching sources for this filter. Try selecting All Servers or another resolution.</p>}
      {errors.length>0&&<div className="px-3 py-4"><p className="mb-3 text-xs text-muted-foreground">{errors.join(', ')} couldn’t be reached.</p><Button variant="secondary" size="sm" onClick={onRetry}>Check sources again</Button></div>}
    </div>
    <footer>Choose a stream to play. Use resolution and server filters to narrow the list. <a href="https://icons8.com" target="_blank" rel="noopener noreferrer">Quality images by Icons8</a>.</footer>
  </section>;
}
export function SourcePickerSheet({open,onOpenChange,...props}:Props&{open:boolean;onOpenChange:(open:boolean)=>void}){
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" className="source-sheet"><SheetHeader className="sr-only"><SheetTitle>Choose a playback source</SheetTitle><SheetDescription>Filter by quality or provider. Choosing a source closes this panel and keeps the player in view.</SheetDescription></SheetHeader><SourcePicker {...props} onSelect={id=>{props.onSelect(id);onOpenChange(false);}}/></SheetContent></Sheet>;
}
