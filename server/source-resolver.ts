import type { IncomingMessage, ServerResponse } from 'node:http';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { z } from 'zod';
import type VylaSDK from '@vyla-entertainment/sdk';

export function isPublicAddress(address: string) {
  const ip=address.toLowerCase().replace(/^::ffff:/,'');
  if(isIP(ip)===4){const [a,b]=ip.split('.').map(Number);return a>0&&a!==10&&a!==127&&a<224&&!(a===169&&b===254)&&!(a===172&&b>=16&&b<=31)&&!(a===192&&(b===168||b===0))&&!(a===100&&b>=64&&b<=127)&&!(a===198&&(b===18||b===19));}
  return isIP(ip)===6&&!['::','::1'].includes(ip)&&!/^f[cd]|^fe[89ab]|^ff/.test(ip);
}
export async function publicMediaUrl(value: string) {
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.port&&url.port!=='443')throw new Error('Invalid media address');
  const addresses=await lookup(url.hostname.replace(/^\[|\]$/g,''),{all:true});
  if(!addresses.length||addresses.some(a=>!isPublicAddress(a.address)))throw new Error('Private media address');
  return url;
}
async function mediaPrefix(value:string,headers:Record<string,string>,signal:AbortSignal,redirects=0):Promise<{text:string;type:string;bytes:Uint8Array}> {
  const url=await publicMediaUrl(value);
  const response=await fetch(url,{headers:{...headers,Range:'bytes=0-16383'},signal,redirect:'manual'});
  if(response.status>=300&&response.status<400&&redirects<3){await response.body?.cancel();return mediaPrefix(new URL(response.headers.get('location')||'',url).href,headers,signal,redirects+1);}
  if(!response.ok)throw new Error('Media unavailable');
  const reader=response.body?.getReader();if(!reader)throw new Error('Empty media');
  const chunks:Uint8Array[]=[];let size=0;
  try{while(size<16384){const part=await reader.read();if(part.done)break;chunks.push(part.value.slice(0,16384-size));size+=chunks[chunks.length-1].length;}}finally{await reader.cancel();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return {bytes,text:new TextDecoder().decode(bytes),type:response.headers.get('content-type')||''};
}
export async function verifyMedia(url:string,headers:Record<string,string>={}) {
  const signal=AbortSignal.timeout(4500);
  let target=url;
  for(let depth=0;depth<3;depth++){
    const sample=await mediaPrefix(target,headers,signal);
    if(!sample.text.trimStart().startsWith('#EXTM3U'))return isMediaSample(sample);
    const child=sample.text.split(/\r?\n/).map(line=>line.trim()).find(line=>line&&!line.startsWith('#'));
    if(!child)return false;
    target=new URL(child,target).href;
  }
  return false;
}
export function isMediaSample(sample:{text:string;type:string;bytes:Uint8Array}){
  if(sample.text.trimStart().startsWith('#EXTM3U'))return sample.text.includes('#EXT-X-')||sample.text.includes('#EXTINF');
  if(/^\s*</.test(sample.text)||/html|json/.test(sample.type))return false;
  return sample.bytes.length>16&&(/^(video|audio)\//.test(sample.type)||/ftyp|styp/.test(sample.text.slice(4,12))||sample.bytes[0]===0x47||sample.bytes.slice(0,4).every((b,i)=>b===[0x1a,0x45,0xdf,0xa3][i]));
}
const querySchema=z.object({type:z.enum(['movie','tv']),id:z.string().regex(/^\d{1,9}$/),season:z.coerce.number().int().min(1).max(10000).optional(),episode:z.coerce.number().int().min(1).max(10000).optional()}).refine(q=>q.type==='movie'||!!(q.season&&q.episode));
const candidateSchema=z.object({url:z.string(),quality:z.string().optional(),label:z.string().optional(),server:z.string().optional(),headers:z.record(z.string()).optional(),type:z.string().optional()});
const resultSchema=z.object({url:z.string().optional(),headers:z.record(z.string()).optional(),allUrls:z.array(candidateSchema).optional()}).passthrough();
type Payload={provider:string;name:string;status:'reachable'|'unavailable'|'timeout';streams:{url:string;name:string;behaviorHints?:{proxyHeaders:{request:Record<string,string>}}}[]};

export function createSourceResolver(tmdbApiKey?:string){
  let sdkPromise:Promise<VylaSDK>|undefined;
  const cache=new Map<string,{until:number;value:Payload}>();
  const pending=new Map<string,Promise<Payload>>();
  const getSdk=()=>sdkPromise||=(import('@vyla-entertainment/sdk').then(({default:SDK})=>new SDK({tmdbApiKey})));
  return async(req:IncomingMessage,res:ServerResponse)=>{
    if(req.method!=='GET'){res.writeHead(405).end();return;}
    const parsed=querySchema.safeParse(Object.fromEntries(new URL(req.url||'','http://localhost').searchParams));
    if(!parsed.success){res.writeHead(400).end('Invalid title request');return;}
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no','X-Content-Type-Options':'nosniff'});res.flushHeaders();
    let closed=false;res.on('close',()=>{closed=true;});
    const send=(data:unknown)=>{if(!closed)res.write(`data: ${JSON.stringify(data)}\n\n`);};
    try{
      const sdk=await getSdk(),providers=sdk.getSources(true),query=parsed.data;
      send({type:'providers',providers:providers.map(p=>({id:p.key,name:p.label}))});
      const deadline=Date.now()+16000;let index=0,completed=0;
      await Promise.all(Array.from({length:8},async()=>{
        while(!closed&&index<providers.length){
          const provider=providers[index++];
          if(Date.now()>=deadline){send({type:'result',provider:provider.key,name:provider.label,status:'timeout',streams:[]});continue;}
          const key=`${query.type}:${query.id}:${query.season||0}:${query.episode||0}:${provider.key}`;
          const cached=cache.get(key);
          let task=cached&&cached.until>Date.now()?Promise.resolve(cached.value):pending.get(key);
          if(!task){
            task=(async():Promise<Payload>=>{
              const empty={provider:provider.key,name:provider.label,status:'unavailable' as const,streams:[]};
              try{
                const raw=resultSchema.parse(await sdk.getStream(provider.key,query.id,query.type==='tv'?query.season:null,query.type==='tv'?query.episode:null));
                const candidates=raw.allUrls?.length?raw.allUrls:raw.url?[candidateSchema.parse(raw)]:[];
                const streams:Payload['streams']=[];
                for(const candidate of candidates.slice(0,3)){
                  const headers=candidate.headers||raw.headers||{};
                  if(await verifyMedia(candidate.url,headers).catch(()=>false))streams.push({url:candidate.url,name:provider.label+(candidate.quality?' · '+candidate.quality:''),...(Object.keys(headers).length?{behaviorHints:{proxyHeaders:{request:headers}}}:{})});
                }
                return {...empty,status:streams.length?'reachable':'unavailable',streams};
              }catch{return empty;}
            })();
            pending.set(key,task);
            // shortcut: SDK requests use their own timeouts; sharing in-flight work prevents duplicate scans after navigation.
            void task.then(value=>{const oldest=cache.keys().next().value;if(cache.size>=200&&oldest)cache.delete(oldest);cache.set(key,{until:Date.now()+(value.streams.length?180000:30000),value});}).finally(()=>pending.delete(key));
          }
          let timer:ReturnType<typeof setTimeout>;
          const timeout:Payload={provider:provider.key,name:provider.label,status:'timeout',streams:[]};
          const value=await Promise.race([task,new Promise<Payload>(resolve=>{timer=setTimeout(()=>resolve(timeout),Math.min(6500,Math.max(1,deadline-Date.now())));})]);clearTimeout(timer!);
          completed++;send({type:'result',...value,completed,total:providers.length});
        }
      }));
      send({type:'done'});
    }catch{send({type:'error',message:'Source discovery is temporarily unavailable. Installed add-ons remain available.'});}
    finally{if(!closed)res.end();}
  };
}
