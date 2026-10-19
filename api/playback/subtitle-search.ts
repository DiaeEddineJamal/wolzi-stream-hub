import { createSubtitleSearch } from '../../server/subtitle-search.js';
import { sameOriginPlayback } from '../../server/playback-origin.js';
export default sameOriginPlayback(createSubtitleSearch());
