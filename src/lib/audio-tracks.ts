import { normalizeLangCode, subtitleLanguage } from './subtitles';

export interface AudioOption {index:number;language:string;label:string}
export interface NativeAudioTrack {label:string;language:string;enabled:boolean;kind?:string}
export interface NativeAudioList extends EventTarget, ArrayLike<NativeAudioTrack> {}
export function nativeAudioTracks(media:HTMLVideoElement|null){
  return (media as HTMLVideoElement&{audioTracks?:NativeAudioList})?.audioTracks;
}
export function audioOption(index:number,language='',name='',originalLanguage='',characteristics='',channels=''):AudioOption {
  const known=!!language&&language!=='und';
  const lang=known?normalizeLangCode(language):'und';
  const languageName=known?subtitleLanguage(lang):'';
  const channelLabel=channels==='2'?'Stereo':channels==='6'?'5.1 surround':channels==='8'?'7.1 surround':'';
  const detail=name.trim()&&!/^(?:\d+|(?:stream|audio|track)[ _-]?\d+)$/i.test(name.trim())&&name.trim().toLowerCase()!==languageName.toLowerCase()?name.trim():channelLabel;
  const accessibility=/description|describes-video|commentary|commentaries/i.test(characteristics+' '+name);
  const role=known&&originalLanguage&&!accessibility?(lang===normalizeLangCode(originalLanguage)?'Original':'Dub'):'';
  return {index,language:lang,label:[languageName,detail,role].filter(Boolean).join(' · ')||`Audio track ${index+1}`};
}
export function enableNativeAudio(tracks:ArrayLike<NativeAudioTrack>,index:number){
  const all=Array.from(tracks);
  if(!Number.isInteger(index)||!all[index])throw new Error('That audio track is no longer available.');
  // Enable first so an unsuccessful switch does not silence the current track.
  const previous=all.map(track=>track.enabled);
  try{
    all[index].enabled=true;
    if(!all[index].enabled)throw new Error('This browser could not switch audio tracks.');
    all.forEach((track,i)=>{if(i!==index)track.enabled=false;});
  }catch(error){
    all.forEach((track,i)=>{try{track.enabled=previous[i];}catch{/* Preserve the remaining playable track. */}});
    throw error;
  }
}
