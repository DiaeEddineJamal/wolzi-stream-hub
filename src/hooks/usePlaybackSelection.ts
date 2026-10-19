import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StreamChoice } from '@/integrations/api/stremio';
function preference(source:StreamChoice){
  if(source.availability==='ready')return 100;
  if(source.availability==='reachable')return 90;
  const text=(source.name+' '+(source.description||'')).toLowerCase();
  const q=/1080/.test(text)?20:/720/.test(text)?16:/480|360|\bsd\b/.test(text)?12:/remux|2160|4k/.test(text)?-5:0;
  return (!source.needsConversion?40:10)+q;
}
export function usePlaybackSelection(sources:StreamChoice[],discovering:boolean,resetKey=''){
  const [selected,setSelected]=useState<string>(),[health,setHealth]=useState<Record<string,'ready'|'failed'>>({}),[grace,setGrace]=useState(false);
  const manual=useRef(false),played=useRef(false);
  useEffect(()=>{setSelected(undefined);setHealth({});manual.current=false;played.current=false;},[resetKey]);
  useEffect(()=>{const timeout=setTimeout(()=>setGrace(true),8000);return()=>clearTimeout(timeout);},[]);
  const choices=useMemo(()=>sources.map(s=>health[s.id]?{...s,availability:health[s.id]}:s).sort((a,b)=>preference(b)-preference(a)),[sources,health]);
  const candidates=choices.filter(s=>s.kind==='video'&&s.availability!=='failed');
  const current=choices.find(s=>s.id===selected),best=candidates[0];
  useEffect(()=>{
    if(!best)return;
    if(!current){if(best.availability==='reachable'||!discovering||grace)setSelected(best.id);}
    else if(!manual.current&&!played.current&&current.kind!=='video'&&best.availability==='reachable')setSelected(best.id);
  },[best,current,discovering,grace]);
  const onSelect=useCallback((id:string)=>{manual.current=true;played.current=false;setHealth(previous=>{const next={...previous};delete next[id];return next;});setSelected(id);},[]);
  const activeId=current?.id;
  const onReady=useCallback(()=>{if(activeId){played.current=true;setHealth(previous=>previous[activeId]==='ready'?previous:{...previous,[activeId]:'ready'});}},[activeId]);
  const onFailure=useCallback(()=>{if(activeId){setHealth(previous=>({...previous,[activeId]:'failed'}));if(!manual.current&&!played.current){setSelected(undefined);}}},[activeId]);
  const next=()=>{if(activeId)setHealth(previous=>({...previous,[activeId]:'failed'}));setSelected(undefined);manual.current=false;played.current=false;};
  return {choices,active:current,onSelect,onReady,onFailure,next};
}
