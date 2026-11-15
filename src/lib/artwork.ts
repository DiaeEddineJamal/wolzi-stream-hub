export function artworkSize(url:string,size:string){return url?.replace(/(image\.tmdb\.org\/t\/p\/)(?:w\d+|original)\//,`$1${size}/`);}
// Phones, tablets and small laptops never need more than 1280 px; large or high-density desktops do.
const largeScreen=typeof window!=='undefined'&&window.innerWidth>=1024&&window.innerWidth*Math.min(window.devicePixelRatio||1,2)>1700;
export function artworkSet(url:string,kind:'poster'|'backdrop'='backdrop'){
  if(!url?.includes('image.tmdb.org/t/p/'))return undefined;
  return (kind==='poster'?['w185','w342','w500','w780']:largeScreen?['w780','w1280','original']:['w780','w1280']).map(size=>`${artworkSize(url,size)} ${size==='original'?3840:size.slice(1)}w`).join(', ');
}
export function paletteFromPixels(pixels:ArrayLike<number>){
  const bins=new Map<string,{r:number;g:number;b:number;weight:number}>();
  for(let i=0;i<pixels.length;i+=4){
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b);
    if(max<30||min>220)continue;
    const weight=1+(max-min)/40,key=[r>>5,g>>5,b>>5].join(',');
    const color=bins.get(key)||{r:0,g:0,b:0,weight:0};color.r+=r*weight;color.g+=g*weight;color.b+=b*weight;color.weight+=weight;bins.set(key,color);
  }
  const dominant=[...bins.values()].sort((a,b)=>b.weight-a.weight)[0];
  const rgb=dominant?[dominant.r,dominant.g,dominant.b].map(v=>Math.round(v/dominant.weight)):[80,80,80];
  return {'--scene-color':'#161616','--scene-accent':`rgb(${rgb.join(' ')})`,'--scene-glow':`rgb(${rgb.map(v=>Math.round(v*.6)).join(' ')})`};
}
