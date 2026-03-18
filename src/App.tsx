import { useState, useEffect, useRef } from 'react';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { UserProfile, Interview, Weakness, PrepPlan } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InterviewRoom from './components/InterviewRoom';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import PrepPlanner from './components/PrepPlanner';
import Performance from './components/Performance';
import JobFinder from './components/JobFinder';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, BrainCircuit, Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'interview' | 'resume' | 'study-plan' | 'performance' | 'job-finder'>('dashboard');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [plans, setPlans] = useState<PrepPlan[]>([]);

  const unsubscribers = useRef<(() => void)[]>([]);

  const GUEST_USER_ID = 'guest_user_v1';

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      try {
        // Cleanup previous listeners
        unsubscribers.current.forEach(unsub => unsub());
        unsubscribers.current = [];

        const effectiveUid = u ? u.uid : GUEST_USER_ID;
        setUser(u);

        let currentProfile: UserProfile;
        const userDoc = await getDoc(doc(db, 'users', effectiveUid));
        
        if (!userDoc.exists()) {
          currentProfile = {
            uid: effectiveUid,
            displayName: u?.displayName || 'Guest User',
            email: u?.email || 'guest@hiresense.ai',
            photoURL: u?.photoURL || '',
            role: 'user',
            skills: [],
            avgScore: 0,
            totalInterviews: 0,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', effectiveUid), currentProfile);
        } else {
          currentProfile = userDoc.data() as UserProfile;
        }
        setProfile(currentProfile);

        // Listen for interviews
        const qInterviews = query(collection(db, 'interviews'), where('userId', '==', effectiveUid), orderBy('createdAt', 'desc'));
        const unsubInterviews = onSnapshot(qInterviews, (snap) => {
          setInterviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Interview)));
        }, (err) => console.error("Interviews sync error:", err));
        unsubscribers.current.push(unsubInterviews);

        // Listen for weaknesses
        const qWeaknesses = query(collection(db, 'weaknesses'), where('userId', '==', effectiveUid));
        const unsubWeaknesses = onSnapshot(qWeaknesses, (snap) => {
          setWeaknesses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Weakness)));
        }, (err) => console.error("Weaknesses sync error:", err));
        unsubscribers.current.push(unsubWeaknesses);

        // Listen for plans
        const qPlans = query(collection(db, 'plans'), where('userId', '==', effectiveUid), orderBy('createdAt', 'desc'));
        const unsubPlans = onSnapshot(qPlans, (snap) => {
          setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as PrepPlan)));
        }, (err) => console.error("Plans sync error:", err));
        unsubscribers.current.push(unsubPlans);

      } catch (error) {
        console.error("Auth state change error:", error);
        // Fallback to guest profile on error
        setProfile({
          uid: GUEST_USER_ID,
          displayName: 'Guest User',
          email: 'guest@hiresense.ai',
          photoURL: '',
          role: 'user',
          skills: [],
          avgScore: 0,
          totalInterviews: 0,
          createdAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribers.current.forEach(unsub => unsub());
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050505] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} logout={logout} login={signInWithGoogle} />
      
      <main className="flex-1 px-8 py-12 overflow-y-auto h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Dashboard profile={profile} interviews={interviews} weaknesses={weaknesses} />
            </motion.div>
          )}
          {activeTab === 'interview' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <InterviewRoom profile={profile} weaknesses={weaknesses} />
            </motion.div>
          )}
          {activeTab === 'resume' && (
            <motion.div
              key="resume"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ResumeAnalyzer profile={profile} />
            </motion.div>
          )}
          {activeTab === 'study-plan' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PrepPlanner profile={profile} plans={plans} weaknesses={weaknesses} />
            </motion.div>
          )}
          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Performance profile={profile} interviews={interviews} weaknesses={weaknesses} />
            </motion.div>
          )}
          {activeTab === 'job-finder' && (
            <motion.div
              key="job-finder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <JobFinder profile={profile} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
