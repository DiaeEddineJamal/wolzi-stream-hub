import { Link } from 'react-router-dom';
import { Check, Play, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWatchlist } from '@/hooks/useWatchlist';
import { watchPath, type MediaItem } from '@/lib/media';
import { artworkSet } from '@/lib/artwork';
import { canHover } from '@/lib/device';
interface Props extends MediaItem {
  className?: string; size?: 'small' | 'medium' | 'large'; showHover?: boolean; voteCount?: number;
  progressPercent?: number; detailTo?: string; playTo?: string; landscape?: boolean; rank?: number;
}
export default function MediaCard({ className, detailTo, playTo, progressPercent, landscape = false, rank, ...item }: Props) {
  const { has, toggle } = useWatchlist();
  const saved = has(item);
  return <article className={cn('max-card group', landscape && 'max-card-landscape', className)}>
    <div className="max-card-art">
      <Link to={detailTo || `/${item.mediaType}/${item.id}`} aria-label={`Details for ${item.title}`} className="block h-full">
        <img className="card-poster" src={(landscape && item.backdropUrl) || item.posterUrl} srcSet={artworkSet((landscape&&item.backdropUrl)||item.posterUrl,landscape?'backdrop':'poster')} sizes={landscape?'(max-width:767px) 78vw, 390px':'(max-width:767px) 38vw, 226px'} alt={item.title} loading="lazy" decoding="async" onError={e => { e.currentTarget.onerror = null; e.currentTarget.srcset=''; e.currentTarget.src = '/poster-placeholder.svg'; }} />
        {canHover && !landscape && item.backdropUrl && <img className="card-expanded-image" src={item.backdropUrl} srcSet={artworkSet(item.backdropUrl)} sizes="520px" alt="" loading="lazy" decoding="async" />}
        <span className="max-card-shade" />
        {rank && <span className="card-rank">{String(rank).padStart(2, '0')}</span>}
        <strong className="card-image-title">{item.title}</strong>
      </Link>
      <div className="card-actions">
        <Link to={playTo || watchPath(item.mediaType, item.id)} className="icon-button bg-white text-black" aria-label={`Play ${item.title}`}><Play size={17} fill="currentColor" /></Link>
        <button className="icon-button" onClick={() => toggle({...item,detailTo,playTo})} aria-pressed={saved} aria-label={`${saved ? 'Remove' : 'Save'} ${item.title}`}>{saved ? <Check size={18} /> : <Plus size={18} />}</button>
      </div>
      {progressPercent != null && <progress className="card-progress" max={100} value={Math.min(100, Math.max(0, progressPercent))} aria-label="Watch progress" />}
    </div>
    <Link to={detailTo || `/${item.mediaType}/${item.id}`} className="card-caption"><h3>{item.title}</h3></Link>
    <p className="card-meta">{item.year}<span>·</span>{item.mediaType === 'movie' ? 'Movie' : item.mediaType === 'anime' ? 'Anime' : 'Series'}{item.rating > 0 && <><span>·</span><span className="card-rating">★ {item.rating.toFixed(1)}</span></>}</p>
  </article>;
}
