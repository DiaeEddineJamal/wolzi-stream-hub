import { ChoiceSelect } from '@/components/ui/select';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/layouts/MainLayout';
import { useAddons } from '@/hooks/useAddons';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePlaybackSelection } from '@/hooks/usePlaybackSelection';
import { useArtworkTheme } from '@/hooks/useArtworkTheme';
import { addonMeta, addonStreams, httpsUrl } from '@/integrations/api/stremio';
import StreamingPlayer from '@/components/watch/StreamingPlayer';
import { SourcePicker, SourcePickerSheet } from '@/components/watch/SourcePicker';
import LoadingState from '@/components/primitives/LoadingState';
import { Button } from '@/components/ui/button';
export default function AddonDetail(){const {addonId,type,id}=useParams();return <AddonSession key={`${addonId}-${type}-${id}`}/>;}
function AddonSession(){
  const {addonId,type,id}=useParams();const {addons}=useAddons();
  const addon=addons.find(a=>a.manifest.id===addonId&&a.enabled);
  const [service]=useLocalStorage<string>('admax-streaming-service','');
  const [chosenVideo,setVideo]=useState<string>();
  const [sourcesOpen,setSourcesOpen]=useState(false);
  const [autoNext,setAutoNext]=useState(false);
  const meta=useQuery({queryKey:['addon-meta',addon?.transportUrl,type,id],enabled:!!addon,queryFn:({signal})=>addonMeta(addon,type,id,signal)});
  const video=chosenVideo || (type==='series' ? meta.data?.videos?.[0]?.id : undefined) || id;
  const currentVideoIndex=meta.data?.videos?.findIndex(v=>v.id===video)??-1;
  const nextVideo=type==='series'&&currentVideoIndex>=0?meta.data?.videos?.[currentVideoIndex+1]:undefined;
  const streams=useQuery({queryKey:['addon-title-streams',addon?.transportUrl,type,video,service],enabled:!!addon&&(type!=='series'||!!meta.data),queryFn:({signal})=>addonStreams(addon,type,video,signal,typeof service==='string'?service:undefined)});
  const playback=usePlaybackSelection(streams.data||[],streams.isFetching,video);
  const {choices,active}=playback;
  let poster:string;try{poster=httpsUrl(meta.data?.background||meta.data?.poster);}catch{poster=undefined;}
  let nextPoster=poster;try{if(nextVideo?.thumbnail)nextPoster=httpsUrl(nextVideo.thumbnail);}catch{/* Use title artwork if an add-on supplies an unsafe thumbnail. */}
  const theme=useArtworkTheme(poster);
  return <MainLayout theme={theme}><div className="page-shell"><header className="catalog-header"><div><p className="eyebrow">{addon?.manifest.name||'ADD-ON'}</p><h1>{meta.data?.name || id}</h1><p>{meta.data?.releaseInfo}</p></div><Link to="/addons" className="view-all">Back to add-ons</Link></header>
    {!addon?<div className="empty-state"><h2>This add-on is not enabled.</h2><Button asChild><Link to="/addons">Manage add-ons</Link></Button></div>:<>
      {meta.data?.videos?.length>0&&<div className="mb-6"><label htmlFor="addon-episode" className="mr-4 text-xs">Choose an episode</label><ChoiceSelect id="addon-episode" label="Choose an episode" value={video} onValueChange={setVideo} options={meta.data.videos.map(v=>({value:v.id,label:(v.season?`S${v.season} E${v.episode} - `:"")+(v.title||v.id)}))}/></div>}
      {streams.isPending?<div className="empty-state"><LoadingState label="Finding streams"/></div>:streams.isError?<div className="empty-state"><h2>This add-on couldn’t return streams.</h2><Button onClick={()=>streams.refetch()}>Try again</Button></div>:<>
        <div className="watch-player-layout"><StreamingPlayer key={video} source={active} title={meta.data?.name||id} storageKey={`addon-${addonId}-${video}`} poster={poster} onSourceReady={playback.onReady} onSourceError={playback.onFailure} onNextSource={playback.next} onOpenSources={()=>setSourcesOpen(true)} nextEpisode={nextVideo?{label:nextVideo.title||nextVideo.id,image:nextPoster,eyebrow:nextVideo.episode?`Episode ${nextVideo.episode}`:undefined,onPlay:()=>setVideo(nextVideo.id)}:undefined} autoNext={autoNext} onAutoNextChange={setAutoNext}/><aside className="desktop-source-picker"><SourcePicker sources={choices} activeId={active?.id} onSelect={playback.onSelect}/></aside></div>
        <div className="selected-source-bar"><span>{active?.name||'No streams returned'}</span><Button variant="secondary" size="sm" onClick={()=>setSourcesOpen(true)}>Change source · {choices.length}</Button></div>
        <SourcePickerSheet sources={choices} activeId={active?.id} onSelect={playback.onSelect} open={sourcesOpen} onOpenChange={setSourcesOpen}/>
        {!choices.length&&<p className="py-6 text-sm text-muted-foreground">No streams were returned for this item. Try another episode or install a stream add-on.</p>}
      </>}
      {meta.isError&&<p className="mt-5 text-sm text-muted-foreground">Metadata could not be loaded. <button onClick={()=>meta.refetch()} className="underline">Retry details</button></p>}
      <p className="my-8 max-w-3xl text-sm leading-8 text-muted-foreground">{meta.data?.description}</p>
    </>}
  </div></MainLayout>;
}
