// Subtitle search and download/convert, written for any fetch-capable runtime: the Node server
// (dev, Render) and Cloudflare Pages Functions (functions/api/playback/subtitle*.ts). Running these
// on Cloudflare's edge matters: subtitle hosts behind bot protection refuse datacenter servers.
import { decodeSubtitle, stripSubtitleAds, toWebVTT } from '../src/lib/subtitles.js';

export type Track={id?:string;url:string;lang:string;release:string;source:string;hearingImpaired:boolean;downloads?:number;label:string};
export interface JsonResult {status:number;body:unknown;cache:string}

// OpenSubtitles.org REST takes its own three-letter language ids.
const OS_LANGUAGES:Record<string,string>={en:'eng',ar:'ara',fr:'fre',es:'spa',de:'ger',it:'ita',pt:'por','pt-br':'pob',nl:'dut',ru:'rus',tr:'tur',ja:'jpn',ko:'kor',zh:'chi',pl:'pol',sv:'swe',no:'nor',da:'dan',fi:'fin',el:'ell',he:'heb',id:'ind',vi:'vie',th:'tha',cs:'cze',hu:'hun',ro:'rum',uk:'ukr',fa:'per',bn:'ben',ur:'urd',hi:'hin',ms:'may',hr:'hrv',sr:'scc',bg:'bul'};
const releasesOf=(values:unknown[])=>[...new Set(values.filter((value):value is string=>typeof value==='string'&&!!value.trim()).map(value=>value.trim()))];

async function wyzie(apiKey:string,id:string,season:string|undefined,episode:string|undefined,language:string|null):Promise<Track[]>{
  const url=new URL('https://sub.wyzie.io/search');
  // No pagination: the first page can be entirely English and omit the requested language.
  url.search=new URLSearchParams({id,key:apiKey,source:'all',format:'srt,ass,vtt'}).toString();
  if(language)url.searchParams.set('language',language);
  if(season&&episode){url.searchParams.set('season',season);url.searchParams.set('episode',episode);}
  const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
  if(response.status===400){
    const error=await response.json().catch(()=>null) as {message?:string}|null;
    if(['No subtitles found','No matching release found'].includes(error?.message||''))return [];
  }
  if(!response.ok)throw new Error('Subtitle provider unavailable');
  const data:unknown=await response.json();
  if(!Array.isArray(data))throw new Error('Invalid response');
  return data.flatMap(track=>{
    try {
      if(typeof track.language!=='string'||typeof track.url!=='string')return [];
      const download=new URL(track.url);
      if(download.origin!=='https://sub.wyzie.io'||!download.pathname.startsWith('/c/'))return [];
      download.searchParams.set('to','vtt');
      const releases=releasesOf([track.matchedRelease,track.release,...(Array.isArray(track.releases)?track.releases:[]),track.fileName]);
      const release=releases.join(' · ').slice(0,600),labelRelease=String(releases[0]||'').slice(0,160);
      return [{id:typeof track.id==='string'||typeof track.id==='number'?`${track.source||'wyzie'}:${track.id}`:undefined,url:download.href,lang:track.language,release,source:String(track.source||'Wyzie'),hearingImpaired:track.isHearingImpaired===true,downloads:typeof track.downloadCount==='number'?track.downloadCount:undefined,label:`Wyzie · ${track.source||'Community'}${labelRelease?' · '+labelRelease:''}`}];
    }catch{return [];}
  });
}

