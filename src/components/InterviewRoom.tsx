import { useState, useEffect, useRef } from 'react';
import { UserProfile, Interview, Question, Weakness, InterviewMode } from '../types';
import { InterviewerAgent, EvaluatorAgent, CoachAgent } from '../services/gemini';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic2, 
  Send, 
  ChevronRight, 
  BrainCircuit, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Lightbulb,
  Trophy,
  ArrowRight,
  RefreshCw,
  Building2,
  ShieldCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface InterviewRoomProps {
  profile: UserProfile | null;
  weaknesses: Weakness[];
}

export default function InterviewRoom({ profile, weaknesses }: InterviewRoomProps) {
  const [step, setStep] = useState<'setup' | 'interview' | 'result'>('setup');
  const [mode, setMode] = useState<InterviewMode>('Technical');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [answer, setAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastEmotion, setLastEmotion] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome for the best experience.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening until manually stopped
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please enable microphone permissions in your browser settings.");
        } else if (event.error === 'network') {
          alert("Network error occurred during speech recognition. Please check your connection.");
        }
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setAnswer(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setIsListening(false);
    }
  };

  const startInterview = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const firstQuestion = await InterviewerAgent.generateQuestion(
        mode, 
        [], 
        undefined, 
        weaknesses.map(w => w.topic),
        company
      );

      const newInterview: Interview = {
        userId: profile.uid,
        mode,
        company,
        status: 'ongoing',
        questions: [{ question: firstQuestion }],
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'interviews'), newInterview);
      setCurrentInterview({ ...newInterview, id: docRef.id });
      setCurrentQuestion(firstQuestion);
      setStep('interview');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentInterview || !answer.trim() || !profile) return;
    
    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsEvaluating(true);
    setHint(null);

    try {
      const evaluation = await EvaluatorAgent.evaluateAnswer(currentQuestion, answer);
      setLastEmotion(evaluation.emotion);
      
      const updatedQuestions = [...currentInterview.questions];
      const lastIdx = updatedQuestions.length - 1;
      updatedQuestions[lastIdx] = {
        ...updatedQuestions[lastIdx],
        answer,
        feedback: evaluation.feedback,
        score: evaluation.score,
        timestamp: new Date().toISOString(),
      };

      // Update weaknesses if score is low
      if (evaluation.score < 6) {
        const topicMatch = await InterviewerAgent.generateQuestion('Technical', [], `Identify the core topic of this question: ${currentQuestion}`, [], '');
        const topic = topicMatch.split('\n')[0].trim();
        
        const q = query(collection(db, 'weaknesses'), where('userId', '==', profile.uid), where('topic', '==', topic));
        const snap = await getDocs(q);
        if (snap.empty) {
          await addDoc(collection(db, 'weaknesses'), {
            userId: profile.uid,
            topic,
            frequency: 1,
            lastEncountered: new Date().toISOString()
          });
        } else {
          const wDoc = snap.docs[0];
          await updateDoc(doc(db, 'weaknesses', wDoc.id), {
            frequency: wDoc.data().frequency + 1,
            lastEncountered: new Date().toISOString()
          });
        }
      }

      if (updatedQuestions.length >= 5) {
        // End interview
        const overall = await CoachAgent.getOverallEvaluation(updatedQuestions);
        const finalScore = updatedQuestions.reduce((acc, q) => acc + (q.score || 0), 0) / updatedQuestions.length;
        
        const finalInterview: Interview = {
          ...currentInterview,
          questions: updatedQuestions,
          status: 'completed',
          overallScore: finalScore,
          evaluation: overall
        };

        await updateDoc(doc(db, 'interviews', currentInterview.id!), finalInterview as any);
        
        // Update profile stats
        const newTotal = profile.totalInterviews + 1;
        const newAvg = ((profile.avgScore * profile.totalInterviews) + finalScore) / newTotal;
        await updateDoc(doc(db, 'users', profile.uid), {
          totalInterviews: newTotal,
          avgScore: newAvg
        });

        setCurrentInterview(finalInterview);
        setStep('result');
      } else {
        // Next question
        const nextQuestion = await InterviewerAgent.generateQuestion(
          mode, 
          updatedQuestions, 
          undefined, 
          weaknesses.map(w => w.topic),
          company
        );

        const nextInterview = {
          ...currentInterview,
          questions: [...updatedQuestions, { question: nextQuestion }]
        };

        await updateDoc(doc(db, 'interviews', currentInterview.id!), nextInterview as any);
        setCurrentInterview(nextInterview);
        setCurrentQuestion(nextQuestion);
        setAnswer('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getHint = async () => {
    setLoading(true);
    try {
      const response = await InterviewerAgent.generateQuestion(
        mode, 
        [], 
        `Provide a short, helpful hint for this question: ${currentQuestion}`, 
        [], 
        ''
      );
      setHint(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {step === 'setup' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-16 text-center border-white/5"
        >
          <div className="w-24 h-24 bg-brand/10 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-brand/20 shadow-xl shadow-brand/5">
            <Mic2 className="w-12 h-12 text-brand" />
          </div>
          <h2 className="text-5xl font-serif italic font-bold mb-6 tracking-tight">Configure your session</h2>
          <p className="text-zinc-400 mb-16 text-lg max-w-lg mx-auto leading-relaxed">Select your interview mode and target company to begin your adaptive coaching session.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16 text-left">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-6">Interview Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {['Technical', 'HR', 'Rapid Fire', 'Company-specific'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m as InterviewMode)}
                    className={`px-6 py-4 rounded-2xl text-sm font-bold transition-all border ${
                      mode === m ? 'bg-brand text-black border-brand shadow-lg shadow-brand/20' : 'bg-white/5 text-zinc-400 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-6">Target Company (Optional)</label>
              <div className="relative">
                <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="e.g. Google, TCS, Accenture"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-16 pr-6 focus:outline-none focus:border-brand/50 transition-all text-lg font-medium"
                />
              </div>
            </div>
          </div>

          <button
            onClick={startInterview}
            disabled={loading}
            className="btn-primary w-full py-6 text-xl flex items-center justify-center gap-4"
          >
            {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : (
              <>
                Start Mock Interview
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>
        </motion.div>
      )}

      {step === 'interview' && (
        <div className="space-y-8">
          {/* Progress Header */}
          <div className="glass-card p-8 flex items-center justify-between border-white/5">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center border border-brand/20">
                <BrainCircuit className="w-7 h-7 text-brand" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Session Progress</p>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-48 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-brand transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,107,0,0.5)]" 
                      style={{ width: `${(currentInterview?.questions.length || 0) * 20}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">{currentInterview?.questions.length}<span className="text-zinc-500">/5</span></span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">AI Evaluator Active</span>
            </div>
          </div>

          {/* Question Card */}
          <motion.div 
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-12 md:p-20 relative overflow-hidden border-white/5"
          >
            <div className="absolute top-0 right-0 p-12">
               <span className="text-[160px] font-serif italic text-white/5 absolute -top-20 -right-8 select-none pointer-events-none">Q</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-serif italic font-medium leading-[1.4] mb-12 relative z-10 text-white">
              {currentQuestion}
            </h3>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={getHint}
                className="flex items-center gap-3 text-xs font-bold text-brand uppercase tracking-widest hover:bg-brand/10 px-6 py-3 rounded-full transition-all border border-transparent hover:border-brand/20"
              >
                <Lightbulb className="w-5 h-5" />
                Get a Hint
              </button>
            </div>
            
            {hint && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-10 p-6 bg-brand/5 border border-brand/10 rounded-3xl text-base text-orange-100/80 leading-relaxed"
              >
                <p className="font-bold mb-2 flex items-center gap-2 text-brand">
                  <Lightbulb className="w-4 h-4" />
                  AI Coach Insight:
                </p>
                {hint}
              </motion.div>
            )}
          </motion.div>

          {/* Answer Input */}
          <div className="relative">
            <textarea 
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-64 glass-card p-10 focus:outline-none focus:border-brand/50 transition-all resize-none text-xl leading-relaxed border-white/5"
            />
            <div className="absolute bottom-8 left-8 flex items-center gap-6">
              <button 
                onClick={toggleListening}
                className={`p-5 rounded-2xl border transition-all shadow-xl relative ${
                  isListening ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                <Mic2 className="w-6 h-6" />
                {isListening && (
                  <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full whitespace-nowrap shadow-lg">
                    Listening... Click to stop
                  </span>
                )}
              </button>
              <button 
                onClick={submitAnswer}
                disabled={!answer.trim() || isEvaluating}
                className="btn-primary px-12 py-5 text-lg flex items-center gap-4"
              >
                {isEvaluating ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    Submit Answer
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
            {lastEmotion && (
              <div className="absolute -top-14 right-0 flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Detected Emotion:</span>
                <span className="text-sm font-bold text-brand">{lastEmotion}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'result' && currentInterview && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-10"
        >
          <div className="glass-card p-16 text-left relative overflow-hidden border-white/5">
            <div className="absolute top-0 left-0 w-full h-2 bg-brand shadow-[0_0_20px_rgba(255,107,0,0.5)]" />
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-5xl font-serif italic font-bold mb-3 tracking-tight">Interview Summary</h2>
                <p className="text-zinc-400 text-lg">Multi-agent intelligence performance report</p>
              </div>
              <div className="text-right bg-white/5 p-8 rounded-[2rem] border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Overall Score</p>
                <p className="text-6xl font-bold text-brand">
                  {(currentInterview.overallScore || 0).toFixed(1)}<span className="text-2xl text-zinc-500">/10</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {[
                { label: 'Technical Accuracy', val: currentInterview.evaluation?.technical || 0, color: 'text-brand' },
                { label: 'Communication Skills', val: currentInterview.evaluation?.communication || 0, color: 'text-blue-500' },
                { label: 'Confidence Level', val: currentInterview.evaluation?.confidence || 0, color: 'text-emerald-500' },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">{s.label}</p>
                  <p className={`text-4xl font-bold ${s.color}`}>{s.val}<span className="text-base text-zinc-500">/10</span></p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
              <div className="space-y-10">
                <div>
                  <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-emerald-500">
                    <CheckCircle2 className="w-6 h-6" />
                    Strong Areas
                  </h4>
                  <ul className="space-y-4">
                    {currentInterview.evaluation?.strongAreas.map((area, i) => (
                      <li key={i} className="flex items-center gap-4 text-zinc-300 text-base">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-red-500">
                    <AlertCircle className="w-6 h-6" />
                    Weak Areas
                  </h4>
                  <ul className="space-y-4">
                    {currentInterview.evaluation?.weakAreas.map((area, i) => (
                      <li key={i} className="flex items-center gap-4 text-zinc-300 text-base">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 shadow-inner">
                <h4 className="font-bold text-xl mb-8 flex items-center gap-3 text-brand">
                  <Lightbulb className="w-6 h-6" />
                  Actionable Suggestions
                </h4>
                <ul className="space-y-5">
                  {currentInterview.evaluation?.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex gap-4 text-zinc-300 text-base leading-relaxed">
                      <span className="text-brand font-bold text-xl">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 mb-16">
              <h4 className="font-bold text-xl mb-6 flex items-center gap-3">
                <BrainCircuit className="w-6 h-6 text-brand" />
                Coach's Final Summary
              </h4>
              <div className="prose prose-invert max-w-none text-zinc-300 text-base leading-relaxed">
                <ReactMarkdown>{currentInterview.evaluation?.summary || ''}</ReactMarkdown>
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary px-16 py-6 text-xl flex items-center gap-4"
              >
                <RefreshCw className="w-6 h-6" />
                Start New Session
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
