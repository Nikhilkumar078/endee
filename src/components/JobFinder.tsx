import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { Search, MapPin, Briefcase, Building2, ChevronRight, Loader2, Sparkles, Filter, ExternalLink } from 'lucide-react';
import { JobSearchAgent } from '../services/gemini';

interface JobFinderProps {
  profile: UserProfile | null;
}

export default function JobFinder({ profile }: JobFinderProps) {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState<any[]>([
    { id: 1, title: 'Senior Software Engineer', company: 'Infosys', location: 'Bangalore, India', type: 'Full-time', salary: '₹25L - ₹35L', match: 95, url: 'https://www.infosys.com/careers/' },
    { id: 2, title: 'Frontend Developer', company: 'Zomato', location: 'Gurgaon, India', type: 'Full-time', salary: '₹18L - ₹28L', match: 88, url: 'https://www.zomato.com/careers' },
    { id: 3, title: 'Full Stack Engineer', company: 'Flipkart', location: 'Bangalore, India', type: 'Hybrid', salary: '₹22L - ₹32L', match: 82, url: 'https://www.flipkartcareers.com/' },
    { id: 4, title: 'Backend Developer', company: 'Paytm', location: 'Noida, India', type: 'Full-time', salary: '₹20L - ₹30L', match: 79, url: 'https://paytm.com/careers' },
  ]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const results = await JobSearchAgent.searchJobs(query);
      if (results && results.length > 0) {
        setJobs(results.map((j, i) => ({ ...j, id: Date.now() + i })));
      }
    } catch (error) {
      console.error("Error searching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.skills && profile.skills.length > 0) {
      setQuery(profile.skills.slice(0, 3).join(", "));
    }
  }, [profile]);

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-brand mb-3">Opportunity Engine</h2>
          <h1 className="text-5xl font-serif italic font-bold tracking-tight">
            Job <span className="text-white">Finder</span>
          </h1>
        </div>
      </div>

      <div className="glass-card p-10 md:p-14 border-white/5 relative overflow-hidden shadow-2xl shadow-brand/5">
        <div className="absolute top-0 right-0 p-14 opacity-5 pointer-events-none">
          <Briefcase className="w-48 h-48 text-brand" />
        </div>
        
        <div className="relative z-10 max-w-3xl space-y-10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand transition-colors" />
              <input 
                type="text"
                placeholder="Search by role, company, or skills in India..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-white/5 border border-white/10 rounded-full py-6 pl-16 pr-8 focus:outline-none focus:border-brand/50 transition-all text-lg font-medium placeholder:text-zinc-600"
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary px-14 py-6 rounded-full flex items-center justify-center gap-3 disabled:opacity-50 min-w-[200px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  AI Search
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {['India', 'Remote', 'Full-time', 'Contract', 'Internship'].map((f) => (
              <button key={f} className="px-6 py-2.5 bg-white/5 border border-white/5 rounded-full text-xs font-bold text-zinc-400 hover:border-brand/30 hover:text-white hover:bg-brand/5 transition-all">
                {f}
              </button>
            ))}
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 ml-auto">
              <Sparkles className="w-3 h-3 text-brand" />
              Real-time Search Powered by HireSense AI
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {jobs.length > 0 ? jobs.map((job) => (
          <motion.div 
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="glass-card p-10 border-white/5 hover:border-brand/30 transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl -mr-16 -mt-16 group-hover:bg-brand/10 transition-all" />
            
            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center group-hover:bg-brand/10 group-hover:border-brand/20 transition-all">
                  <Building2 className="w-8 h-8 text-zinc-500 group-hover:text-brand transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white group-hover:text-brand transition-colors">{job.title}</h3>
                  <p className="text-sm text-zinc-500 font-medium">{job.company}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 mb-2">AI Match</p>
                <p className="text-3xl font-serif italic text-white">{job.match}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-10 relative z-10">
              <div className="flex items-center gap-3 text-xs font-medium text-zinc-400">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                </div>
                {job.location}
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-zinc-400">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-zinc-500" />
                </div>
                {job.type}
              </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-white/5 relative z-10">
              <p className="text-lg font-bold text-white">{job.salary}</p>
              <a 
                href={job.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-[0.1em] hover:bg-white transition-all shadow-lg shadow-brand/20"
              >
                Apply Now
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center glass-card border-white/5">
            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">No jobs found for your search. Try different keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}
