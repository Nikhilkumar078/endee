import { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { ResumeAnalyzer as AnalyzerAgent } from '../services/gemini';
import { db } from '../firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Target, 
  Zap,
  ArrowRight,
  ChevronRight,
  FileUp,
  History,
  RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface ResumeAnalyzerProps {
  profile: UserProfile | null;
}

export default function ResumeAnalyzer({ profile }: ResumeAnalyzerProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ 
    skills: string[]; 
    projects: string[]; 
    summary: string;
    atsScore: number;
    atsSuggestions: string[];
  } | null>(null);
  const [improvements, setImprovements] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setLoading(true);
    try {
      const extractedText = await extractTextFromPdf(file);
      setText(extractedText);
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      alert('Failed to extract text from PDF. Please try pasting manually.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeResume = async () => {
    if (!text.trim() || !profile) return;
    setLoading(true);
    try {
      const analysis = await AnalyzerAgent.analyze(text);
      setResult(analysis);
      
      // Update profile skills
      await updateDoc(doc(db, 'users', profile.uid), {
        skills: Array.from(new Set([...profile.skills, ...analysis.skills]))
      });

      // The analysis now contains ATS suggestions and score
      setImprovements(analysis.summary);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-brand mb-3">Profile Optimization</h2>
          <h1 className="text-5xl font-serif italic font-bold tracking-tight">Resume Analyzer</h1>
        </div>
        <div className="flex gap-4">
          <button className="btn-secondary flex items-center gap-3">
            <History className="w-5 h-5" />
            Analysis History
          </button>
        </div>
      </div>

      <div className="glass-card p-12 md:p-16 overflow-hidden relative border-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <FileText className="w-64 h-64 text-brand" />
        </div>
        
        <div className="relative z-10 max-w-2xl mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand mb-4">Resume Intelligence</h2>
          <h3 className="text-4xl font-serif italic font-bold tracking-tight mb-6 text-white leading-tight">
            Optimize your <span className="text-brand">Professional Profile</span> for ATS
          </h3>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Upload your resume in PDF format or paste the text to extract skills, 
            detect gaps, and receive real-time AI-powered improvements.
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center gap-6 p-12 bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] hover:border-brand/30 hover:bg-brand/5 transition-all group"
            >
              <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center border border-brand/20 group-hover:scale-110 transition-transform shadow-xl shadow-brand/5">
                <FileUp className="w-8 h-8 text-brand" />
              </div>
              <div className="text-center">
                <p className="font-bold text-xl text-white">Upload PDF Resume</p>
                <p className="text-sm text-zinc-500 mt-2 font-medium">{fileName || 'Click to select file'}</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".pdf" 
                className="hidden" 
              />
            </button>
            
            <div className="flex-1">
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Or paste your resume text here..."
                className="w-full h-full min-h-[200px] bg-white/5 border border-white/10 rounded-[2.5rem] p-10 focus:outline-none focus:border-brand/50 transition-all resize-none text-base leading-relaxed text-zinc-300"
              />
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button 
              onClick={analyzeResume}
              disabled={loading || !text.trim()}
              className="btn-primary px-16 py-6 text-xl flex items-center gap-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : (
                <>
                  Analyze Resume
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-10"
        >
          {/* Skills & Projects */}
          <div className="lg:col-span-2 space-y-10">
            {/* ATS Score Card */}
            <div className="glass-card p-10 relative overflow-hidden border-white/5">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <CheckCircle2 className="w-40 h-40 text-emerald-500" />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-3">ATS Compatibility Score</h3>
                  <p className="text-6xl font-serif italic font-bold text-white tracking-tighter">{result.atsScore}%</p>
                  <p className="text-sm text-zinc-500 mt-4 font-medium max-w-xs">Your resume is highly optimized for modern applicant tracking systems.</p>
                </div>
                <div className="w-32 h-32 rounded-full border-8 border-white/5 flex items-center justify-center relative shadow-2xl">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-white/5"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={351.8}
                      strokeDashoffset={351.8 - (351.8 * result.atsScore) / 100}
                      className="text-emerald-500 transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ATS OK</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-10 border-white/5">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center border border-brand/20">
                  <Target className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Extracted Skills</h3>
                  <p className="text-xs text-zinc-500 font-medium">Core competencies detected from your profile</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {result.skills.map((skill, i) => (
                  <span key={i} className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-semibold text-zinc-300 hover:bg-white/10 hover:text-white hover:border-brand/30 transition-all cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-card p-10 border-white/5">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Key Projects</h3>
                  <p className="text-xs text-zinc-500 font-medium">Significant achievements and contributions</p>
                </div>
              </div>
              <div className="space-y-5">
                {result.projects.map((project, i) => (
                  <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-[1.5rem] flex items-center justify-between group hover:border-white/10 transition-all">
                    <p className="font-medium text-base text-zinc-300 group-hover:text-white transition-colors leading-relaxed">{project}</p>
                    <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/5 transition-all shrink-0 ml-6">
                      <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Improvements & ATS Suggestions */}
          <div className="space-y-10">
            <div className="glass-card p-10 border-white/5">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">ATS Suggestions</h3>
                  <p className="text-xs text-zinc-500 font-medium">Critical improvements for compatibility</p>
                </div>
              </div>
              <div className="space-y-6">
                {result.atsSuggestions.map((suggestion, i) => (
                  <div key={i} className="flex gap-5 text-base text-zinc-400 leading-relaxed group">
                    <div className="mt-2 w-2 h-2 rounded-full bg-yellow-500 shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.5)] group-hover:scale-125 transition-transform" />
                    <p className="group-hover:text-zinc-200 transition-colors">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-10 border-white/5">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Profile Summary</h3>
                  <p className="text-xs text-zinc-500 font-medium">AI-generated professional overview</p>
                </div>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed italic font-serif text-lg">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
            </div>

            <div className="bg-brand/5 border border-brand/10 rounded-[2.5rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <AlertCircle className="w-32 h-32 text-brand" />
              </div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center border border-brand/20">
                  <AlertCircle className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-bold text-xl text-brand">Gap Detection</h3>
              </div>
              <p className="text-base text-orange-100/70 leading-relaxed relative z-10">
                Based on your profile, you might be missing certifications in 
                Cloud Architecture or advanced System Design patterns which are 
                highly valued for your target roles.
              </p>
            </div>
            
            <button 
              onClick={() => {
                setResult(null);
                setText('');
                setFileName(null);
              }}
              className="btn-secondary w-full py-6 flex items-center justify-center gap-4 text-lg"
            >
              <RefreshCw className="w-6 h-6" />
              Analyze New Resume
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
