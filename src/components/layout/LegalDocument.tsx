import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { useSEO } from '@/hooks/useSEO';
import { HookSidebar } from '@/components/ui/hook-sidebar';
export default function LegalDocument({title,intro,sections}:{title:string;intro:string;sections:{title:string;body:ReactNode}[]}){
  useSEO({title:title+' — A&D MAX',description:intro});
  const [active,setActive]=useState(0);
  useEffect(()=>{
    const elements=Array.from(document.querySelectorAll<HTMLElement>('.policy-section'));
    const update=()=>{
      let index=0;
      elements.forEach((element,i)=>{if(element.getBoundingClientRect().top<=170)index=i;});
      if(window.scrollY>0&&window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-2)index=elements.length-1;
      setActive(index);
    };
    update();
    window.addEventListener('scroll',update,{passive:true});
    return()=>window.removeEventListener('scroll',update);
  },[title]);
  return <MainLayout><div className="page-shell policy-page"><header className="catalog-header"><div><p className="eyebrow">A LITTLE CLARITY</p><h1>{title}</h1><p>{intro}</p></div><span className="policy-date">Updated October 18, 2026</span></header><nav className="policy-tabs" aria-label="Legal information"><NavLink to="/privacy">Privacy</NavLink><NavLink to="/terms">Terms</NavLink><NavLink to="/legal">Legal & attribution</NavLink></nav><div className="policy-layout"><div>{sections.map((section,index)=><section className="policy-section" id={'section-'+(index+1)} key={section.title}><span className="policy-number">{String(index+1).padStart(2,'0')}</span><h2>{section.title}</h2><div>{section.body}</div></section>)}</div><aside className="policy-contents"><HookSidebar label="Contents" items={sections.map((section,index)=>({label:section.title,href:'#section-'+(index+1)}))} value={active} onChange={setActive}/><Link className="policy-contact" to="/contact">Get in touch ↗</Link></aside></div></div></MainLayout>;
}
