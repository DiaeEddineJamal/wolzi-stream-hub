import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { continueWatching, mergeProgress, validProgress, type WatchProgress } from '@/lib/watch-progress';
const caches=new Map<string,{raw:string|null;rows:WatchProgress[]}>();
function read(key:string){
  let raw:string|null=null;try{raw=localStorage.getItem(key);}catch{/* Storage is optional. */}
  const cached=caches.get(key);if(cached&&cached.raw===raw)return cached.rows;
  let rows:WatchProgress[]=[];try{const parsed=JSON.parse(raw||'[]');if(Array.isArray(parsed))rows=parsed.filter(validProgress);}catch{/* Ignore malformed device data. */}
  caches.set(key,{raw,rows});return rows;
}
function write(key:string,rows:WatchProgress[]){try{localStorage.setItem(key,JSON.stringify(rows));window.dispatchEvent(new Event('admax-history'));}catch{/* Account saving can still succeed without device storage. */}}
const subscribe=(listener:()=>void)=>{window.addEventListener('storage',listener);window.addEventListener('admax-history',listener);return()=>{window.removeEventListener('storage',listener);window.removeEventListener('admax-history',listener);};};
export function usePlaybackHistory(){
  const {user}=useAuth(),client=useQueryClient(),saving=useRef(false),pending=useRef<WatchProgress|null>(null);
  const storageKey='admax-history-'+(user?.id||'guest'),queryKey=['watch-history',user?.id];
  const snapshot=useCallback(()=>read(storageKey),[storageKey]);
  const local=useSyncExternalStore(subscribe,snapshot);
  const remote=useQuery({queryKey,enabled:!!user,staleTime:15000,queryFn:async({signal})=>{const {data,error}=await supabase.from('watch_history').select('*').eq('user_id',user.id).order('watched_at',{ascending:false}).limit(100).abortSignal(signal);if(error)throw error;return data as WatchProgress[];}});
  const items=useMemo(()=>mergeProgress(remote.data||[],local),[remote.data,local]);
  const save=useCallback(async(item:WatchProgress)=>{
    if(!validProgress(item)||item.progress<1)return;
    write(storageKey,mergeProgress(read(storageKey),[item]));
    if(!user)return;
    // A save that arrives mid-upload (e.g. the final one on pause) is flushed afterwards, not dropped.
    if(saving.current){pending.current=item;return;}
    saving.current=true;
    try{
      const record={user_id:user.id,content_id:item.content_id,content_type:item.content_type,title:item.title,poster_path:item.poster_path,watched_at:item.watched_at,progress:item.progress,duration:item.duration,progress_percent:item.progress_percent,season:item.season,episode:item.episode};
      const result=await supabase.from('watch_history').upsert(record,{onConflict:'user_id,content_id,content_type,season,episode'});
      if(result.error)throw result.error;
      client.setQueryData<WatchProgress[]>(['watch-history',user.id],previous=>mergeProgress(previous||[],[item]));
    }finally{
      saving.current=false;
      const next=pending.current;pending.current=null;
      if(next)void save(next).catch(()=>{});
    }
  },[storageKey,user,client]);
  const clear=async()=>{if(user){const {error}=await supabase.from('watch_history').delete().eq('user_id',user.id);if(error)throw error;}write(storageKey,[]);client.setQueryData(queryKey,[]);};
  return {items,continuing:continueWatching(items),save,clear,error:remote.error,loading:!!user&&remote.isPending,reload:remote.refetch};
}
