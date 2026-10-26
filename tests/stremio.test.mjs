import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const require=createRequire(import.meta.url);
async function load(file){
  const result=await build({entryPoints:[file],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'},tsconfig:'tsconfig.app.json',define:{'import.meta.env':'{}'},logLevel:'silent'});
  const module={exports:{}};
  new Function('require','module','exports',result.outputFiles[0].text)(require,module,module.exports);
  return module.exports;
}
const {sameOriginPlayback}=await load('server/playback-origin.ts');
for(const [headers,expected] of [[{host:'a-d-max.vercel.app',origin:'https://a-d-max.vercel.app'},200],[{host:'a-d-max.vercel.app',origin:'https://unrelated.example'},403],[{host:'a-d-max.vercel.app','sec-fetch-site':'cross-site'},403],[{host:'a-d-max.vercel.app',origin:'invalid'},403]]){
  const response={status:200,writeHead(status){this.status=status;return this;},end(){}};
  let called=false;
  await sameOriginPlayback(async()=>{called=true;})({headers},response);
  assert.equal(response.status,expected);
  assert.equal(called,expected===200);
}
const api=await load('src/integrations/api/stremio.ts');
const {watchPath,toMediaItem}=await load('src/lib/media.ts');
const resolver=await load('server/source-resolver.ts');
const subtitles=await load('src/lib/subtitles.ts');
const artwork=await load('src/lib/artwork.ts');
const captions=await load('src/lib/captions.ts');
const audioTracks=await load('src/lib/audio-tracks.ts');
const mobilePlayer=await load('src/lib/mobile-player.ts');
const touchBuffer=mobilePlayer.playbackBufferConfig(true),desktopBuffer=mobilePlayer.playbackBufferConfig(false);
assert.equal(touchBuffer.maxBufferLength,30);
assert.equal(touchBuffer.maxMaxBufferLength,60);
assert.ok(touchBuffer.maxBufferSize<desktopBuffer.maxBufferSize);
assert.ok(touchBuffer.backBufferLength<desktopBuffer.backBufferLength);
const fullscreenTestDocument=globalThis.document;
globalThis.document={fullscreenElement:null};
try{
  let nativeEntries=0,nativeExits=0;
  const nativeVideo={webkitDisplayingFullscreen:false,webkitEnterFullscreen(){nativeEntries++;this.webkitDisplayingFullscreen=true;},webkitExitFullscreen(){nativeExits++;this.webkitDisplayingFullscreen=false;}};
  const rejectingStage={requestFullscreen:async()=>{throw new Error('Not supported');}};
  await mobilePlayer.togglePlayerFullscreen(rejectingStage,nativeVideo);
  assert.equal(nativeEntries,1);
  assert.equal(mobilePlayer.isPlayerFullscreen(rejectingStage,nativeVideo),true);
  await mobilePlayer.togglePlayerFullscreen(rejectingStage,nativeVideo);
  assert.equal(nativeExits,1);
  await mobilePlayer.togglePlayerFullscreen({},nativeVideo);
  assert.equal(nativeEntries,2);
  await assert.rejects(()=>mobilePlayer.togglePlayerFullscreen({},null),/unavailable/);
  let standardEntries=0;
  await mobilePlayer.togglePlayerFullscreen({requestFullscreen:async()=>{standardEntries++;}},null);
  assert.equal(standardEntries,1);
}finally{globalThis.document=fullscreenTestDocument;}
assert.equal(audioTracks.audioOption(0,'jpn','Japanese','ja').label,'Japanese · Original');
assert.equal(audioTracks.audioOption(1,'eng','stream_5','ja','','2').label,'English · Stereo · Dub');
assert.equal(audioTracks.audioOption(2,'en','Commentary','ja').label,'English · Commentary');
assert.equal(audioTracks.audioOption(3,'und','','ja').label,'Audio track 4');
assert.equal(audioTracks.audioOption(0,'en','English','','','6').label,'English · 5.1 surround');
const nativeDubTracks=[{enabled:true},{enabled:false}];
audioTracks.enableNativeAudio(nativeDubTracks,1);
assert.deepEqual(nativeDubTracks.map(track=>track.enabled),[false,true]);
assert.throws(()=>audioTracks.enableNativeAudio(nativeDubTracks,5),/no longer available/);
assert.deepEqual(nativeDubTracks.map(track=>track.enabled),[false,true]);
const unsupportedDub=[{enabled:true},{get enabled(){return false;},set enabled(value){}}];
assert.throws(()=>audioTracks.enableNativeAudio(unsupportedDub,1),/could not switch/);
assert.equal(unsupportedDub[0].enabled,true);
const progress=await load('src/lib/watch-progress.ts');
const watched={content_id:'123',content_type:'tv',title:'A story',poster_path:null,progress:120,duration:1000,progress_percent:12,season:1,episode:1,watched_at:'2026-10-18T12:00:00Z'};
assert.equal(progress.resumeSeconds(watched),120);
assert.equal(progress.resumeSeconds({...watched,progress:990}),0);
assert.equal(progress.validProgress({...watched,duration:Infinity}),false);
assert.equal(progress.mergeProgress([watched],[{...watched,progress:240,watched_at:'2026-10-18T12:01:00Z'}])[0].progress,240);
assert.equal(progress.continueWatching([watched,{...watched,episode:2,progress:990,watched_at:'2026-10-18T12:01:00Z'}]).length,0);
assert.equal(progress.continueWatching([watched,{...watched,content_id:'456'}]).length,2);
const {default:TrailerPlayer}=await load('src/components/watch/TrailerPlayer.tsx');
const {createElement}=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
for(const videoId of ['javascript:alert(1)','invalid','https://youtube.com/watch?v=123']){
  const markup=renderToStaticMarkup(createElement(TrailerPlayer,{videoId,title:'Test trailer'}));
  assert.match(markup,/This trailer can’t play here/);
  assert.doesNotMatch(markup,/<iframe/);
}
const {default:PlayerControls}=await load('src/components/watch/PlayerControls.tsx');
const previousDocument=globalThis.document;
globalThis.document={pictureInPictureEnabled:false};
try {
  const playerProps={media:null,engine:null,container:{current:null},title:'Test',sourceName:'Test source',onUpload:async()=>{},converted:false};
  const buffering=renderToStaticMarkup(createElement(PlayerControls,{...playerProps,loading:true}));
  const ready=renderToStaticMarkup(createElement(PlayerControls,{...playerProps,loading:false}));
  assert.doesNotMatch(buffering,/class="cinema-center-play"/);
  assert.match(ready,/class="cinema-center-play"/);
  assert.match(buffering,/aria-label="Play"/); // Bottom play remains available for a browser gesture.
} finally {
  if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
}
const {HookSidebar}=await load('src/components/ui/hook-sidebar.tsx');
const {StaticRouter}=require('react-router-dom/server');
const sidebar=renderToStaticMarkup(createElement(StaticRouter,null,createElement(HookSidebar,{label:'Contents',items:[{label:'Account',href:'#section-1'},{label:'Progress',href:'#section-2'}],value:1})));
assert.match(sidebar,/href="#section-2" aria-current="location"/);
assert.match(sidebar,/data-slot="hook-sidebar"/);
const manifest=api.manifestSchema.parse({id:'test',name:'Test',version:'1.0.0',types:['movie','series'],resources:[{name:'stream',types:['movie'],idPrefixes:['tt']},'catalog'],catalogs:[]});
assert.equal(api.metaSchema.parse({id:'series',type:'series',name:'Demo',videos:[{id:'series:1:2',thumbnail:'https://example.com/episode.jpg'}]}).videos[0].thumbnail,'https://example.com/episode.jpg');
assert.equal(api.normalizeManifestUrl('stremio://example.com/config/manifest.json'),'https://example.com/config/manifest.json');
assert.equal(api.normalizeManifestUrl('https://example.com/config/'),'https://example.com/config/manifest.json');
for(const url of ['javascript:alert(1)','http://example.com','https://user:password@example.com/manifest.json','https://example.com/manifest.json?token=secret'])assert.throws(()=>api.normalizeManifestUrl(url));
assert.equal(api.supportsResource(manifest,'stream','movie','tt123'),true);
assert.equal(api.supportsResource(manifest,'stream','series','tt123:1:2'),false);
assert.equal(api.supportsResource(manifest,'stream','movie','custom:123'),false);
assert.equal(api.resourceUrl('https://example.com/config/manifest.json','stream','series','tt123:2:4'),'https://example.com/config/stream/series/tt123%3A2%3A4.json');
assert.equal(api.resourceUrl('https://example.com/manifest.json','catalog','movie','list',{search:'A & B'}),'https://example.com/catalog/movie/list/search=A%20%26%20B.json');
assert.equal(api.classifyStream({url:'https://example.com/video.mp4'},'1','Test').kind,'video');
assert.equal(api.classifyStream({url:'https://example.com/video.mp4'},'1','Test','/streaming-service').service,'/streaming-service');
assert.equal(api.classifyStream({url:'https://example.com/video.mp4',infoHash:'a'.repeat(40)},'1','Test').url,'https://example.com/video.mp4');
assert.equal(api.classifyStream({url:'javascript:alert(1)'},'1','Test').kind,'unsupported');
assert.equal(api.classifyStream({externalUrl:'https://example.com/watch'},'1','Test').kind,'external');
assert.equal(api.classifyStream({externalUrl:'data:text/html,hello'},'1','Test').kind,'unsupported');
assert.equal(api.classifyStream({infoHash:'a'.repeat(40)},'1','Test').kind,'unsupported');
assert.equal(api.classifyStream({url:'https://example.com/video',behaviorHints:{notWebReady:true}},'1','Test').kind,'unsupported');
assert.equal(api.classifyStream({url:'https://example.com/video',subtitles:[{url:'javascript:alert(1)',lang:'en'}]},'1','Test').subtitles.length,0);
assert.equal(api.classifyStream({url:'https://example.com/video',subtitles:[{id:'arabic-release',url:'https://example.com/ar.srt',lang:'ar'}]},'1','Test').subtitles[0].id,'arabic-release');
assert.equal(api.serviceStreamUrl({infoHash:'A'.repeat(40)},'https://service.example'),`https://service.example/${'a'.repeat(40)}/-1`);
assert.equal(api.serviceStreamUrl({infoHash:'a'.repeat(40),fileIdx:2},'http://127.0.0.1:11470'),`http://127.0.0.1:11470/${'a'.repeat(40)}/2`);
assert.throws(()=>api.serviceStreamUrl({infoHash:'../../settings'},'https://service.example'));
assert.throws(()=>api.normalizeServiceUrl('http://remote.example:11470'));
assert.throws(()=>api.normalizeServiceUrl('https://user:pass@service.example'));
assert.equal(api.classifyStream({infoHash:'a'.repeat(40)},'1','Test','https://service.example').kind,'video');
assert.equal(api.serviceStreamUrl({infoHash:'a'.repeat(40),fileIdx:0},'/streaming-service'),`/streaming-service/${'a'.repeat(40)}/0`);
assert.equal(api.hlsPlaybackUrl('/streaming-service/video/0','/streaming-service','session','http://127.0.0.1:8080').startsWith('/hlsv2/session/master.m3u8?mediaURL=http%3A%2F%2F127.0.0.1%3A8080%2Fstreaming-service%2Fvideo%2F0'),true);
const proxy=api.serviceStreamUrl({url:'https://video.example/a.mp4?token=a',behaviorHints:{proxyHeaders:{request:{Referer:'https://example.com'}}}},'https://service.example');
assert.ok(proxy.startsWith('https://service.example/proxy/d=https%3A%2F%2Fvideo.example&h=Referer%3Ahttps%3A%2F%2Fexample.com/a.mp4?token=a'));
assert.equal(watchPath('tv','123',2,4),'/watch/tv/123/2/4');
assert.equal(watchPath('anime','456',3,8),'/watch/anime/456/8?season=3');
assert.equal(toMediaItem({id:1,name:'Anime',first_air_date:'2026-01-01'},'anime').mediaType,'anime');
assert.equal(api.isNativeVideoUrl('https://cdn.example/video.mp4'),true);
assert.equal(api.isNativeVideoUrl('/streaming-service/video/0'),true);
assert.equal(api.isNativeVideoUrl('http://untrusted.example/video.mp4'),false);
assert.equal(api.isNativeVideoUrl('javascript:alert(1)'),false);
assert.equal(api.isNativeVideoUrl('//untrusted.example/video.mp4'),false);
assert.equal(api.classifyStream({infoHash:'a'.repeat(40)},'1','Test','/streaming-service').needsConversion,true);
assert.equal(api.classifyStream({url:'https://example.com/video.mkv'},'1','Test','/streaming-service').needsConversion,true);
for(const ip of ['127.0.0.1','10.0.0.2','192.168.1.1','172.16.0.2','169.254.169.254','100.64.0.1','::1','::ffff:127.0.0.1','fd00::1'])assert.equal(resolver.isPublicAddress(ip),false,ip);
assert.equal(resolver.isPublicAddress('1.1.1.1'),true);
assert.equal(resolver.isPublicAddress('2606:4700:4700::1111'),true);
const sample=(text,type='application/octet-stream')=>({text,type,bytes:new TextEncoder().encode(text)});
assert.equal(resolver.isMediaSample(sample('<html>Click here to watch an ad</html>','video/mp4')),false);
assert.equal(resolver.isMediaSample(sample('{"url":"https://example.com/video"}','application/json')),false);
assert.equal(resolver.isMediaSample(sample('#EXTM3U\n#EXTINF:4,\nsegment.ts')),true);
assert.equal(resolver.isMediaSample(sample('0000ftypisom000000000000000000')),true);
assert.equal(resolver.isMediaSample(sample('')),false);
assert.equal(subtitles.toWebVTT('1\r\n00:00:01,250 --> 00:00:03,500\r\nHello'),'WEBVTT\n\n1\n00:00:01.250 --> 00:00:03.500\nHello\n');
assert.equal(subtitles.toWebVTT('WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nHello').startsWith('WEBVTT'),true);
assert.match(subtitles.toWebVTT('[Events]\nDialogue: 0,0:00:01.20,0:00:03.40,Default,,0,0,0,,Hello\\Nworld'),/00:00:01.200 --> 00:00:03.400\nHello\nworld/);
assert.throws(()=>subtitles.toWebVTT('<html>Not a subtitle</html>'));
assert.equal(subtitles.subtitleLanguage('eng'),'English');
assert.equal(subtitles.subtitleLanguage('und'),'Unknown language');
assert.equal(subtitles.subtitleUrl('https://example.com/en.srt'),'/api/playback/subtitles?url=https%3A%2F%2Fexample.com%2Fen.srt');
assert.equal(subtitles.subtitleUrl('blob:test'),'blob:test');
assert.equal(subtitles.normalizeLangCode('ara'),'ar');
assert.equal(subtitles.normalizeLangCode('ar_SA'),'ar');
assert.equal(subtitles.decodeSubtitle(new TextEncoder().encode('العربية')),'العربية');
assert.equal(subtitles.decodeSubtitle(Uint8Array.from([0xc7,0xe1,0xda,0xd1,0xc8,0xed,0xc9])),'العربية');
assert.equal(subtitles.decodeSubtitle(Uint8Array.from([0xff,0xfe,0x27,0x06,0x44,0x06])),'ال');
assert.equal(subtitles.decodeSubtitle(Uint8Array.from([0xe9]),'text/plain; charset=windows-1252'),'é');
const releaseTracks=Array.from({length:7},(_,i)=>({url:`https://example.com/${i}.srt`,lang:'ar',release:i===6?'Movie.2025.1080p.WEB-DL.GROUP':'Movie.2025.720p.BluRay.OTHER'}));
const ranked=subtitles.rankSubtitleTracks(releaseTracks,'Movie.2025.1080p.WEB-DL.GROUP');
assert.equal(ranked.length,7); // Keep alternatives beyond the former three-track limit.
assert.equal(ranked[0],releaseTracks[6]);
assert.deepEqual(subtitles.rankSubtitleTracks(releaseTracks),releaseTracks);
const videoHints={filename:'Example.S02E03.1080p.WEB-DL-GROUP.mkv',videoHash:'1234567890abcdef',videoSize:123456789};
const hintedStream=api.classifyStream(api.streamSchema.parse({url:'https://example.com/movie.mp4',behaviorHints:videoHints}),'hinted','Test');
assert.equal(hintedStream.filename,videoHints.filename);
assert.deepEqual(subtitles.subtitleVideoExtras(hintedStream),{filename:videoHints.filename,videoHash:videoHints.videoHash,videoSize:'123456789'});
assert.deepEqual(subtitles.subtitleVideoExtras({videoHash:'not-a-hash',videoSize:-1}),{});
assert.match(api.resourceUrl('https://example.com/manifest.json','subtitles','series','tt123:2:3',subtitles.subtitleVideoExtras(hintedStream)),/filename=Example.S02E03.1080p.WEB-DL-GROUP.mkv&videoHash=1234567890abcdef&videoSize=123456789/);
const versions=[
  {url:'wrong-cut',lang:'en',release:'Example.S02E03.1080p.BluRay-OTHER.mkv'},
  {url:'right-release',lang:'en',release:'Example.S02E03.720p.WEB-DL-GROUP.srt'},
  {url:'wrong-episode',lang:'en',release:'Example.S02E04.1080p.WEB-DL-GROUP.srt'},
];
assert.equal(subtitles.rankSubtitleTracks(versions,videoHints.filename)[0].url,'right-release');
assert.equal(subtitles.rankSubtitleTracks(versions,videoHints.filename).at(-1).url,'wrong-episode');
assert.equal(subtitles.subtitleMatchesEpisode(versions[1],'tt123:2:3'),true);
assert.equal(subtitles.subtitleMatchesEpisode(versions[2],'tt123:2:3'),false);
assert.equal(subtitles.subtitleMatchesEpisode({url:'unknown',lang:'en'},'tt123:2:3'),true);
assert.equal(subtitles.subtitleMatchesEpisode(versions[2],'tt123'),true);
assert.equal(captions.hlsSubtitleOffset({type:'main',sn:4,start:6,elementaryStreams:{video:{startPTS:10}}}),4);
assert.equal(captions.hlsSubtitleOffset({type:'main',sn:5,start:12,elementaryStreams:{video:{startPTS:13.5}}}),1.5);
assert.equal(captions.hlsSubtitleOffset({type:'main',sn:6,start:18,elementaryStreams:{audio:{startPTS:20}}}),2);
assert.equal(captions.hlsSubtitleOffset({type:'subtitle',sn:4,start:6,elementaryStreams:{video:{startPTS:10}}}),undefined);
assert.equal(captions.hlsSubtitleOffset({type:'main',sn:'initSegment',start:0,elementaryStreams:{}}),undefined);
assert.equal(captions.hlsSubtitleOffset({type:'main',sn:4,start:0,elementaryStreams:{video:{startPTS:NaN}}}),undefined);
const arrivingTracks=[{language:'eng',mode:'showing'}];
assert.equal(subtitles.preferredSubtitleIndex(arrivingTracks,'ar'),0);
arrivingTracks.push({language:'ara',mode:'disabled'});
assert.equal(subtitles.preferredSubtitleIndex(arrivingTracks,'ar'),1); // Late Arabic replaces the automatic English fallback.
assert.equal(subtitles.preferredSubtitleIndex(arrivingTracks,'off'),-1);
assert.match(artwork.artworkSet('https://image.tmdb.org/t/p/w500/test.jpg','poster'),/w780\/test.jpg 780w/);
assert.equal(artwork.artworkSet('https://example.com/poster.jpg'),undefined);
assert.equal(artwork.paletteFromPixels([180,30,20,255])['--scene-color'],'#161616');
assert.equal(artwork.paletteFromPixels([180,30,20,255])['--scene-glow'],'rgb(108 18 12)');
assert.deepEqual(captions.captionPreferences(null),captions.defaultCaptions);
assert.deepEqual(captions.captionPreferences({size:999,color:'url(javascript:test)',delay:-100,position:0,autoSync:'yes'}),{size:200,color:'#ffffff',delay:-30,position:10,autoSync:true});
assert.equal(captions.captionPreferences({autoSync:false}).autoSync,false);
assert.deepEqual(captions.captionTimes(10,12,1,1.5),{start:16,end:19});
assert.equal(captions.captionPreferences({size:NaN,delay:Infinity}).size,100);
assert.deepEqual(captions.captionTimes(1,3,-2),{start:0,end:1});
assert.deepEqual(captions.captionTimes(1,3,1.5),{start:2.5,end:4.5});
const cueTiming=new WeakMap(),timedCue={startTime:10,endTime:12};
captions.applyCaptionTiming(timedCue,1.5,cueTiming);
captions.applyCaptionTiming(timedCue,1.5,cueTiming);
assert.deepEqual(timedCue,{startTime:11.5,endTime:13.5}); // Repeated updates never accumulate delay.
captions.applyCaptionTiming(timedCue,-2,cueTiming);
assert.deepEqual(timedCue,{startTime:8,endTime:10});
captions.applyCaptionTiming(timedCue,0,cueTiming);
assert.deepEqual(timedCue,{startTime:10,endTime:12});
timedCue.startTime=40;timedCue.endTime=42; // Playback engine corrects its timeline after a discontinuity.
captions.applyCaptionTiming(timedCue,1.5,cueTiming);
assert.deepEqual(timedCue,{startTime:41.5,endTime:43.5});
captions.applyCaptionTiming(timedCue,0,cueTiming);
assert.deepEqual(timedCue,{startTime:40,endTime:42});
const untouchedCue={startTime:7,endTime:9};
captions.applyCaptionTiming(untouchedCue,0,cueTiming);
assert.equal(cueTiming.has(untouchedCue),false); // Unadjusted native cues remain owned by HLS.
assert.equal(captions.nextEpisodeDue(100,89.9),false);
assert.equal(captions.nextEpisodeDue(100,90),true);
assert.equal(captions.nextEpisodeDue(200,179.9),false);
assert.equal(captions.nextEpisodeDue(200,180),true);
assert.equal(captions.nextEpisodeDue(100,100,true),true);
assert.equal(captions.nextEpisodeProgress(200,180,false,5,true),0);
assert.equal(captions.nextEpisodeProgress(200,200,true,5,true),.8);
assert.equal(captions.nextEpisodeProgress(200,200,true,0,true),1);
assert.equal(captions.nextEpisodeProgress(200,190,false,5,false),.5);
assert.equal(captions.nextEpisodeProgress(0,0,false,5,true),0);
const overlappingCaptions=[{mode:'showing'},{mode:'showing'},{mode:'disabled'}];
captions.activateCaptionTrack(overlappingCaptions,1);
assert.deepEqual(overlappingCaptions.map(track=>track.mode),['disabled','showing','disabled']);
captions.activateCaptionTrack(overlappingCaptions,-1);
assert.equal(overlappingCaptions.filter(track=>track.mode==='showing').length,0);
const previousFetch=globalThis.fetch;
const calls=[];
try{
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({streams:[{url:'https://example.com/test.mp4'}]}));};
  const streams=await api.addonStreams({manifest,transportUrl:'https://example.com/config/manifest.json',enabled:true},'movie','tt123');
  assert.equal(streams.length,1);assert.equal(streams[0].kind,'video');
  assert.equal(calls[0].options.credentials,'omit');assert.equal(calls[0].options.referrerPolicy,'no-referrer');
  const count=calls.length;
  await api.addonStreams({manifest,transportUrl:'https://example.com/manifest.json',enabled:false},'movie','tt123');
  assert.equal(calls.length,count);
  globalThis.fetch=async()=>new Response('unavailable',{status:503});
  await assert.rejects(()=>api.requestJson('https://example.com/manifest.json'),/503/);
  globalThis.fetch=async()=>new Response(JSON.stringify({streams:'invalid'}));
  await assert.rejects(()=>api.addonStreams({manifest,transportUrl:'https://example.com/manifest.json',enabled:true},'movie','tt123'));
  globalThis.fetch=async(url,{signal})=>{if(signal.aborted)throw new DOMException('Aborted','AbortError');};
  const controller=new AbortController();controller.abort();
  await assert.rejects(()=>api.requestJson('https://example.com',controller.signal),/Aborted/);
}finally{globalThis.fetch=previousFetch;}
const mediaProxy=await load('server/media-proxy.ts');
const rewritten=mediaProxy.rewritePlaylist('#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n#EXTINF:6,\nseg/1.ts\n','https://cdn.example/hls/index.m3u8',{Referer:'https://site.example/'});
assert.match(rewritten,/URI="\/api\/playback\/media\/key\.bin\?u=https%3A%2F%2Fcdn\.example%2Fhls%2Fkey\.bin&h=Referer%3Ahttps/);
assert.match(rewritten,/\n\/api\/playback\/media\/1\.ts\?u=https%3A%2F%2Fcdn\.example%2Fhls%2Fseg%2F1\.ts&h=/);
assert.equal(api.isNativeVideoUrl(rewritten.split('\n').at(-2)),true);
{
  // Segments on a host the browser can reach go direct; keys and variant playlists stay relayed.
  const media='#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n#EXT-X-MAP:URI="init.mp4"\n#EXTINF:6,\nseg/1.ts\n#EXTINF:6,\nhttps://other.example/2.ts\n';
  const direct=mediaProxy.rewritePlaylist(media,'https://cdn.example/hls/index.m3u8',{Referer:'https://site.example/'},{directHost:'cdn.example'});
  assert.match(direct,/\nhttps:\/\/cdn\.example\/hls\/seg\/1\.ts\n/);
  assert.match(direct,/#EXT-X-MAP:URI="https:\/\/cdn\.example\/hls\/init\.mp4"/);
  assert.match(direct,/URI="\/api\/playback\/media\/key\.bin\?/);
  assert.match(direct,/\n\/api\/playback\/media\/2\.ts\?u=https%3A%2F%2Fother\.example/);
  const master=mediaProxy.rewritePlaylist('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\nlow/index.m3u8\n','https://cdn.example/master.m3u8',{},{full:true});
  assert.match(master,/\n\/api\/playback\/media\/index\.m3u8\?u=https%3A%2F%2Fcdn\.example%2Flow%2Findex\.m3u8&full=1/);
  const realFetch=globalThis.fetch;let calls=0;
  globalThis.fetch=async(_url,init)=>{calls++;return {status:206,headers:new Headers({'access-control-allow-origin':init.headers.Origin||''}),body:null};};
  try{
    assert.equal(await mediaProxy.directlyReachable(new URL('https://cors.example/a.ts'),'https://a-d-max.vercel.app',true),true);
    assert.equal(await mediaProxy.directlyReachable(new URL('https://cors.example/b.ts'),'https://a-d-max.vercel.app',true),true);
    assert.equal(calls,1,'host results are cached');
    globalThis.fetch=async()=>({status:403,headers:new Headers(),body:null});
    assert.equal(await mediaProxy.directlyReachable(new URL('https://blocked.example/a.ts'),'https://a-d-max.vercel.app',false),false);
  }finally{globalThis.fetch=realFetch;}
}
assert.equal(api.classifyStream({url:'https://cdn.example/a.m3u8',behaviorHints:{proxyHeaders:{request:{Referer:'https://site.example/'}}}},'x','Add-on').url,'/api/playback/media/a.m3u8?u=https%3A%2F%2Fcdn.example%2Fa.m3u8&h=Referer%3Ahttps%3A%2F%2Fsite.example%2F');
const {matchesQualityFilter}=await load('src/components/watch/SourcePicker.tsx');
assert.equal(matchesQualityFilter('Torrentio 4K UHD 2160p','4k'),true);
assert.equal(matchesQualityFilter('Torrentio 1080p BluRay','1080'),true);
assert.equal(matchesQualityFilter('Torrentio 720p WEB-DL','720'),true);
assert.equal(matchesQualityFilter('Provider · 480p','480'),true);
assert.equal(matchesQualityFilter('Provider · 360p','360'),true);
assert.equal(matchesQualityFilter('Provider · 360p','4k'),false);
const candidates=resolver.selectCandidates([{url:'https://cdn.example/2160.m3u8',quality:'4K'},{url:'https://cdn.example/1080a.m3u8',quality:'1080p'},{url:'https://cdn.example/1080b.m3u8',quality:'1080p'},{url:'https://cdn.example/720.m3u8',quality:'720p'},{url:'https://cdn.example/480.m3u8',quality:'480p'},{url:'https://cdn.example/360.m3u8',quality:'360p'}]);
assert.equal(candidates.some(c=>c.quality==='480p'),true);
assert.equal(candidates.some(c=>c.quality==='360p'),true);
const {clampCropOffset}=await load('src/pages/Profile.tsx');
assert.deepEqual(clampCropOffset({x:500,y:-500},{w:800,h:400},1,240),{x:120,y:0});
assert.deepEqual(clampCropOffset({x:0,y:0},{w:400,h:400},1,240),{x:0,y:0});
const {getServiceInstaller}=await load('src/hooks/useStreamingService.ts');
assert.equal(getServiceInstaller('Mozilla/5.0 (Windows NT 10.0; Win64; x64)').platform,'windows');
assert.match(getServiceInstaller('Mozilla/5.0 (Windows NT 10.0; Win64; x64)').url,/StremioServiceSetup\.exe$/);
assert.equal(getServiceInstaller('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)').platform,'mac');
assert.equal(getServiceInstaller('Mozilla/5.0 (X11; Linux x86_64)').platform,'linux');
assert.equal(getServiceInstaller('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)').platform,'mobile');
assert.equal(api.mediaProxyUrl('https://moon.zenoak.top/vd/SUVjbE',{'Referer':'https://www.movy.bz/'},true),'/api/playback/media/SUVjbE.m3u8?u=https%3A%2F%2Fmoon.zenoak.top%2Fvd%2FSUVjbE&h=Referer%3Ahttps%3A%2F%2Fwww.movy.bz%2F');
assert.equal(api.classifyStream({url:'https://moon.zenoak.top/vd/SUVjbE',behaviorHints:{isHls:true,proxyHeaders:{request:{Referer:'https://www.movy.bz/'}}}},'1','Movy','http://127.0.0.1:11470').url,'/api/playback/media/SUVjbE.m3u8?u=https%3A%2F%2Fmoon.zenoak.top%2Fvd%2FSUVjbE&h=Referer%3Ahttps%3A%2F%2Fwww.movy.bz%2F');
assert.equal(resolver.isMediaSample(sample('0000moof000000000000000000')),true);
const disguisedTs=new Uint8Array(600);disguisedTs[0]=0x89;disguisedTs[68]=0x47;disguisedTs[68+188]=0x47;disguisedTs[68+376]=0x47;
assert.equal(resolver.isMediaSample({text:'PNG...',type:'image/png',bytes:disguisedTs}),true);
assert.equal(resolver.mergeProviderHeaders('https://api.movenerds.space/api/proxy/master.m3u8',{key:'movenerds',label:'MoverNerds',cdnHeaders:[{pattern:/movenerds\.space/i,headers:{Referer:'https://movenerds.space/',Origin:'https://movenerds.space'}}]},undefined,{Referer:'https://player.vidzee.wtf/'}).Origin,'https://movenerds.space');
assert.equal(subtitles.subtitleFlagUrl('eng'),'https://flagcdn.com/w40/us.png');
assert.equal(subtitles.subtitleFlagUrl('ara'),'https://flagcdn.com/w40/sa.png');
assert.equal(subtitles.subtitleCodeBadge('fre'),'FR');
assert.equal(matchesQualityFilter('Movy · Miami','1080',true),true);
assert.equal(matchesQualityFilter('Movy · Miami','480',true),true);
const {STREAMING_PLATFORMS}=await load('src/pages/Index.tsx');
assert.equal(STREAMING_PLATFORMS.some(p=>p.name==='Netflix'&&p.logo==='/providers/netflix.png'),true);
assert.equal(STREAMING_PLATFORMS.some(p=>p.name==='HBO Max'&&p.logo==='/providers/max.png'),true);
const sync=await load('src/lib/subtitle-sync.ts');
assert.deepEqual(sync.parseVttCues('WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.500\nHi\n\n2\n00:01:00.000 --> 00:01:02.000\n[door slams]\n\n00:02.000 --> 00:03.000\n<i>Yes</i>').map(c=>[c.start,c.end]),[[1,2.5],[2,3]]);
{
  let seed=7;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647,gauss=()=>Math.sqrt(-2*Math.log(rand()+1e-12))*Math.cos(2*Math.PI*rand());
  const script=()=>{const cues=[];let t=5;while(t<4000){const len=1+rand()*3;cues.push({start:t,end:t+len});t+=len+.3+rand()*(rand()<.15?20:3);}return cues;};
  const hear=(cues,offset,scale,from,to)=>{const timeline=new sync.SpeechTimeline(),shown=cues.map(c=>({start:c.start*scale+offset,end:c.end*scale+offset}));for(let t=from;t<to;t+=.05){const speaking=shown.some(c=>t>=c.start+.2*gauss()&&t<c.end-.3+.2*gauss())&&rand()<.85;timeline.record(t,speaking?-38+5*gauss():-62+4*gauss());}return timeline;};
  const cues=script();
  const late=sync.estimateAlignment(cues,hear(cues,2.3,1,0,180));
  assert.ok(late&&Math.abs(late.offset-2.3)<=.2&&late.scale===1,'detects a constant subtitle delay');
  const early=sync.estimateAlignment(cues,hear(cues,-7.8,1,600,780));
  assert.ok(early&&Math.abs(early.offset+7.8)<=.2,'detects subtitles that appear before the audio');
  const pal=sync.estimateAlignment(cues,hear(cues,1,25/23.976,0,1800));
  assert.ok(pal&&Math.abs(pal.scale-25/23.976)<1e-9&&Math.abs(pal.offset-1)<=.3,'corrects PAL frame-rate drift');
  assert.equal(sync.estimateAlignment(script(),hear(cues,0,1,0,300)),undefined,'never aligns an unrelated release');
  assert.equal(sync.estimateAlignment(cues,hear(cues,0,1,0,40)),undefined,'waits for enough dialogue');
}
assert.equal(subtitles.stripSubtitleAds('WEBVTT\n\n1\n00:00:00.130 --> 00:00:05.320\nDo you want subtitles for any video?\n\n2\n00:00:07.000 --> 00:00:09.000\nHello\n'),'WEBVTT\n\n2\n00:00:07.000 --> 00:00:09.000\nHello\n');
console.log('Stremio protocol, source verification, service conversion, trust boundaries, routing, and recovery checks passed.');

const {createSubtitleSearch}=await load('server/subtitle-search.ts');
const subtitleResponse=()=>({status:0,body:'',writeHead(status){this.status=status;return this;},end(body){this.body=body;}});
{
  // Without a Wyzie key, the keyless OpenSubtitles.org search still answers.
  const realFetch=globalThis.fetch;let calledUrl;
  globalThis.fetch=async url=>{calledUrl=String(url);return {ok:true,json:async()=>[
    {IDSubtitleFile:'7',SubFormat:'srt',SubEncoding:'CP1256',ISO639:'ar',SubHearingImpaired:'0',SubDownloadsCnt:'12',MovieReleaseName:'Show.S01E01.WEB-DL-GRP',SubFileName:'Show.S01E01.ar.srt',SubDownloadLink:'https://dl.opensubtitles.org/en/download/src-api/vrf-1/filead/7.gz'},
    {IDSubtitleFile:'8',SubFormat:'srt',ISO639:'en',SubDownloadLink:'https://evil.example/8.gz'},
  ]};};
  try{
    const noKey=subtitleResponse();
    await createSubtitleSearch('')({method:'GET',url:'/?id=tt0944947:1:1&language=ar'},noKey);
    assert.equal(calledUrl,'https://rest.opensubtitles.org/search/episode-1/imdbid-0944947/season-1/sublanguageid-ara');
    const body=JSON.parse(noKey.body);
    assert.equal(body.configured,true);
    assert.deepEqual(body.subtitles.map(track=>[track.id,track.lang,track.url]),[['osorg:7','ar','https://dl.opensubtitles.org/en/download/src-api/vrf-1/file/7.gz#charset=CP1256']]);
    assert.match(body.subtitles[0].release,/WEB-DL-GRP/);
  }finally{globalThis.fetch=realFetch;}
}
const badId=subtitleResponse();
await createSubtitleSearch('test')({method:'GET',url:'/?id=https://private.example'},badId);
assert.equal(badId.status,400);
const realFetch=globalThis.fetch;
try {
  let calledUrl;
  globalThis.fetch=async url=>{calledUrl=new URL(url);return {ok:true,json:async()=>[
    {language:'en',url:'https://sub.wyzie.io/c/test?tok=scoped',source:'charlie',release:'Release A'},
    {language:'en',url:'https://untrusted.example/subtitle.srt'},
  ]};};
  const found=subtitleResponse();
  await createSubtitleSearch('server-only-secret')({method:'GET',url:'/?id=tt0944947:2:3'},found);
  assert.equal(calledUrl.searchParams.get('season'),'2');
  assert.equal(calledUrl.searchParams.get('episode'),'3');
  assert.equal(calledUrl.searchParams.get('source'),'all');
  assert.equal(calledUrl.searchParams.has('limit'),false);
  const result=JSON.parse(found.body);
  assert.equal(result.subtitles.length,1);
  assert.match(result.subtitles[0].url,/to=vtt/);
  assert.doesNotMatch(found.body,/server-only-secret/);
  globalThis.fetch=async url=>{calledUrl=new URL(url);return {ok:true,json:async()=>[
    ...Array.from({length:205},(_,i)=>({id:i,language:'en',url:`https://sub.wyzie.io/c/${i}?tok=scoped`})),
    {id:'arabic',language:'ar',url:'https://sub.wyzie.io/c/arabic?tok=scoped',source:'lima',release:'Movie.WEB-DL',releases:['Movie.GROUP'],fileName:'Movie.ar.srt'},
  ]};};
  const arabic=subtitleResponse();
  await createSubtitleSearch('server-only-secret')({method:'GET',url:'/?id=1399:2:3&language=ar'},arabic);
  assert.equal(calledUrl.searchParams.get('id'),'1399');
  assert.equal(calledUrl.searchParams.get('language'),'ar');
  assert.equal(calledUrl.searchParams.get('season'),'2');
  const arabicTrack=JSON.parse(arabic.body).subtitles.find(track=>track.lang==='ar');
  assert.equal(arabicTrack.id,'lima:arabic');
  assert.match(arabicTrack.release,/Movie.GROUP/);
  assert.doesNotMatch(arabic.body,/server-only-secret/);
  assert.equal(arabicTrack.source,'lima');
  globalThis.fetch=async()=>({ok:false,status:400,json:async()=>({message:'No subtitles found'})});
  const empty=subtitleResponse();await createSubtitleSearch('secret')({method:'GET',url:'/?id=tt123'},empty);
  assert.equal(empty.status,200);assert.deepEqual(JSON.parse(empty.body),{subtitles:[],configured:true});
  globalThis.fetch=async()=>({ok:false,status:429});
  const limited=subtitleResponse();await createSubtitleSearch('secret')({method:'GET',url:'/?id=tt123'},limited);
  assert.equal(limited.status,502);assert.doesNotMatch(limited.body,/secret/);
}finally{globalThis.fetch=realFetch;}

const {matchesTrendingFilters}=await load('src/lib/catalog-filters.ts');
const trendingBase={mediaType:'all',genre:'all',year:'all',minRating:'all'};
const trendingMovie={media_type:'movie',genre_ids:[28,16],original_language:'ja',release_date:'2026-02-03',vote_average:8.2};
assert.equal(matchesTrendingFilters(trendingMovie,trendingBase),true);
assert.equal(matchesTrendingFilters({...trendingMovie,media_type:'person'},trendingBase),false);
assert.equal(matchesTrendingFilters(trendingMovie,{...trendingBase,mediaType:'tv'}),false);
assert.equal(matchesTrendingFilters(trendingMovie,{...trendingBase,mediaType:'anime'}),true);
assert.equal(matchesTrendingFilters({...trendingMovie,original_language:'en'},{...trendingBase,mediaType:'anime'}),false);
assert.equal(matchesTrendingFilters(trendingMovie,{...trendingBase,year:'2026',genre:'28',minRating:'8'}),true);
assert.equal(matchesTrendingFilters(trendingMovie,{...trendingBase,year:'2010s'}),false);
assert.equal(matchesTrendingFilters(trendingMovie,{...trendingBase,genre:'18'}),false);
assert.equal(matchesTrendingFilters({...trendingMovie,release_date:''},{...trendingBase,year:'2026'}),false);

assert.equal(matchesTrendingFilters({...trendingMovie,media_type:'tv',genre_ids:[10759]},{...trendingBase,genre:'28'}),true);
