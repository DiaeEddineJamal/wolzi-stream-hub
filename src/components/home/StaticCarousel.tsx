import ContentSection from './ContentSection';
import type { MediaItem } from '@/lib/media';
export default function StaticCarousel(props: { items: MediaItem[]; title: string; viewMoreLink?: string }) {
  return <ContentSection {...props} landscape={false} />;
}
