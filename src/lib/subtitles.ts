export function toWebVTT(value:string){
  const text=value.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
  if(text.startsWith('WEBVTT'))return text+'\n';
  if(/\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(text))return 'WEBVTT\n\n'+text.replace(/(\d{1,2}:\d{2}:\d{2}),(\d{3})/g,'$1.$2')+'\n';
  if(/^Dialogue:/m.test(text)){
    const time=(s:string)=>s.trim().replace(/^(\d):/,'0$1:').replace(/\.(\d{2})$/,(_,fraction)=>'.'+fraction+'0');
    const cues=text.split('\n').filter(line=>line.startsWith('Dialogue:')).map((line,index)=>{const fields=line.slice(9).split(',');return `${index+1}\n${time(fields[1])} --> ${time(fields[2])}\n${fields.slice(9).join(',').replace(/\{[^}]*\}/g,'').replace(/\\N/gi,'\n').replace(/\\h/g,' ')}`;});
    if(cues.length)return 'WEBVTT\n\n'+cues.join('\n\n')+'\n';
  }
  throw new Error('Choose a WebVTT, SRT, or ASS subtitle file.');
}
export function subtitleUrl(url:string){
  return url.startsWith('blob:')?url:'/api/playback/subtitles?'+new URLSearchParams({url});
}
export function subtitleLanguage(lang:string){
  if(!lang||lang==='und')return 'Unknown language';
  const codes:Record<string,string>={eng:'en',fre:'fr',fra:'fr',ara:'ar',spa:'es',por:'pt',pob:'pt-BR',ger:'de',deu:'de',ita:'it',jpn:'ja',chi:'zh',zho:'zh',rus:'ru',tur:'tr',kor:'ko',hin:'hi',dut:'nl',nld:'nl'};
  const code=codes[lang]||lang;
  try{return new Intl.DisplayNames(['en'],{type:'language'}).of(code)||lang;}catch{return lang;}
}
