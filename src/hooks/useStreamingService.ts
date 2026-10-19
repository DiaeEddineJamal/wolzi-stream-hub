import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export const LOCAL_SERVICE='http://127.0.0.1:11470';
const localPreview=()=>typeof window!=='undefined'&&['127.0.0.1','localhost','[::1]'].includes(window.location.hostname);
export const openServiceSetup=()=>typeof window!=='undefined'&&window.dispatchEvent(new Event('admax-service-setup'));

export interface ServiceInstaller {
  platform:'windows'|'mac'|'linux'|'mobile';
  label:string;
  url:string;
  filename:string;
}
export function getServiceInstaller(ua=typeof navigator!=='undefined'?navigator.userAgent:''):ServiceInstaller{
  if(/Android|iPhone|iPad|iPod/i.test(ua))return {platform:'mobile',label:'Get Stremio App',url:'https://www.stremio.com/downloads',filename:''};
  if(/Mac/i.test(ua))return {platform:'mac',label:'Download for macOS (.dmg)',url:'https://dl.strem.io/stremio-service/v0.1.21/StremioService.dmg',filename:'StremioService.dmg'};
  if(/Linux/i.test(ua))return {platform:'linux',label:'Download for Linux (.deb)',url:'https://dl.strem.io/stremio-service/v0.1.21/stremio-service_amd64.deb',filename:'stremio-service_amd64.deb'};
  return {platform:'windows',label:'Download Installer for Windows (.exe)',url:'https://dl.strem.io/stremio-service/v0.1.19/StremioServiceSetup.exe',filename:'StremioServiceSetup.exe'};
}

// Stremio Service only sends CORS headers to stremio.com origins, so reachability is checked with an opaque request.
export async function serviceReachable(base:string){
  try{
    if(base.startsWith('/')){const response=await fetch(base+'/settings',{signal:AbortSignal.timeout(4000)});return response.ok&&/json/.test(response.headers.get('content-type')||'');}
    await fetch(base+'/settings',{mode:'no-cors',credentials:'omit',signal:AbortSignal.timeout(4000)});return true;
  }catch{return false;}
}

// Saved choice first ('off' disables); otherwise the service on this computer, like web.stremio.com.
export function useStreamingService(){
  const [saved,setSaved]=useLocalStorage<string>('admax-streaming-service','');
  const queryClient=useQueryClient();
  const usable=typeof saved==='string'&&saved&&saved!=='off'&&!(saved.startsWith('/')&&!localPreview())?saved:'';
  const detected=useQuery({queryKey:['streaming-service'],enabled:!usable&&saved!=='off',staleTime:30000,retry:1,refetchInterval:q=>q.state.data?false:10000,refetchOnWindowFocus:true,queryFn:async()=>{
    for(const base of localPreview()?['/streaming-service',LOCAL_SERVICE]:[LOCAL_SERVICE])if(await serviceReachable(base))return base;
    return null;
  }});
  const recheck=()=>queryClient.invalidateQueries({queryKey:['streaming-service']});
  return {service:saved==='off'?undefined:usable||detected.data||undefined,saved,setSaved,recheck,checking:detected.isFetching,detectedOnce:detected.isFetched};
}
