
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen,
  ArrowRight,
  RefreshCcw,
  Trash2,
  TrendingUp,
  CheckCircle,
  CloudLightning,
  Check,
  GraduationCap,
  ChevronRight,
  X,
  Search,
  Pencil,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Grade, GRADE_POINTS, UserRecord, Subject, GPARecord } from '../types.ts';

interface GPACalculatorProps {
  user: UserRecord;
  setUser: (u: UserRecord) => void;
}

const GPACalculator: React.FC<GPACalculatorProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  
  const getDraft = () => {
    const draft = sessionStorage.getItem('educalc_gpa_draft');
    return draft ? JSON.parse(draft) : null;
  };

  const draft = getDraft();

  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [step, setStep] = useState(draft?.step || 1);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentId, setDepartmentId] = useState(draft?.departmentId || user?.department || '');
  const [semester, setSemester] = useState(draft?.semester || 0);
  const [loadedSubjects, setLoadedSubjects] = useState<Subject[]>(draft?.loadedSubjects || []);
  const [grades, setGrades] = useState<Record<string, Grade>>(draft?.grades || {});
  const [result, setResult] = useState<number | null>(draft?.result || null);
  const [isSaved, setIsSaved] = useState(draft?.isSaved || false);
  const [isMyResult, setIsMyResult] = useState(true);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [isDeptPickerOpen, setIsDeptPickerOpen] = useState(false);
  
  // Elective selection states
  const [isElectivePickerOpen, setIsElectivePickerOpen] = useState(false);
  const [activeElectiveIndex, setActiveElectiveIndex] = useState<number | null>(null);
  const [electiveSearchQuery, setElectiveSearchQuery] = useState('');

  // Honors Student features
  const [isHonors, setIsHonors] = useState<boolean>(draft?.isHonors || false);
  const [honorsSubjects, setHonorsSubjects] = useState<Array<Subject & { grade: Grade }>>(draft?.honorsSubjects || []);
  const [isHonorsPickerOpen, setIsHonorsPickerOpen] = useState(false);
  const [activeHonorsIndex, setActiveHonorsIndex] = useState<number | null>(null);
  const [honorsSearchQuery, setHonorsSearchQuery] = useState('');
  const [numHonorsInput, setNumHonorsInput] = useState<number>(draft?.numHonorsInput || 1);

  const honorsAvailableSubjects = useMemo(() => {
    const list: Subject[] = [];
    const seen = new Set<string>();
    departments.forEach(dept => {
      if (dept.id === departmentId) return; // exclude current department
      Object.values(dept.semesters).forEach((semSubjects: any) => {
        semSubjects.forEach((sub: any) => {
          const code = sub.code.toUpperCase();
          const isPlaceholder = code.startsWith('PE-') || code.startsWith('OE-') || sub.name.toLowerCase().includes('elective');
          if (!isPlaceholder && !seen.has(sub.code) && sub.credits > 0) {
            seen.add(sub.code);
            list.push({ ...sub, deptName: dept.name });
          }
        });
      });
    });
    return list.sort((a, b) => a.code.localeCompare(b.code));
  }, [departments, departmentId]);

  const filteredHonorsSubjects = useMemo(() => {
    if (!honorsSearchQuery.trim()) {
      return honorsAvailableSubjects.slice(0, 50);
    }
    const q = honorsSearchQuery.toLowerCase();
    return honorsAvailableSubjects.filter(sub => 
      sub.code.toLowerCase().includes(q) || 
      sub.name.toLowerCase().includes(q)
    );
  }, [honorsAvailableSubjects, honorsSearchQuery]);

  const handleSelectHonorsSubject = (index: number, selectedSub: Subject) => {
    if (honorsSubjects.some((s, i) => i !== index && s.code === selectedSub.code)) {
      alert("This subject is already selected for honors!");
      return;
    }
    if (loadedSubjects.some(s => s.code === selectedSub.code)) {
      alert("This subject is already in your current semester's syllabus!");
      return;
    }

    const newHonors = [...honorsSubjects];
    newHonors[index] = {
      ...selectedSub,
      grade: newHonors[index]?.grade || '-'
    };
    setHonorsSubjects(newHonors);
    setIsHonorsPickerOpen(false);
    setHonorsSearchQuery('');
  };

  useEffect(() => {
    if (isHonors) {
      if (honorsSubjects.length < numHonorsInput) {
        const diff = numHonorsInput - honorsSubjects.length;
        const added = Array.from({ length: diff }, () => ({
          code: `HONORS-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          name: 'Choose Honors Course',
          credits: 3,
          grade: '-' as Grade
        }));
        setHonorsSubjects([...honorsSubjects, ...added]);
      } else if (honorsSubjects.length > numHonorsInput) {
        setHonorsSubjects(honorsSubjects.slice(0, numHonorsInput));
      }
    }
  }, [numHonorsInput, isHonors]);

  useEffect(() => {
    if (isHonors && honorsSubjects.length === 0) {
      setHonorsSubjects(Array.from({ length: numHonorsInput }, () => ({
        code: `HONORS-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        name: 'Choose Honors Course',
        credits: 3,
        grade: '-' as Grade
      })));
    }
  }, [isHonors]);

  useEffect(() => {
    if (semester > 0 && semester < 5 && isHonors) {
      setIsHonors(false);
      setHonorsSubjects([]);
    }
  }, [semester, isHonors]);

  const allAvailableSubjects = useMemo(() => {
    const list: Subject[] = [];
    const seen = new Set<string>();
    departments.forEach(dept => {
      Object.values(dept.semesters).forEach((semSubjects: any) => {
        semSubjects.forEach((sub: any) => {
          const code = sub.code.toUpperCase();
          const isPlaceholder = code.startsWith('PE-') || code.startsWith('OE-') || sub.name.toLowerCase().includes('elective');
          if (!isPlaceholder && !seen.has(sub.code) && sub.credits > 0) {
            seen.add(sub.code);
            list.push(sub);
          }
        });
      });
    });
    return list.sort((a, b) => a.code.localeCompare(b.code));
  }, [departments]);

  const filteredElectives = useMemo(() => {
    if (!electiveSearchQuery.trim()) {
      return allAvailableSubjects.slice(0, 50); // initial 50 subjects
    }
    const q = electiveSearchQuery.toLowerCase();
    return allAvailableSubjects.filter(sub => 
      sub.code.toLowerCase().includes(q) || 
      sub.name.toLowerCase().includes(q)
    );
  }, [allAvailableSubjects, electiveSearchQuery]);

  const handleSelectElective = (index: number, selectedSub: Subject) => {
    const newSubjects = [...loadedSubjects];
    const oldCode = newSubjects[index].code;
    const originalPlaceholderCode = newSubjects[index].originalPlaceholderCode || oldCode;
    
    newSubjects[index] = {
      ...selectedSub,
      isCustomElective: true,
      originalPlaceholderCode
    };
    
    setLoadedSubjects(newSubjects);
    
    const oldGrade = grades[oldCode] || '-';
    const newGrades = { ...grades };
    delete newGrades[oldCode];
    newGrades[selectedSub.code] = oldGrade;
    setGrades(newGrades);
    setIsElectivePickerOpen(false);
    setElectiveSearchQuery('');
  };

  const handleResetElective = (index: number) => {
    const newSubjects = [...loadedSubjects];
    const sub = newSubjects[index];
    if (sub.isCustomElective && sub.originalPlaceholderCode) {
      const placeholderCode = sub.originalPlaceholderCode;
      let placeholderName = "Professional Elective";
      if (placeholderCode.startsWith('OE')) {
        placeholderName = "Open Elective";
      }
      
      newSubjects[index] = {
        code: placeholderCode,
        name: placeholderName,
        credits: 3
      };
      setLoadedSubjects(newSubjects);
      
      const newGrades = { ...grades };
      delete newGrades[sub.code];
      newGrades[placeholderCode] = '-';
      setGrades(newGrades);
    }
  };

  const isElective = (sub: Subject) => {
    const code = sub.code.toUpperCase();
    return code.startsWith('PE-') || code.startsWith('OE-') || sub.name.toLowerCase().includes('elective') || sub.isCustomElective;
  };

  useEffect(() => {
    sessionStorage.setItem('educalc_gpa_draft', JSON.stringify({
      step,
      departmentId,
      semester,
      loadedSubjects,
      grades,
      result,
      isSaved,
      isHonors,
      honorsSubjects,
      numHonorsInput
    }));
  }, [step, departmentId, semester, loadedSubjects, grades, result, isSaved, isHonors, honorsSubjects, numHonorsInput]);

  const availableSemesters = useMemo(() => {
    if (!departmentId) return [];
    const maxSems = departmentId === 'MBA' ? 10 : 8;
    return Array.from({ length: maxSems }, (_, i) => i + 1);
  }, [departmentId]);

  const isAllGradesSelected = useMemo(() => {
    const normalValid = loadedSubjects.length > 0 && loadedSubjects.every(sub => grades[sub.code] && grades[sub.code] !== '-');
    const honorsValid = !isHonors || (honorsSubjects.length > 0 && honorsSubjects.every(sub => 
      sub.code && !sub.code.startsWith('HONORS-') && sub.name !== 'Choose Honors Course' && sub.grade && sub.grade !== '-'
    ));
    return normalValid && honorsValid;
  }, [loadedSubjects, grades, isHonors, honorsSubjects]);

  useEffect(() => {
    fetch('subjects.json')
      .then(res => res.json())
      .then(data => setDepartments(data.departments || []))
      .catch(() => setFetchError('Failed to load curriculum data.'));
  }, []);

  const handleLoadAcademicData = async () => {
    if (!departmentId || semester === 0) return;

    setIsLoading(true);
    setFetchError(null);
    const dept = departments.find(d => d.id === departmentId);
    const subjects = dept?.semesters[semester.toString()];
    
    if (!subjects || subjects.length === 0) {
      setFetchError('Curriculum under update. Please try another semester.');
      setIsLoading(false);
      return;
    }

    const filteredSubjects = subjects.filter((s: Subject) => s.credits > 0);
    setLoadedSubjects(filteredSubjects);
    const initial: Record<string, Grade> = {};
    filteredSubjects.forEach((s: Subject) => initial[s.code] = '-');
    setGrades(initial);
    setStep(2);
    setIsLoading(false);
    setResult(null);
    setIsSaved(false);
    setIsMyResult(false);
  };

  const calculateGPA = () => {
    if (!isAllGradesSelected) return;
    
    let totalPoints = 0;
    let totalCredits = 0;
    loadedSubjects.forEach(sub => {
      const grade = grades[sub.code];
      if (grade && grade !== '-') {
        totalPoints += GRADE_POINTS[grade] * sub.credits;
        totalCredits += sub.credits;
      }
    });

    if (isHonors) {
      honorsSubjects.forEach(sub => {
        if (sub.grade && sub.grade !== '-') {
          totalPoints += GRADE_POINTS[sub.grade] * sub.credits;
          totalCredits += sub.credits;
        }
      });
    }

    setResult(totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0);
    setIsSaved(false);
  };

  const handleSaveResult = () => {
    if (result === null || isSaved || !isMyResult) return;
    const filteredHistory = user.gpaHistory.filter(r => r.semester !== semester);
    
    const combinedSubjects = [
      ...loadedSubjects.map(s => ({ ...s, grade: grades[s.code] || '-' })),
      ...(isHonors ? honorsSubjects.map(s => ({ ...s, grade: s.grade || '-' })) : [])
    ];

    const newRecord: GPARecord = {
      id: Math.random().toString(36).substr(2, 9),
      semester,
      gpa: result,
      department: departmentId,
      date: new Date().toISOString(),
      subjects: combinedSubjects
    };
    setUser({ ...user, gpaHistory: [newRecord, ...filteredHistory] });
    setIsSaved(true);
    
    if (user.isGuest) {
      setShowRegisterPrompt(true);
    }
  };

  const deleteGPAHistory = (id: string) => {
    setUser({ ...user, gpaHistory: user.gpaHistory.filter(r => r.id !== id) });
  };

  const reset = () => {
    setStep(1);
    setResult(null);
    setSemester(0);
    setIsSaved(false);
    setIsMyResult(false);
    setFetchError(null);
    setIsHonors(false);
    setHonorsSubjects([]);
    setNumHonorsInput(1);
    sessionStorage.removeItem('educalc_gpa_draft');
  };

  const selectedDept = departments.find(d => d.id === departmentId);
  const selectedDeptName = selectedDept?.name || 'Select Department Stream';

  // Fix: Added 'key' to props type to resolve TypeScript error when using GradeButton in a loop in JSX
  const GradeButton = ({ subCode, grade }: { subCode: string, grade: Grade, key?: React.Key }) => {
    const isRA = grade === 'RA';
    const isSelected = grades[subCode] === grade;
    
    let baseStyles = "w-11 h-11 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center justify-center";
    let activeStyles = "";
    let inactiveStyles = "";

    if (isRA) {
      activeStyles = "bg-rose-500 text-white scale-110 shadow-lg shadow-rose-500/30";
      inactiveStyles = "bg-rose-50 dark:bg-rose-950/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30";
    } else {
      activeStyles = "bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/30";
      inactiveStyles = "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700";
    }

    return (
      <button 
        onClick={() => setGrades({...grades, [subCode]: grade})} 
        className={`${baseStyles} ${isSelected ? activeStyles : inactiveStyles}`}
      >
        {grade}
      </button>
    );
  };

  const HonorsGradeButton = ({ honorsIndex, grade }: { honorsIndex: number, grade: Grade, key?: React.Key }) => {
    const isRA = grade === 'RA';
    const isSelected = honorsSubjects[honorsIndex]?.grade === grade;
    
    let baseStyles = "w-11 h-11 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center justify-center";
    let activeStyles = "";
    let inactiveStyles = "";

    if (isRA) {
      activeStyles = "bg-rose-500 text-white scale-110 shadow-lg shadow-rose-500/30";
      inactiveStyles = "bg-rose-50 dark:bg-rose-950/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30";
    } else {
      activeStyles = "bg-amber-500 text-white scale-110 shadow-lg shadow-amber-500/30";
      inactiveStyles = "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20";
    }

    const handleClick = () => {
      const newHonors = [...honorsSubjects];
      newHonors[honorsIndex] = {
        ...newHonors[honorsIndex],
        grade
      };
      setHonorsSubjects(newHonors);
    };

    return (
      <button 
        onClick={handleClick} 
        className={`${baseStyles} ${isSelected ? activeStyles : inactiveStyles}`}
      >
        {grade}
      </button>
    );
  };

  return (
    <div className="space-y-10 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 relative pb-10">
      {/* Department Picker Popup */}
      <div className={`fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 transition-all duration-300 ${isDeptPickerOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${isDeptPickerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsDeptPickerOpen(false)}
        ></div>
        <div 
          className={`relative w-full max-w-lg bg-white dark:bg-[#1a2333] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden transition-transform duration-300 transform ${isDeptPickerOpen ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95'}`}
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-black dark:text-white tracking-tight">Select Department</h3>
            <button onClick={() => setIsDeptPickerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              <button 
                onClick={() => { setDepartmentId(''); setSemester(0); setIsDeptPickerOpen(false); }}
                className={`w-full px-8 py-6 flex items-center justify-between transition-all duration-200 group ${!departmentId ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}`}
              >
                <span className={`text-base font-bold transition-colors ${!departmentId ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  None Selected
                </span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${!departmentId ? 'border-indigo-600 shadow-sm' : 'border-slate-300 dark:border-slate-700'}`}>
                  {!departmentId && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                </div>
              </button>

              {departments.map((dept) => {
                const isSelected = departmentId === dept.id;
                return (
                  <button
                    key={dept.id}
                    onClick={() => { setDepartmentId(dept.id); setSemester(0); setIsDeptPickerOpen(false); }}
                    className={`w-full px-8 py-6 flex items-center justify-between transition-all duration-200 group ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}`}
                  >
                    <div className="flex flex-col text-left pr-6">
                      <span className={`font-bold text-base transition-colors leading-tight ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-400'}`}>
                        {dept.name}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`}>
                        {dept.id}
                      </span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'border-indigo-600 scale-110 shadow-lg shadow-indigo-600/20' : 'border-slate-300 dark:border-slate-700 group-hover:border-slate-400'}`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-in zoom-in"></div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
             <p className="text-[10px] text-center font-black text-slate-400 uppercase tracking-widest">Secure Institutional Registry</p>
          </div>
        </div>
      </div>

      {/* Elective Picker Popup */}
      <div className={`fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 transition-all duration-300 ${isElectivePickerOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${isElectivePickerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsElectivePickerOpen(false)}
        ></div>
        <div 
          className={`relative w-full max-w-lg bg-white dark:bg-[#1a2333] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden transition-transform duration-300 transform ${isElectivePickerOpen ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95'}`}
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black dark:text-white tracking-tight">Select Elective Course</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Search curriculum database for your courses</p>
            </div>
            <button onClick={() => setIsElectivePickerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Search size={18} />
              </span>
              <input 
                type="text" 
                placeholder="Type course code or title..." 
                value={electiveSearchQuery} 
                onChange={(e) => setElectiveSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold dark:text-white text-sm"
              />
            </div>
          </div>
          
          <div className="max-h-[40vh] overflow-y-auto no-scrollbar">
            {filteredElectives.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-bold text-sm">
                No matching subjects found.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                {filteredElectives.map((sub) => (
                  <button
                    key={sub.code}
                    onClick={() => activeElectiveIndex !== null && handleSelectElective(activeElectiveIndex, sub)}
                    className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left transition-colors group"
                  >
                    <div className="flex flex-col pr-6">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                        {sub.name}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest mt-1 text-slate-400">
                        {sub.code}
                      </span>
                    </div>
                    <div className="shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-xl text-xs font-black">
                      {sub.credits} Credits
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 text-center border-t border-slate-100 dark:border-slate-800">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syllabus Academic Courses</p>
          </div>
        </div>
      </div>

      {/* Honors Picker Popup */}
      <div className={`fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 transition-all duration-300 ${isHonorsPickerOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${isHonorsPickerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsHonorsPickerOpen(false)}
        ></div>
        <div 
          className={`relative w-full max-w-lg bg-white dark:bg-[#1a2333] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden transition-transform duration-300 transform ${isHonorsPickerOpen ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95'}`}
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black dark:text-white tracking-tight text-amber-500">Add Honors Course</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Search curriculum database from other departments</p>
            </div>
            <button onClick={() => setIsHonorsPickerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Search size={18} />
              </span>
              <input 
                type="text" 
                placeholder="Type course code or title..." 
                value={honorsSearchQuery} 
                onChange={(e) => setHonorsSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold dark:text-white text-sm"
              />
            </div>
          </div>
          
          <div className="max-h-[40vh] overflow-y-auto no-scrollbar">
            {filteredHonorsSubjects.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-bold text-sm">
                No matching subjects found in other departments.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHonorsSubjects.map((sub: any) => (
                  <button
                    key={sub.code}
                    onClick={() => activeHonorsIndex !== null && handleSelectHonorsSubject(activeHonorsIndex, sub)}
                    className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left transition-colors group"
                  >
                    <div className="flex flex-col pr-6">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition-colors leading-tight">
                        {sub.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {sub.code}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <span className="text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                          {sub.deptName || 'Curriculum'}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-xl text-xs font-black">
                      {sub.credits} Credits
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 text-center border-t border-slate-100 dark:border-slate-800">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syllabus Academic Courses</p>
          </div>
        </div>
      </div>

      {showRegisterPrompt && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-[#1a2333] p-8 rounded-[3rem] shadow-2xl text-center space-y-6 stagger-card-1">
            <div className="w-20 h-20 bg-indigo-600/10 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <CloudLightning size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black dark:text-white">Saved Locally</h3>
              <p className="text-slate-500 text-sm">Account required for cloud sync.</p>
            </div>
            <button onClick={() => navigate('/login')} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest">Login Now</button>
            <button onClick={() => setShowRegisterPrompt(false)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase text-[10px]">Later</button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center px-2">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter dark:text-white">GPA <span className="text-indigo-600">Assistance</span></h2>
          <p className="text-slate-400 dark:text-slate-500 font-medium text-base md:text-lg">Analyze your semester performance instantly.</p>
        </div>
        {(step === 2 || result !== null) && (
          <button onClick={reset} className="p-4 bg-white dark:bg-slate-800 text-slate-500 rounded-2xl shadow-xl transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95"><RefreshCcw size={20} /></button>
        )}
      </div>

      {step === 1 ? (
        <div className="space-y-12 animate-in fade-in duration-500">
          <div className="space-y-6">
            <label className="text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] ml-2 flex items-center">
              <BookOpen size={14} className="mr-2" /> Academic Department
            </label>
            
            <button 
              onClick={() => setIsDeptPickerOpen(true)}
              className="w-full p-8 bg-white dark:bg-[#1a2333] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-between group transition-all hover:border-indigo-500/30 hover:shadow-2xl active:scale-[0.98]"
            >
              <div className="flex flex-col text-left">
                <span className={`text-base font-bold transition-colors ${departmentId ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                  {selectedDeptName}
                </span>
                {departmentId && (
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mt-1">{departmentId} Stream Active</span>
                )}
              </div>
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <ChevronRight size={20} />
              </div>
            </button>
          </div>

          {departmentId && (
            <div className="bg-white dark:bg-[#1a2333] p-8 md:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Select Semester Cycle</p>
                <div className="grid grid-cols-4 gap-4 max-w-[360px] mx-auto">
                  {availableSemesters.map(n => (
                    <button 
                      key={n} 
                      onClick={() => setSemester(n)} 
                      className={`aspect-square flex items-center justify-center rounded-2xl font-black transition-all active:scale-90 ${
                        semester === n ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {semester > 0 && (
                <button 
                  onClick={handleLoadAcademicData} 
                  className="w-full py-6 bg-indigo-600 text-white font-black rounded-full shadow-2xl flex items-center justify-center gap-4 uppercase tracking-widest text-[11px] hover:bg-indigo-700 active:scale-95 transition-all animate-in zoom-in"
                >
                  <ArrowRight size={18} /> <span>Load Semester {semester} Subjects</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center">
             <div className="w-full max-w-2xl px-8 py-4 bg-indigo-600/10 dark:bg-indigo-500/20 rounded-[2rem] border border-indigo-600/30 shadow-md flex items-center justify-between gap-4">
                <span className="text-xs md:text-sm font-black text-indigo-600/90 dark:text-indigo-400/90 uppercase tracking-widest text-left">{selectedDeptName}</span>
                <span className="text-lg md:text-2xl font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-600/15 dark:bg-indigo-500/25 px-5 py-2 rounded-2xl shrink-0">SEM {semester}</span>
             </div>
          </div>

          {loadedSubjects.map((sub, idx) => (
            <div key={sub.code} className={`p-8 bg-white dark:bg-[#1a2333] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl stagger-card-${(idx % 4) + 1}`}>
               <div className="flex flex-col items-center gap-6">
                 <div className="text-center flex flex-col items-center w-full">
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                     {sub.code} • {sub.credits} Credits
                     {sub.isCustomElective && (
                       <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[9px] font-extrabold rounded">ELECTIVE</span>
                     )}
                   </p>
                   
                   <div className="flex items-center justify-center gap-2 group max-w-full">
                     <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xl leading-tight text-center">{sub.name}</h4>
                     {sub.isCustomElective && (
                       <div className="flex items-center gap-1 shrink-0">
                         <button 
                           onClick={() => { setActiveElectiveIndex(idx); setIsElectivePickerOpen(true); }}
                           title="Change Elective"
                           className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-lg transition-all active:scale-90"
                         >
                           <Pencil size={15} />
                         </button>
                         <button 
                           onClick={() => handleResetElective(idx)}
                           title="Reset to Placeholder"
                           className="hidden"
                         >
                           <RefreshCcw size={13} />
                         </button>
                       </div>
                     )}
                   </div>
                   
                   {isElective(sub) && !sub.isCustomElective && (
                     <div className="mt-4">
                       <button 
                         onClick={() => { setActiveElectiveIndex(idx); setIsElectivePickerOpen(true); }}
                         className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                       >
                         <Search size={12} /> Choose Elective Subject
                       </button>
                     </div>
                   )}
                 </div>
                 
                 <div className="flex flex-col items-center gap-3">
                   <div className="flex flex-wrap justify-center gap-2">
                     {['O','A+','A','B+'].map(g => (
                       <GradeButton key={g} subCode={sub.code} grade={g as Grade} />
                     ))}
                   </div>
                   <div className="flex justify-center gap-2">
                      {['B','C','RA'].map(g => ( <GradeButton key={g} subCode={sub.code} grade={g as Grade} /> ))}
                   </div>
                 </div>
               </div>
            </div>
          ))}

          {/* Honors program check box (TOP of the generate button) */}
          {semester >= 5 && (
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-md space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isHonorsTop" 
                  checked={isHonors} 
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (semester === 0) {
                        alert("Please select a semester first!");
                        return;
                      }
                      if (semester < 5) {
                        alert("Honors program option is only eligible for Semester 5 and above across all departments.");
                        return;
                      }
                    }
                    setIsHonors(e.target.checked);
                  }} 
                  className="w-5 h-5 text-indigo-600 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500 accent-amber-500"
                />
                <label htmlFor="isHonorsTop" className="font-black text-slate-800 dark:text-slate-200 text-sm md:text-base cursor-pointer flex items-center gap-2">
                  <GraduationCap className="text-amber-500" size={18} /> Are you an Honors Student?
                </label>
              </div>
              {isHonors && (
                <span className="text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-500/20">
                  Honors Mode Active
                </span>
              )}
            </div>

            {semester > 0 && semester < 5 && (
              <div className="pt-2 text-xs text-rose-500 font-bold flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800/60">
                <span>⚠️ Honors Program is only eligible for Semester 5 and above in every department.</span>
              </div>
            )}

            {isHonors && (
              <div className="space-y-6 pt-4 border-t border-slate-150 dark:border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">How many honors subjects do you want to add?</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Choose curriculum courses from other departments</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setNumHonorsInput(Math.max(1, numHonorsInput - 1))}
                      className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      min={1} 
                      max={5} 
                      value={numHonorsInput} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          setNumHonorsInput(Math.min(5, Math.max(1, val)));
                        }
                      }}
                      className="w-16 h-10 text-center font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:text-white"
                    />
                    <button 
                      type="button"
                      onClick={() => setNumHonorsInput(Math.min(5, numHonorsInput + 1))}
                      className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Honors Subjects list inside step 2 */}
          {isHonors && (
            <div className="space-y-6 mt-4 animate-in fade-in duration-300">
              <div className="px-2">
                <h4 className="font-black text-amber-500 text-xs uppercase tracking-widest flex items-center gap-2">
                  <GraduationCap size={16} /> Honors Program Courses
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Add courses belonging to other departments as specified by Honors regulations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {honorsSubjects.map((sub, idx) => {
                  const isPlaceholder = sub.name === 'Choose Honors Course' || sub.code.startsWith('HONORS-');
                  return (
                    <div 
                      key={idx} 
                      className="p-8 rounded-[2.5rem] border-2 border-dashed border-amber-300 dark:border-amber-500/30 bg-gradient-to-tr from-amber-500/5 to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10 shadow-[0_15px_30px_-5px_rgba(245,158,11,0.08)] relative flex flex-col justify-between gap-6 overflow-hidden hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-300"
                    >
                      <div className="absolute -top-3 -right-3 w-16 h-16 bg-amber-400/10 dark:bg-amber-400/5 rounded-full blur-xl pointer-events-none"></div>
                      
                      <div className="flex flex-col items-center text-center">
                        <div className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full mb-3 border border-amber-500/20">
                          HONORS SLOT {idx + 1}
                        </div>
                        
                        {!isPlaceholder ? (
                          <>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{sub.code} • {sub.credits} Credits</p>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base md:text-lg leading-tight min-h-[44px] flex items-center justify-center">{sub.name}</h4>
                            
                            <button 
                              type="button"
                              onClick={() => { setActiveHonorsIndex(idx); setIsHonorsPickerOpen(true); }}
                              className="mt-3 px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95"
                            >
                              <Pencil size={12} /> Change Course
                            </button>
                          </>
                        ) : (
                          <div className="py-6 flex flex-col items-center justify-center">
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mb-4">No course chosen for Slot {idx + 1}</p>
                            <button 
                              type="button"
                              onClick={() => { setActiveHonorsIndex(idx); setIsHonorsPickerOpen(true); }}
                              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                            >
                              <Search size={14} /> Search & Add Course
                            </button>
                          </div>
                        )}
                      </div>

                      {!isPlaceholder && (
                        <div className="flex flex-col items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/85">
                          <div className="flex flex-wrap justify-center gap-2">
                            {['O','A+','A','B+'].map(g => (
                              <HonorsGradeButton key={g} honorsIndex={idx} grade={g as Grade} />
                            ))}
                          </div>
                          <div className="flex justify-center gap-2">
                            {['B','C','RA'].map(g => ( 
                              <HonorsGradeButton key={g} honorsIndex={idx} grade={g as Grade} /> 
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {isAllGradesSelected && (
            <p className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 text-center py-2">
              Please check and verify your selected grades before clicking generate!
            </p>
          )}

          <button 
            onClick={calculateGPA} 
            disabled={!isAllGradesSelected}
            className="w-full py-7 bg-indigo-600 text-white font-black rounded-full shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <RefreshCcw size={20} /> <span>Generate GPA Result</span>
          </button>



          {result !== null && (
            <div className="flex flex-col items-center py-12 space-y-8 animate-in slide-in-from-top-6">
              <div className="w-56 aspect-square bg-white dark:bg-[#1a2333] rounded-[4rem] flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-[0_30px_60px_-15px_rgba(79,70,229,0.2)] stagger-card-1">
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2">Semester GPA</p>
                <h2 className="text-7xl font-black text-indigo-600 dark:text-white tracking-tighter">{result.toFixed(2)}</h2>
              </div>
              
              <div onClick={() => setIsMyResult(!isMyResult)} className={`flex items-center gap-5 px-10 py-6 rounded-[2.5rem] border transition-all cursor-pointer stagger-card-2 ${isMyResult ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-900 border-transparent shadow-inner'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isMyResult ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-800 text-transparent'}`}><CheckCircle size={22}/></div>
                <div className="text-left">
                  <p className={`text-xs font-black uppercase tracking-widest ${isMyResult ? 'text-emerald-600' : 'text-slate-400'}`}>My Result Verification</p>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Confirm this result is mine</p>
                </div>
              </div>

              <button 
                onClick={handleSaveResult} 
                disabled={isSaved || !isMyResult} 
                className={`w-full max-md:max-w-md py-7 rounded-full font-black uppercase tracking-widest stagger-card-3 shadow-2xl active:scale-95 transition-all text-sm ${isSaved ? 'bg-emerald-500 text-white' : isMyResult ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
              >
                {isSaved ? 'Archived Successfuly' : 'Commit to History'}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default GPACalculator;
