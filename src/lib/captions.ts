export const defaultCaptions={size:100,color:'#ffffff',position:90,delay:0,autoSync:true};
export type CaptionPreferences=typeof defaultCaptions;
export function captionPreferences(value:unknown):CaptionPreferences{
  const input=value&&typeof value==='object'?value as Record<string,unknown>:{};
  const number=(key:'size'|'position'|'delay',min:number,max:number)=>typeof input[key]==='number'&&Number.isFinite(input[key])?Math.max(min,Math.min(max,input[key] as number)):defaultCaptions[key];
  return {size:number('size',75,200),position:number('position',10,90),delay:number('delay',-30,30),color:typeof input.color==='string'&&/^#[\da-f]{6}$/i.test(input.color)?input.color:defaultCaptions.color,autoSync:typeof input.autoSync==='boolean'?input.autoSync:defaultCaptions.autoSync};
}
export function captionTimes(start:number,end:number,delay:number,scale=1){
  return {start:Math.max(0,start*scale+delay),end:Math.max(.001,end*scale+delay)};
}
export function hlsSubtitleOffset(frag:{type:string;sn:number|string;start:number;elementaryStreams:{video?:{startPTS:number};audio?:{startPTS:number}}}){
  if(frag.type!=='main'||frag.sn==='initSegment')return undefined;
  const stream=frag.elementaryStreams.video||frag.elementaryStreams.audio;
  const offset=stream?stream.startPTS-frag.start:NaN;
  return Number.isFinite(offset)?offset:undefined;
}
export interface CaptionTiming {start:number;end:number;appliedStart:number;appliedEnd:number}
export function applyCaptionTiming(cue:Pick<TextTrackCue,'startTime'|'endTime'>,delay:number,times:WeakMap<object,CaptionTiming>,scale=1){
  let original=times.get(cue);
  if(!original&&delay===0&&scale===1)return;
  // HLS can correct cue timestamps after a seek or discontinuity; retain its new baseline.
  if(!original||cue.startTime!==original.appliedStart||cue.endTime!==original.appliedEnd){
    original={start:cue.startTime,end:cue.endTime,appliedStart:cue.startTime,appliedEnd:cue.endTime};
    times.set(cue,original);
  }
  const time=captionTimes(original.start,original.end,delay,scale);
  original.appliedStart=time.start;original.appliedEnd=time.end;
  if(time.end>cue.endTime&&cue.endTime!==time.end)cue.endTime=time.end;
  if(cue.startTime!==time.start)cue.startTime=time.start;
  if(cue.endTime!==time.end)cue.endTime=time.end;
}
export function nextEpisodeDue(duration:number,time:number,ended=false){
  return ended||(Number.isFinite(duration)&&duration>0&&time>=duration*0.9);
}
export function nextEpisodeProgress(duration:number,time:number,ended:boolean,countdown:number,autoplay:boolean){
  if(!Number.isFinite(duration)||duration<=0)return 0;
  const windowSec=Math.max(0.001,duration*0.1);
  const remaining=ended?0:Math.max(0,duration-time);
  const progress=autoplay?1-(remaining+(ended?countdown:5))/(windowSec+5):1-remaining/windowSec;
  return Math.min(1,Math.max(0,progress));
}
export function activateCaptionTrack(tracks:Pick<TextTrack,'mode'>[],index:number){
  tracks.forEach((track,i)=>{const mode=i===index?'showing':'disabled';if(track.mode!==mode)track.mode=mode;});
}
