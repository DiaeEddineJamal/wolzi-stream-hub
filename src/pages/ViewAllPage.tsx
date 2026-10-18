import { useState } from 'react';
import { GridPageSkeleton } from '@/components/primitives/Skeletons';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/layouts/MainLayout';
import CatalogCards from '@/components/home/CatalogCards';
import { Button } from '@/components/ui/button';
import { useArtworkTheme } from '@/hooks/useArtworkTheme';
import type { MediaItem } from '@/lib/media';
export type { MediaItem } from '@/lib/media';
interface Props {title:string;fetchDataFunction:(page:number)=>Promise<{items:(MediaItem & {overview?:string})[];totalPages:number;totalResults:number;hasMore?:boolean}>}
export default function ViewAllPage({title,fetchDataFunction}:Props){return <Results key={title} title={title} fetchDataFunction={fetchDataFunction}/>;}
function Results({title,fetchDataFunction}:Props){
  const [page,setPage]=useState(1);
  const result=useQuery({queryKey:['view-all',title,page],queryFn:()=>fetchDataFunction(page)});
  const theme=useArtworkTheme(result.data?.items?.[0]?.backdropUrl);
  return <MainLayout theme={theme}><div className="page-shell"><header className="catalog-header"><div><p className="eyebrow">KEEP EXPLORING</p><h1>{title}</h1><p>{result.data?.totalResults?.toLocaleString() || 'A world of'} titles to discover.</p></div></header>
    {result.isPending?<GridPageSkeleton count={18}/>:result.isError?<div className="empty-state"><h2>The catalog couldn’t load.</h2><Button onClick={()=>result.refetch()}>Try again</Button></div>:<>
      {result.data.items.length?<CatalogCards items={result.data.items}/>:<div className="empty-state"><h2>No titles this time.</h2><p>Try another search or category.</p></div>}
      <div className="flex justify-center items-center gap-5 py-6"><Button variant="secondary" disabled={page===1} onClick={()=>{setPage(p=>p-1);window.scrollTo(0,0);}}>Previous</Button><span className="text-xs text-muted-foreground">Page {page} of {Math.max(1,Math.min(500,result.data.totalPages))}</span><Button variant="secondary" disabled={page>=Math.min(500,result.data.totalPages)} onClick={()=>{setPage(p=>p+1);window.scrollTo(0,0);}}>Next</Button></div>
    </>}
  </div></MainLayout>;
}
