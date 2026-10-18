import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { CSSProperties } from 'react';

export default function SceneAmbience({theme}:{theme?:CSSProperties}){
  const artwork=(theme as Record<string,string>)?.['--scene-artwork'];
  const reduced=useReducedMotion();
  if(!artwork||artwork==='none')return null;
  return <div className="scene-ambience" aria-hidden="true"><AnimatePresence initial={false}>
    {artwork&&artwork!=='none'&&<motion.div key={artwork} className="scene-ambience-art" style={{backgroundImage:artwork}} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:1.2,ease:'easeInOut'}}/>}
  </AnimatePresence></div>;
}
