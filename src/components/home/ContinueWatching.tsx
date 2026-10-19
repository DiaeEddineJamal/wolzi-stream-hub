import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { usePlaybackHistory } from '@/hooks/usePlaybackHistory';
import tmdbApi, { getPosterUrl } from '@/integrations/api/tmdb';
import { watchPath } from '@/lib/media';
import type { WatchProgress } from '@/lib/watch-progress';
import DraggableRail from './DraggableRail';
import MediaCard from './MediaCard';
function ResumeCard({item}:{item:WatchProgress}){
  const details=useQuery({queryKey:['detail',item.content_type,item.content_id],enabled:!item.backdropUrl,staleTime:300000,queryFn:async()=>(await(item.content_type==='movie'?tmdbApi.getMovieDetails(Number(item.content_id)):tmdbApi.getTVShowDetails(Number(item.content_id)))).data});
  const backdrop=details.data?.backdrop_path?'https://image.tmdb.org/t/p/w1280'+details.data.backdrop_path:item.backdropUrl;
  return <MediaCard id={item.content_id} title={item.title} mediaType={item.content_type} posterUrl={item.poster_path?.startsWith('https://')?item.poster_path:getPosterUrl(item.poster_path)||'/poster-placeholder.svg'} backdropUrl={backdrop} progressPercent={item.progress_percent} playTo={watchPath(item.content_type,item.content_id,item.season||1,item.episode||1)} landscape={false}/>;
}
export default function ContinueWatching(){
  const {continuing}=usePlaybackHistory();
  if(!continuing.length)return null;
  return <section className="content-section" aria-label="Continue watching"><header className="section-heading page-shell"><div><p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2>Continue watching</h2></div><Link className="view-all" to="/watch-history">History <ChevronRight size={15}/></Link></header><DraggableRail className="media-rail poster-rail">{continuing.slice(0,12).map(item=><ResumeCard key={item.content_type+item.content_id} item={item}/>)}</DraggableRail></section>;
}
