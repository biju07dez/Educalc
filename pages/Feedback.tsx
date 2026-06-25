
import React, { useState } from 'react';
import { 
  MessageSquare, 
  Star, 
  Send, 
  CheckCircle2, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
// Re-verifying react-router-dom import for compatibility
import { useNavigate } from 'react-router-dom';
import { UserRecord, FeedbackRecord } from '../types.ts';

interface FeedbackProps {
  user: UserRecord;
}

const Feedback: React.FC<FeedbackProps> = ({ user }) => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) return;

    setIsSubmitting(true);

    const feedback: FeedbackRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      rating,
      comment: comment.trim(),
      date: new Date().toISOString()
    };

    const existingFeedback = JSON.parse(localStorage.getItem('educalc_feedback_db') || '[]');
    localStorage.setItem('educalc_feedback_db', JSON.stringify([...existingFeedback, feedback]));

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1200);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-black dark:text-white mb-4">Feedback Received!</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-10 font-medium">
          Thank you for helping us improve EduCalc. Your thoughts are what drive our innovation.
        </p>
        <button 
          onClick={() => navigate('/gpa')}
          className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest text-xs"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white dark:bg-[#1a2333] rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-black dark:text-white tracking-tight">Share Your <span className="text-indigo-600">Thoughts</span></h2>
          <p className="text-slate-400 font-medium">Help us make EduCalc better for every student.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1a2333] p-8 md:p-12 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl space-y-10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 text-indigo-500/5 rotate-12">
          <MessageSquare size={160} />
        </div>

        <div className="space-y-6 text-center relative z-10">
          <label className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">How would you rate your experience?</label>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-all transform active:scale-90"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star 
                  size={40} 
                  className={`transition-colors duration-200 ${
                    star <= (hoverRating || rating) 
                      ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' 
                      : 'text-slate-200 dark:text-slate-800'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-indigo-500 font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
              {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}
            </p>
          )}
        </div>

        <div className="space-y-4 relative z-10">
          <label className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] ml-2">What's on your mind?</label>
          <textarea
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you love or what we could improve..."
            className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 dark:text-white rounded-[2rem] border-none focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium resize-none text-base placeholder:text-slate-300 dark:placeholder:text-slate-700"
          />
        </div>

        <button
          type="submit"
          disabled={rating === 0 || !comment.trim() || isSubmitting}
          className="w-full py-6 bg-indigo-600 text-white font-black rounded-full shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center space-x-3 uppercase tracking-widest text-xs relative z-10"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Send Feedback</span>
              <Send size={16} />
            </>
          )}
        </button>

        <div className="flex items-center justify-center space-x-2 pt-4">
          <Sparkles size={14} className="text-amber-500" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged in as {user.name}</p>
        </div>
      </form>
    </div>
  );
};

export default Feedback;
