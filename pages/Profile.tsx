import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRecord } from '../types.ts';
import { 
  User as UserIcon, 
  Hash, 
  BookOpen, 
  LogOut, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  X,
  Camera,
  Trash2,
  LogIn,
  ShieldAlert,
  CloudLightning,
  Award,
  Smartphone,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Profile = ({ user, setUser }: { user: UserRecord, setUser: (u: UserRecord | null) => void }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const performLogout = () => {
    setUser(null);
    setShowLogoutConfirm(false);
    navigate('/gpa');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUser({ ...user, profilePicture: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-[#1a2333] p-8 rounded-[3rem] shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto"><AlertTriangle size={32} /></div>
            <h3 className="text-2xl font-black dark:text-white tracking-tight">{user.isGuest ? 'Clear Data?' : 'Sign Out?'}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {user.isGuest 
                ? 'Your local calculation history will be permanently deleted.' 
                : 'You can sign back in at any time to access your data.'}
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={performLogout} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20">
                {user.isGuest ? 'Clear Local Data' : 'Confirm Logout'}
              </button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {user.isGuest && (
        <div className="bg-indigo-600 p-6 md:p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-500/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10"><CloudLightning size={120} /></div>
          <div className="space-y-1 text-center md:text-left relative z-10">
            <h3 className="text-xl md:text-2xl font-black tracking-tight">Upgrade Your Profile</h3>
            <p className="text-indigo-100 font-medium text-sm">Sign in to sync your history across devices and unlock achievements.</p>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:scale-105 transition-all active:scale-95 uppercase tracking-widest text-[10px] whitespace-nowrap relative z-10"
          >
            Create Account
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-[#1a2333] p-10 md:p-12 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        {!user.isGuest && (
          <div className="absolute top-0 right-0 p-8">
            <button onClick={() => setShowLogoutConfirm(true)} className="text-slate-400 hover:text-red-500 transition-colors p-2">
              <LogOut size={22} />
            </button>
          </div>
        )}
        <div 
          className={`relative group ${user.isGuest ? 'cursor-default' : 'cursor-pointer'}`} 
          onClick={() => !user.isGuest && fileInputRef.current?.click()}
        >
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-2xl relative">
            {user.profilePicture ? (
              <img src={user.profilePicture} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <div className={`w-full h-full ${user.isGuest ? 'bg-slate-400' : 'bg-indigo-600'} flex items-center justify-center text-white text-7xl font-black uppercase`}>
                {user.name.charAt(0)}
              </div>
            )}
            {!user.isGuest && (
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
            )}
          </div>
        </div>
        <div className="text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{user.name}</h2>
            {user.isGuest && <span className="mt-1 md:mt-0 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 font-black text-[10px] rounded-lg uppercase tracking-widest self-center md:self-auto">Local Session</span>}
          </div>
          <p className="text-indigo-600 dark:text-indigo-400 text-sm font-black uppercase tracking-[0.3em] mt-2">{user.role} • {user.registerNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#1a2333] p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
          <h3 className="text-2xl font-black flex items-center space-x-3 text-slate-800 dark:text-white"><UserIcon className="text-indigo-600" /> <span>Identity</span></h3>
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration ID</p>
              <p className="font-bold text-lg dark:text-white">{user.registerNumber}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</p>
              <p className="font-bold text-lg dark:text-white">{user.department || 'Not Specified'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2333] p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
          <h3 className="text-2xl font-black flex items-center space-x-3 text-slate-800 dark:text-white"><TrendingUp className="text-emerald-500" /> <span>Calculations</span></h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
            {(user.gpaHistory.length > 0 || user.cgpaHistory.length > 0) ? (
              <div className="space-y-4">
                {user.gpaHistory.sort((a,b) => b.semester - a.semester).map((record) => {
                  const isExpanded = expandedRecordId === record.id;
                  return (
                    <div 
                      key={record.id} 
                      onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                      className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-indigo-500/20 transition-all cursor-pointer flex flex-col"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                          <Calendar size={18} className="text-slate-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-black text-[10px] text-slate-700 dark:text-slate-300 uppercase">GPA Sem {record.semester}</span>
                            {user.isGuest && <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-0.5"><Smartphone size={8} /> Local</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-4 py-1.5 rounded-xl font-black text-sm ${record.gpa < 5 ? 'text-red-500 bg-red-500/10' : record.gpa >= 8.5 ? 'text-emerald-500 bg-emerald-500/10' : 'text-indigo-600 bg-indigo-500/10'}`}>{record.gpa.toFixed(2)}</span>
                          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </div>
                      </div>
                      
                      {isExpanded && record.subjects && record.subjects.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-left w-full animate-in fade-in slide-in-from-top-1 duration-200" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex justify-between px-1">
                            <span>Subject & Code</span>
                            <span>Credits • Grade</span>
                          </div>
                          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                            {record.subjects.map((sub, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs bg-slate-100/50 dark:bg-slate-900/30 p-2.5 rounded-xl gap-2">
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{sub.name}</span>
                                  <span className="font-mono text-[9px] text-slate-400">{sub.code}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">{sub.credits} C</span>
                                  <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md min-w-[28px] text-center">{sub.grade}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[9px] text-slate-400/80 font-semibold italic mt-2 text-center">
                            Calculated on: {new Date(record.date).toLocaleDateString(undefined, { dateStyle: 'medium' })} • {record.department}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {user.cgpaHistory.map((record) => (
                   <div key={record.id} className="flex items-center justify-between p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <Award size={18} className="text-indigo-400" />
                      <div className="flex flex-col">
                        <span className="font-black text-[10px] text-indigo-700 dark:text-indigo-300 uppercase">CGPA • {record.semestersCovered} Sems</span>
                        {user.isGuest && <span className="text-[8px] font-black text-indigo-400 uppercase flex items-center gap-0.5"><Smartphone size={8} /> Local</span>}
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl font-black text-sm ${record.cgpa < 5 ? 'text-red-500 bg-red-500/10' : record.cgpa >= 8.5 ? 'text-emerald-500 bg-emerald-500/10' : 'text-white bg-indigo-600'}`}>{record.cgpa.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 space-y-2">
                <ShieldAlert className="mx-auto text-slate-200" size={40} />
                <p className="text-slate-400 font-medium italic">No history found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;