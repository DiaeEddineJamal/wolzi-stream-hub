// Shared helpers for the Cloudflare Pages Functions in functions/api/playback/.
export interface EdgeContext {request:Request;env:Record<string,string|undefined>;waitUntil:(promise:Promise<unknown>)=>void}

// Same rule as server/playback-origin.ts: only this site may call the playback endpoints.
export function sameSite(request:Request){
  const origin=request.headers.get('origin');
  return request.headers.get('sec-fetch-site')!=='cross-site'&&(!origin||origin===new URL(request.url).origin);
}

// Workers cannot reach private networks, so only the address shape needs checking here.
export async function publicUrl(value:string){
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443'))throw new Error('Invalid address');
  return url;
}

export async function gunzip(bytes:Uint8Array,limit=8_000_000){
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),chunks:Uint8Array[]=[];let size=0;
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>limit){await reader.cancel();throw new Error('Subtitle too large');}chunks.push(part.value);}
  const out=new Uint8Array(size);let offset=0;for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.length;}
  return out;
}

// Cloudflare's default cache (Workers runtime); typed here so the file also checks under Node types.
export interface EdgeCache {match(request:Request):Promise<Response|undefined>;put(request:Request,response:Response):Promise<void>}
export const edgeCache=()=>(globalThis as unknown as {caches:{default:EdgeCache}}).caches.default;
