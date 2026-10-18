import { useMemo, useState } from 'react';
import { Check, ExternalLink, Layers, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import LoadingState from '@/components/primitives/LoadingState';
import type { StreamChoice } from '@/integrations/api/stremio';
interface Props { sources: StreamChoice[]; activeId?: string; onSelect: (id:string)=>void; loading?: boolean; errors?: string[]; onRetry?:()=>void }
export function SourcePicker({sources,activeId,onSelect,loading,errors=[],onRetry}:Props){
  const [query,setQuery]=useState(''),[filter,setFilter]=useState('all');
  const visible=useMemo(()=>sources.filter(s=>{
    const text=(s.name+' '+(s.description||'')).toLowerCase();
    return text.includes(query.toLowerCase()) && (filter==='all'||(filter==='providers'?!!s.provider:filter==='4k'?/4k|2160/.test(text):/1080/.test(text)));
  }),[sources,query,filter]);
  return <section className="source-picker" aria-label="Playback sources"><header><div className="flex items-center justify-between"><h2>Sources <span>{sources.length}</span></h2><Link to="/addons" aria-label="Manage add-ons"><ExternalLink size={15}/></Link></div><p className="source-summary">{sources.filter(s=>s.kind==='video'&&s.availability!=='failed').length} stream options · {sources.filter(s=>s.availability==='checking').length} checking</p><div className="source-search"><Search size={14}/><input aria-label="Filter sources" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find quality or provider…"/></div><div className="source-filters">{[['all','All'],['4k','4K'],['1080','1080p'],['providers','Providers']].map(([key,label])=><button key={key} onClick={()=>setFilter(key)} aria-pressed={filter===key}>{label}</button>)}</div></header>
    <div className="source-scroll">{loading&&<div className="px-3 py-4"><LoadingState label="Checking providers"/></div>}{visible.map(s=><button key={s.id} className={`source-result ${s.id===activeId?'active':''}`} disabled={s.kind==='unsupported'&&!!s.availability} onClick={()=>onSelect(s.id)} aria-pressed={s.id===activeId}><div className="source-result-heading"><strong>{s.name}</strong>{s.id===activeId?<Check size={15}/>:<Layers size={14}/>}</div>{s.description&&<p>{s.description}</p>}<span className={s.availability==='ready'?'source-ready':undefined}>{s.availability==='ready'?'Ready in this browser':s.availability==='failed'?'Unavailable':s.availability==='checking'?'Checking this title…':s.availability==='timeout'?'Check timed out':s.kind==='video'?(s.availability==='reachable'?'Media link checked':'Play in A&D MAX'):s.kind==='external'?'External player':'Needs streaming service'}</span></button>)}{!visible.length&&!loading&&<p className="p-5 text-xs leading-6 text-muted-foreground">No matching sources. Try another quality or provider.</p>}{errors.length>0&&<div className="px-3 py-4"><p className="mb-3 text-xs text-muted-foreground">{errors.join(', ')} couldn’t be reached.</p><Button variant="secondary" size="sm" onClick={onRetry}>Check sources again</Button></div>}</div>
    <footer>Select a source to switch immediately. <a href="https://vyla.cc/sdk/" target="_blank" rel="noreferrer">Discovery by Vyla</a></footer>
  </section>;
}
export function SourcePickerSheet({open,onOpenChange,...props}:Props&{open:boolean;onOpenChange:(open:boolean)=>void}){
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" className="source-sheet"><SheetHeader className="sr-only"><SheetTitle>Choose a playback source</SheetTitle><SheetDescription>Filter by quality or provider. Choosing a source closes this panel and keeps the player in view.</SheetDescription></SheetHeader><SourcePicker {...props} onSelect={id=>{props.onSelect(id);onOpenChange(false);}}/></SheetContent></Sheet>;
}
