export interface SubtitleTrack {id?:string;url:string;lang:string;label?:string;release?:string;source?:string;hearingImpaired?:boolean;downloads?:number}
export interface SubtitleVideo {filename?:string;videoHash?:string;videoSize?:number}

export function subtitleVideoExtras(video:SubtitleVideo={}) {
  const extra:Record<string,string>={};
  if(video.filename?.trim())extra.filename=video.filename.trim().slice(0,500);
  if(video.videoHash&&/^[a-f\d]{16}$/i.test(video.videoHash))extra.videoHash=video.videoHash;
  if(Number.isSafeInteger(video.videoSize)&&video.videoSize>0)extra.videoSize=String(video.videoSize);
  return extra;
}

export function subtitleMatchesEpisode(track:SubtitleTrack,id=''){
  const target=/:(\d+):(\d+)$/.exec(id);
  if(!target)return true;
  const episodes=[...(track.release||track.label||'').matchAll(/s(\d{1,2})[ ._-]*e(\d{1,3})/gi)];
  return !episodes.length||episodes.some(match=>Number(match[1])===Number(target[1])&&Number(match[2])===Number(target[2]));
}

export function preferredSubtitleIndex(tracks:Pick<TextTrack,'language'|'mode'>[],preferred:string|null){
  if(preferred==='off')return -1;
  if(preferred){const match=tracks.findIndex(track=>normalizeLangCode(track.language)===normalizeLangCode(preferred));if(match>=0)return match;}
  const showing=tracks.findIndex(track=>track.mode==='showing');
  return showing>=0?showing:tracks.findIndex(track=>normalizeLangCode(track.language)==='en');
}

export function rankSubtitleTracks<T extends SubtitleTrack>(tracks:T[],release=''){
  const tokens=(value:string)=>value.toLowerCase().replace(/web[ ._-]?(dl|rip)/g,'web$1').match(/[a-z0-9]{3,}/g)||[];
  const wanted=new Set(tokens(release));
  const origin=(value:string)=>/bluray|blu-ray|bdrip|brrip/i.test(value)?'bluray':/web[ ._-]?(dl|rip)|webrip/i.test(value)?'web':/hdtv/i.test(value)?'hdtv':/dvd/i.test(value)?'dvd':undefined;
  const wantedOrigin=origin(release);
  const episode=(value:string)=>/s(\d{1,2})[ ._-]*e(\d{1,3})/i.exec(value)?.slice(1).map(Number).join(':');
  const wantedEpisode=episode(release);
  const group=(value:string)=>/-([a-z\d]+)(?:\.(?:mkv|mp4|srt|vtt|ass))?$/i.exec(value.trim())?.[1].toLowerCase();
  const wantedGroup=group(release);
  const score=(track:T)=>{
    const candidate=track.release||track.label||'';
    const candidateOrigin=origin(candidate),candidateEpisode=episode(candidate);
    // A shared title is weaker evidence than a matching cut/source or release group.
    return [...new Set(tokens(candidate))].filter(token=>wanted.has(token)).length
      +(wantedOrigin&&candidateOrigin?(wantedOrigin===candidateOrigin?12:-20):0)
      +(wantedEpisode&&candidateEpisode?(wantedEpisode===candidateEpisode?20:-100):0)
      +(wantedGroup&&candidate.split(' · ').some(value=>group(value)===wantedGroup)?25:0);
  };
  return [...tracks].sort((a,b)=>score(b)-score(a));
}

export function decodeSubtitle(bytes:Uint8Array,contentType=''){
  if(bytes[0]===255&&bytes[1]===254)return new TextDecoder('utf-16le').decode(bytes);
  if(bytes[0]===254&&bytes[1]===255)return new TextDecoder('utf-16be').decode(bytes);
  const charset=/charset=["']?([^\s;"']+)/i.exec(contentType)?.[1];
  if(charset){try{return new TextDecoder(charset,{fatal:true}).decode(bytes);}catch{/* Some providers mislabel their encoding. */}}
  // shortcut: unlabelled legacy files default to Arabic Windows-1256; other legacy encodings need provider charset metadata.
  try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return new TextDecoder('windows-1256').decode(bytes);}
}

