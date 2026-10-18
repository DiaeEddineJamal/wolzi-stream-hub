param(
  [string]$FfmpegPath = "$env:LOCALAPPDATA\Programs\StremioService\ffmpeg.exe",
  [string]$Origin = 'http://127.0.0.1:8080'
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $FfmpegPath)) { throw 'Start Stremio Service and supply its FFmpeg path.' }
$mediaDirectory = Join-Path $PSScriptRoot 'media'
New-Item -ItemType Directory -Force -Path $mediaDirectory | Out-Null
$embeddedSubtitle=Join-Path $mediaDirectory 'embedded.srt'
[IO.File]::WriteAllText($embeddedSubtitle,"1`n00:00:00,000 --> 00:00:04,000`nEmbedded subtitle check`n`n2`n00:00:04,000 --> 00:00:08,000`nSecond caption`n`n3`n00:00:08,000 --> 00:00:12,000`nFinal caption`n")
$formats = @(
  @{Name='mkv'; Subtitles=$true; Codec=@('-c:v','libx265','-x265-params','pools=1:frame-threads=1:log-level=error','-c:a','ac3','-c:s','srt','-metadata:s:s:0','language=eng')},
  @{Name='avi'; Codec=@('-c:v','mpeg4','-c:a','libmp3lame')},
  @{Name='wmv'; Codec=@('-c:v','wmv2','-c:a','wmav2')},
  @{Name='mov'; Codec=@('-c:v','prores_ks','-profile:v','0','-c:a','pcm_s16le')},
  @{Name='webm'; Codec=@('-c:v','libvpx-vp9','-cpu-used','8','-c:a','libopus')}
)
function Read-Playlist($Response){
  if($Response.Content -is [byte[]]){return [Text.Encoding]::UTF8.GetString($Response.Content)}
  return [string]$Response.Content
}
foreach ($format in $formats) {
  $outputPath=Join-Path $mediaDirectory ('compatibility.'+$format.Name)
  $inputs=@('-f','lavfi','-i','testsrc2=size=320x180:rate=24','-f','lavfi','-i','sine=frequency=440:sample_rate=48000')
  if($format.Subtitles){$inputs+=@('-f','srt','-i',$embeddedSubtitle)}
  $ffmpegArguments=@('-hide_banner','-loglevel','error','-y')+$inputs+@('-t','12','-shortest')+$format.Codec+@('-threads','2',$outputPath)
  & $FfmpegPath @ffmpegArguments
  if($LASTEXITCODE -ne 0){throw "Failed to generate $($format.Name) sample"}
  $session='format-'+$format.Name+'-'+[Guid]::NewGuid().ToString('N')
  $mediaUrl="$Origin/tests/media/compatibility.$($format.Name)?run=$session"
  $url="$Origin/hlsv2/$session/master.m3u8?mediaURL=$([Uri]::EscapeDataString($mediaUrl))&videoCodecs=h264&audioCodecs=aac&maxAudioChannels=2&forceTranscoding=1"
  $timer=[Diagnostics.Stopwatch]::StartNew()
  $master=Invoke-WebRequest -Uri $url -TimeoutSec 30
  $masterText=Read-Playlist $master
  if($master.StatusCode -ne 200 -or $masterText -notmatch '#EXTM3U'){throw "No HLS master for $($format.Name)"}
  $videoPath=($masterText -split "`n" | Where-Object {$_ -and -not $_.StartsWith('#')} | Select-Object -First 1).Trim()
  $playlistUrl=[Uri]::new([Uri]$url,$videoPath)
  $playlist=Invoke-WebRequest -Uri $playlistUrl -TimeoutSec 30
  $playlistText=Read-Playlist $playlist
  $segment=($playlistText -split "`n" | Where-Object {$_ -and -not $_.StartsWith('#')} | Select-Object -First 1).Trim()
  $fragment=Invoke-WebRequest -Uri ([Uri]::new($playlistUrl,$segment)) -TimeoutSec 30
  if($fragment.StatusCode -ne 200 -or $fragment.RawContentLength -lt 100){throw "No video fragment for $($format.Name)"}
  $audioMatch=[regex]::Match($masterText,'TYPE=AUDIO[^\r\n]+URI="([^"]+)"')
  if(-not $audioMatch.Success){throw "No audio playlist for $($format.Name)"}
  $audioUrl=[Uri]::new([Uri]$url,$audioMatch.Groups[1].Value)
  $audio=Invoke-WebRequest -Uri $audioUrl -TimeoutSec 30
  $audioPath=((Read-Playlist $audio) -split "`n" | Where-Object {$_ -and -not $_.StartsWith('#')} | Select-Object -First 1).Trim()
  $audioFragment=Invoke-WebRequest -Uri ([Uri]::new($audioUrl,$audioPath)) -TimeoutSec 30
  if($audioFragment.StatusCode -ne 200 -or $audioFragment.RawContentLength -lt 100){throw "No audio fragment for $($format.Name)"}
  $subtitleBytes=0
  if($format.Subtitles){
    $subtitleMatch=[regex]::Match($masterText,'TYPE=SUBTITLES[^\r\n]+URI="([^"]+)"')
    if(-not $subtitleMatch.Success){throw 'Embedded subtitles are missing from the master playlist'}
    $subtitleUrl=[Uri]::new([Uri]$url,$subtitleMatch.Groups[1].Value)
    $subtitles=Invoke-WebRequest -Uri $subtitleUrl -TimeoutSec 30
    $subtitlePath=((Read-Playlist $subtitles) -split "`n" | Where-Object {$_ -and -not $_.StartsWith('#')} | Select-Object -First 1).Trim()
    $captions=Invoke-WebRequest -Uri ([Uri]::new($subtitleUrl,$subtitlePath)) -TimeoutSec 30
    if((Read-Playlist $captions) -notmatch 'WEBVTT'){throw 'Embedded caption conversion failed'}
    $subtitleBytes=$captions.RawContentLength
  }
  $timer.Stop()
  [PSCustomObject]@{Format=$format.Name; HlsStatus=$master.StatusCode; FragmentBytes=$fragment.RawContentLength; AudioBytes=$audioFragment.RawContentLength; SubtitleBytes=$subtitleBytes; Seconds=[math]::Round($timer.Elapsed.TotalSeconds,2)}
}
