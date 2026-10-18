import { subtitleRoute } from '../../server/subtitles.js';
import { sameOriginPlayback } from '../../server/playback-origin.js';
export default sameOriginPlayback(subtitleRoute);
