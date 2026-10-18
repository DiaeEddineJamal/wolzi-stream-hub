import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { streamingSources, getStreamingUrl } from '@/integrations/api/streamingSources';
import { testStreamingSource, createStreamingSources, SourceTestResult } from '@/utils/sourceTestUtils';

interface TestResult {
  sourceId: string;
  sourceName: string;
  movieUrl: string;
  tvUrl: string;
  animeUrl: string;
  movieWorking: boolean | null;
  tvWorking: boolean | null;
  animeWorking: boolean | null;
  isLoading: boolean;
  error?: string;
}

const SourceTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  // Sample IDs for testing
  const sampleMovieId = '550'; // Fight Club (TMDB ID)
  const sampleTvId = '1399'; // Game of Thrones (TMDB ID)
  const sampleAnimeId = '16498'; // Attack on Titan (TMDB ID)

  useEffect(() => {
    initializeTestResults();
  }, []);

  const initializeTestResults = () => {
    const results: TestResult[] = streamingSources.map(source => {
      const movieUrl = getStreamingUrl('movie', sampleMovieId, source);
      const tvUrl = getStreamingUrl('tv', sampleTvId, source, 1, 1);
      const animeUrl = getStreamingUrl('anime', sampleAnimeId, source, 1, 1);

      return {
        sourceId: source.id,
        sourceName: source.name,
        movieUrl,
        tvUrl,
        animeUrl,
        movieWorking: null,
        tvWorking: null,
        animeWorking: null,
        isLoading: false
      };
    });

    setTestResults(results);
  };

  const testSingleSource = async (sourceId: string, mediaType: 'movie' | 'tv' | 'anime') => {
    setTestResults(prev => prev.map(result => 
      result.sourceId === sourceId 
        ? { ...result, isLoading: true, error: undefined }
        : result
    ));

    try {
      const source = streamingSources.find(s => s.id === sourceId);
      if (!source) throw new Error('Source not found');

      let url: string;
      switch (mediaType) {
        case 'movie':
          url = getStreamingUrl('movie', sampleMovieId, source);
          break;
        case 'tv':
          url = getStreamingUrl('tv', sampleTvId, source, 1, 1);
          break;
        case 'anime':
          url = getStreamingUrl('anime', sampleAnimeId, source, 1, 1);
          break;
      }

      // Create a test source object
      const testSource = {
        id: sourceId,
        name: source.name,
        url,
        quality: source.quality
      };

      const result = await testStreamingSource(testSource, mediaType, '8000');
      
      setTestResults(prev => prev.map(testResult => 
        testResult.sourceId === sourceId 
          ? { 
              ...testResult, 
              [`${mediaType}Working`]: result.isWorking,
              isLoading: false,
              error: result.error
            }
          : testResult
      ));
    } catch (error) {
      setTestResults(prev => prev.map(result => 
        result.sourceId === sourceId 
          ? { 
              ...result, 
              [`${mediaType}Working`]: false,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : result
      ));
    }
  };

  const testAllSources = async () => {
    setIsTestingAll(true);
    setTestProgress(0);
    
    const totalTests = streamingSources.length * 3; // 3 media types per source
    let completedTests = 0;

    for (const source of streamingSources) {
      // Test movie
      await testSingleSource(source.id, 'movie');
      completedTests++;
      setTestProgress((completedTests / totalTests) * 100);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));

      // Test TV
      await testSingleSource(source.id, 'tv');
      completedTests++;
      setTestProgress((completedTests / totalTests) * 100);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Test anime
      await testSingleSource(source.id, 'anime');
      completedTests++;
      setTestProgress((completedTests / totalTests) * 100);

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsTestingAll(false);
  };

  const getStatusIcon = (working: boolean | null, isLoading: boolean) => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    if (working === null) return <div className="w-4 h-4 bg-neutral-300 rounded-full" />;
    if (working) return <CheckCircle className="w-4 h-4 text-wolzi-accent" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusColor = (working: boolean | null) => {
    if (working === null) return 'bg-neutral-100';
    if (working) return 'bg-wolzi-accent/10 border-wolzi-accent/30';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--wolzi-bg))] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Streaming Sources Test Dashboard
          </h1>
          <p className="text-neutral-300 mb-6">
            Test all {streamingSources.length} streaming sources across movies, TV shows, and anime
          </p>
          
          <div className="flex justify-center gap-4 mb-6">
            <Button 
              onClick={testAllSources}
              disabled={isTestingAll}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isTestingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing... {Math.round(testProgress)}%
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Test All Sources
                </>
              )}
            </Button>
            
            <Button 
              onClick={initializeTestResults}
              variant="outline"
              className="border-neutral-600 text-neutral-300 hover:bg-neutral-800"
            >
              Reset Results
            </Button>
          </div>

          {isTestingAll && (
            <div className="w-full max-w-md mx-auto bg-neutral-800 rounded-full h-2 mb-6">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${testProgress}%` }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testResults.map((result) => (
            <motion.div
              key={result.sourceId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${getStatusColor(
                result.movieWorking && result.tvWorking && result.animeWorking
              )} border rounded-lg p-4 backdrop-blur-sm bg-white/10`}
            >
              <Card className="bg-transparent border-none shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="truncate">{result.sourceName}</span>
                    <Badge variant="secondary" className="ml-2">
                      {streamingSources.find(s => s.id === result.sourceId)?.quality || 'HD'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Movie Test */}
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <span className="text-neutral-300 text-sm">Movie</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.movieWorking, result.isLoading)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => testSingleSource(result.sourceId, 'movie')}
                        disabled={result.isLoading}
                        className="text-xs text-neutral-400 hover:text-white"
                      >
                        Test
                      </Button>
                    </div>
                  </div>

                  {/* TV Test */}
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <span className="text-neutral-300 text-sm">TV Show</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.tvWorking, result.isLoading)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => testSingleSource(result.sourceId, 'tv')}
                        disabled={result.isLoading}
                        className="text-xs text-neutral-400 hover:text-white"
                      >
                        Test
                      </Button>
                    </div>
                  </div>

                  {/* Anime Test */}
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <span className="text-neutral-300 text-sm">Anime</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.animeWorking, result.isLoading)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => testSingleSource(result.sourceId, 'anime')}
                        disabled={result.isLoading}
                        className="text-xs text-neutral-400 hover:text-white"
                      >
                        Test
                      </Button>
                    </div>
                  </div>

                  {result.error && (
                    <div className="text-xs text-red-400 mt-2 p-2 bg-red-900/20 rounded">
                      {result.error}
                    </div>
                  )}

                  {/* URLs for debugging */}
                  <details className="text-xs">
                    <summary className="text-neutral-400 cursor-pointer hover:text-white">
                      View URLs
                    </summary>
                    <div className="mt-2 space-y-1 text-neutral-500">
                      <div className="break-all">Movie: {result.movieUrl}</div>
                      <div className="break-all">TV: {result.tvUrl}</div>
                      <div className="break-all">Anime: {result.animeUrl}</div>
                    </div>
                  </details>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="text-neutral-400 text-sm">
            Total Sources: {streamingSources.length} | 
            Working: {testResults.filter(r => r.movieWorking || r.tvWorking || r.animeWorking).length} | 
            Failed: {testResults.filter(r => r.movieWorking === false && r.tvWorking === false && r.animeWorking === false).length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceTest;