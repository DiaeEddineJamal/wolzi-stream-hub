import { mediaProxyRoute } from '../../server/media-proxy.js';
import { sameOriginPlayback } from '../../server/playback-origin.js';
export default sameOriginPlayback(mediaProxyRoute);
