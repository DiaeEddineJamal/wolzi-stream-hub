export const defaultCaptions={size:100,color:'#ffffff',position:90,delay:0};
export type CaptionPreferences=typeof defaultCaptions;
export function captionPreferences(value:unknown):CaptionPreferences{
  const input=value&&typeof value==='object'?value as Record<string,unknown>:{};
  const number=(key:keyof CaptionPreferences,min:number,max:number)=>typeof input[key]==='number'&&Number.isFinite(input[key])?Math.max(min,Math.min(max,input[key] as number)):defaultCaptions[key] as number;
  return {size:number('size',75,200),position:number('position',10,90),delay:number('delay',-30,30),color:typeof input.color==='string'&&/^#[\da-f]{6}$/i.test(input.color)?input.color:defaultCaptions.color};
}
export function captionTimes(start:number,end:number,delay:number){
  return {start:Math.max(0,start+delay),end:Math.max(.001,end+delay)};
}
export function nextEpisodeDue(duration:number,time:number,ended=false){
  return ended||(duration>20&&duration-time>0&&duration-time<=20);
}
export function nextEpisodeProgress(duration:number,time:number,ended:boolean,countdown:number,autoplay:boolean){
  if(!Number.isFinite(duration)||duration<=0)return 0;
  const remaining=ended?0:Math.max(0,duration-time);
  const progress=autoplay?1-(remaining+(ended?countdown:5))/25:1-remaining/20;
  return Math.min(1,Math.max(0,progress));
}
export function activateCaptionTrack(tracks:Pick<TextTrack,'mode'>[],index:number){
  tracks.forEach((track,i)=>{const mode=i===index?'showing':'disabled';if(track.mode!==mode)track.mode=mode;});
}
