import React, { useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import EmbedTester from '@/components/testing/EmbedTester';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Info, Check, AlertTriangle } from 'lucide-react';

const EmbedTest: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [movieList, setMovieList] = useState<any[]>([]);
  const [tvList, setTvList] = useState<any[]>([]);

  const fetchList = async (type: 'movie' | 'tv') => {
    setApiStatus('loading');
    try {
      const response = await fetch(`https://embed.su/list/${type}.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} list: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (type === 'movie') {
        setMovieList(data.slice(0, 20)); // Just show first 20 for performance
      } else {
        setTvList(data.slice(0, 20)); // Just show first 20 for performance
      }
      
      setApiStatus('success');
    } catch (error) {
      console.error(`Error fetching ${type} list:`, error);
      setApiStatus('error');
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Embed.su API Tester</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Embed Tester</h2>
            <p className="text-wolzi-light-gray mb-4">
              Test embedding videos directly from Embed.su using the official API.
            </p>
            <EmbedTester />
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">API Status Checker</h2>
            <p className="text-wolzi-light-gray mb-4">
              Verify that the Embed.su API is working correctly by fetching available content lists.
            </p>
            
            <div className="flex gap-2 mb-4">
              <Button onClick={() => fetchList('movie')} variant="default">
                Fetch Movies List
              </Button>
              <Button onClick={() => fetchList('tv')} variant="outline">
                Fetch TV Shows List
              </Button>
            </div>
            
            {apiStatus === 'loading' && (
              <div className="flex items-center p-3 bg-wolzi-dark-gray/50 rounded-md mb-4">
                <div className="w-5 h-5 border-2 border-wolzi-accent border-t-transparent rounded-full animate-spin mr-3"></div>
                <span>Loading data from Embed.su API...</span>
              </div>
            )}
            
            {apiStatus === 'success' && (
              <div className="flex items-center p-3 bg-green-500/10 text-green-400 rounded-md mb-4">
                <Check className="w-5 h-5 mr-3" />
                <span>Successfully connected to Embed.su API</span>
              </div>
            )}
            
            {apiStatus === 'error' && (
              <div className="flex items-center p-3 bg-red-500/10 text-red-400 rounded-md mb-4">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <span>Failed to connect to Embed.su API</span>
              </div>
            )}
            
            {(movieList.length > 0 || tvList.length > 0) && (
              <Tabs defaultValue="movies" className="mt-4">
                <TabsList>
                  <TabsTrigger value="movies" disabled={movieList.length === 0}>Movies</TabsTrigger>
                  <TabsTrigger value="tv" disabled={tvList.length === 0}>TV Shows</TabsTrigger>
                </TabsList>
                
                <TabsContent value="movies">
                  <div className="h-80 overflow-y-auto mt-2 border border-wolzi-border rounded-md p-3">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-wolzi-dark-gray/80 backdrop-blur-sm">
                        <tr>
                          <th className="text-left p-2">TMDB ID</th>
                          <th className="text-left p-2">Title</th>
                          <th className="text-left p-2">Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movieList.map((movie, index) => (
                          <tr key={index} className="border-t border-wolzi-border">
                            <td className="p-2">{movie.id}</td>
                            <td className="p-2">{movie.title}</td>
                            <td className="p-2">{movie.year || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="tv">
                  <div className="h-80 overflow-y-auto mt-2 border border-wolzi-border rounded-md p-3">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-wolzi-dark-gray/80 backdrop-blur-sm">
                        <tr>
                          <th className="text-left p-2">TMDB ID</th>
                          <th className="text-left p-2">Title</th>
                          <th className="text-left p-2">Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tvList.map((show, index) => (
                          <tr key={index} className="border-t border-wolzi-border">
                            <td className="p-2">{show.id}</td>
                            <td className="p-2">{show.title}</td>
                            <td className="p-2">{show.year || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </Card>
        </div>
        
        <div className="mt-8">
          <Card className="p-6">
            <div className="flex items-start">
              <Info className="w-5 h-5 mr-3 text-wolzi-accent mt-0.5" />
              <div>
                <h3 className="font-bold">API Documentation Reference</h3>
                <p className="text-wolzi-light-gray mt-1">
                  <strong>Movie Embed URL:</strong> https://embed.su/embed/movie/{tmdb_id}
                </p>
                <p className="text-wolzi-light-gray">
                  <strong>TV Show Embed URL:</strong> https://embed.su/embed/tv/{tmdb_id}/{season_number}/{episode_number}
                </p>
                <p className="text-wolzi-light-gray">
                  <strong>List Endpoints:</strong> https://embed.su/list/movie.json and https://embed.su/list/tv.json
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default EmbedTest; 