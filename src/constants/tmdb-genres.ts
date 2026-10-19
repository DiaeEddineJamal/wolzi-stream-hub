/** TMDB genre id → label (movie & TV share most ids) */
export const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10765: "Sci-Fi & Fantasy",
};

export const MOVIE_GENRES = [
  { id: "28", label: "Action" },
  { id: "12", label: "Adventure" },
  { id: "16", label: "Animation" },
  { id: "35", label: "Comedy" },
  { id: "80", label: "Crime" },
  { id: "99", label: "Documentary" },
  { id: "18", label: "Drama" },
  { id: "10751", label: "Family" },
  { id: "14", label: "Fantasy" },
  { id: "36", label: "History" },
  { id: "27", label: "Horror" },
  { id: "9648", label: "Mystery" },
  { id: "10749", label: "Romance" },
  { id: "878", label: "Sci-Fi" },
  { id: "53", label: "Thriller" },
];

export const TV_GENRES = [
  { id: "10759", label: "Action & Adventure" },
  { id: "16", label: "Animation" },
  { id: "35", label: "Comedy" },
  { id: "80", label: "Crime" },
  { id: "99", label: "Documentary" },
  { id: "18", label: "Drama" },
  { id: "10751", label: "Family" },
  { id: "9648", label: "Mystery" },
  { id: "10749", label: "Romance" },
  { id: "10765", label: "Sci-Fi & Fantasy" },
];

export const ANIME_GENRES = [
  { id: "10759", label: "Action & Adventure" },
  { id: "35", label: "Comedy" },
  { id: "18", label: "Drama" },
  { id: "9648", label: "Mystery" },
  { id: "10749", label: "Romance" },
  { id: "10765", label: "Sci-Fi & Fantasy" },
];

export function genreNamesFromIds(ids: number[] | undefined, max = 4): string[] {
  if (!ids?.length) return [];
  return ids
    .map((id) => GENRE_MAP[id])
    .filter(Boolean)
    .slice(0, max);
}
