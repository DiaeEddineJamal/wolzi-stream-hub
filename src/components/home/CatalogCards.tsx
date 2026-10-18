import MediaCard from './MediaCard';
import DraggableRail from './DraggableRail';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { MediaItem } from '@/lib/media';

export default function CatalogCards({items}:{items:MediaItem[]}){
  const desktop=useMediaQuery('(min-width:768px)'),wide=useMediaQuery('(min-width:1101px)');
  if(!desktop)return <div className="catalog-grid">{items.map(item=><MediaCard key={item.mediaType+item.id} {...item}/>)}</div>;
  const columns=wide?6:5;
  return <div className="catalog-rows">{Array.from({length:Math.ceil(items.length/columns)},(_,row)=><DraggableRail key={row} className="media-rail poster-rail catalog-row">{items.slice(row*columns,(row+1)*columns).map(item=><MediaCard key={item.mediaType+item.id} {...item}/>)}</DraggableRail>)}</div>;
}
