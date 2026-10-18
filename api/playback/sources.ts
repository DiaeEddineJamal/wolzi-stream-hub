import { createSourceResolver } from '../../server/source-resolver.js';
import { sameOriginPlayback } from '../../server/playback-origin.js';
const resolveSources=createSourceResolver(process.env.TMDB_API_KEY||process.env.VITE_TMDB_API_KEY);
export default sameOriginPlayback(resolveSources);
