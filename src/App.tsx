import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import MediaDetail from "./pages/MediaDetail";
import Movies from "./pages/Movies";
import TVSeries from "./pages/TVSeries";
import Anime from "./pages/Anime";
import WatchHistory from "./pages/WatchHistory";
import SearchResults from "./pages/SearchResults";
import Watch from "./pages/Watch";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv-series" element={<TVSeries />} />
            <Route path="/anime" element={<Anime />} />
            
            {/* Media detail routes */}
            <Route path="/movie/:id" element={<MediaDetail />} />
            <Route path="/tv/:id" element={<MediaDetail />} />
            <Route path="/anime/:id" element={<MediaDetail />} />
            <Route path="/tv/:id/season/:seasonNumber/episode/:episodeNumber" element={<MediaDetail />} />
            
            {/* Watch routes */}
            <Route path="/watch/movie/:id" element={<Watch />} />
            <Route path="/watch/tv/:id/season/:seasonNumber/episode/:episodeNumber" element={<Watch />} />
            <Route path="/watch/anime/:id/episode/:episodeNumber" element={<Watch />} />
            
            {/* Protected routes */}
            <Route path="/watch-history" element={
              <ProtectedRoute>
                <WatchHistory />
              </ProtectedRoute>
            } />
            
            {/* Search */}
            <Route path="/search" element={<SearchResults />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
