import type { IncomingMessage, ServerResponse } from 'node:http';
import { searchSubtitles } from './subtitle-core.js';
// Node route (dev server, Render); the live site serves this from functions/api/playback/subtitle-search.ts.
export function createSubtitleSearch(apiKey = process.env.WYZIE_API_KEY) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if(req.method!=='GET'){res.writeHead(405,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({subtitles:[]}));return;}
    const result=await searchSubtitles(new URL(req.url||'','http://localhost').searchParams,apiKey);
    res.writeHead(result.status,{'Content-Type':'application/json','Cache-Control':result.cache});res.end(JSON.stringify(result.body));
  };
}
