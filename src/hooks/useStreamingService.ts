import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export const LOCAL_SERVICE='http://127.0.0.1:11470';
const localPreview=()=>['127.0.0.1','localhost','[::1]'].includes(window.location.hostname);

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
  return {service:saved==='off'?undefined:usable||detected.data||undefined,saved,setSaved,recheck,checking:detected.isFetching};
}
