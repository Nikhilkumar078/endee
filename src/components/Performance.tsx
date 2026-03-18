import { UserProfile, Interview, Weakness } from '../types';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Target, Award, BrainCircuit, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface PerformanceProps {
  profile: UserProfile | null;
  interviews: Interview[];
  weaknesses: Weakness[];
}

export default function Performance({ profile, interviews, weaknesses }: PerformanceProps) {
  const chartData = interviews.slice().reverse().map((int, i) => ({
    name: `Int ${i + 1}`,
    score: int.overallScore ? (int.overallScore * 10).toFixed(1) : 0,
    technical: int.evaluation?.technical ? (int.evaluation.technical * 10).toFixed(1) : 0,
    communication: int.evaluation?.communication ? (int.evaluation.communication * 10).toFixed(1) : 0,
  }));

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-brand mb-3">Analytics Engine</h2>
          <h1 className="text-5xl font-serif italic font-bold tracking-tight">
            Performance <span className="text-white">Metrics</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-card p-8 text-center border-white/5 shadow-xl shadow-brand/5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Aggregate Score</p>
            <p className="text-4xl font-bold text-brand">{(profile?.avgScore || 0).toFixed(1)}<span className="text-lg text-zinc-500">/10</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 glass-card p-10 border-white/5">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center border border-brand/20">
                <TrendingUp className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Score Progression</h3>
                <p className="text-xs text-zinc-500 font-medium">Performance trends over time</p>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
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
                  dataKey="name" 
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
                  domain={[0, 100]}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '16px', padding: '12px' }}
                  itemStyle={{ color: '#FF6B00', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#FF6B00" 
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  strokeWidth={4} 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-10">
          <div className="glass-card p-10 border-white/5">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Skill Distribution</h3>
                <p className="text-xs text-zinc-500 font-medium">Core competency breakdown</p>
              </div>
            </div>
            <div className="space-y-6">
              {['Technical', 'Communication', 'Confidence'].map((skill) => {
                const val = profile ? (profile.avgScore * 10).toFixed(0) : 0; // Simplified for demo
                return (
                  <div key={skill} className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      <span>{skill}</span>
                      <span className="text-white">{val}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-white transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-brand/5 border border-brand/10 rounded-[2.5rem] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Award className="w-32 h-32 text-brand" />
            </div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center border border-brand/20">
                <Award className="w-5 h-5 text-brand" />
              </div>
              <h3 className="font-bold text-xl text-brand">Top Weaknesses</h3>
            </div>
            <div className="space-y-4 relative z-10">
              {weaknesses.slice(0, 3).map((w, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                  <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{w.topic}</span>
                  <span className="text-[10px] font-bold text-brand uppercase tracking-widest bg-brand/10 px-3 py-1 rounded-full border border-brand/20">{w.frequency} hits</span>
                </div>
              ))}
              {weaknesses.length === 0 && <p className="text-sm text-orange-200/50 italic text-center py-6">No weaknesses detected yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
