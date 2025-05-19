
import React from "react";
import MainLayout from "@/layouts/MainLayout";
import HeroBanner from "@/components/home/HeroBanner";
import ContentSection from "@/components/home/ContentSection";

const Index: React.FC = () => {
  // Mock data - In a real app, this would come from an API
  const featuredContent = {
    id: "1",
    title: "Stranger Things: Season 4",
    description:
      "When a young boy disappears, his mother, a police chief, and his friends must confront terrifying supernatural forces in order to get him back. As they search for answers, they unravel a series of extraordinary mysteries involving secret government experiments, horrifying supernatural forces, and one very strange little girl.",
    imageUrl: "https://images.unsplash.com/photo-1597002973885-8c90683fa6e0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80",
    mediaType: "tv" as const,
  };

  const trendingContent = [
    {
      id: "1",
      title: "The Witcher",
      posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.2,
      year: "2023",
      mediaType: "tv" as const,
    },
    {
      id: "2",
      title: "Dune",
      posterUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.7,
      year: "2023",
      mediaType: "movie" as const,
    },
    {
      id: "3",
      title: "Attack on Titan: Final Season",
      posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 9.2,
      year: "2023",
      mediaType: "anime" as const,
    },
    {
      id: "4",
      title: "The Last of Us",
      posterUrl: "https://images.unsplash.com/photo-1460881680858-30d872d5b530?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.9,
      year: "2023",
      mediaType: "tv" as const,
    },
    {
      id: "5",
      title: "Oppenheimer",
      posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.5,
      year: "2023",
      mediaType: "movie" as const,
    },
    {
      id: "6",
      title: "Jujutsu Kaisen",
      posterUrl: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.7,
      year: "2023",
      mediaType: "anime" as const,
    },
  ];

  const popularMovies = [
    {
      id: "7",
      title: "Guardians of the Galaxy Vol. 3",
      posterUrl: "https://images.unsplash.com/photo-1581795669633-91ef7c9699a8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.1,
      year: "2023",
      mediaType: "movie" as const,
    },
    {
      id: "8",
      title: "Spider-Man: Across the Spider-Verse",
      posterUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.8,
      year: "2023",
      mediaType: "movie" as const,
    },
    {
      id: "9",
      title: "John Wick: Chapter 4",
      posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 7.8,
      year: "2023",
      mediaType: "movie" as const,
    },
    {
      id: "10",
      title: "Mission: Impossible - Dead Reckoning",
      posterUrl: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 7.6,
      year: "2023",
      mediaType: "movie" as const,
    },
    {
      id: "11",
      title: "The Flash",
      posterUrl: "https://images.unsplash.com/photo-1512070679279-8988d32161be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 6.9,
      year: "2023",
      mediaType: "movie" as const,
    },
    {
      id: "12",
      title: "Fast X",
      posterUrl: "https://images.unsplash.com/photo-1618609378039-b572f64d54a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 5.9,
      year: "2023",
      mediaType: "movie" as const,
    },
  ];

  const topAnime = [
    {
      id: "13",
      title: "Demon Slayer: Kimetsu no Yaiba",
      posterUrl: "https://images.unsplash.com/photo-1624969862293-b749659a85f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.7,
      year: "2023",
      mediaType: "anime" as const,
    },
    {
      id: "14",
      title: "One Piece",
      posterUrl: "https://images.unsplash.com/photo-1612017071647-4175119130fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.9,
      year: "2023",
      mediaType: "anime" as const,
    },
    {
      id: "15",
      title: "My Hero Academia",
      posterUrl: "https://images.unsplash.com/photo-1587204714992-2c93c0dc2235?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.4,
      year: "2023",
      mediaType: "anime" as const,
    },
    {
      id: "16",
      title: "Chainsaw Man",
      posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.7,
      year: "2023",
      mediaType: "anime" as const,
    },
    {
      id: "17",
      title: "Spy x Family",
      posterUrl: "https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.6,
      year: "2023",
      mediaType: "anime" as const,
    },
    {
      id: "18",
      title: "Oshi no Ko",
      posterUrl: "https://images.unsplash.com/photo-1560467475-9463e53adabd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.8,
      year: "2023",
      mediaType: "anime" as const,
    },
  ];

  const popularTVSeries = [
    {
      id: "19",
      title: "The Last of Us",
      posterUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.9,
      year: "2023",
      mediaType: "tv" as const,
    },
    {
      id: "20",
      title: "House of the Dragon",
      posterUrl: "https://images.unsplash.com/photo-1607548964647-3dfd3f5b1f74?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.5,
      year: "2023",
      mediaType: "tv" as const,
    },
    {
      id: "21",
      title: "The Mandalorian",
      posterUrl: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.7,
      year: "2023",
      mediaType: "tv" as const,
    },
    {
      id: "22",
      title: "Wednesday",
      posterUrl: "https://images.unsplash.com/photo-1548366565-6bbab241282d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.1,
      year: "2023",
      mediaType: "tv" as const,
    },
    {
      id: "23",
      title: "Succession",
      posterUrl: "https://images.unsplash.com/photo-1542204637-e67bc7d41e48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.8,
      year: "2023",
      mediaType: "tv" as const,
    },
    {
      id: "24",
      title: "The Boys",
      posterUrl: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      rating: 8.7,
      year: "2023",
      mediaType: "tv" as const,
    },
  ];

  return (
    <MainLayout>
      <HeroBanner {...featuredContent} />
      
      <div className="py-4 md:py-8">
        <ContentSection
          title="Trending Now"
          items={trendingContent}
          viewMoreLink="/trending"
        />
        
        <ContentSection
          title="Popular Movies"
          items={popularMovies}
          viewMoreLink="/movies"
          className="mt-8"
        />
        
        <ContentSection
          title="Top Anime"
          items={topAnime}
          viewMoreLink="/anime"
          className="mt-8"
        />
        
        <ContentSection
          title="Popular TV Series"
          items={popularTVSeries}
          viewMoreLink="/tv-series"
          className="mt-8"
        />
      </div>
    </MainLayout>
  );
};

export default Index;
