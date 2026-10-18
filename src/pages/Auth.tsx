import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, MailCheck } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
const Particles=lazy(()=>import('@/components/vendor/reactbits/Particles'));
export default function Auth(){
  const reduced=useReducedMotion();
  const [params,setParams]=useSearchParams();
  const signupMode=params.get('mode')==='signup';
  const resetMode=params.get('mode')==='reset';
  const recovery=params.get('mode')==='recovery';
  const {login,signup,isLoggedIn}=useAuth();
  const navigate=useNavigate();
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[confirm,setConfirm]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  // Address awaiting confirmation: shows the check-your-inbox panel (after sign-up, or a sign-in before confirming).
  const [pending,setPending]=useState(''),[unconfirmed,setUnconfirmed]=useState(false);
  const resend=async(address:string)=>{setBusy(true);setError('');try{const {error}=await supabase.auth.resend({type:'signup',email:address,options:{emailRedirectTo:window.location.origin+'/auth'}});if(error)throw error;setMessage('A new confirmation link is on its way.');}catch{setError('We couldn’t resend the email just now. Wait a minute and try again.');}finally{setBusy(false);}};
  useEffect(()=>{if(isLoggedIn&&!recovery)navigate('/profile',{replace:true});},[isLoggedIn,recovery,navigate]);
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();setError('');setMessage('');setUnconfirmed(false);
    if((signupMode||recovery)&&password!==confirm){setError('The passwords don’t match.');return;}
    setBusy(true);
    try{
      if(resetMode){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/auth?mode=recovery'});if(error)throw error;setMessage('If this address has an account, a reset link is on its way.');}
      else if(recovery){const {error}=await supabase.auth.updateUser({password});if(error)throw error;setMessage('Password updated. You can return to your profile.');}
      else if(signupMode){const {needsConfirmation}=await signup(email,password,name);if(needsConfirmation)setPending(email.trim());}
      else{await login(email,password);navigate('/');}
    }catch(e){
      if(!signupMode&&!resetMode&&!recovery&&(e as {code?:string})?.code==='email_not_confirmed'){setUnconfirmed(true);setError('Confirm your email first. Open the link we sent to '+email.trim()+', then sign in.');return;}setError(resetMode?'The reset email couldn’t be requested. Try again.':recovery?'The password couldn’t be updated. Request a new reset link.':signupMode?'Your account couldn’t be created. Check your details and try again.':'We couldn’t sign you in. Check your email and password.');}finally{setBusy(false);}
  };
  const changeMode=(mode:string)=>{setParams({mode});setError('');setMessage('');setPending('');setUnconfirmed(false);};
  return <MainLayout><div className="auth-universe"><div className="auth-particles" aria-hidden="true"><Suspense fallback={null}><Particles particleCount={130} particleColors={['#ffffff','#d2d2d2','#929292']} particleBaseSize={85} sizeRandomness={1} alphaParticles speed={.065} particleSpread={12} pixelRatio={Math.min(window.devicePixelRatio,1.5)} moveParticlesOnHover={false} glow={.15} opacity={.7}/></Suspense></div><div className="page-shell auth-layout">
    {pending?<section className="auth-form-panel auth-inbox" aria-live="polite"><span className="auth-inbox-icon"><MailCheck size={26}/></span><p className="eyebrow">ONE LAST STEP</p><h1>Check your inbox.</h1><p className="auth-subtitle">We sent a confirmation link to <strong>{pending}</strong>. Open it to activate your account, then sign in.</p><p className="auth-inbox-hint">Can’t find it? Check spam or promotions. The link expires in 24 hours.</p>{error&&<p role="alert" className="auth-error">{error}</p>}{message&&<p role="status" className="auth-success">{message}</p>}<div className="auth-inbox-actions"><Button onClick={()=>changeMode('login')}>Go to sign in<ArrowUpRight size={16}/></Button><Button variant="secondary" disabled={busy} onClick={()=>void resend(pending)}>{busy?'Sending…':'Resend email'}</Button></div></section>:
    <section className="auth-form-panel"><p className="eyebrow">YOUR WORLD OF STORIES</p><AnimatePresence mode="wait" initial={false}><motion.div key={params.get('mode')||'login'} className="auth-intro" initial={{opacity:0,y:reduced?0:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduced?0:-4}} transition={{duration:reduced?0:.18}}><h1>{signupMode?'Your story starts here.':resetMode?'Let’s get you back.':recovery?'A fresh start.':'Welcome back.'}</h1><p className="auth-subtitle">{signupMode?'Create your A&D MAX account.':resetMode?'We’ll email you a password reset link.':recovery?'Choose a password with at least 8 characters.':'Sign in. Settle in. Find your next favorite.'}</p></motion.div></AnimatePresence>
      {!resetMode&&!recovery&&<div className="auth-mode-switch" aria-label="Account access"><button type="button" aria-pressed={!signupMode} onClick={()=>changeMode('login')}>Sign in</button><button type="button" aria-pressed={signupMode} onClick={()=>changeMode('signup')}>Create account</button></div>}
      {error&&<p role="alert" className="auth-error">{error}{unconfirmed&&<> <button type="button" className="underline" disabled={busy} onClick={()=>void resend(email.trim())}>Resend link</button></>}</p>}{message&&<p role="status" className="auth-success">{message}</p>}
      <form onSubmit={submit} className="space-y-5">
        {signupMode&&<div><label htmlFor="display-name">Your name</label><Input id="display-name" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required maxLength={80}/></div>}
        {!recovery&&<div><label htmlFor="auth-email">Email address</label><Input id="auth-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"/></div>}
        {!resetMode&&<div><div className="flex justify-between"><label htmlFor="auth-password">Password</label>{!signupMode&&!recovery&&<button type="button" className="text-xs text-muted-foreground" onClick={()=>changeMode('reset')}>Forgot password?</button>}</div><Input id="auth-password" type="password" autoComplete={signupMode||recovery?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} required minLength={signupMode||recovery?8:1}/></div>}
        {(signupMode||recovery)&&<div><label htmlFor="auth-confirm">Confirm password</label><Input id="auth-confirm" type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={8}/></div>}
        {signupMode&&<label className="flex items-start gap-3 text-xs leading-6 text-muted-foreground"><input type="checkbox" required className="mt-1.5 accent-white"/><span>I agree to the <Link to="/terms" className="text-white underline">Terms of Service</Link> and <Link to="/privacy" className="text-white underline">Privacy Policy</Link>.</span></label>}
        <Button type="submit" className="w-full" disabled={busy}>{busy?'One moment…':signupMode?'Create account':resetMode?'Send reset link':recovery?'Update password':'Sign in'}<ArrowUpRight size={16}/></Button>
      </form>
      <p className="auth-switch">{signupMode?'Already at home here?':'New to A&D MAX?'} <button onClick={()=>changeMode(signupMode||resetMode||recovery?'login':'signup')}>{signupMode||resetMode||recovery?'Sign in':'Create an account'}</button></p>
    </section>}
  </div></div></MainLayout>;
}
