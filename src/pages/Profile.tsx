import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Camera, ChevronRight, History, LogOut, Pencil, Play, Puzzle, Server, Trash2, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { usePlaybackHistory } from '@/hooks/usePlaybackHistory';
import { useStreamingService } from '@/hooks/useStreamingService';
import { getPosterUrl } from '@/integrations/api/tmdb';
import { watchPath } from '@/lib/media';
import type { WatchProgress } from '@/lib/watch-progress';
import { supabase } from '@/lib/supabase';

const AVATAR_TYPES=['image/jpeg','image/png','image/webp','image/gif'];
const CROP_VIEW=240,CROP_OUT=400;
const art=(item:WatchProgress)=>item.backdropUrl||(item.poster_path?.startsWith('https://')?item.poster_path:getPosterUrl(item.poster_path))||'/poster-placeholder.svg';
const remaining=(item:WatchProgress)=>{const m=Math.max(1,Math.round((item.duration-item.progress)/60));return m>=60?`${Math.floor(m/60)} h ${m%60} min left`:`${m} min left`;};
export function clampCropOffset(offset:{x:number;y:number},natural:{w:number;h:number},zoom:number,view=CROP_VIEW){
  if(!natural.w||!natural.h)return {x:0,y:0};
  const base=Math.max(view/natural.w,view/natural.h)*zoom;
  const maxX=Math.max(0,(natural.w*base-view)/2),maxY=Math.max(0,(natural.h*base-view)/2);
  return {x:Math.min(maxX,Math.max(-maxX,offset.x))||0,y:Math.min(maxY,Math.max(-maxY,offset.y))||0};
}

