import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { createSourceResolver } from './source-resolver.js';
import { createSubtitleSearch } from './subtitle-search.js';
import { subtitleRoute } from './subtitles.js';
import { mediaProxyRoute } from './media-proxy.js';
import { sameOriginPlayback } from './playback-origin.js';

// Standalone playback API (Back4App container, see Dockerfile). The site's Cloudflare Pages Function (functions/api/playback)
// forwards /api/playback/* here with a shared secret and the site's host, so the handlers see
// the same same-origin request they would on Vercel.
type Handler=(req:IncomingMessage,res:ServerResponse)=>Promise<void>;
const secret=process.env.PROXY_SECRET||'';
if(!secret){console.error('PROXY_SECRET is required.');process.exit(1);}
// One provider's stray async error must not restart the whole API (Node exits on these by default).
process.on('unhandledRejection',error=>{console.error('Unhandled rejection:',error instanceof Error?error.stack||error.message:error);});
// Per-viewer request budget (one minute windows). A source scan fans out to every provider, so it
// gets a small budget; playlists, keys and subtitles are cheap and frequent.
const budgets:Record<string,number>={'/api/playback/sources':30};
const otherBudget=900,windowMs=60_000;
const seen=new Map<string,{start:number;count:number}>();
export function overBudget(ip:string,prefix:string,now=Date.now()){
  if(!ip)return false; // No viewer address (direct deployments): nothing fair to count against.
  const key=ip+'|'+(budgets[prefix]?prefix:'*'),entry=seen.get(key);
  if(!entry||now-entry.start>=windowMs){if(seen.size>20_000)seen.clear();seen.set(key,{start:now,count:1});return false;}
  return ++entry.count>(budgets[prefix]||otherBudget);
}
const routes:[string,Handler][]=[
  ['/api/playback/media',sameOriginPlayback(mediaProxyRoute)],
  ['/api/playback/sources',sameOriginPlayback(createSourceResolver(process.env.TMDB_API_KEY||process.env.VITE_TMDB_API_KEY))],
  ['/api/playback/subtitle-search',sameOriginPlayback(createSubtitleSearch())],
  ['/api/playback/subtitles',sameOriginPlayback(subtitleRoute)],
];
const valid=(value:unknown)=>{
  const given=Buffer.from(String(value||'')),expected=Buffer.from(secret);
  return given.length===expected.length&&timingSafeEqual(given,expected);
};

export const server=createServer((req,res)=>{
  // A malformed request target (e.g. "//") makes URL throw; that must be a 400, not a dead process.
  let path:string;
  try{path=new URL(req.url||'/','http://localhost').pathname;}catch{res.writeHead(400).end();return;}
  if(path==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain'}).end('ok');return;}
  const route=routes.find(([prefix])=>path===prefix||path.startsWith(prefix+'/'));
  if(!route){res.writeHead(404).end();return;}
  const siteHost=String(req.headers['x-site-host']||'');
  if(!valid(req.headers['x-proxy-secret'])||!/^[\w.-]+(:\d+)?$/.test(siteHost)){res.writeHead(403).end();return;}
  // Act as the site: same-origin checks and the media relay's Referer/Origin use the site's address.
  // Set by the site's forwarder (functions/api/playback/[[path]].js), which the secret above authenticates.
  if(overBudget(String(req.headers['x-client-ip']||''),route[0])){res.writeHead(429,{'Retry-After':'60','Cache-Control':'no-store'}).end();return;}
  req.headers.host=siteHost;req.headers['x-forwarded-proto']='https';
  void route[1](req,res);
});
server.listen(Number(process.env.PORT)||10000,()=>console.log('Playback API listening'));
