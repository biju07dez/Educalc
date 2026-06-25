import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Tesseract, { createWorker } from 'tesseract.js';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calculator,
  ArrowRight,
  RefreshCcw,
  Camera,
  X,
  CloudLightning
} from 'lucide-react';
import { Grade, GRADE_POINTS, UserRecord, GPARecord } from '../types.ts';

interface SimpleAIScannerProps {
  user: UserRecord;
  setUser: (u: UserRecord) => void;
}

const SimpleAIScanner: React.FC<SimpleAIScannerProps> = ({ user, setUser }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    gpa: number;
    results: Array<{ code: string; name: string; grade: Grade; credits: number }>;
  } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<number>(0);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isMyResult, setIsMyResult] = useState(true);
  const [isDeptPickerOpen, setIsDeptPickerOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Add scanning animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes scan-line {
        0% { top: 0; }
        100% { top: 100%; }
      }
      .animate-scan-line {
        animation: scan-line 2s linear infinite;
      }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);

    fetch('subjects.json')
      .then(res => res.json())
      .then(data => setDepartments(data.departments || []))
      .catch(err => console.error("Failed to load departments:", err));

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setResult(null);
      setError(null);
      setIsSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setImage(canvas.toDataURL('image/jpeg'));
        stopCamera();
        setResult(null);
      }
    }
  };

  const preprocessImage = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Scale up for better OCR (2x)
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Apply filters to enhance text clarity
        ctx.filter = "grayscale(1) contrast(1.8) brightness(1.1)";
        ctx.drawImage(canvas, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        // Simple thresholding to create a clean black and white image
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const val = avg > 140 ? 255 : 0; 
          data[i] = data[i + 1] = data[i + 2] = val;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = imageSrc;
    });
  };

  const levenshtein = (a: string, b: string): number => {
    const matrix = Array.from({ length: b.length + 1 }, (_, j) =>
      Array.from({ length: a.length + 1 }, (_, i) => (j === 0 ? i : i === 0 ? j : 0))
    );
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + cost);
      }
    }
    return matrix[b.length][a.length];
  };

  const normalizeGrade = (raw: string): string => {
    let up = raw.toUpperCase().replace(/\s/g, '');
    if (up.includes('PASS')) return up.replace('PASS', '').trim() || 'O';
    const typoMap: Record<string, string> = {
      '0': 'O', 'NON': 'O', 'ET': 'O', 'Q': 'O', 'D': 'O', 'BT': 'B+', 'A1': 'A+', 'B1': 'B+', 'AT': 'A+', 'U': 'RA', 'F': 'RA', 'AB': 'RA', 'W': 'RA', 'WH': 'RA'
    };
    for (const [key, val] of Object.entries(typoMap)) {
      if (up === key) return val;
    }
    if (['O', 'A+', 'A', 'B+', 'B', 'C', 'RA'].includes(up)) return up;
    
    // More flexible checks
    if (up.startsWith('O') || up === '0' || up === 'Q') return 'O';
    if (up.startsWith('A')) return up.includes('+') || up.includes('1') || up.includes('T') ? 'A+' : 'A';
    if (up.startsWith('B')) return up.includes('+') || up.includes('1') || up.includes('T') ? 'B+' : 'B';
    if (up === 'C') return 'C';
    if (['RA', 'U', 'F', 'AB', 'W', 'WH'].some(fail => up.includes(fail))) return 'RA';
    
    return '';
  };

  const processImage = async (): Promise<void> => {
    if (!image) return;
    setIsProcessing(true);
    setError(null);

    try {
      const cleanedImage = await preprocessImage(image);
      const subjectsRes = await fetch("subjects.json");
      const subjectsData = await subjectsRes.json();

      const allSubjects: any[] = [];
      subjectsData.departments.forEach((d: any) => {
        Object.values(d.semesters).forEach((sArr: any) => {
          sArr.forEach((s: any) => {
            if (!allSubjects.some(as => as.code === s.code)) allSubjects.push(s);
          });
        });
      });

      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+ ",
        preserve_interword_spaces: "1"
      });

      const { data: { text } } = await worker.recognize(cleanedImage);
      await worker.terminate();

      console.log("RAW OCR TEXT:", text);

      const lines = text.split('\n');
      const uniqueResults = new Map<string, any>();
      let detectedSem: number | null = null;

      // Patterns
      const codePattern = /([A-Z]{2,3})\s*([0-9]{4,5})/i;
      const gradePattern = /\b(O|A\+|A|B\+|B|C|RA|U|F|AB|0|NON|ET|BT|AT|PASS)\b/i;
      const semPattern = /(?:Semester|Sem|Semster)\s*[:\-]?\s*(\d+)/i;

      // Try to find semester in the whole text first
      const globalSemMatch = text.match(semPattern);
      if (globalSemMatch) detectedSem = parseInt(globalSemMatch[1]);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Look for semester in line if not found yet
        if (!detectedSem) {
          const sMatch = line.match(semPattern) || line.match(/^(\d{1,2})\s+[A-Z]/);
          if (sMatch) detectedSem = parseInt(sMatch[1]);
        }

        const cMatch = line.match(codePattern);
        if (cMatch) {
          const rawCode = (cMatch[1] + cMatch[2]).toUpperCase()
            .replace(/^6/, 'G').replace(/^5/, 'S').replace(/^8/, 'B');
          
          // Look for grade in the same line
          let gMatch = line.match(gradePattern);
          
          // If not in same line, check next line (sometimes OCR splits rows)
          if (!gMatch && i + 1 < lines.length) {
            gMatch = lines[i+1].match(gradePattern);
          }

          if (gMatch) {
            const grade = normalizeGrade(gMatch[1]);
            if (grade) {
              // Fuzzy match code with higher tolerance (2)
              let bestSub = allSubjects.find(s => s.code === rawCode) ||
                allSubjects.find(s => levenshtein(rawCode, s.code) <= 2);

              if (bestSub) {
                if (!uniqueResults.has(bestSub.code)) {
                  uniqueResults.set(bestSub.code, {
                    code: bestSub.code,
                    name: bestSub.name,
                    grade: grade as Grade,
                    credits: bestSub.credits
                  });
                }
              }
            }
          }
        }
      }

      if (uniqueResults.size === 0) throw new Error("No subjects detected. Please ensure the image is clear and contains a marksheet.");

      if (detectedSem) setSelectedSemester(detectedSem);

      const branchMatch = text.match(/Branch\s*[:\-]?\s*([^\n]+)/i);
      let detectedDept = branchMatch ? branchMatch[1].trim() : null;
      if (!detectedDept) {
        const keywords = ["Computer Science", "Information Technology", "Mechanical", "Civil", "Electrical", "Electronics"];
        keywords.forEach(k => { if (text.toLowerCase().includes(k.toLowerCase())) detectedDept = k; });
      }
      if (detectedDept) {
        const match = departments.find(d => d.name.toLowerCase().includes(detectedDept!.toLowerCase()) || detectedDept!.toLowerCase().includes(d.id.toLowerCase()));
        if (match) setSelectedDeptId(match.id);
      }

      calculateAndSetResult(Array.from(uniqueResults.values()));
    } catch (err: any) {
      setError(err.message || "OCR failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateAndSetResult = (results: any[]) => {
    let totalPoints = 0, totalCredits = 0;
    results.forEach(r => {
      totalPoints += (GRADE_POINTS[r.grade as Grade] || 0) * r.credits;
      totalCredits += r.credits;
    });
    setResult({ results, gpa: totalCredits > 0 ? totalPoints / totalCredits : 0 });
    setIsSaved(false);
  };

  const handleSaveResult = () => {
    if (!result || !selectedSemester || !selectedDeptId || isSaved || !isMyResult) return;
    if (user.isGuest) { setShowLoginPrompt(true); return; }
    const filtered = user.gpaHistory.filter(r => r.semester !== selectedSemester);
    const newRecord: GPARecord = {
      id: Math.random().toString(36).substr(2, 9),
      semester: selectedSemester,
      gpa: result.gpa,
      department: selectedDeptId,
      date: new Date().toISOString(),
      subjects: result.results.map(r => ({ ...r }))
    };
    setUser({ ...user, gpaHistory: [newRecord, ...filtered] });
    setIsSaved(true);
  };

  const handleUpdateGrade = (index: number, newGrade: Grade) => {
    if (!result) return;
    const updated = [...result.results];
    updated[index] = { ...updated[index], grade: newGrade };
    calculateAndSetResult(updated);
    setEditingIndex(null);
  };

  const GradeOption = ({ grade, isCurrent, onSelect }: { grade: Grade, isCurrent: boolean, onSelect: () => void, key?: string }) => {
    const isRA = grade === 'RA';
    return (
      <button
        onClick={onSelect}
        className={`flex-1 h-12 rounded-xl font-black text-xs transition-all active:scale-90 flex items-center justify-center border-2 ${isCurrent ? (isRA ? 'bg-rose-500 border-rose-500 text-white' : 'bg-brand-600 border-brand-600 text-white') : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'
          }`}
      >
        {grade}
      </button>
    );
  };

  const ScanningOverlay = () => (
    <div className="absolute inset-0 z-10 bg-black/20 flex flex-col items-center justify-center backdrop-blur-[2px] rounded-3xl overflow-hidden">
      <div className="absolute w-full h-[2px] bg-brand-500 shadow-[0_0_15px_rgba(37,99,235,0.8)] animate-scan-line top-0"></div>
      <div className="text-white text-center space-y-4 animate-pulse">
        <CloudLightning className="mx-auto" size={48} />
        <p className="font-black uppercase tracking-widest text-xs">AI Scanning active</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10 px-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">AI <span className="text-brand-600 text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Result Scanner</span></h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Extract Anna University marksheet data instantly with high-precision neural OCR.</p>
      </div>

      {!result && !isProcessing && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
          onClick={() => !isCameraOpen && fileInputRef.current?.click()}
          className={`border-4 border-dashed rounded-[3rem] p-16 text-center cursor-pointer transition-all ${isDragging ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-900 shadow-xl shadow-slate-200/50 dark:shadow-none'}`}
        >
          <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} accept="image/*" className="hidden" />
          {isCameraOpen ? (
            <div className="space-y-6" onClick={e => e.stopPropagation()}>
              <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <button onClick={stopCamera} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white"><X size={20} /></button>
              </div>
              <button onClick={captureImage} className="px-10 py-4 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-600/30">Capture Screenshot</button>
            </div>
          ) : image ? (
            <div className="space-y-8">
              <img src={image} className="w-48 h-48 mx-auto rounded-3xl object-cover shadow-2xl border-4 border-white dark:border-slate-700" alt="Preview" />
              <div className="flex gap-4 justify-center">
                <button onClick={(e) => { e.stopPropagation(); processImage(); }} className="px-10 py-5 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-600/30 flex items-center gap-2">Identify Now <ArrowRight size={20} /></button>
                <button onClick={(e) => { e.stopPropagation(); startCamera(); }} className="px-10 py-5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black rounded-2xl">Retake</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center gap-6">
                <div className="w-24 h-24 bg-brand-50 rounded-[2rem] flex items-center justify-center text-brand-600"><Upload size={40} /></div>
                <button onClick={(e) => { e.stopPropagation(); startCamera(); }} className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-400"><Camera size={40} /></button>
              </div>
              <p className="text-xl font-black text-slate-700 dark:text-slate-200">drop the screenshot of your result here</p>
            </div>
          )}
        </div>
      )}

      {isProcessing && (
        <div className="relative h-[400px] bg-slate-900 rounded-[3rem] overflow-hidden">
          <img src={image!} className="w-full h-full object-cover opacity-40 blur-sm" alt="Processing" />
          <ScanningOverlay />
          <div className="absolute bottom-10 left-0 right-0 text-center text-white space-y-2">
            <Loader2 className="mx-auto animate-spin text-brand-400" size={32} />
            <p className="text-sm font-black uppercase tracking-[0.3em]">Neural Extraction...</p>
          </div>
        </div>
      )}

      {error && <div className="p-6 bg-red-50 text-red-600 rounded-3xl flex justify-between items-center font-bold"><span>{error}</span><button onClick={() => setImage(null)}>Try Again</button></div>}

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white dark:bg-surface-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-wrap gap-6 items-center shadow-sm">
              <div className="flex-1 min-w-[200px] space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400">Branch / Department</p>
                <button onClick={() => setIsDeptPickerOpen(true)} className="w-full h-14 bg-slate-50 dark:bg-slate-800 px-5 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700 font-bold truncate">
                  {departments.find(d => d.id === selectedDeptId)?.name || 'Select Department'} <ArrowRight size={16} className="text-brand-500" />
                </button>
              </div>
              <div className="w-32 space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400">Semester</p>
                <select value={selectedSemester} onChange={e => setSelectedSemester(parseInt(e.target.value))} className="w-full h-14 bg-slate-50 dark:bg-slate-800 px-4 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold outline-none ring-brand-500 focus:ring-2">
                  <option value={0}>-</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>Sem {n}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-brand-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-center shadow-xl shadow-brand-600/30 overflow-hidden relative">
              <CloudLightning className="absolute -right-4 -top-4 opacity-10" size={120} />
              <p className="text-[10px] font-black uppercase opacity-60">Estimated GPA</p>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black">{result.gpa.toFixed(2)}</span>
                <span className="text-xl font-bold opacity-40">/10.0</span>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white dark:bg-surface-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Extracted Marks</h3>
                <p className="text-xs text-slate-500">Verified code & grade parsing</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                <CheckCircle2 size={14} /> Accurate
              </div>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {result.results.map((r, i) => (
                <div key={r.code} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded uppercase text-slate-500">{r.code}</span>
                        <span className="text-[10px] font-black text-brand-500">{r.credits} Credits</span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">{r.name}</h4>
                    </div>
                    <div className="relative">
                      <button onClick={() => setEditingIndex(editingIndex === i ? null : i)} className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black transition-all ${r.grade === 'RA' ? 'bg-rose-50 border-2 border-rose-100 text-rose-500' : 'bg-brand-50 border-2 border-brand-100 text-brand-600'}`}>
                        <span className="text-xs">{r.grade}</span>
                        <span className="text-[8px] opacity-40 uppercase">Edit</span>
                      </button>
                      {editingIndex === i && (
                        <div className="absolute top-full right-0 mt-3 z-50 bg-white dark:bg-surface-900 p-4 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-64 flex flex-wrap gap-2">
                          {(['O', 'A+', 'A', 'B+', 'B', 'C', 'RA'] as Grade[]).map(g => (
                            <GradeOption key={g} grade={g} isCurrent={r.grade === g} onSelect={() => handleUpdateGrade(i, g)} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Action */}
          <div className="bg-white dark:bg-surface-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <button
              onClick={() => setIsMyResult(!isMyResult)}
              className={`flex items-center gap-4 group cursor-pointer ${isMyResult ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isMyResult ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
                {isMyResult && <CheckCircle2 size={20} />}
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase">My Result Verification</p>
                <p className="text-[10px] font-bold">Confirm this result is mine</p>
              </div>
            </button>

            <div className="flex gap-4 w-full sm:w-auto">
              <button onClick={() => { setImage(null); setResult(null); }} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold rounded-2xl">Reset Scanner</button>
              <button
                onClick={handleSaveResult}
                disabled={isSaved || !isMyResult || !selectedSemester || !selectedDeptId}
                className={`flex-1 sm:flex-none px-10 py-4 font-black rounded-2xl shadow-xl transition-all ${isSaved ? 'bg-emerald-500 text-white' : 'bg-brand-600 text-white shadow-brand-600/30'}`}
              >
                {isSaved ? 'Analysis Archived' : 'Commit to History'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dept Picker Popup */}
      <div className={`fixed inset-0 z-[300] flex items-center justify-center p-6 ${isDeptPickerOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity ${isDeptPickerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsDeptPickerOpen(false)}></div>
        <div className={`relative w-full max-w-xl bg-white dark:bg-surface-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 transform ${isDeptPickerOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-black">Choose Engineering Branch</h3>
            <button onClick={() => setIsDeptPickerOpen(false)}><X size={24} /></button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 no-scrollbar">
            {departments.map(d => (
              <button
                key={d.id}
                onClick={() => { setSelectedDeptId(d.id); setIsDeptPickerOpen(false); }}
                className={`w-full p-6 text-left rounded-3xl transition-all flex items-center justify-between group ${selectedDeptId === d.id ? 'bg-brand-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <div>
                  <p className="font-bold text-lg leading-tight">{d.name}</p>
                  <p className={`text-[10px] font-black uppercase mt-1 ${selectedDeptId === d.id ? 'text-white/60' : 'text-slate-400'}`}>{d.id}</p>
                </div>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedDeptId === d.id ? 'border-white' : 'border-slate-200 group-hover:border-brand-500'}`}>
                  {selectedDeptId === d.id && <div className="w-3 h-3 bg-white rounded-full"></div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white dark:bg-surface-900 p-8 rounded-[3rem] text-center space-y-6 max-w-sm">
            <div className="w-16 h-16 bg-brand-600/10 text-brand-600 rounded-full flex items-center justify-center mx-auto"><CloudLightning size={32} /></div>
            <h3 className="text-2xl font-black">Sync Required</h3>
            <p className="text-slate-500">Log in to safely archive your AI scanned results to your permanent academic history.</p>
            <button onClick={() => navigate('/login')} className="w-full py-4 bg-brand-600 text-white font-black rounded-2xl shadow-lg">Login / Sign Up</button>
            <button onClick={() => setShowLoginPrompt(false)} className="text-slate-400 font-bold">Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleAIScanner;
