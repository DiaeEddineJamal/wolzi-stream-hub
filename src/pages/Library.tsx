import { Link } from 'react-router-dom';
import { Bookmark, History } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Button } from '@/components/ui/button';
import LoadingState from '@/components/primitives/LoadingState';
import CatalogCards from '@/components/home/CatalogCards';
export default function Library(){
  const {items,loading,error,reload,signedIn}=useWatchlist();
  return <MainLayout><div className="page-shell"><header className="catalog-header"><div><p className="eyebrow">ALL YOUR NEXT WATCHES</p><h1>My List</h1><p>{signedIn?'Your stories, saved to your account.':'Your stories, saved for later on this device.'}</p></div><Button variant="secondary" asChild><Link to="/watch-history"><History size={16}/>Watch history</Link></Button></header>
    {error&&<div className="settings-panel mb-6"><p className="mb-3 text-sm">Account sync is unavailable. Your saved device copy is shown.</p><Button variant="secondary" onClick={()=>reload()}>Retry sync</Button></div>}
    {loading?<div className="empty-state"><LoadingState label="Opening your list"/></div>:items.length?<CatalogCards items={items}/>:<div className="empty-state"><Bookmark size={32} className="text-muted-foreground"/><h2>Make room for a good story.</h2><p>Tap the plus on any title to keep it here for your next movie night.</p><Button asChild><Link to="/">Explore titles</Link></Button></div>}
  </div></MainLayout>;
}