export function toWebVTT(value:string){
  const text=value.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
  if(text.startsWith('WEBVTT'))return text+'\n';
  if(/\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(text))return 'WEBVTT\n\n'+text.replace(/(\d{1,2}:\d{2}:\d{2}),(\d{3})/g,'$1.$2')+'\n';
  if(/^Dialogue:/m.test(text)){
    const time=(s:string)=>s.trim().replace(/^(\d):/,'0$1:').replace(/\.(\d{2})$/,(_,fraction)=>'.'+fraction+'0');
    const cues=text.split('\n').filter(line=>line.startsWith('Dialogue:')).map((line,index)=>{const fields=line.slice(9).split(',');return `${index+1}\n${time(fields[1])} --> ${time(fields[2])}\n${fields.slice(9).join(',').replace(/\{[^}]*\}/g,'').replace(/\\N/gi,'\n').replace(/\\h/g,' ')}`;});
    if(cues.length)return 'WEBVTT\n\n'+cues.join('\n\n')+'\n';
  }
  throw new Error('Choose a WebVTT, SRT, or ASS subtitle file.');
}
// Providers inject promotional cues that are not dialogue; they also mislead dialogue alignment.
const SUBTITLE_AD=/opensubtitles|osdb\.link|subtitles for any video|advertise your product|support us and become vip|subscene|yts\.|yify|addic7ed\.com|www\.[a-z0-9-]+\.(com|net|org)/i;
export function stripSubtitleAds(vtt:string){
  const [header,...blocks]=vtt.split(/\n{2,}/);
  return [header,...blocks.filter(block=>!(block.includes('-->')&&SUBTITLE_AD.test(block)))].join('\n\n').trimEnd()+'\n';
}
export function subtitleUrl(url:string){
  return url.startsWith('blob:')?url:'/api/playback/subtitles?'+new URLSearchParams({url});
}
const ISO_CODES:Record<string,string>={
  eng:'en',en:'en',fre:'fr',fra:'fr',fr:'fr',ara:'ar',ar:'ar',spa:'es',spl:'es',spn:'es',es:'es',
  por:'pt',pt:'pt',pob:'pt-BR','pt-br':'pt-BR',ger:'de',deu:'de',de:'de',ita:'it',it:'it',
  jpn:'ja',ja:'ja',chi:'zh',zho:'zh',zh:'zh',zht:'zh-TW',zhs:'zh-CN',rus:'ru',ru:'ru',
  tur:'tr',tr:'tr',kor:'ko',ko:'ko',hin:'hi',hi:'hi',dut:'nl',nld:'nl',nl:'nl',
  pol:'pl',pl:'pl',swe:'sv',sv:'sv',nor:'no',no:'no',dan:'da',da:'da',fin:'fi',fi:'fi',
  gre:'el',ell:'el',el:'el',heb:'he',he:'he',ind:'id',id:'id',vie:'vi',vi:'vi',tha:'th',th:'th',
  ces:'cs',cze:'cs',cs:'cs',hun:'hu',hu:'hu',ron:'ro',rum:'ro',ro:'ro',ukr:'uk',uk:'uk',
  fas:'fa',per:'fa',fa:'fa',ben:'bn',bn:'bn',urd:'ur',ur:'ur',tam:'ta',ta:'ta',tel:'te',te:'te',
  may:'ms',msa:'ms',ms:'ms',fil:'tl',tgl:'tl',tl:'tl',hrv:'hr',hr:'hr',srp:'sr',sr:'sr',bul:'bg',bg:'bg'
};
const COUNTRY_CODES:Record<string,string>={
  en:'us',fr:'fr',ar:'sa',es:'es',pt:'pt','pt-BR':'br',de:'de',it:'it',ja:'jp',zh:'cn','zh-TW':'tw','zh-CN':'cn',
  ru:'ru',tr:'tr',ko:'kr',hi:'in',nl:'nl',pl:'pl',sv:'se',no:'no',da:'dk',fi:'fi',el:'gr',he:'il',
  id:'id',vi:'vn',th:'th',cs:'cz',hu:'hu',ro:'ro',uk:'ua',fa:'ir',bn:'bd',ur:'pk',ta:'in',te:'in',
  ms:'my',tl:'ph',hr:'hr',sr:'rs',bg:'bg'
};
export function normalizeLangCode(lang:string){
  if(!lang)return 'und';
  const clean=lang.trim().toLowerCase().replace(/_/g,'-');
  return ISO_CODES[clean]||ISO_CODES[clean.split('-')[0]]||clean;
}
export function subtitleLanguage(lang:string){
  if(!lang||lang==='und')return 'Unknown language';
  const code=normalizeLangCode(lang);
  if(code==='pt-BR')return 'Portuguese (Brazil)';
  if(code==='zh-TW')return 'Chinese (Traditional)';
  try{return new Intl.DisplayNames(['en'],{type:'language'}).of(code)||lang;}catch{return lang;}
}
export function subtitleNativeLanguage(lang:string){
  if(!lang||lang==='und')return '';
  const code=normalizeLangCode(lang);
  try{
    const native=new Intl.DisplayNames([code],{type:'language'}).of(code)||'';
    return native?native.charAt(0).toUpperCase()+native.slice(1):'';
  }catch{return '';}
}
export function subtitleFlagUrl(lang:string){
  if(!lang||lang==='und')return undefined;
  const code=normalizeLangCode(lang);
  const country=COUNTRY_CODES[code]||COUNTRY_CODES[code.split('-')[0]];
  return country?`https://flagcdn.com/w40/${country}.png`:undefined;
}
export function subtitleCodeBadge(lang:string){
  if(!lang||lang==='und')return 'CC';
  return normalizeLangCode(lang).split('-')[0].toUpperCase().slice(0,3);
}
