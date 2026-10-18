import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Brand from './Brand';
export default function Footer() {
  return <footer className="max-footer page-shell">
    <div className="footer-top"><div><Brand /><p>A world of stories.<br />A place to call yours.</p></div><div className="footer-links">
      <div><h3>Explore</h3><Link to="/movies">Movies</Link><Link to="/tv-series">Series</Link><Link to="/anime">Anime</Link></div>
      <div><h3>Your space</h3><Link to="/library">My List</Link><Link to="/watch-history">Watch history</Link><Link to="/addons">Add-ons <ArrowUpRight size={12} /></Link></div>
      <div><h3>A&D MAX</h3><Link to="/about">Our story</Link><Link to="/help">Help center</Link><Link to="/contact">Contact</Link></div>
    </div></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} A&D MAX</span><div><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/legal">Legal</Link><a href="https://rareui.com" target="_blank" rel="noreferrer">Rare UI</a></div></div>
  </footer>;
}
