import { User } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Mic2, 
  FileText, 
  CalendarRange, 
  LogOut, 
  BrainCircuit, 
  BarChart3, 
  Search,
  User as UserIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: User | null;
  logout: () => void;
  login: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, user, logout, login }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText },
    { id: 'interview', label: 'Mock Interview', icon: Mic2 },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'job-finder', label: 'Job Finder', icon: Search },
    { id: 'study-plan', label: 'Study Plan', icon: CalendarRange },
  ];

  return (
    <aside className="w-72 h-screen border-r border-white/5 sticky top-0 bg-bg flex flex-col z-50">
      <div className="p-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 rotate-3">
          <BrainCircuit className="w-7 h-7 text-black -rotate-3" />
        </div>
        <span className="font-serif italic font-bold text-2xl tracking-tighter uppercase">
          HireSense<span className="text-brand"> AI</span>
        </span>
      </div>

      <nav className="flex-1 px-6 space-y-2 py-6">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden",
              activeTab === item.id 
                ? "text-black" 
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-all duration-300 relative z-10",
              activeTab === item.id ? "text-black scale-110" : "text-zinc-600 group-hover:text-brand"
            )} />
            <span className="relative z-10">{item.label}</span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-brand shadow-lg shadow-brand/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5">
        <div className="glass-card p-5 mb-6 flex items-center gap-4 border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center overflow-hidden shadow-inner">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-6 h-6 text-brand" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-white">{user?.displayName || 'Guest User'}</p>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] truncate">
              {user ? 'Active Session' : 'Guest Mode'}
            </p>
          </div>
        </div>
        {user ? (
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all font-bold text-sm group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Logout
          </button>
        ) : (
          <button 
            onClick={login}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-brand/20 bg-brand/5 hover:bg-brand/10 text-brand transition-all font-bold text-sm group"
          >
            Sign In for Sync
          </button>
        )}
      </div>
    </aside>
  );
}
