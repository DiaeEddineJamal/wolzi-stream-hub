import { Link } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
const faqs=[
 ['How do I start watching?','Browse Discover, Movies, Series, or Anime. Open a title for its details, then select Watch now. On the watch page, choose a source. For a series you can change seasons and episodes there.'],
 ['How does My List work?','Use the plus on a title to save it. My List stays in this browser and is available without an account. Clearing browser storage also clears this list.'],
 ['How do I connect a Stremio add-on?','Open Add-ons and paste a trusted HTTPS manifest.json address or stremio:// link. The add-on must support browser requests (CORS). Enable or remove it from the same page. Configuration is stored in this browser.'],
 ['Why does an add-on need another player?','Some add-ons return torrents, non-HTTPS videos, custom proxy headers, or formats your browser cannot decode. Those need a compatible streaming service or Stremio’s desktop app. Direct HTTPS video sources can play inside A&D MAX.'],
 ['A video won’t play. What can I do?','Sources are checked in parallel for the title you open. The player automatically moves on after an error or a prolonged stall. You can also choose a different source or retry discovery. Availability still depends on the provider, connection, and region.'],
 ['Where are subtitles and quality settings?','Use the video controls for volume, fullscreen, and available WebVTT subtitles. Source filters help you choose a quality; HLS can adapt to the connection. Connect Stremio Service for conversion of formats your browser cannot decode.'],
 ['Can I resume or play the next episode?','Direct streams save resume position on this device. Signed-in users can also save account watch history. Enable next-episode playback in the watch page settings.'],
 ['What are the keyboard shortcuts?','Focus the video player. Space or K plays and pauses, left and right seek ten seconds, M toggles mute, and F requests fullscreen.'],
 ['Why are embedded players unavailable?','Third-party player pages can open advertisements when you press play. A&D MAX uses direct video instead and does not load those embedded pages or advertising scripts. External providers open only when you explicitly follow their link.'],
];
export default function Help(){return <MainLayout><div className="page-shell help-page"><header className="catalog-header"><div><p className="eyebrow">A LITTLE GUIDANCE</p><h1>Let’s keep the story going.</h1><p>Answers to the things you might be wondering.</p></div></header><Accordion type="single" collapsible className="max-w-3xl">{faqs.map(([q,a],i)=><AccordionItem key={q} value={String(i)}><AccordionTrigger className="py-6 text-left text-base font-medium">{q}</AccordionTrigger><AccordionContent className="max-w-2xl pb-7 text-sm leading-8 text-muted-foreground">{a}</AccordionContent></AccordionItem>)}</Accordion><div className="my-10 text-sm text-muted-foreground">Still need a hand? <Link className="ml-2 text-white underline" to="/contact">Get in touch</Link></div></div></MainLayout>;}

