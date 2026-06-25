import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Award,
  Calculator,
  Zap,
  User as UserIcon,
  Menu,
  X,
  MessageSquare,
  Scan,
  ArrowUp
} from 'lucide-react';
import { UserRecord } from './types.ts';
import GPACalculator from './components/GPACalculator.tsx';
import CGPACalculator from './components/CGPACalculator.tsx';
import SimpleAIScanner from './components/SimpleAIScanner.tsx';
import Profile from './pages/Profile.tsx';
import Login from './pages/Login.tsx';
import Feedback from './pages/Feedback.tsx';

const AppContent = () => {
  const [user, setUser] = useState<UserRecord>(() => {
    try {
      const saved = localStorage.getItem('educalc_user_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 'guest-' + Math.random().toString(36).substr(2, 9),
      name: 'Guest User',
      registerNumber: 'GUEST-USER',
      department: '',
      role: 'student',
      gpaHistory: [],
      cgpaHistory: [],
      badges: [],
      isGuest: true
    };
  });

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const mainRef = useRef<HTMLElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (e.currentTarget.scrollTop > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    setShowScrollTop(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleUpdateUser = (updatedUser: UserRecord | null) => {
    if (updatedUser) {
      setUser(updatedUser);
      localStorage.setItem('educalc_user_data', JSON.stringify(updatedUser));
    } else {
      const freshGuest: UserRecord = {
        id: 'guest-' + Math.random().toString(36).substr(2, 9),
        name: 'Guest User',
        registerNumber: 'GUEST-USER',
        department: '',
        role: 'student',
        gpaHistory: [],
        cgpaHistory: [],
        badges: [],
        isGuest: true
      };
      setUser(freshGuest);
      localStorage.setItem('educalc_user_data', JSON.stringify(freshGuest));
    }
  };

  const NavLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to || (to === '/' && location.pathname === '/gpa');
    return (
      <Link 
        to={to} 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${
          isActive 
            ? 'bg-brand-600 text-white shadow-xl shadow-brand-500/30 scale-[1.02]' 
            : 'text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400'
        }`}
      >
        <Icon size={20} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-950 text-slate-900 dark:text-slate-100 flex flex-col h-screen overflow-hidden">
      <header className="sticky top-0 w-full bg-white/80 dark:bg-surface-950/80 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800/50 z-[60] h-20 flex items-center px-6 shrink-0">
        <div className="flex items-center space-x-4 flex-1">
          <div 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <Calculator className="text-white" size={20} />
          </div>
          <Link to="/" className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter leading-none dark:text-white">EduCalc</span>
          </Link>
        </div>
        
        <button 
          className="p-3 bg-slate-100 dark:bg-surface-800 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-surface-700 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <div className={`fixed inset-0 z-[120] transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-surface-950/40 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className={`relative w-80 h-full bg-white dark:bg-surface-900 p-8 shadow-2xl space-y-2 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white">
              <Calculator size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter">EduCalc</span>
          </div>
          
          <NavLink to="/" icon={Zap} label="GPA Analyzer" />
          <NavLink to="/cgpa" icon={Award} label="CGPA Mastery" />
          <NavLink to="/scanner" icon={Scan} label="Visual Scan" />
          
          <div className="my-8 border-t border-slate-100 dark:border-slate-800/50 mx-2"></div>

          <NavLink to="/profile" icon={UserIcon} label="My Account" />
          <NavLink to="/feedback" icon={MessageSquare} label="Feedback" />
        </div>
      </div>
      
      <main ref={mainRef} onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="max-w-5xl mx-auto p-6 md:p-10">
          <Routes>
            <Route path="/" element={<GPACalculator user={user} setUser={handleUpdateUser} />} />
            <Route path="/login" element={<Login setUser={handleUpdateUser} />} />
            <Route path="/gpa" element={<GPACalculator user={user} setUser={handleUpdateUser} />} />
            <Route path="/cgpa" element={<CGPACalculator user={user} setUser={handleUpdateUser} />} />
            <Route path="/scanner" element={<SimpleAIScanner user={user} setUser={handleUpdateUser} />} />
            <Route path="/feedback" element={user && !user.isGuest ? <Feedback user={user} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={<Profile user={user} setUser={handleUpdateUser} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-28 right-6 md:right-10 z-[110] p-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 animate-in fade-in zoom-in-75 duration-200"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} strokeWidth={2.5} />
        </button>
      )}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/90 dark:bg-surface-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 px-10 py-3 flex justify-between items-center rounded-3xl shadow-2xl z-[100] animate-in slide-in-from-bottom-10 duration-700">
        <Link to="/gpa" className={`p-3 transition-all duration-300 ${location.pathname === '/' || location.pathname === '/gpa' ? 'text-brand-600 scale-125' : 'text-slate-400'}`}>
          <Zap size={24} strokeWidth={2.5} />
        </Link>
        <Link to="/cgpa" className={`p-3 transition-all duration-300 ${location.pathname === '/cgpa' ? 'text-brand-600 scale-125' : 'text-slate-400'}`}>
          <Award size={24} strokeWidth={2.5} />
        </Link>
        <Link to="/scanner" className={`p-3 transition-all duration-300 ${location.pathname === '/scanner' ? 'text-brand-600 scale-125' : 'text-slate-400'}`}>
          <Scan size={24} strokeWidth={2.5} />
        </Link>
        <Link to="/profile" className={`p-3 transition-all duration-300 ${location.pathname === '/profile' ? 'text-brand-600 scale-125' : 'text-slate-400'}`}>
          <UserIcon size={24} strokeWidth={2.5} />
        </Link>
      </nav>
    </div>
  );
};

const App = () => (
  <HashRouter>
    <AppContent />
  </HashRouter>
);

export default App;