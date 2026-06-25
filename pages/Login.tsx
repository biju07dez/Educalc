
import React, { useState, useEffect } from 'react';
// Re-verifying react-router-dom import for compatibility
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Calculator, ArrowRight, Smartphone, Fingerprint, Tag, Lock, AlertCircle, Cpu, Loader2 } from 'lucide-react';
import { UserRecord } from '../types.ts';

const Login = ({ setUser }: { setUser: (user: UserRecord) => void }) => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    department: '',
    password: ''
  });

  useEffect(() => {
    fetch('subjects.json')
      .then(res => res.json())
      .then(data => setDepartments(data.departments.map((d: any) => ({ id: d.id, name: d.name }))));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAuthenticating(true);

    if (!formData.department || !formData.registerNumber || !formData.password) {
      setError("Institutional parameters required.");
      setIsAuthenticating(false);
      return;
    }

    setTimeout(() => {
      const usersDb: Record<string, UserRecord> = JSON.parse(localStorage.getItem('educalc_users_registry') || '{}');
      const existingUser = usersDb[formData.registerNumber];

      if (existingUser) {
        if (existingUser.password === formData.password) {
          setUser(existingUser);
          navigate('/');
        } else {
          setError("Access credentials invalid.");
          setIsAuthenticating(false);
        }
      } else {
        const newUser: UserRecord = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name || 'Scholar',
          registerNumber: formData.registerNumber,
          department: formData.department,
          password: formData.password,
          role: 'student',
          gpaHistory: [],
          cgpaHistory: [],
          badges: ['pioneer'],
          isGuest: false
        };
        usersDb[formData.registerNumber] = newUser;
        localStorage.setItem('educalc_users_registry', JSON.stringify(usersDb));
        setUser(newUser);
        navigate('/');
      }
    }, 1500);
  };

  const handleGuest = () => {
    const user: UserRecord = {
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
    setUser(user);
    navigate('/');
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center py-12 px-4 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-600/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
      
      <div className="w-full max-w-xl bg-white/70 dark:bg-surface-900/70 backdrop-blur-3xl p-10 md:p-16 rounded-[4rem] shadow-2xl border border-white/50 dark:border-slate-800/50 relative overflow-hidden">
        <div className="flex flex-col items-center text-center mb-12 relative z-10">
          <div className="w-20 h-20 bg-brand-600 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-2xl shadow-brand-500/40 relative group">
            <Calculator size={36} className="group-hover:rotate-12 transition-transform" />
            <div className="absolute -inset-2 border-2 border-brand-500/20 rounded-[2.2rem] animate-pulse"></div>
          </div>
          <h2 className="text-5xl font-black dark:text-white tracking-tighter">EduCalc</h2>
          <p className="text-slate-500 mt-3 font-bold text-[10px] uppercase tracking-[0.4em] flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" /> Secure Institutional Access
          </p>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-xs font-bold leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input 
              type="text" 
              required 
              placeholder="Full Identification Name" 
              className="w-full p-5 bg-slate-50 dark:bg-surface-950 dark:text-white rounded-3xl border-none font-bold outline-none focus:ring-2 focus:ring-brand-600 transition-all text-sm shadow-inner" 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department Stream</label>
            <div className="relative">
              <select 
                required 
                value={formData.department} 
                onChange={(e) => setFormData({...formData, department: e.target.value})} 
                className="w-full p-5 bg-slate-50 dark:bg-surface-950 dark:text-white rounded-3xl border-none font-bold outline-none appearance-none focus:ring-2 focus:ring-brand-600 transition-all text-sm shadow-inner"
              >
                <option value="" disabled>Select Department</option>
                {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
              </select>
              <Tag size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reg Number</label>
              <input 
                type="text" 
                inputMode="numeric"
                required 
                placeholder="Ex: 9612..." 
                className="w-full p-5 bg-slate-50 dark:bg-surface-950 dark:text-white rounded-3xl border-none font-bold outline-none focus:ring-2 focus:ring-brand-600 transition-all text-sm shadow-inner" 
                onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
              <div className="relative">
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  className="w-full p-5 bg-slate-50 dark:bg-surface-950 dark:text-white rounded-3xl border-none font-bold outline-none focus:ring-2 focus:ring-brand-600 transition-all text-sm shadow-inner" 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                />
                <Lock size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isAuthenticating}
            className="w-full py-6 bg-brand-600 text-white font-black rounded-full shadow-2xl shadow-brand-500/30 hover:bg-brand-700 active:scale-95 transition-all flex items-center justify-center space-x-4 uppercase tracking-widest text-[11px]"
          >
            {isAuthenticating ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>Secure Login</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
          
          <button 
            type="button" 
            onClick={handleGuest} 
            className="w-full py-2 text-slate-400 font-black hover:text-brand-500 transition-colors uppercase tracking-widest text-[10px]"
          >
            Continue as Guest Node
          </button>
        </form>

        <div className="mt-12 flex justify-center space-x-10 text-slate-200 dark:text-slate-800 transition-colors">
           <div className="flex flex-col items-center gap-1"><Smartphone size={24} /><span className="text-[8px] font-bold">MOBILE</span></div>
           <div className="flex flex-col items-center gap-1"><Fingerprint size={24} /><span className="text-[8px] font-bold">BIOMETRIC</span></div>
           <div className="flex flex-col items-center gap-1"><ShieldCheck size={24} /><span className="text-[8px] font-bold">AES-256</span></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
