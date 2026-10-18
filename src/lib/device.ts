// Mouse/trackpad devices get hover-only extras (card backdrops, SVG glass refraction); touch devices skip their cost.
export const canHover=typeof window!=='undefined'&&window.matchMedia('(hover:hover) and (pointer:fine)').matches;

// Touch devices: flag active scrolling so the costly SVG glass refraction pauses while content moves under it
// (it would re-run every frame); it returns ~150 ms after the page settles.
if(typeof window!=='undefined'&&!canHover){
  const root=document.documentElement;let timer=0;
  window.addEventListener('scroll',()=>{
    if(!timer)root.classList.add('is-scrolling');else clearTimeout(timer);
    timer=window.setTimeout(()=>{root.classList.remove('is-scrolling');timer=0;},150);
  },{passive:true,capture:true});
}
