import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Tables } from '@/types/supabase';
type UserProfile=Tables<'profiles'>;
interface AuthContextType {
  user:User|null;profile:UserProfile|null;session:Session|null;isLoggedIn:boolean;loading:boolean;
  login:(email:string,password:string)=>Promise<unknown>;
  signup:(email:string,password:string,username:string)=>Promise<void>;
  logout:()=>Promise<boolean>;
  updateProfile:(profile:Partial<UserProfile>)=>Promise<UserProfile>;
}
const AuthContext=createContext<AuthContextType|undefined>(undefined);
export function AuthProvider({children}:{children:ReactNode}){
  const [session,setSession]=useState<Session|null>(null),[profile,setProfile]=useState<UserProfile|null>(null),[loading,setLoading]=useState(true);
  const user=session?.user||null;
  useEffect(()=>{
    let active=true;
    // Keep this callback synchronous: profile requests run outside the auth lock.
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,next)=>{if(active){setSession(next);setLoading(false);}});
    void supabase.auth.getSession().then(({data,error})=>{if(active){setSession(error?null:data.session);setLoading(false);}}).catch(()=>{if(active)setLoading(false);});
    return()=>{active=false;subscription.unsubscribe();};
  },[]);
  const userId=user?.id,username=user?.user_metadata?.username;
  useEffect(()=>{
    let active=true;setProfile(null);
    if(!userId)return;
    // Insert-if-missing without asking for the row back (that returned 406 when a parallel run won), then read it.
    const read=()=>supabase.from('profiles').select('*').eq('id',userId).maybeSingle();
    void (async()=>{
      let {data}=await read();
      if(!data){await supabase.from('profiles').upsert({id:userId,username:username||'Viewer'},{onConflict:'id',ignoreDuplicates:true});({data}=await read());}
      if(active&&data)setProfile(data);
    })().catch(()=>{});
    return()=>{active=false;};
  },[userId,username]);
  const login=async(email:string,password:string)=>{
    const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(error)throw error;setSession(data.session);return data;
  };
  const signup=async(email:string,password:string,username:string)=>{
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{username:username.trim()},emailRedirectTo:window.location.origin+'/auth'}});
    if(error)throw error;
    // Confirm-email signups have no session; profile creation waits for sign-in.
    if(data.session)setSession(data.session);
  };
  const logout=async()=>{
    const {error}=await supabase.auth.signOut();if(error)throw error;
    setSession(null);setProfile(null);
    try{localStorage.removeItem('wolziflix_user_profile');}catch{/* Device preferences are retained. */}
    return true;
  };
  const updateProfile=async(value:Partial<UserProfile>)=>{
    if(!user)throw new Error('Sign in to update your profile.');
    const {data,error}=await supabase.from('profiles').update({username:value.username,avatar_url:value.avatar_url,updated_at:new Date().toISOString()}).eq('id',user.id).select().single();
    if(error)throw error;setProfile(data);return data;
  };
  return <AuthContext.Provider value={{user,profile,session,isLoggedIn:!!user,loading,login,signup,logout,updateProfile}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth requires AuthProvider');return value;}