// Keyless REST search; results carry release names, which drive release ranking.
async function openSubtitlesOrg(id:string,season:string|undefined,episode:string|undefined,language:string|null):Promise<Track[]>{
  if(!id.startsWith('tt'))return [];
  const parts=[...(season&&episode?[`episode-${Number(episode)}`]:[]),`imdbid-${id.slice(2).padStart(7,'0')}`,...(season&&episode?[`season-${Number(season)}`]:[])];
  const languageId=language?OS_LANGUAGES[language.toLowerCase()]:undefined;
  if(language&&!languageId)return [];
  if(languageId)parts.push(`sublanguageid-${languageId}`);
  const response=await fetch('https://rest.opensubtitles.org/search/'+parts.join('/'),{signal:AbortSignal.timeout(12000),headers:{'X-User-Agent':'A&D MAX v1','User-Agent':'A&D MAX v1',Accept:'application/json'}});
  if(!response.ok)throw new Error('Subtitle provider unavailable');
  const data:unknown=await response.json();
  if(!Array.isArray(data))throw new Error('Invalid response');
  return data.flatMap(track=>{
    try {
      if(typeof track.SubDownloadLink!=='string'||track.SubFormat&&!/^(srt|vtt|ass|ssa|sub)$/i.test(track.SubFormat))return [];
      const download=new URL(track.SubDownloadLink);
      if(download.protocol!=='https:'||!/(^|\.)opensubtitles\.org$/.test(download.hostname))return [];
      // The ad-free file variant avoids an injected advert cue at the start.
      download.pathname=download.pathname.replace('/filead/','/file/');
      // Server-side hint only (fragments are never sent upstream): legacy files need their 8-bit encoding.
      if(typeof track.SubEncoding==='string'&&/^[\w-]{3,20}$/.test(track.SubEncoding))download.hash='charset='+track.SubEncoding;
      const releases=releasesOf([track.MovieReleaseName,track.SubFileName]);
      return [{id:`osorg:${track.IDSubtitleFile}`,url:download.href,lang:String(track.ISO639||track.SubLanguageID||'und'),release:releases.join(' · ').slice(0,600),source:'OpenSubtitles.org',hearingImpaired:track.SubHearingImpaired==='1',downloads:Number(track.SubDownloadsCnt)||undefined,label:`OpenSubtitles.org${releases[0]?' · '+releases[0].slice(0,160):''}`}];
    }catch{return [];}
  });
}

// Provider credentials stay server-side. Download URLs contain scoped tokens, never API keys.
export async function searchSubtitles(params:URLSearchParams,apiKey?:string):Promise<JsonResult>{
  // Successful searches are shared through the CDN for an hour; download links stay valid that long.
  const ok=(body:unknown):JsonResult=>({status:200,body,cache:'public, max-age=300, s-maxage=3600'});
  const fail=(status:number,body:unknown):JsonResult=>({status,body,cache:'no-store'});
  const id=params.get('id')||'',language=params.get('language');
  const match=/^((?:tt)?\d+)(?::(\d+):(\d+))?$/.exec(id);
  if(!match||(language!==null&&!/^[a-z]{2,3}(-[a-z]{2})?$/i.test(language)))return fail(400,{subtitles:[]});
  const searches=[openSubtitlesOrg(match[1],match[2],match[3],language),...(apiKey?[wyzie(apiKey,match[1],match[2],match[3],language)]:[])];
  const results=await Promise.allSettled(searches);
  const subtitles=results.flatMap(result=>result.status==='fulfilled'?result.value:[]);
  if(!subtitles.length&&results.every(result=>result.status==='rejected'))return fail(502,{subtitles:[],error:'Additional subtitle sources are temporarily unavailable.'});
  return ok({subtitles,configured:true});
}

export interface SubtitleFile {vtt:string}
// Download a subtitle (following up to four redirects through `check`), gunzip if needed, decode
// its charset and convert it to WebVTT without advert cues. `check` validates each address.
export async function downloadSubtitle(value:string,check:(url:string)=>Promise<URL>,gunzip:(bytes:Uint8Array)=>Promise<Uint8Array>):Promise<SubtitleFile>{
  if(!value||value.length>8000)throw new Error('Invalid subtitle');
  let url=await check(value),response:Response|undefined;
  const signal=AbortSignal.timeout(12000);
  for(let redirects=0;redirects<4;redirects++){
    response=await fetch(url,{signal,redirect:'manual',headers:{Accept:'text/vtt, text/plain, */*'}});
    if(response.status<300||response.status>=400)break;
    await response.body?.cancel();url=await check(new URL(response.headers.get('location')||'',url).href);
  }
  if(!response?.ok||!response.body)throw new Error('Subtitle unavailable');
  const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
  try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>2_000_000)throw new Error('Subtitle too large');chunks.push(part.value);}}finally{await reader.cancel();}
  let bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  if(bytes[0]===0x1f&&bytes[1]===0x8b)bytes=await gunzip(bytes);
  if(bytes.length>8_000_000)throw new Error('Subtitle too large');
  const type=response.headers.get('content-type')||'',hint=/^#charset=([\w-]+)$/.exec(new URL(value).hash)?.[1];
  const text=decodeSubtitle(bytes,/charset=/i.test(type)||!hint?type:'text/plain; charset='+hint);
  return {vtt:stripSubtitleAds(toWebVTT(text))};
}
export const SUBTITLE_HEADERS={'Content-Type':'text/vtt; charset=utf-8','Cache-Control':'public, max-age=86400, s-maxage=604800','X-Content-Type-Options':'nosniff'};
