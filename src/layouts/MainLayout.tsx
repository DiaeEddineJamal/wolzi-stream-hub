import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import InstallApp from '@/components/layout/InstallApp';
import SceneAmbience from '@/components/layout/SceneAmbience';
export default function MainLayout({ children, theme }: { children: React.ReactNode; theme?:CSSProperties }) {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); document.title = 'A&D MAX — A world of stories'; document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index, follow'); }, [pathname]);
  const cinematic = ['/', '/movies', '/tv-series', '/anime'].includes(pathname) || /^\/(movie|tv|anime)\/\d+/.test(pathname);
  const information = ['/privacy','/terms','/legal'].includes(pathname);
  return <div className="app-shell" style={theme}><SceneAmbience theme={theme}/><a className="skip-link" href="#main">Skip to content</a><NavBar /><main id="main" className={`${cinematic ? 'cinematic-page' : 'standard-page'} ${information ? 'information-page' : ''} ${pathname === '/profile' ? 'account-page' : ''}`}>{children}</main><Footer /><MobileBottomNav /><InstallApp /></div>;
}
