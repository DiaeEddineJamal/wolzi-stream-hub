import type { IncomingMessage, ServerResponse } from 'node:http';

// Provider credentials stay on the server. Download URLs contain scoped tokens, never API keys.
export function createSubtitleSearch(apiKey = process.env.WYZIE_API_KEY) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const send=(status:number,data:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'private, max-age=300'});res.end(JSON.stringify(data));};
    if(req.method!=='GET'){send(405,{subtitles:[]});return;}
    const id=new URL(req.url||'','http://localhost').searchParams.get('id')||'';
    const match=/^(tt\d+)(?::(\d+):(\d+))?$/.exec(id);
    if(!match){send(400,{subtitles:[]});return;}
    if(!apiKey){send(200,{subtitles:[],configured:false});return;}
    try {
      const url=new URL('https://sub.wyzie.io/search');
      url.search=new URLSearchParams({id:match[1],key:apiKey,source:'all',format:'srt,ass,vtt',limit:'200'}).toString();
      if(match[2]){url.searchParams.set('season',match[2]);url.searchParams.set('episode',match[3]);}
      const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw new Error('Subtitle provider unavailable');
      const data:unknown=await response.json();
      if(!Array.isArray(data))throw new Error('Invalid response');
      const subtitles=data.slice(0,200).flatMap(track=>{
        try {
          if(typeof track.language!=='string'||typeof track.url!=='string')return [];
          const download=new URL(track.url);
          if(download.origin!=='https://sub.wyzie.io'||!download.pathname.startsWith('/c/'))return [];
          download.searchParams.set('to','vtt');
          return [{url:download.href,lang:track.language,label:`Wyzie · ${track.source||'Community'}${track.release?' · '+String(track.release).slice(0,140):''}`}];
        }catch{return [];}
      });
      send(200,{subtitles,configured:true});
    }catch{send(502,{subtitles:[],error:'Additional subtitle sources are temporarily unavailable.'});}
  };
}
