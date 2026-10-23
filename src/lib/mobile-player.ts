export const touchPlayerQuery='(max-width: 767px), (pointer: coarse)';

export function playbackBufferConfig(touch:boolean){
  return touch
    ? {maxBufferLength:30,maxMaxBufferLength:60,backBufferLength:10,maxBufferSize:24*1000*1000}
    : {maxBufferLength:60,maxMaxBufferLength:600,backBufferLength:30,maxBufferSize:60*1000*1000};
}
type NativeFullscreenVideo=HTMLVideoElement&{webkitDisplayingFullscreen?:boolean;webkitEnterFullscreen?:()=>void;webkitExitFullscreen?:()=>void};
export function isPlayerFullscreen(stage:HTMLElement,media:HTMLVideoElement|null){
  return document.fullscreenElement===stage||!!(media as NativeFullscreenVideo)?.webkitDisplayingFullscreen;
}
export async function togglePlayerFullscreen(stage:HTMLElement,media:HTMLVideoElement|null){
  const native=media as NativeFullscreenVideo;
  if(document.fullscreenElement){await document.exitFullscreen();return;}
  if(native?.webkitDisplayingFullscreen&&native.webkitExitFullscreen){native.webkitExitFullscreen();return;}
  if(stage.requestFullscreen){
    try{await stage.requestFullscreen();return;}catch(error){if(!native?.webkitEnterFullscreen)throw error;}
  }
  if(native?.webkitEnterFullscreen){native.webkitEnterFullscreen();return;}
  throw new Error('Fullscreen is unavailable in this browser.');
}
