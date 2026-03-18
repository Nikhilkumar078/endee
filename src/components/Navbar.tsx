import { User } from 'firebase/auth';
import { LayoutDashboard, Mic2, FileText, CalendarRange, LogOut, BrainCircuit } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: User;
  logout: () => void;
}

export default function Navbar({ activeTab, setActiveTab, user, logout }: NavbarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'interview', label: 'Interview', icon: Mic2 },
    { id: 'resume', label: 'Resume', icon: FileText },
    { id: 'study-plan', label: 'Study Plan', icon: CalendarRange },
  ];

  return (
    <nav className="border-b border-white/5 sticky top-0 bg-[#050505]/80 backdrop-blur-xl z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-black" />
          </div>
          <span className="font-serif italic font-bold text-xl tracking-tighter uppercase hidden sm:block">
            HireSense<span className="text-orange-500"> AI</span>
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeTab === item.id 
                  ? "bg-white text-black" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="hidden md:block">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Active User</span>
            <span className="text-sm font-medium">{user.displayName}</span>
          </div>
          <button 
            onClick={logout}
            className="p-2 rounded-xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
