import { defineConfig, loadEnv, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { createSourceResolver } from './server/source-resolver';
import { subtitleRoute } from './server/subtitles';

// Same-origin relay to the user's running Stremio Service; no public open proxy.
const serviceTarget = process.env.STREMIO_SERVICE_URL || 'http://127.0.0.1:11470';
const serviceProxy = {
  '/streaming-service': { target: serviceTarget, changeOrigin: false, rewrite: (url: string) => url.replace(/^\/streaming-service/, '') },
  '/hlsv2': { target: serviceTarget, changeOrigin: false },
};
const localServiceGuard = (server: {middlewares:ViteDevServer['middlewares']}):void => { server.middlewares.use((req, res, next) => {
  if (/^\/(streaming-service|hlsv2|api\/playback)(\/|$)/.test(req.url || '') &&
      (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`))) {
    res.statusCode=403;res.end('This local service is available only to A&D MAX on this origin.');return;
  }
  next();
}); };

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env=loadEnv(mode,process.cwd(),'');
  const resolveSources=createSourceResolver(env.TMDB_API_KEY||env.VITE_TMDB_API_KEY);
  const sourceRoutes=(server:{middlewares:ViteDevServer['middlewares']})=>{
    server.middlewares.use('/api/playback/subtitles',(req,res)=>{void subtitleRoute(req,res);});
    server.middlewares.use('/api/playback/sources',(req,res)=>{void resolveSources(req,res).catch(()=>{if(!res.headersSent)res.writeHead(500);res.end();});});
  };
  return {
  server: {
    proxy: serviceProxy,
    host: "127.0.0.1",
    port: 8080,
    hmr: {
      // Configure HMR to work properly with iframes
      clientPort: 8080,
      // Increase timeout to prevent frequent reconnection attempts
      timeout: 5000,
      // Add overlay to show HMR connection status
      overlay: true
    },
    // Properly handle iframes and CORS
    cors: false,
  },
  preview: { host: '127.0.0.1', proxy: serviceProxy },
  plugins: [
    {name:'local-service-guard',configureServer:localServiceGuard,configurePreviewServer:localServiceGuard},
    {name:'playback-source-resolver',configureServer:sourceRoutes,configurePreviewServer:sourceRoutes},
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    modulePreload: {
      polyfill: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          vendor: ['axios']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (name && /\.css$/i.test(name)) return 'assets/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
};});
