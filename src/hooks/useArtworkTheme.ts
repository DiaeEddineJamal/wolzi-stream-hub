import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { artworkSize, paletteFromPixels } from '@/lib/artwork';
export function useArtworkTheme(url?:string){
  const [palette,setPalette]=useState(()=>paletteFromPixels([]));
  useEffect(()=>{
    let cancelled=false;
    if(!url)return;
    const image=new Image();image.crossOrigin='anonymous';image.src=artworkSize(url,'w300');
    image.onload=()=>{if(cancelled)return;try{const canvas=document.createElement('canvas');canvas.width=32;canvas.height=18;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,32,18);setPalette(paletteFromPixels(context.getImageData(0,0,32,18).data));}catch{setPalette(paletteFromPixels([]));}};
    return()=>{cancelled=true;};
  },[url]);
  return useMemo(()=>({...palette,'--scene-artwork':url?`url("${artworkSize(url,'w780')}")`:'none'}) as CSSProperties,[palette,url]);
}
