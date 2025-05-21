import React, { useEffect, useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import ContentSection from '@/components/home/ContentSection';
import jikanApi from '@/integrations/api/jikan';
import gogoAnimeApi from '@/integrations/api/gogoanime';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnimeItem {
  id: string;
  title: string;
  posterUrl: string;
  rating: number;
  year: string;
  mediaType: 'anime';
  description?: string;
}

const Anime: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [popularAnime, setPopularAnime] = useState<AnimeItem[]>([]);
  const [airingAnime, setAiringAnime] = useState<AnimeItem[]>([]);
  const [upcomingAnime, setUpcomingAnime] = useState<AnimeItem[]>([]);
  const [recentEpisodes, setRecentEpisodes] = useState<AnimeItem[]>([]);
  
  useEffect(() => {
    const fetchAnimeData = async () => {
      setLoading(true);
      try {
        // Fetch popular anime from Jikan API
        const popularResponse = await jikanApi.getTopAnime(1, 20, 'bypopularity');
        const processedPopular = popularResponse.data.data.map((anime: any) => ({
          id: anime.mal_id.toString(),
          title: anime.title,
          posterUrl: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
          rating: anime.score || 0,
          year: (anime.aired.from || "").substring(0, 4),
          mediaType: 'anime' as const,
          description: anime.synopsis
        }));
        setPopularAnime(processedPopular);
        
        // Fetch currently airing anime
        const airingResponse = await jikanApi.getAiringAnime(1, 20);
        const processedAiring = airingResponse.data.data.map((anime: any) => ({
          id: anime.mal_id.toString(),
          title: anime.title,
          posterUrl: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
          rating: anime.score || 0,
          year: (anime.aired.from || "").substring(0, 4),
          mediaType: 'anime' as const,
          description: anime.synopsis
        }));
        setAiringAnime(processedAiring);
        
        // Fetch upcoming anime
        const upcomingResponse = await jikanApi.getUpcomingAnime(1, 20);
        const processedUpcoming = upcomingResponse.data.data.map((anime: any) => ({
          id: anime.mal_id.toString(),
          title: anime.title,
          posterUrl: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
          rating: anime.score || 0,
          year: (anime.aired.from || "").substring(0, 4),
          mediaType: 'anime' as const,
          description: anime.synopsis
        }));
        setUpcomingAnime(processedUpcoming);
        
        // Fetch recent episodes from GogoAnime
        const recentEpisodesResponse = await gogoAnimeApi.getRecentEpisodes(1);
        const processedRecentEpisodes = recentEpisodesResponse.data.results.map((anime: any) => ({
          id: anime.id,
          title: anime.title,
          posterUrl: anime.image || "https://via.placeholder.com/500x750?text=No+Image",
          rating: 0, // GogoAnime doesn't provide ratings
          year: "", // GogoAnime doesn't provide years
          mediaType: 'anime' as const,
          description: `Episode ${anime.episodeNumber} - Watch latest episodes`
        }));
        setRecentEpisodes(processedRecentEpisodes);
        
      } catch (error) {
        console.error('Error fetching anime data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnimeData();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 gradient-text">Anime</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <Tabs defaultValue="popular" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="airing">Currently Airing</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="recent">Recent Episodes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="popular">
              <ContentSection
                title="Popular Anime"
                items={popularAnime.slice(0, 12)}
                viewMoreLink="/anime/popular"
                showViewMore={true}
                className="mb-12"
              />
            </TabsContent>
            
            <TabsContent value="airing">
              <ContentSection
                title="Currently Airing Anime"
                items={airingAnime.slice(0, 12)}
                viewMoreLink="/anime/airing"
                showViewMore={true}
                className="mb-12"
              />
            </TabsContent>
            
            <TabsContent value="upcoming">
              <ContentSection
                title="Upcoming Anime"
                items={upcomingAnime.slice(0, 12)}
                viewMoreLink="/anime/upcoming"
                showViewMore={true}
                className="mb-12"
              />
            </TabsContent>
            
            <TabsContent value="recent">
              <ContentSection
                title="Recent Episodes"
                items={recentEpisodes.slice(0, 12)} // Keep slice for consistency on this page
                // No viewMoreLink for recent episodes as per instructions
                className="mb-12"
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
};

export default Anime; 