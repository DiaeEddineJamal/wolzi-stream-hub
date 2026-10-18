import { useEffect, useState, type CSSProperties } from 'react';

// Blurred artwork behind the page. Layers stack and the newest fades in with CSS; older ones are removed only once
// it is fully opaque, so the previous artwork can never flash back (framer's exit animation snapped at its last frame).
export default function SceneAmbience({theme}:{theme?:CSSProperties}){
  const artwork=(theme as Record<string,string>)?.['--scene-artwork'];
  const [layers,setLayers]=useState<string[]>([]);
  useEffect(()=>{
    if(!artwork||artwork==='none')return;
    setLayers(previous=>previous[previous.length-1]===artwork?previous:[...previous.slice(-1),artwork]);
  },[artwork]);
  if(!layers.length)return null;
  return <div className="scene-ambience" aria-hidden="true">
    {layers.map((art,i)=>{const top=i===layers.length-1;return <div key={art} className={'scene-ambience-art'+(top&&layers.length>1?' ambience-in':'')} style={{backgroundImage:art}} onAnimationEnd={top?()=>setLayers([art]):undefined}/>;})}
  </div>;
}
