import { Link } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
export default function NotFound(){
  useEffect(()=>{document.querySelector('meta[name="robots"]')?.setAttribute('content','noindex, follow');},[]);
  return <MainLayout><div className="empty-state min-h-[60vh]"><p className="eyebrow">THE END OF THIS SCENE · 404</p><h1>Let’s find a better story.</h1><p>This page may have moved, or the link may have taken a wrong turn.</p><Button asChild><Link to="/">Back to discover</Link></Button></div></MainLayout>;
}
