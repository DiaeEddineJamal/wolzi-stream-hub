import type { IncomingMessage, ServerResponse } from 'node:http';
import { gunzipSync } from 'node:zlib';
import { publicMediaUrl } from './source-resolver.js';
import { downloadSubtitle, SUBTITLE_HEADERS } from './subtitle-core.js';
// Node route (dev server, Render); the live site serves this from functions/api/playback/subtitles.ts.
export async function subtitleRoute(req:IncomingMessage,res:ServerResponse){
  if(req.method!=='GET'){res.writeHead(405).end();return;}
  try{
    const value=new URL(req.url||'','http://localhost').searchParams.get('url')||'';
    const {vtt}=await downloadSubtitle(value,async url=>publicMediaUrl(url),async bytes=>new Uint8Array(gunzipSync(bytes,{maxOutputLength:8_000_000})));
    res.writeHead(200,SUBTITLE_HEADERS);res.end(vtt);
  }catch{if(!res.headersSent)res.writeHead(422,{'Content-Type':'text/plain'});res.end('This subtitle could not be loaded or converted.');}
}