export default function Profile(){
  const {user,profile,logout,updateProfile}=useAuth(),navigate=useNavigate();
  const {items:saved}=useWatchlist(),{items:history,continuing}=usePlaybackHistory(),{service}=useStreamingService();
  // Render from auth metadata immediately; the profile row only refines it.
  const name=profile?.username||user?.user_metadata?.username||user?.email?.split('@')[0]||'Viewer';
  const avatarUrl=profile?.avatar_url||(user?.user_metadata?.avatar_url as string|undefined)||null;
  const [username,setUsername]=useState(name),edited=useRef(false);
  useEffect(()=>{if(!edited.current)setUsername(name);},[name]);
  const [saving,setSaving]=useState(false),[uploading,setUploading]=useState(false);
  const [cropSrc,setCropSrc]=useState<string|null>(null),[natural,setNatural]=useState({w:1,h:1}),[zoom,setZoom]=useState(1),[offset,setOffset]=useState({x:0,y:0});
  const file=useRef<HTMLInputElement>(null),nameInput=useRef<HTMLInputElement>(null),cropImg=useRef<HTMLImageElement>(null),drag=useRef<{x:number;y:number;ox:number;oy:number}|null>(null);
  useEffect(()=>()=>{if(cropSrc)URL.revokeObjectURL(cropSrc);},[cropSrc]);
  if(!user)return null;
  const hours=Math.round(history.reduce((sum,item)=>sum+(item.progress||0),0)/360)/10;
  const since=new Date(user.created_at).toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const trimmed=username.trim(),changed=Boolean(trimmed&&trimmed!==name);
  const save=async(e:React.FormEvent)=>{
    e.preventDefault();if(!trimmed)return;setSaving(true);
    try{await updateProfile({username:trimmed,avatar_url:avatarUrl});edited.current=false;toast.success('Username updated');}
    catch{toast.error('Could not save your username. Try again.');}finally{setSaving(false);}
  };
  const setPhoto=async(url:string|null,done:string)=>{await updateProfile({username:name,avatar_url:url});toast.success(done);};
  const selectFile=(chosen?:File)=>{
    if(!chosen)return;
    if(chosen.size>10485760||!AVATAR_TYPES.includes(chosen.type)){toast.error('Choose a PNG, JPEG, WebP or GIF under 10 MB.');return;}
    if(cropSrc)URL.revokeObjectURL(cropSrc);
    setZoom(1);setOffset({x:0,y:0});setCropSrc(URL.createObjectURL(chosen));
    if(file.current)file.current.value='';
  };
  const closeCrop=()=>{if(cropSrc)URL.revokeObjectURL(cropSrc);setCropSrc(null);};
  const applyCrop=async()=>{
    const img=cropImg.current;if(!img||!natural.w)return;
    setUploading(true);
    try{
      const canvas=document.createElement('canvas');canvas.width=CROP_OUT;canvas.height=CROP_OUT;
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
      const clamped=clampCropOffset(offset,natural,zoom),ratio=CROP_OUT/CROP_VIEW;
      const base=Math.max(CROP_OUT/natural.w,CROP_OUT/natural.h)*zoom;
      const w=natural.w*base,h=natural.h*base;
      ctx.imageSmoothingQuality='high';
      ctx.drawImage(img,(CROP_OUT-w)/2+clamped.x*ratio,(CROP_OUT-h)/2+clamped.y*ratio,w,h);
      const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',0.9));
      const dataUrl=canvas.toDataURL('image/webp',0.88);
      let finalUrl=dataUrl;
      if(blob){
        const path=`${user.id}/${crypto.randomUUID()}.webp`;
        const {error}=await supabase.storage.from('avatars').upload(path,blob,{contentType:'image/webp',upsert:true});
        if(!error)finalUrl=supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      }
      await setPhoto(finalUrl,'Photo updated');
      closeCrop();
    }catch{toast.error('Could not save that photo. Try again.');}finally{setUploading(false);}
  };
  const removePhoto=async()=>{setUploading(true);try{await setPhoto(null,'Photo removed');}catch{toast.error('Could not remove the photo. Try again.');}finally{setUploading(false);}};
  const signOut=()=>{void logout().then(()=>navigate('/')).catch(()=>toast.error('Could not sign out. Try again.'));};
  const avatar=avatarUrl?<img src={avatarUrl} alt=""/>:<span>{name.slice(0,2).toUpperCase()}</span>;
  const clamped=clampCropOffset(offset,natural,zoom);
  const baseScale=Math.max(CROP_VIEW/natural.w,CROP_VIEW/natural.h)*zoom;

  return <MainLayout><div className="page-shell profile-page">
    <input ref={file} type="file" accept={AVATAR_TYPES.join(',')} hidden onChange={e=>selectFile(e.target.files?.[0])}/>

    <header className="profile-header">
      <div className="profile-avatar-wrap">
        <button type="button" className="profile-avatar" onClick={()=>file.current?.click()} disabled={uploading} aria-label="Change profile photo"><span className="profile-avatar-clip">{avatar}</span></button>
        <span className="profile-avatar-badge" aria-hidden="true"><Camera size={14}/></span>
      </div>
      <div className="profile-title-row"><h1>{name}</h1><button type="button" className="profile-edit-trigger" aria-label="Edit username" onClick={()=>{nameInput.current?.focus();nameInput.current?.select();}}><Pencil size={14}/></button></div>
      <p>{user.email}</p>
      <dl className="profile-stats">
        <div><dt>In My List</dt><dd>{saved.length}</dd></div>
        <div><dt>Titles started</dt><dd>{history.length}</dd></div>
        <div><dt>Hours watched</dt><dd>{hours}</dd></div>
      </dl>
    </header>

    {continuing.length>0&&<section className="profile-group">
      <div className="profile-group-head"><h2>Continue watching</h2><Link to="/watch-history">See all <ChevronRight size={14}/></Link></div>
      <div className="profile-resume">{continuing.slice(0,4).map(item=><Link key={item.content_type+item.content_id} to={watchPath(item.content_type,item.content_id,item.season||1,item.episode||1)} className="resume-row">
        <span className="resume-art"><img src={art(item)} alt="" loading="lazy"/><i style={{width:`${Math.min(100,item.progress_percent)}%`}}/></span>
        <span className="resume-text"><strong>{item.title}</strong><small>{item.season&&item.episode?`S${item.season} · E${item.episode} · `:''}{remaining(item)}</small></span>
        <span className="resume-play" aria-hidden="true"><Play size={14} fill="currentColor"/></span>
      </Link>)}</div>
    </section>}

    <section className="profile-group">
      <div className="profile-group-head"><h2>Profile</h2></div>
      <div className="profile-list">
        <div className="profile-item">
          <span className="profile-thumb">{avatar}</span>
          <span className="profile-item-text"><strong>Profile photo</strong><small>Crop and adjust · PNG, JPEG, WebP or GIF</small></span>
          <span className="profile-item-actions">{avatarUrl&&<Button variant="ghost" size="sm" disabled={uploading} onClick={()=>void removePhoto()} aria-label="Remove photo"><Trash2 size={15}/></Button>}<Button variant="secondary" size="sm" disabled={uploading} onClick={()=>file.current?.click()}>{uploading?'Saving…':avatarUrl?'Change':'Add photo'}</Button></span>
        </div>
        <form className="profile-item" onSubmit={save}>
          <label htmlFor="display-name" className="profile-item-text"><strong>Username</strong><small>Shown on your profile and menus</small></label>
          <span className="profile-item-actions profile-name"><Input ref={nameInput} id="display-name" value={username} maxLength={80} required placeholder="Enter username" onChange={e=>{edited.current=true;setUsername(e.target.value);}}/><Button size="sm" type="submit" variant={changed?'default':'secondary'} disabled={saving||!trimmed}>{saving?'Saving…':'Save'}</Button></span>
        </form>
        <div className="profile-item">
          <span className="profile-item-text"><strong>Email</strong><small>Member since {since}</small></span>
          <span className="profile-item-value">{user.email}</span>
        </div>
      </div>
    </section>

    <section className="profile-group">
      <div className="profile-group-head"><h2>Library</h2></div>
      <div className="profile-list">
        <Link className="profile-item" to="/library"><Bookmark size={18}/><span className="profile-item-text"><strong>My List</strong><small>Titles saved for later</small></span><span className="profile-item-value">{saved.length}</span><ChevronRight size={16}/></Link>
        <Link className="profile-item" to="/watch-history"><History size={18}/><span className="profile-item-text"><strong>Watch history</strong><small>Everything you’ve started</small></span><span className="profile-item-value">{history.length}</span><ChevronRight size={16}/></Link>
      </div>
    </section>

    <section className="profile-group">
      <div className="profile-group-head"><h2>Playback</h2></div>
      <div className="profile-list">
        <Link className="profile-item" to="/addons"><Puzzle size={18}/><span className="profile-item-text"><strong>Add-ons</strong><small>Catalogs and streams from Stremio-compatible add-ons</small></span><ChevronRight size={16}/></Link>
        <Link className="profile-item" to="/addons#streaming-service"><Server size={18}/><span className="profile-item-text"><strong>Stremio Service</strong><small>Needed for torrents and format conversion</small></span><span className={'profile-status'+(service?' is-on':'')}>{service?'Connected':'Not detected'}</span><ChevronRight size={16}/></Link>
      </div>
    </section>

    <section className="profile-group">
      <div className="profile-list"><button type="button" className="profile-item profile-signout" onClick={signOut}><LogOut size={18}/><span className="profile-item-text"><strong>Sign out</strong></span></button></div>
    </section>

    <Dialog open={!!cropSrc} onOpenChange={open=>{if(!open&&!uploading)closeCrop();}}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Crop profile photo</DialogTitle>
          <DialogDescription>Drag to reposition and use the slider to zoom.</DialogDescription>
        </DialogHeader>
        <div className="crop-stage-wrap">
          <div className="crop-stage" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,ox:clamped.x,oy:clamped.y};}} onPointerMove={e=>{if(!drag.current)return;setOffset(clampCropOffset({x:drag.current.ox+(e.clientX-drag.current.x),y:drag.current.oy+(e.clientY-drag.current.y)},natural,zoom));}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
            {cropSrc&&<img ref={cropImg} src={cropSrc} alt="Crop preview" draggable={false} onLoad={e=>{const el=e.currentTarget;setNatural({w:el.naturalWidth||1,h:el.naturalHeight||1});setOffset({x:0,y:0});}} style={{width:`${natural.w*baseScale}px`,height:`${natural.h*baseScale}px`,transform:`translate(calc(-50% + ${clamped.x}px), calc(-50% + ${clamped.y}px))`}}/>}
          </div>
          <label className="crop-zoom"><ZoomIn size={15}/><span>Zoom</span><input type="range" aria-label="Zoom photo" min={1} max={3} step={0.02} value={zoom} onChange={e=>{const z=Number(e.target.value);setZoom(z);setOffset(prev=>clampCropOffset(prev,natural,z));}}/></label>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="secondary" disabled={uploading} onClick={closeCrop}>Cancel</Button>
          <Button type="button" disabled={uploading} onClick={()=>void applyCrop()}>{uploading?'Saving…':'Save photo'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div></MainLayout>;
}
