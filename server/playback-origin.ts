import type { IncomingMessage, ServerResponse } from 'node:http';
export function sameOriginPlayback(handler:(req:IncomingMessage,res:ServerResponse)=>Promise<void>){
  return async(req:IncomingMessage,res:ServerResponse)=>{
    const origin=req.headers.origin;
    if(req.headers['sec-fetch-site']==='cross-site'||(origin&&!['https://'+req.headers.host,'http://'+req.headers.host].includes(origin))){
      res.writeHead(403).end('This playback endpoint is available only on this website.');return;
    }
    try{await handler(req,res);}catch{
      console.error('Playback request failed');
      if(!res.headersSent)res.writeHead(500);
      res.end();
    }
  };
}
