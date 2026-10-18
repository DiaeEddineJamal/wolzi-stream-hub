import { NavLink } from 'react-router-dom';
import { Compass, Clapperboard, Tv, Sparkles, Library } from 'lucide-react';
import GlassSurface from '@/components/vendor/reactbits/GlassSurface';
const items=[{to:'/',label:'Discover',icon:Compass},{to:'/movies',label:'Movies',icon:Clapperboard},{to:'/tv-series',label:'Series',icon:Tv},{to:'/anime',label:'Anime',icon:Sparkles},{to:'/library',label:'My List',icon:Library}];
export default function MobileBottomNav(){
  return <nav className="mobile-dock" aria-label="Mobile navigation"><GlassSurface className="dock-glass" width="100%" height={70} borderRadius={35} backgroundOpacity={.12} blur={12} distortionScale={-38} displace={1.5} redOffset={0} greenOffset={3} blueOffset={6} renderer="svg"><div className="dock-links">{items.map(({to,label,icon:Icon})=><NavLink end={to==='/'} key={to} to={to}><span className="dock-icon"><Icon size={22} strokeWidth={1.7}/></span><span>{label}</span></NavLink>)}</div></GlassSurface></nav>;
}
