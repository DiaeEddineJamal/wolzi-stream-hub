// Layout-matched placeholders: they reuse the real rail/card/grid classes so nothing shifts when content arrives.
const Bar=({className=''}:{className?:string})=><span className={'sk '+className}/>;

export function RailSkeleton({landscape=true,count=6}:{landscape?:boolean;count?:number}){
  return <section className="content-section" aria-hidden="true">
    <header className="section-heading page-shell"><div><Bar className="sk-eyebrow"/><Bar className="sk-heading"/></div></header>
    <div className={'media-rail sk-rail'+(landscape?'':' poster-rail')}>{Array.from({length:count},(_,i)=><article key={i} className={'max-card'+(landscape?' max-card-landscape':'')}><div className="max-card-art sk"/><Bar className="sk-caption"/></article>)}</div>
  </section>;
}

export function GridSkeleton({count=12}:{count?:number}){
  return <div className="catalog-grid sk-grid" aria-hidden="true">{Array.from({length:count},(_,i)=><article key={i} className="max-card"><div className="max-card-art sk"/><Bar className="sk-caption"/><Bar className="sk-caption sk-short"/></article>)}</div>;
}

// Hero copy block shared by the home/catalog hero and the title detail page.
function StoryCopy({poster}:{poster?:boolean}){
  return <div className="sk-story page-shell">
    {poster&&<span className="sk sk-poster"/>}
    <div className="sk-story-copy"><Bar className="sk-eyebrow"/><Bar className="sk-title"/><Bar className="sk-meta"/><Bar className="sk-line"/><Bar className="sk-line sk-short"/><div className="sk-actions"><Bar className="sk-button"/><Bar className="sk-circle"/><Bar className="sk-circle"/></div></div>
  </div>;
}

export function HeroSkeleton(){
  return <div className="sk-page" role="status" aria-label="Loading"><div className="sk-hero"><StoryCopy poster/></div></div>;
}

export function DetailSkeleton(){
  return <div className="sk-page" role="status" aria-label="Loading"><div className="sk-hero sk-detail"><StoryCopy/></div><RailSkeleton/></div>;
}

export function GridPageSkeleton({count}:{count?:number}){
  return <div role="status" aria-label="Loading"><GridSkeleton count={count}/></div>;
}
