import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
export default function UserMenu(){
  const {user,profile,logout}=useAuth(),navigate=useNavigate();
  if(!user)return null;
  const name=profile?.username||user.user_metadata?.username||user.email?.split('@')[0]||'Viewer';
  const avatarUrl=profile?.avatar_url||(user.user_metadata?.avatar_url as string|undefined)||undefined;
  return <DropdownMenu><DropdownMenuTrigger asChild><button className="icon-button" aria-label="Account menu"><Avatar className="h-8 w-8"><AvatarImage className="object-cover" src={avatarUrl} alt=""/><AvatarFallback>{String(name).slice(0,2).toUpperCase()}</AvatarFallback></Avatar></button></DropdownMenuTrigger><DropdownMenuContent className="w-56" align="end"><div className="min-w-0 p-3"><p className="break-words text-sm font-medium">{name}</p><p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p></div><DropdownMenuSeparator/><DropdownMenuItem asChild><Link to="/profile"><User className="mr-2 h-4 w-4"/>Profile</Link></DropdownMenuItem><DropdownMenuItem onSelect={()=>{void logout().then(()=>navigate('/')).catch(()=>toast.error('Could not sign out. Try again.'));}}><LogOut className="mr-2 h-4 w-4"/>Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
