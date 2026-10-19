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
const ISO_CODES:Record<string,string>={
  eng:'en',en:'en',fre:'fr',fra:'fr',fr:'fr',ara:'ar',ar:'ar',spa:'es',spl:'es',spn:'es',es:'es',
  por:'pt',pt:'pt',pob:'pt-BR','pt-br':'pt-BR',ger:'de',deu:'de',de:'de',ita:'it',it:'it',
  jpn:'ja',ja:'ja',chi:'zh',zho:'zh',zh:'zh',zht:'zh-TW',zhs:'zh-CN',rus:'ru',ru:'ru',
  tur:'tr',tr:'tr',kor:'ko',ko:'ko',hin:'hi',hi:'hi',dut:'nl',nld:'nl',nl:'nl',
  pol:'pl',pl:'pl',swe:'sv',sv:'sv',nor:'no',no:'no',dan:'da',da:'da',fin:'fi',fi:'fi',
  gre:'el',ell:'el',el:'el',heb:'he',he:'he',ind:'id',id:'id',vie:'vi',vi:'vi',tha:'th',th:'th',
  ces:'cs',cze:'cs',cs:'cs',hun:'hu',hu:'hu',ron:'ro',rum:'ro',ro:'ro',ukr:'uk',uk:'uk',
  fas:'fa',per:'fa',fa:'fa',ben:'bn',bn:'bn',urd:'ur',ur:'ur',tam:'ta',ta:'ta',tel:'te',te:'te',
  may:'ms',msa:'ms',ms:'ms',fil:'tl',tgl:'tl',tl:'tl',hrv:'hr',hr:'hr',srp:'sr',sr:'sr',bul:'bg',bg:'bg'
};
const COUNTRY_CODES:Record<string,string>={
  en:'us',fr:'fr',ar:'sa',es:'es',pt:'pt','pt-BR':'br',de:'de',it:'it',ja:'jp',zh:'cn','zh-TW':'tw','zh-CN':'cn',
  ru:'ru',tr:'tr',ko:'kr',hi:'in',nl:'nl',pl:'pl',sv:'se',no:'no',da:'dk',fi:'fi',el:'gr',he:'il',
  id:'id',vi:'vn',th:'th',cs:'cz',hu:'hu',ro:'ro',uk:'ua',fa:'ir',bn:'bd',ur:'pk',ta:'in',te:'in',
  ms:'my',tl:'ph',hr:'hr',sr:'rs',bg:'bg'
};
export function normalizeLangCode(lang:string){
  if(!lang)return 'und';
  const clean=lang.trim().toLowerCase().replace(/_/g,'-');
  return ISO_CODES[clean]||ISO_CODES[clean.split('-')[0]]||clean;
}
export function subtitleLanguage(lang:string){
  if(!lang||lang==='und')return 'Unknown language';
  const code=normalizeLangCode(lang);
  if(code==='pt-BR')return 'Portuguese (Brazil)';
  if(code==='zh-TW')return 'Chinese (Traditional)';
  try{return new Intl.DisplayNames(['en'],{type:'language'}).of(code)||lang;}catch{return lang;}
}
export function subtitleNativeLanguage(lang:string){
  if(!lang||lang==='und')return '';
  const code=normalizeLangCode(lang);
  try{
    const native=new Intl.DisplayNames([code],{type:'language'}).of(code)||'';
    return native?native.charAt(0).toUpperCase()+native.slice(1):'';
  }catch{return '';}
}
export function subtitleFlagUrl(lang:string){
  if(!lang||lang==='und')return undefined;
  const code=normalizeLangCode(lang);
  const country=COUNTRY_CODES[code]||COUNTRY_CODES[code.split('-')[0]];
  return country?`https://flagcdn.com/w40/${country}.png`:undefined;
}
export function subtitleCodeBadge(lang:string){
  if(!lang||lang==='und')return 'CC';
  return normalizeLangCode(lang).split('-')[0].toUpperCase().slice(0,3);
}
