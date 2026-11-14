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
  const path=new URL(req.url||'/','http://localhost').pathname;
  if(path==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain'}).end('ok');return;}
  const route=routes.find(([prefix])=>path===prefix||path.startsWith(prefix+'/'));
  if(!route){res.writeHead(404).end();return;}
  const siteHost=String(req.headers['x-site-host']||'');
  if(!valid(req.headers['x-proxy-secret'])||!/^[\w.-]+(:\d+)?$/.test(siteHost)){res.writeHead(403).end();return;}
  // Act as the site: same-origin checks and the media relay's Referer/Origin use the site's address.
  req.headers.host=siteHost;req.headers['x-forwarded-proto']='https';
  void route[1](req,res);
});
server.listen(Number(process.env.PORT)||10000,()=>console.log('Playback API listening'));
