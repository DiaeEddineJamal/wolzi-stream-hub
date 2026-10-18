import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Camera, ChevronRight, Clock, History, LogOut, Puzzle, Server } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/layouts/MainLayout';
import ContinueWatching from '@/components/home/ContinueWatching';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { usePlaybackHistory } from '@/hooks/usePlaybackHistory';
import { useStreamingService } from '@/hooks/useStreamingService';
import { supabase } from '@/lib/supabase';

const AVATAR_TYPES=['image/jpeg','image/png','image/webp','image/gif'];
export default function Profile(){
  const {user,profile,logout,updateProfile}=useAuth(),navigate=useNavigate();
  const {items:saved}=useWatchlist(),{items:history}=usePlaybackHistory(),{service}=useStreamingService();
  // Render from auth metadata immediately; the profile row only refines it.
  const name=profile?.username||user?.user_metadata?.username||user?.email?.split('@')[0]||'Viewer';
  const [username,setUsername]=useState(name),edited=useRef(false);
  useEffect(()=>{if(!edited.current)setUsername(name);},[name]);
  const [saving,setSaving]=useState(false),[uploading,setUploading]=useState(false);
  const file=useRef<HTMLInputElement>(null);
  if(!user)return null;
  const hours=Math.round(history.reduce((sum,item)=>sum+(item.progress||0),0)/360)/10;
  const since=new Date(user.created_at).toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const save=async(e:React.FormEvent)=>{
    e.preventDefault();setSaving(true);
    try{await updateProfile({username:username.trim(),avatar_url:profile?.avatar_url});edited.current=false;toast.success('Profile saved');}
    catch{toast.error('Could not save your profile. Try again.');}finally{setSaving(false);}
  };
  const upload=async(chosen?:File)=>{
    if(!chosen)return;
    if(chosen.size>5242880||!AVATAR_TYPES.includes(chosen.type)){toast.error('Choose a PNG, JPEG, WebP or GIF under 5 MB.');return;}
    setUploading(true);
    try{
      const path=`${user.id}/${crypto.randomUUID()}.${chosen.type.split('/')[1]}`;
      const {error}=await supabase.storage.from('avatars').upload(path,chosen,{contentType:chosen.type});if(error)throw error;
      await updateProfile({username:profile?.username||name,avatar_url:supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl});
      toast.success('Photo updated');
    }catch{toast.error('Could not upload that photo. Try again.');}finally{setUploading(false);if(file.current)file.current.value='';}
  };
  return <MainLayout><div className="page-shell">
    <header className="catalog-header profile-hero">
      <div className="profile-identity">
        <button type="button" className="profile-avatar" onClick={()=>file.current?.click()} disabled={uploading} aria-label="Change profile photo">
          {profile?.avatar_url?<img src={profile.avatar_url} alt=""/>:<span>{name.slice(0,2).toUpperCase()}</span>}
          <i aria-hidden="true"><Camera size={15}/></i>
        </button>
        <input ref={file} type="file" accept={AVATAR_TYPES.join(',')} hidden onChange={e=>void upload(e.target.files?.[0])}/>
        <div><p className="eyebrow">YOUR ACCOUNT</p><h1>{name}</h1><p>{user.email} · Member since {since}</p></div>
      </div>
      <Button variant="secondary" onClick={()=>{void logout().then(()=>navigate('/')).catch(()=>toast.error('Could not sign out. Try again.'));}}><LogOut size={16}/>Sign out</Button>
    </header>
    <section className="profile-stats" aria-label="Your activity">
      <Link to="/library"><Bookmark size={18}/><strong>{saved.length}</strong><span>In My List</span><ChevronRight size={15}/></Link>
      <Link to="/watch-history"><History size={18}/><strong>{history.length}</strong><span>Titles started</span><ChevronRight size={15}/></Link>
      <div><Clock size={18}/><strong>{hours}</strong><span>Hours watched</span></div>
    </section>
  </div>
  <ContinueWatching/>
  <div className="page-shell profile-grid">
    <form className="settings-panel" onSubmit={save}>
      <p className="eyebrow">PROFILE</p><h2 className="mb-5 text-xl">How you appear</h2>
      <label className="profile-field"><span>Display name</span><Input value={username} maxLength={80} required onChange={e=>{edited.current=true;setUsername(e.target.value);}}/></label>
      <label className="profile-field"><span>Email</span><Input value={user.email||''} disabled/></label>
      <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={saving||!username.trim()||username.trim()===profile?.username}>{saving?'Saving…':'Save changes'}</Button><Button type="button" variant="secondary" onClick={()=>file.current?.click()} disabled={uploading}><Camera size={16}/>{uploading?'Uploading…':'Change photo'}</Button></div>
    </form>
    <section className="settings-panel">
      <p className="eyebrow">PLAYBACK</p><h2 className="mb-5 text-xl">Sources and services</h2>
      <Link className="profile-row" to="/addons"><Puzzle size={18}/><span><strong>Add-ons</strong><small>Catalogs and streams from Stremio-compatible add-ons</small></span><ChevronRight size={16}/></Link>
      <Link className="profile-row" to="/addons#streaming-service"><Server size={18}/><span><strong>Stremio Service</strong><small>{service?'Connected on this computer':'Not detected. Needed for torrents and conversion'}</small></span><ChevronRight size={16}/></Link>
    </section>
  </div></MainLayout>;
}
