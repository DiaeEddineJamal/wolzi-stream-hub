import { getBackdropUrl, getPosterUrl } from '@/integrations/api/tmdb';
import { genreNamesFromIds } from '@/constants/tmdb-genres';
export type MediaType = 'movie' | 'tv' | 'anime';
export interface MediaItem {
  id: string; title: string; posterUrl: string; backdropUrl?: string; mediaType: MediaType;
  rating?: number; year?: string; description?: string; genres?: string[]; detailTo?: string; playTo?: string;
}
interface CatalogRecord {
  id: number | string; title?: string; name?: string; poster_path?: string; backdrop_path?: string;
  media_type?: MediaType; vote_average?: number; release_date?: string; first_air_date?: string;
  overview?: string; genres?: {name:string}[]; genre_ids?: number[];
}
export function toMediaItem(item: CatalogRecord, type?: MediaType): MediaItem {
  return {
    id: String(item.id), title: item.title || item.name,
    posterUrl: getPosterUrl(item.poster_path, 'w500') || '/poster-placeholder.svg',
    backdropUrl: getBackdropUrl(item.backdrop_path, 'w1280') || undefined,
    mediaType: type || item.media_type || 'movie', rating: item.vote_average,
    year: (item.release_date || item.first_air_date || '').slice(0, 4), description: item.overview,
    genres: item.genres?.map((g: { name: string }) => g.name) || genreNamesFromIds(item.genre_ids, 3),
  };
}
export function watchPath(type: MediaType, id: string, season = 1, episode = 1) {
  if (type === 'movie') return `/watch/movie/${id}`;
  if (type === 'anime') return `/watch/anime/${id}/${episode}?season=${season}`;
  return `/watch/tv/${id}/${season}/${episode}`;
}
