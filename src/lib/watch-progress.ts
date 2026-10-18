import type { MediaType } from './media';
export interface WatchProgress {
  content_id:string;content_type:MediaType;title:string;poster_path:string|null;backdropUrl?:string;
  progress:number;duration:number;progress_percent:number;season:number|null;episode:number|null;watched_at:string;
}
export const progressKey=(item:Pick<WatchProgress,'content_type'|'content_id'|'season'|'episode'>)=>[item.content_type,item.content_id,item.season||0,item.episode||0].join(':');
export function validProgress(value:unknown):value is WatchProgress{
  const item=value as WatchProgress;
  return !!item&&typeof item.content_id==='string'&&typeof item.title==='string'&&['movie','tv','anime'].includes(item.content_type)&&Number.isFinite(item.progress)&&item.progress>=0&&Number.isFinite(item.duration)&&item.duration>0&&Number.isFinite(Date.parse(item.watched_at));
}
export function mergeProgress(...lists:WatchProgress[][]){
  const result=new Map<string,WatchProgress>();
  lists.flat().filter(validProgress).forEach(item=>{const key=progressKey(item),previous=result.get(key);if(!previous||Date.parse(item.watched_at)>=Date.parse(previous.watched_at))result.set(key,item);});
  return [...result.values()].sort((a,b)=>Date.parse(b.watched_at)-Date.parse(a.watched_at)).slice(0,100);
}
export function resumeSeconds(item?:WatchProgress){return item&&item.progress>=1&&item.duration-item.progress>20&&item.progress/item.duration<.95?item.progress:0;}
export function continueWatching(items:WatchProgress[]){
  const seen=new Set<string>();
  return mergeProgress(items).filter(item=>{const key=item.content_type+':'+item.content_id;if(seen.has(key))return false;seen.add(key);return resumeSeconds(item)>0;});
}
