import { Link } from 'react-router-dom';
import { ArrowUpRight, CircleHelp, MessageSquare } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
export default function Contact(){
  const contact=import.meta.env.VITE_SUPPORT_EMAIL;
  return <MainLayout><div className="page-shell"><header className="catalog-header"><div><p className="eyebrow">WE’RE LISTENING</p><h1>A conversation starts here.</h1><p>Questions, ideas, or a little help with your next watch.</p></div></header><div className="contact-grid"><section className="settings-panel"><CircleHelp size={25}/><h2>Need a hand?</h2><p>Find help with playback, add-ons, subtitles, and your account.</p><Button variant="secondary" asChild><Link to="/help">Visit the help center <ArrowUpRight size={16}/></Link></Button></section><section className="settings-panel"><MessageSquare size={25}/><h2>Something on your mind?</h2><p>{contact?'Send your question or feedback to the support team. Please don’t include passwords or private add-on configuration links.':'A support inbox has not been connected yet. In the meantime, the help center covers common playback and account questions.'}</p>{contact&&<Button variant="secondary" asChild><a href={'mailto:'+contact}>Email support <ArrowUpRight size={16}/></a></Button>}</section></div></div></MainLayout>;
}
