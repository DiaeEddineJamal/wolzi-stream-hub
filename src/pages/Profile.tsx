import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Camera, ChevronRight, History, LogOut, Play, Puzzle, Server, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { usePlaybackHistory } from '@/hooks/usePlaybackHistory';
import { useStreamingService } from '@/hooks/useStreamingService';
import { getPosterUrl } from '@/integrations/api/tmdb';
import { watchPath } from '@/lib/media';
import type { WatchProgress } from '@/lib/watch-progress';
import { supabase } from '@/lib/supabase';

const AVATAR_TYPES=['image/jpeg','image/png','image/webp','image/gif'];
const art=(item:WatchProgress)=>item.backdropUrl||(item.poster_path?.startsWith('https://')?item.poster_path:getPosterUrl(item.poster_path))||'/poster-placeholder.svg';
const remaining=(item:WatchProgress)=>{const m=Math.max(1,Math.round((item.duration-item.progress)/60));return m>=60?`${Math.floor(m/60)} h ${m%60} min left`:`${m} min left`;};

export default function Profile(){
  const {user,profile,logout,updateProfile}=useAuth(),navigate=useNavigate();
  const {items:saved}=useWatchlist(),{items:history,continuing}=usePlaybackHistory(),{service}=useStreamingService();
  // Render from auth metadata immediately; the profile row only refines it.
  const name=profile?.username||user?.user_metadata?.username||user?.email?.split('@')[0]||'Viewer';
  const [username,setUsername]=useState(name),edited=useRef(false);
  useEffect(()=>{if(!edited.current)setUsername(name);},[name]);
  const [saving,setSaving]=useState(false),[uploading,setUploading]=useState(false);
  const file=useRef<HTMLInputElement>(null);
  if(!user)return null;
  const hours=Math.round(history.reduce((sum,item)=>sum+(item.progress||0),0)/360)/10;
  const since=new Date(user.created_at).toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const changed=username.trim()&&username.trim()!==(profile?.username||name);
  const save=async(e:React.FormEvent)=>{
    e.preventDefault();if(!changed)return;setSaving(true);
    try{await updateProfile({username:username.trim(),avatar_url:profile?.avatar_url});edited.current=false;toast.success('Name updated');}
    catch{toast.error('Could not save your name. Try again.');}finally{setSaving(false);}
  };
  const setPhoto=async(url:string|null,done:string)=>{await updateProfile({username:profile?.username||name,avatar_url:url});toast.success(done);};
  const upload=async(chosen?:File)=>{
    if(!chosen)return;
    if(chosen.size>5242880||!AVATAR_TYPES.includes(chosen.type)){toast.error('Choose a PNG, JPEG, WebP or GIF under 5 MB.');return;}
    setUploading(true);
    try{
      const path=`${user.id}/${crypto.randomUUID()}.${chosen.type.split('/')[1]}`;
      const {error}=await supabase.storage.from('avatars').upload(path,chosen,{contentType:chosen.type});if(error)throw error;
      await setPhoto(supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl,'Photo updated');
    }catch{toast.error('Could not upload that photo. Try again.');}finally{setUploading(false);if(file.current)file.current.value='';}
  };
  const removePhoto=async()=>{setUploading(true);try{await setPhoto(null,'Photo removed');}catch{toast.error('Could not remove the photo. Try again.');}finally{setUploading(false);}};
  const signOut=()=>{void logout().then(()=>navigate('/')).catch(()=>toast.error('Could not sign out. Try again.'));};
  const avatar=profile?.avatar_url?<img src={profile.avatar_url} alt=""/>:<span>{name.slice(0,2).toUpperCase()}</span>;

  return <MainLayout><div className="page-shell profile-page">
    <input ref={file} type="file" accept={AVATAR_TYPES.join(',')} hidden onChange={e=>void upload(e.target.files?.[0])}/>

    <header className="profile-header">
      <button type="button" className="profile-avatar" onClick={()=>file.current?.click()} disabled={uploading} aria-label="Change profile photo">{avatar}<i aria-hidden="true"><Camera size={14}/></i></button>
      <h1>{name}</h1>
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
          <span className="profile-item-text"><strong>Profile photo</strong><small>PNG, JPEG, WebP or GIF, up to 5 MB</small></span>
          <span className="profile-item-actions">{profile?.avatar_url&&<Button variant="ghost" size="sm" disabled={uploading} onClick={()=>void removePhoto()} aria-label="Remove photo"><Trash2 size={15}/></Button>}<Button variant="secondary" size="sm" disabled={uploading} onClick={()=>file.current?.click()}>{uploading?'Uploading…':profile?.avatar_url?'Change':'Add photo'}</Button></span>
        </div>
        <form className="profile-item" onSubmit={save}>
          <label htmlFor="display-name" className="profile-item-text"><strong>Display name</strong><small>Shown on your profile and menus</small></label>
          <span className="profile-item-actions profile-name"><Input id="display-name" value={username} maxLength={80} required onChange={e=>{edited.current=true;setUsername(e.target.value);}}/>{changed&&<Button size="sm" type="submit" disabled={saving}>{saving?'Saving…':'Save'}</Button>}</span>
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
  </div></MainLayout>;
}
