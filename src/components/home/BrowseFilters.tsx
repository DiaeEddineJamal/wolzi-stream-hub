import { useState } from 'react';
import { ArrowDownWideNarrow, Check, SlidersHorizontal, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface BrowseOption { value:string; label:string }
export interface BrowseField { id:string; label:string; value:string; options:BrowseOption[]; onChange:(value:string)=>void; defaultValue?:string }
interface Props {
  title:string;genre:string;genres:{id:string;label:string}[];onGenreChange:(value:string)=>void;
  fields:BrowseField[];sort:BrowseField;groups?:BrowseField[];onReset:()=>void;
}
export default function BrowseFilters({title,genre,genres,onGenreChange,fields,sort,groups=[],onReset}:Props){
  const [open,setOpen]=useState(false),[sortOpen,setSortOpen]=useState(false);
  const active=fields.filter(field=>field.value!==(field.defaultValue||'all'));
  const selectedGenre=genres.find(item=>item.id===genre);
  const sortLabel=sort.options.find(option=>option.value===sort.value)?.label;
  const count=active.length+(genre!=='all'?1:0);
  const sorted=sort.value!==(sort.defaultValue||'default');
  const primaryChanged=groups.some(group=>group.value!==(group.defaultValue||group.options[0]?.value));
  return <section className="browse-filters" aria-label={`${title} filters`}>
    <div className="browse-filter-toolbar">
      <div className="browse-primary-groups">
        {groups.length?groups.map(group=><div className="browse-segment" key={group.id} role="group" aria-label={group.label}>
          {group.options.map(option=><button key={option.value} type="button" aria-pressed={group.value===option.value} onClick={()=>group.onChange(option.value)}>{option.label}</button>)}
        </div>):<div className="browse-filter-intro"><span>YOUR NEXT GREAT WATCH</span><h2>Explore {title.toLowerCase()}</h2></div>}
      </div>
      <div className="browse-filter-actions">
        <Popover open={sortOpen} onOpenChange={setSortOpen}>
          <PopoverTrigger asChild><button type="button" className="browse-action browse-sort-trigger" aria-label={`Sort: ${sortLabel}`}><ArrowDownWideNarrow size={16}/><span>{sortLabel}</span></button></PopoverTrigger>
          <PopoverContent role="menu" aria-label="Sort titles" className="browse-sort-menu" align="end" sideOffset={8} collisionPadding={12}>
            <p>Sort by</p>{sort.options.map(option=><button type="button" role="menuitemradio" aria-checked={sort.value===option.value} key={option.value} onClick={()=>{sort.onChange(option.value);setSortOpen(false);}}><span>{option.label}</span>{sort.value===option.value&&<Check size={15}/>}</button>)}
          </PopoverContent>
        </Popover>
        <button type="button" className="browse-action" onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-expanded={open}><SlidersHorizontal size={16}/><span>Filters</span>{count>0&&<small>{count}</small>}</button>
      </div>
    </div>
    <div className="browse-genre-rail" role="group" aria-label="Genre">
      <button type="button" aria-pressed={genre==='all'} onClick={()=>onGenreChange('all')}>All genres</button>
      {genres.map(item=><button type="button" key={item.id} aria-pressed={genre===item.id} onClick={()=>onGenreChange(genre===item.id?'all':item.id)}>{item.label}</button>)}
    </div>
    {(count>0||sorted||primaryChanged)&&<div className="browse-active-filters" aria-label="Active filters">
      {selectedGenre&&<button type="button" onClick={()=>onGenreChange('all')} aria-label={`Remove ${selectedGenre.label} genre`}>{selectedGenre.label}<X size={12}/></button>}
      {active.map(field=><button type="button" key={field.id} onClick={()=>field.onChange(field.defaultValue||'all')} aria-label={`Remove ${field.label} filter`}>{field.options.find(option=>option.value===field.value)?.label}<X size={12}/></button>)}
      <button type="button" className="browse-clear" onClick={onReset}>Clear all</button>
    </div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="browse-filter-dialog">
      <DialogHeader><DialogTitle>Refine your selection</DialogTitle><DialogDescription>Find a story that fits your mood.</DialogDescription></DialogHeader>
      <div className="browse-refinements">
        {fields.map(field=><fieldset key={field.id}><legend>{field.label}</legend><div className="browse-option-grid">
          {field.options.map(option=><button type="button" key={option.value} aria-pressed={field.value===option.value} onClick={()=>field.onChange(option.value)}>{option.label}</button>)}
        </div></fieldset>)}
      </div>
      <footer><button type="button" className="browse-clear" onClick={onReset}>Reset filters</button><button type="button" className="browse-done" onClick={()=>setOpen(false)}>Show titles</button></footer>
    </DialogContent></Dialog>
  </section>;
}
