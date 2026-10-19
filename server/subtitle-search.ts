import type { IncomingMessage, ServerResponse } from 'node:http';

// Provider credentials stay on the server. Download URLs contain scoped tokens, never API keys.
export function createSubtitleSearch(apiKey = process.env.WYZIE_API_KEY) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const send=(status:number,data:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'private, max-age=300'});res.end(JSON.stringify(data));};
    if(req.method!=='GET'){send(405,{subtitles:[]});return;}
    const params=new URL(req.url||'','http://localhost').searchParams;
    const id=params.get('id')||'',language=params.get('language');
    const match=/^((?:tt)?\d+)(?::(\d+):(\d+))?$/.exec(id);
    if(!match||(language!==null&&language!=='ar')){send(400,{subtitles:[]});return;}
    if(!apiKey){send(200,{subtitles:[],configured:false});return;}
    try {
      const url=new URL('https://sub.wyzie.io/search');
      // No pagination: the first page can be entirely English and omit Arabic.
      url.search=new URLSearchParams({id:match[1],key:apiKey,source:'all',format:'srt,ass,vtt'}).toString();
      if(language)url.searchParams.set('language',language);
      if(match[2]){url.searchParams.set('season',match[2]);url.searchParams.set('episode',match[3]);}
      const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw new Error('Subtitle provider unavailable');
      const data:unknown=await response.json();
      if(!Array.isArray(data))throw new Error('Invalid response');
      const subtitles=data.flatMap(track=>{
        try {
          if(typeof track.language!=='string'||typeof track.url!=='string')return [];
          const download=new URL(track.url);
          if(download.origin!=='https://sub.wyzie.io'||!download.pathname.startsWith('/c/'))return [];
          download.searchParams.set('to','vtt');
          const releases=[...new Set([track.release,...(Array.isArray(track.releases)?track.releases:[]),track.fileName].filter(value=>typeof value==='string'&&value.trim()))];
          const release=releases.join(' · ').slice(0,600),labelRelease=String(releases[0]||'').slice(0,160);
          return [{id:typeof track.id==='string'||typeof track.id==='number'?`${track.source||'wyzie'}:${track.id}`:undefined,url:download.href,lang:track.language,release,label:`Wyzie · ${track.source||'Community'}${labelRelease?' · '+labelRelease:''}`}];
        }catch{return [];}
      });
      send(200,{subtitles,configured:true});
    }catch{send(502,{subtitles:[],error:'Additional subtitle sources are temporarily unavailable.'});}
  };
}
