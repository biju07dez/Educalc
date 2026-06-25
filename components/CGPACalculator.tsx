
import React, { useState, useEffect, useMemo } from 'react';
// Re-verifying react-router-dom import for compatibility
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  Layers, 
  BarChart3,
  Save,
  CheckCircle,
  Trash2,
  TrendingUp,
  History,
  CloudLightning,
  X,
  Smartphone,
  User,
  RefreshCw,
  Zap
} from 'lucide-react';
import { UserRecord, CGPARecord } from '../types.ts';

interface CGPACalculatorProps {
  user: UserRecord;
  setUser: (u: UserRecord) => void;
}

const CGPACalculator: React.FC<CGPACalculatorProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  
  // Extract latest personal GPA for each semester from history
  const historyMap = useMemo(() => {
    const map: Record<number, number> = {};
    // Sort by date descending to get the most recent entry for each semester
    const sortedHistory = [...user.gpaHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    sortedHistory.forEach(record => {
      if (!map[record.semester]) {
        map[record.semester] = record.gpa;
      }
    });
    return map;
  }, [user.gpaHistory]);

  const maxHistorySem = useMemo(() => {
    const sems = Object.keys(historyMap).map(Number);
    return sems.length > 0 ? Math.max(...sems) : 2;
  }, [historyMap]);

  const [numSemesters, setNumSemesters] = useState(Math.max(2, maxHistorySem));
  const [semGPAs, setSemGPAs] = useState<string[]>(Array(10).fill(''));
  const [result, setResult] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isMyResult, setIsMyResult] = useState(true);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

  // Sync state with history on mount or when history changes
  useEffect(() => {
    const newGPAs = [...semGPAs];
    let changed = false;
    for (let i = 1; i <= 10; i++) {
      if (historyMap[i] !== undefined && newGPAs[i - 1] === '') {
        newGPAs[i - 1] = historyMap[i].toString();
        changed = true;
      }
    }
    if (changed) setSemGPAs(newGPAs);
  }, [historyMap]);

  const calculateCGPA = () => {
    let sum = 0, count = 0;
    for (let i = 0; i < numSemesters; i++) {
      const val = parseFloat(semGPAs[i]);
      if (!isNaN(val)) { sum += val; count++; }
    }
    setResult(count > 0 ? Number((sum / count).toFixed(2)) : 0);
    setIsSaved(false);
    setIsMyResult(false);
  };

  const handleSaveResult = () => {
    if (result === null || isSaved || !isMyResult) return;
    const newRecord: CGPARecord = {
      id: Math.random().toString(36).substr(2, 9),
      cgpa: result,
      date: new Date().toISOString(),
      semestersCovered: numSemesters
    };
    setUser({ ...user, cgpaHistory: [newRecord, ...user.cgpaHistory] });
    setIsSaved(true);
    
    if (user.isGuest) {
      setShowRegisterPrompt(true);
    }
  };

  const deleteItem = (id: string) => {
    setUser({ ...user, cgpaHistory: user.cgpaHistory.filter(i => i.id !== id) });
  };

  const handleSyncReset = () => {
    const freshGPAs = Array(10).fill('');
    for (let i = 1; i <= 10; i++) {
      if (historyMap[i] !== undefined) {
        freshGPAs[i - 1] = historyMap[i].toString();
      }
    }
    setSemGPAs(freshGPAs);
    setResult(null);
  };

  const reset = () => {
    setSemGPAs(Array(10).fill(''));
    setResult(null);
    setIsSaved(false);
    setIsMyResult(false);
    setNumSemesters(2);
  };

  // Helper to check if all visible inputs are filled
  const isReadyToCalculate = useMemo(() => {
    return semGPAs.slice(0, numSemesters).every(val => val.trim() !== '');
  }, [semGPAs, numSemesters]);

  const isAnyInputFilled = useMemo(() => {
    return semGPAs.some(val => val.trim() !== '') || result !== null;
  }, [semGPAs, result]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 pb-20 relative">
      {showRegisterPrompt && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-[#1a2333] p-8 rounded-[3rem] shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setShowRegisterPrompt(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="w-20 h-20 bg-indigo-600/10 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <CloudLightning size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black dark:text-white tracking-tight">CGPA Saved!</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                This history is temporary and linked to this browser. Register now to sync your progress across all your devices.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/login')} 
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Sync Progress
              </button>
              <button 
                onClick={() => setShowRegisterPrompt(false)} 
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all"
              >
                Keep as Guest
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start px-2">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter dark:text-white">CGPA <span className="text-indigo-600">Master</span></h2>
          <p className="text-slate-400 font-medium text-base md:text-lg">Master your cumulative academic milestones.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          {isAnyInputFilled && (
            <button 
              onClick={reset} 
              className="p-4 bg-white dark:bg-slate-800 text-slate-500 rounded-2xl shadow-xl transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 border border-slate-100 dark:border-slate-700"
              title="Reset Calculator"
            >
              <RefreshCw size={20} />
            </button>
          )}
          {Object.keys(historyMap).length > 0 && (
            <button 
              onClick={handleSyncReset}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              <Zap size={14} className="fill-current" /> Sync History
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a2333] p-8 md:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl space-y-10">
        <div className="space-y-6">
          <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            <span className="flex items-center"><Layers size={18} className="mr-2 text-indigo-500" /> Semesters:</span>
            <span className="text-2xl text-indigo-600">{numSemesters}</span>
          </div>
          <input type="range" min="2" max="10" step="1" value={numSemesters} onChange={e => setNumSemesters(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-600" />
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {Array.from({ length: numSemesters }).map((_, i) => {
            const isSynced = historyMap[i + 1]?.toString() === semGPAs[i];
            return (
              <div key={i} className="space-y-3 relative group">
                <div className="flex justify-between items-center px-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sem {i + 1}</label>
                   {isSynced && (
                     <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                        <Zap size={8} className="fill-emerald-500" /> Synced
                     </span>
                   )}
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="10" 
                    placeholder="0.00" 
                    value={semGPAs[i]} 
                    onChange={e => { 
                      const v = [...semGPAs]; 
                      v[i] = e.target.value; 
                      setSemGPAs(v);
                      setResult(null); 
                    }} 
                    className={`w-full p-5 bg-slate-50 dark:bg-slate-900 rounded-[2rem] font-black text-center text-xl md:text-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner ${isSynced ? 'border border-emerald-500/20' : 'border-transparent'}`} 
                  />
                  {isSynced && (
                    <div className="absolute -right-1 -top-1 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={calculateCGPA} 
          disabled={!isReadyToCalculate}
          className={`w-full py-7 bg-indigo-600 text-white font-black rounded-full shadow-2xl uppercase tracking-widest transition-all flex items-center justify-center space-x-3 ${!isReadyToCalculate ? 'opacity-50 cursor-not-allowed grayscale-[0.5]' : 'active:scale-95 hover:bg-indigo-700 hover:shadow-indigo-500/40'}`}
        >
          <BarChart3 size={20} /> <span>Calculate CGPA</span>
        </button>

        {result !== null && (
          <div className="animate-in slide-in-from-top-4 flex flex-col items-center space-y-6">
            <div className="w-48 aspect-square bg-white dark:bg-[#0b1220] rounded-[3rem] flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-2xl">
              <p className="text-slate-400 font-black uppercase text-[10px] mb-1">Cumulative</p>
              <h2 className={`text-6xl font-black ${result < 5 ? 'text-red-500' : result >= 8.5 ? 'text-emerald-500' : 'text-indigo-600 dark:text-white'}`}>{result.toFixed(2)}</h2>
            </div>
            
            {!isSaved && (
              <div 
                onClick={() => setIsMyResult(!isMyResult)}
                className={`group cursor-pointer flex items-center gap-4 px-6 py-4 rounded-3xl transition-all duration-300 border w-full max-sm ${isMyResult ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-900 border-transparent'}`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isMyResult ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-transparent'}`}>
                  <CheckCircle size={14} />
                </div>
                <div className="flex flex-col text-left">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isMyResult ? 'text-emerald-600' : 'text-slate-400'}`}>My Result Verification</span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Confirm this result is mine</span>
                </div>
              </div>
            )}

            <button 
              onClick={handleSaveResult} 
              disabled={isSaved || !isMyResult} 
              className={`w-full py-6 font-black rounded-full uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-3 ${isSaved ? 'bg-emerald-500 text-white' : isMyResult ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
            >
              {isSaved ? <><CheckCircle size={22} /> <span>{user.isGuest ? 'SAVED TO DEVICE' : 'RESULT SAVED'}</span></> : <><Save size={22} /> <span>Save History</span></>}
            </button>
            
            {!isMyResult && !isSaved && (
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <User size={12} /> External calculation
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default CGPACalculator;
