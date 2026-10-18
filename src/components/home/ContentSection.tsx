import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from './MediaCard';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/lib/media';
import { useDragScroll } from '@/hooks/useDragScroll';
interface Props {
  eyebrow?: string; title: string; items: (MediaItem & { overview?: string })[];
  viewMoreLink?: string; className?: string; showViewMore?: boolean; landscape?: boolean; ranked?: boolean;
}
export default function ContentSection({ title, eyebrow, items, viewMoreLink, className, showViewMore = true, landscape = true, ranked = false }: Props) {
  const rail = useRef<HTMLDivElement>(null);
  const drag=useDragScroll(rail);
  if (!items.length) return null;
  const scroll = (direction: number) => rail.current?.scrollBy({ left: direction * rail.current.clientWidth * .85, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  return <section className={cn('content-section', className)}>
    <header className="section-heading page-shell">
      <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>
      <div className="flex items-center gap-2">
        {showViewMore && viewMoreLink && <Link className="view-all" to={viewMoreLink}>View all <ChevronRight size={15} /></Link>}
        <button className="rail-arrow" onClick={() => scroll(-1)} aria-label={`Previous ${title}`}><ChevronLeft size={16} /></button>
        <button className="rail-arrow" onClick={() => scroll(1)} aria-label={`More ${title}`}><ChevronRight size={16} /></button>
      </div>
    </header>
    <div ref={rail} className={cn('media-rail', !landscape && 'poster-rail')} {...drag}>
      {items.map((item, index) => <MediaCard key={`${item.mediaType}-${item.id}`} {...item} landscape={landscape} rank={ranked ? index + 1 : undefined} />)}
    </div>
  </section>;
}
