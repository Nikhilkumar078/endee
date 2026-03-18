import { UserProfile, Interview, Weakness } from '../types';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Target, 
  Award, 
  History, 
  AlertCircle, 
  ChevronRight,
  BarChart3,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface DashboardProps {
  profile: UserProfile | null;
  interviews: Interview[];
  weaknesses: Weakness[];
}

export default function Dashboard({ profile, interviews, weaknesses }: DashboardProps) {
  const chartData = interviews
    .slice(0, 7)
    .reverse()
    .map((int, i) => ({
      day: `Int ${i + 1}`,
      score: int.overallScore || 0,
    }));

  const stats = [
    { label: 'Avg. Score', value: `${profile?.avgScore.toFixed(1) || 0}/10`, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Interviews', value: profile?.totalInterviews || 0, icon: Target, color: 'text-orange-500' },
    { label: 'Hireability', value: `${Math.round((profile?.avgScore || 0) * 10)}%`, icon: Award, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-brand mb-3">System Overview</h2>
          <h1 className="text-5xl font-serif italic font-bold tracking-tight">
            Welcome back, <span className="text-white">{profile?.displayName.split(' ')[0]}</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card px-8 py-5 flex items-center gap-5 border-white/5">
              <div className={`${stat.color} bg-white/5 p-3 rounded-2xl`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-10 border-white/5">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center border border-brand/20">
                <BarChart3 className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Improvement Tracking</h3>
                <p className="text-xs text-zinc-500 font-medium">Performance over the last 7 sessions</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Real-time Data</span>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#ffffff20" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#ffffff20" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, 10]}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '16px', padding: '12px' }}
                  itemStyle={{ color: '#FF6B00', fontWeight: 'bold' }}
                  cursor={{ stroke: '#FF6B00', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#FF6B00" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weakness Detection */}
        <div className="glass-card p-10 border-white/5">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Weakness Detection</h3>
              <p className="text-xs text-zinc-500 font-medium">AI-identified focus areas</p>
            </div>
          </div>
          <div className="space-y-5">
            {weaknesses.length > 0 ? (
              weaknesses.map((w, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                  <div>
                    <p className="font-bold text-sm group-hover:text-brand transition-colors">{w.topic}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Encountered {w.frequency}x</p>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/30" />
                </div>
                <p className="text-zinc-500 text-sm font-medium">No major weaknesses detected yet.<br/>Keep interviewing!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Past Interview Recall */}
      <div className="glass-card p-10 border-white/5">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <History className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Interview History</h3>
              <p className="text-xs text-zinc-500 font-medium">Review your past performance</p>
            </div>
          </div>
          <button className="text-xs font-bold text-brand uppercase tracking-widest hover:underline flex items-center gap-2">
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {interviews.map((int, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -8, scale: 1.02 }}
              className="p-8 bg-white/5 border border-white/5 rounded-3xl group cursor-pointer hover:border-brand/30 transition-all shadow-xl hover:shadow-brand/5"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="px-4 py-1.5 bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-widest rounded-full border border-brand/20">
                  {int.mode}
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {new Date(int.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <h4 className="font-bold text-xl mb-4 group-hover:text-brand transition-colors">{int.company || 'General Interview'}</h4>
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Award className="w-4 h-4 text-zinc-500" />
                  </div>
                  <span className="text-lg font-bold text-white">{int.overallScore?.toFixed(1) || 'N/A'}<span className="text-xs text-zinc-500">/10</span></span>
                </div>
                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-brand group-hover:border-brand transition-all">
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-black transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
          {interviews.length === 0 && (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
              <p className="text-zinc-500 font-medium">No interviews taken yet. Start your first one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
