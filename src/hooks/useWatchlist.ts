import { useSyncExternalStore } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import tmdbApi from '@/integrations/api/tmdb';
import { toMediaItem, type MediaItem, type MediaType } from '@/lib/media';
import { toast } from 'sonner';
const KEY='admax-watchlist';
let cachedRaw:string|null=null,cached:MediaItem[]=[];
const subscribe=(listener:()=>void)=>{window.addEventListener('storage',listener);window.addEventListener('admax-library',listener);return()=>{window.removeEventListener('storage',listener);window.removeEventListener('admax-library',listener);};};
function parse(raw:string|null){try{const value=JSON.parse(raw||'[]');return Array.isArray(value)?value.filter(item=>item&&typeof item.id==='string'&&typeof item.title==='string'&&['movie','tv','anime'].includes(item.mediaType)):[];}catch{return [];}}
function snapshot(){try{const raw=localStorage.getItem(KEY);if(raw!==cachedRaw){cachedRaw=raw;cached=parse(raw);}}catch{/* Storage is optional. */}return cached;}
const same=(a:MediaItem,b:MediaItem)=>a.id===b.id&&a.mediaType===b.mediaType;
function cacheAccount(id:string,items:MediaItem[]){try{localStorage.setItem(KEY+'-'+id,JSON.stringify(items));}catch{/* Account data remains in Supabase. */}}
export function useWatchlist(){
  const {user}=useAuth(),client=useQueryClient();
  const guest=useSyncExternalStore(subscribe,snapshot);
  const queryKey=['watchlist',user?.id];
  const remote=useQuery({queryKey,enabled:!!user,staleTime:30000,queryFn:async({signal})=>{
    const {data,error}=await supabase.from('watchlist').select('*').eq('user_id',user.id).order('added_at',{ascending:false}).abortSignal(signal);if(error)throw error;
    let saved:MediaItem[]=[];try{saved=parse(localStorage.getItem(KEY+'-'+user.id));}catch{/* Metadata can load from the catalog. */}
    const items=await Promise.all(data.map(async row=>{
      const type=row.media_type as MediaType,metadata=parse(JSON.stringify([row.metadata]))[0],cached=saved.find(item=>item.id===row.media_id&&item.mediaType===type);
      if(metadata&&metadata.id===row.media_id&&metadata.mediaType===type)return metadata;
      if(cached)return cached;
      try{return toMediaItem((await(type==='movie'?tmdbApi.getMovieDetails(Number(row.media_id)):tmdbApi.getTVShowDetails(Number(row.media_id)))).data,type);}
      catch{return {id:row.media_id,mediaType:type,title:'Title unavailable',posterUrl:'/poster-placeholder.svg'};}
    }));cacheAccount(user.id,items);return items;
  }});
  let items:MediaItem[]=guest;
  if(user){try{items=remote.data||parse(localStorage.getItem(KEY+'-'+user.id));}catch{items=remote.data||[];}}
  const has=(item:MediaItem)=>items.some(entry=>same(entry,item));
  const toggle=async(item:MediaItem)=>{
    if(!user){const current=snapshot(),exists=current.some(entry=>same(entry,item));try{localStorage.setItem(KEY,JSON.stringify(exists?current.filter(entry=>!same(entry,item)):[item,...current]));window.dispatchEvent(new Event('admax-library'));toast.success(exists?'Removed from My List':'Added to My List');}catch{toast.error('Your browser could not save your list.');}return;}
    if(remote.isPending){toast.message('Your list is still loading. Try again in a moment.');return;}
    await client.cancelQueries({queryKey});
    const current=client.getQueryData<MediaItem[]>(queryKey)||items,previous=current.find(entry=>same(entry,item));
    const next=previous?current.filter(entry=>!same(entry,item)):[item,...current];client.setQueryData(queryKey,next);cacheAccount(user.id,next);
    try{
    const result=previous?await supabase.from('watchlist').delete().eq('user_id',user.id).eq('media_id',item.id).eq('media_type',item.mediaType):await supabase.from('watchlist').upsert({user_id:user.id,media_id:item.id,media_type:item.mediaType,metadata:JSON.parse(JSON.stringify(item))},{onConflict:'user_id,media_id,media_type',ignoreDuplicates:true});
    if(result.error)throw result.error;
    toast.success(previous?'Removed from My List':'Saved to your account');
    }catch{client.setQueryData<MediaItem[]>(queryKey,latest=>{const restored=(latest||[]).filter(entry=>!same(entry,item));if(previous)restored.unshift(previous);cacheAccount(user.id,restored);return restored;});toast.error('Your account list could not be saved. Try again.');}
  };
  return {items,has,toggle,loading:!!user&&remote.isPending,error:user?remote.error:null,reload:remote.refetch,signedIn:!!user};
}
