import { useState } from 'react';
import { UserProfile, PrepPlan, Weakness } from '../types';
import { PlanningAgent } from '../services/gemini';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  CalendarRange, 
  Loader2, 
  CheckCircle2, 
  Target, 
  Sparkles,
  ArrowRight,
  Clock,
  BookOpen,
  CheckSquare
} from 'lucide-react';

interface PrepPlannerProps {
  profile: UserProfile | null;
  plans: PrepPlan[];
  weaknesses: Weakness[];
}

export default function PrepPlanner({ profile, plans, weaknesses }: PrepPlannerProps) {
  const [target, setTarget] = useState('');
  const [duration, setDuration] = useState(5);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    if (!target.trim() || !profile) return;
    setLoading(true);
    try {
      const planData = await PlanningAgent.generatePlan(
        target, 
        duration, 
        weaknesses.map(w => w.topic)
      );

      const newPlan: PrepPlan = {
        userId: profile.uid,
        target,
        durationDays: duration,
        plan: planData,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'plans'), newPlan);
      setTarget('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = plans[0];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header & Generator */}
      <div className="glass-card p-12 md:p-16 border-white/5 relative overflow-hidden shadow-2xl shadow-brand/5">
        <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
          <CalendarRange className="w-48 h-48 text-brand" />
        </div>
        
        <div className="max-w-2xl mb-14 relative z-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-brand mb-4">Study Plan Agent</h2>
          <h1 className="text-5xl font-serif italic font-bold tracking-tight mb-8">
            Your personalized <span className="text-white">Study Roadmap</span>
          </h1>
          <p className="text-zinc-400 text-lg font-medium leading-relaxed">
            Tell us your target company or role, and we'll generate a day-wise 
            study plan tailored to your weaknesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div className="md:col-span-2 relative group">
            <Target className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand transition-colors" />
            <input 
              type="text"
              placeholder="Target Company or Role (e.g. TCS SDE-1)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-6 focus:outline-none focus:border-brand/50 transition-all text-lg font-medium placeholder:text-zinc-600"
            />
          </div>
          <div className="relative group">
            <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand transition-colors" />
            <select 
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-6 focus:outline-none focus:border-brand/50 transition-all appearance-none text-lg font-medium"
            >
              {[3, 5, 7, 14, 30].map(d => (
                <option key={d} value={d} className="bg-[#0A0A0A]">{d} Days Plan</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={generatePlan}
          disabled={loading || !target.trim()}
          className="btn-primary mt-10 px-14 py-6 rounded-full flex items-center justify-center gap-3 disabled:opacity-50 min-w-[240px]"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              Generate Prep Plan
              <Sparkles className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Current Plan Display */}
      {currentPlan && (
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center border border-brand/20">
                <CalendarRange className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="text-3xl font-serif italic font-bold">Active Plan: {currentPlan.target}</h3>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">
                  Generated {new Date(currentPlan.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {currentPlan.plan.map((day, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-10 flex flex-col md:flex-row gap-10 border-white/5 hover:border-brand/20 transition-all group"
              >
                <div className="md:w-32 flex-shrink-0">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center group-hover:bg-brand/10 group-hover:border-brand/20 transition-all">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Day</span>
                    <span className="text-3xl font-bold text-brand">{day.day}</span>
                  </div>
                </div>

                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-brand" />
                      Topics to Cover
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {day.topics.map((topic, j) => (
                        <span key={j} className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-xs font-bold text-zinc-300 hover:text-white hover:border-brand/30 transition-all">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-3">
                      <CheckSquare className="w-4 h-4 text-brand" />
                      Action Items
                    </h4>
                    <ul className="space-y-4">
                      {day.tasks.map((task, j) => (
                        <li key={j} className="flex items-start gap-4 text-sm font-medium text-zinc-400 group/item">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand mt-2 group-hover/item:scale-150 transition-transform" />
                          <span className="group-hover/item:text-zinc-200 transition-colors">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
