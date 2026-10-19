import { useState } from 'react';
import { GridPageSkeleton } from '@/components/primitives/Skeletons';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import CatalogCards from '@/components/home/CatalogCards';
import { usePlaybackHistory } from '@/hooks/usePlaybackHistory';
import { getPosterUrl } from '@/integrations/api/tmdb';
import { watchPath } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
export default function WatchHistory(){
  const history=usePlaybackHistory(),[clearing,setClearing]=useState(false);
  const clear=async()=>{setClearing(true);try{await history.clear();toast.success('Watch history cleared');}catch{toast.error('Your watch history could not be cleared.');}finally{setClearing(false);}};
  const cards=history.items.map(item=>({id:item.content_id,title:item.title,mediaType:item.content_type,posterUrl:item.poster_path?.startsWith('https://')?item.poster_path:getPosterUrl(item.poster_path)||'/poster-placeholder.svg',backdropUrl:item.backdropUrl,progressPercent:item.progress_percent,playTo:watchPath(item.content_type,item.content_id,item.season||1,item.episode||1)}));
  return <MainLayout><div className="page-shell"><header className="catalog-header"><div><p className="eyebrow">THE STORIES YOU’VE BEEN INTO</p><h1>Watch history</h1><p>Pick up the thread. Keep the story going.</p></div>{!!history.items.length&&<AlertDialog><AlertDialogTrigger asChild><Button variant="secondary" disabled={clearing}>Clear history</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Clear your watch history?</AlertDialogTitle><AlertDialogDescription>This removes your account and device watch history. Your saved list stays available.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep history</AlertDialogCancel><AlertDialogAction onClick={clear}>Clear history</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}</header>
  {history.error&&<div className="settings-panel mb-6"><p className="mb-3 text-sm">Account sync is unavailable. Progress saved on this device is still here.</p><Button variant="secondary" onClick={()=>history.reload()}>Retry sync</Button></div>}
  {history.loading&&!history.items.length?<GridPageSkeleton/>:cards.length?<CatalogCards items={cards}/>:<div className="empty-state"><History size={32} className="text-muted-foreground"/><h2>Your story starts here.</h2><p>Start a title to save your place here.</p><Button asChild><Link to="/">Find something to watch</Link></Button></div>}
  </div></MainLayout>;
}
