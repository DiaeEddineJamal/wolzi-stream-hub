import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { artworkSet } from '@/lib/artwork';
import type { MediaItem } from '@/lib/media';
import { useCarouselDrag } from '@/hooks/useDragScroll';
export default function SpotlightCarousel({items,viewMoreLink='/trending/all'}:{items:MediaItem[];viewMoreLink?:string}){
  const [index,setIndex]=useState(0);const reduced=useReducedMotion();
  const move=(delta:number)=>setIndex(value=>(value+delta+items.length)%items.length);
  const drag=useCarouselDrag(move);
  if(!items.length)return null;
  return <section className="spotlight-section" aria-label="Everyone’s watching" aria-roledescription="carousel"><header className="section-heading page-shell"><div><h2>Everyone’s watching</h2><p>Stories in the spotlight. Yours to discover.</p></div><Link className="view-all" to={viewMoreLink}>Explore all <ChevronRight size={15}/></Link></header>
    <div className="spotlight-stage" {...drag.handlers}><motion.div className="spotlight-track" style={{x:drag.offset}}>
      {[-1,0,1].map(position=>{const item=items[(index+position+items.length)%items.length];return <motion.div key={items.length<3?position:item.id} className={`spotlight-card ${position===0?'is-current':''}`} initial={false} animate={{x:`${position*107}%`,scale:position===0?1:.9,opacity:position===0?1:.33}} transition={{duration:reduced?0:.55,ease:[.22,.75,.2,1]}} aria-hidden={position!==0}><Link to={`/${item.mediaType}/${item.id}`} tabIndex={position===0?0:-1}><img src={item.backdropUrl||item.posterUrl} srcSet={artworkSet(item.backdropUrl)} sizes="(max-width:767px) 86vw, 64vw" alt="" loading="lazy" decoding="async"/><div className="spotlight-copy"><h3>{item.title}</h3><p>{item.description}</p><span><Play size={12} fill="currentColor"/>Explore story</span></div></Link></motion.div>;})}
      </motion.div><button className="spotlight-arrow previous" aria-label="Previous spotlight" onClick={()=>move(-1)}><ChevronLeft/></button><button className="spotlight-arrow next" aria-label="Next spotlight" onClick={()=>move(1)}><ChevronRight/></button>
    </div><div className="spotlight-dots">{items.slice(0,8).map((item,i)=><button key={item.id} aria-label={`Spotlight ${item.title}`} aria-current={index===i} onClick={()=>setIndex(i)}><span/></button>)}</div>
  </section>;
}
