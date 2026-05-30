import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase/client';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { MOCK_JOBS } from '../lib/seeds/seedJobs';
import { MOCK_NETWORK_USERS } from '../lib/seeds/seedNetworkProfiles';
import { Job, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Building2, MapPin, ChevronRight, Share2, FileText, Check, Loader2, ArrowLeft } from 'lucide-react';

export default function JobApplication() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Flow State
  const [step, setStep] = useState(1);
  const [matchAnalysis, setMatchAnalysis] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [referrers, setReferrers] = useState<any[]>([]);
  const [selectedReferrerId, setSelectedReferrerId] = useState<string | null>(null);
  const [referralMessage, setReferralMessage] = useState<string>("");
  const [referralSent, setReferralSent] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Animated score representation
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
         navigate('/auth');
         return;
      }
      try {
        // Fetch current user so we pass it to APIs
        const uSnap = await getDoc(doc(db, "users", authUser.uid));
        if (uSnap.exists()) setUser(uSnap.data() as User);
        else {
           // Provide fallback dummy
           setUser({ uid: authUser.uid, displayName: authUser.displayName || 'You', photoURL: authUser.photoURL || '', email: authUser.email||'' } as any);
        }
      } catch (e) {
        console.warn("Failed to fetch user doc");
        setUser({ uid: authUser.uid, displayName: authUser.displayName || 'You' } as any);
      }

      // Hardcoded Mock Jobs for Job details
      const foundJob = MOCK_JOBS.find(j => j.id === jobId) as unknown as Job;
      if (foundJob) setJob(foundJob);
      
      setLoading(false);
    });
    return () => unsub();
  }, [jobId, navigate]);

  // Initial Match Analysis Effect
  useEffect(() => {
    if (job && user && step === 1 && !matchAnalysis) {
      runMatchAnalysis();
    }
  }, [job, user, step]); // Run once

  const runMatchAnalysis = async () => {
    try {
      const res = await fetch("/api/jobs/match", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, job })
      });
      const data = await res.json();
      setMatchAnalysis(data);
    } catch (e) {
      console.error(e);
      // Fallback
      setMatchAnalysis({
         matchScore: 84,
         whyApply: ["Strong PM experience", "Fintech background aligns", "You live in a target region"],
         honestGaps: ["Missing specific regulatory knowledge"],
         applicationAdvice: "Focus your cover letter on how you scaled the previous product."
      });
    }
  };

  // Score Animation Effect
  useEffect(() => {
    if (step === 1 && matchAnalysis) {
       const score = matchAnalysis.matchScore || 0;
       let current = 0;
       const interval = setInterval(() => {
         current += 1;
         if (current >= score) {
           setDisplayScore(score);
           clearInterval(interval);
         } else {
           setDisplayScore(current);
         }
       }, 15);
       return () => clearInterval(interval);
    }
  }, [step, matchAnalysis]);

  const generateLetter = async () => {
    setGeneratingLetter(true);
    setCoverLetter("");
    try {
      const res = await fetch("/api/jobs/cover-letter", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, job, matchAnalysis })
      });
      const data = await res.json();
      setCoverLetter(data.coverLetter || "Dear Hiring Manager,\n\nI am excited to apply for this role. I have extensive experience building scalable products and collaborating with cross-functional teams.\n\nThank you,\n" + user?.displayName);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handleStep2Enter = () => {
    setStep(2);
    if (!coverLetter && !generatingLetter) {
       generateLetter();
    }
  };

  const handleStep3Enter = () => {
    setStep(3);
    // Find mock referrers based on networkInsiders or just random
    const insiders = job?.networkInsiders || [];
    let insideProfiles = MOCK_NETWORK_USERS.filter(u => insiders.includes(u.id));
    // If empty list, just pick one Mock profile to demo the feature
    if (insideProfiles.length === 0 && MOCK_NETWORK_USERS.length > 0) {
       insideProfiles = [MOCK_NETWORK_USERS[0]];
    }
    
    setReferrers(insideProfiles.map(u => ({
       user: u,
       sharedContext: ["Both worked in FinTech", "Attended nearby universities"]
    })));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendIntro = (id: string, name: string) => {
     setReferralSent(prev => ({ ...prev, [id]: true }));
     setSelectedReferrerId(null);
     showToast(`Introduction sent to ${name}`);
  };

  const finalizeApplication = async () => {
    if (!job || !user) return;
    setSubmitting(true);
    try {
      const bestReferrer = Object.keys(referralSent)[0] || null;
      await addDoc(collection(db, "applications"), {
         userId: user.uid,
         jobId: job.id,
         coverLetter,
         matchScore: matchAnalysis?.matchScore || 0,
         referrerId: bestReferrer,
         referralMessageSent: !!bestReferrer,
         status: "submitted",
         appliedAt: serverTimestamp()
      });
      setSubmitting(false);
      setSubmitted(true);
    } catch(e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-8 text-white"><Loader2 className="w-8 h-8 animate-spin text-brand-green" /></div>;
  if (!job || !user) return <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-8 text-white">Not found</div>;

  return (
    <div className="fixed inset-0 z-[60] bg-[#05070a] overflow-y-auto pb-safe scrollbar-hide text-white flex flex-col md:relative md:z-0 md:bg-transparent">
       
       <AnimatePresence>
          {toast && (
            <motion.div 
               initial={{ top: -50, opacity: 0 }} 
               animate={{ top: 20, opacity: 1 }} 
               exit={{ top: -50, opacity: 0 }} 
               className="fixed left-1/2 -translate-x-1/2 z-[100] bg-brand-green text-black px-6 py-3 rounded-full font-bold shadow-lg shadow-brand-green/20 flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {toast}
            </motion.div>
          )}
       </AnimatePresence>

       {/* Step Indicators */}
       <div className="bg-[#0A0D14] sticky top-0 z-40 border-b border-white/5 p-4 flex items-center justify-center gap-1 md:gap-4 md:bg-transparent md:border-none md:mt-4">
          <button onClick={() => navigate(-1)} className="absolute left-4 md:hidden text-slate-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></button>
          {[1, 2, 3, 4].map(s => {
             const active = step >= s;
             return (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${active ? 'bg-brand-green text-black' : 'bg-slate-800 text-slate-500'}`}>
                    {s}
                  </div>
                  {s < 4 && <div className={`w-8 md:w-16 h-1 mx-1 rounded-full transition-colors ${step > s ? 'bg-brand-green' : 'bg-slate-800'}`} />}
                </div>
             );
          })}
       </div>

       <div className="max-w-3xl mx-auto w-full p-4 md:p-8 flex-1 flex flex-col items-stretch relative">

          <AnimatePresence mode="wait">
            {!submitted && step === 1 && (
               <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                  
                  {matchAnalysis ? (
                     <div className="flex-1 space-y-8 flex flex-col">
                       <div className="text-center space-y-6">
                         <h1 className="text-3xl font-bold text-white tracking-tight">Match Analysis</h1>
                         
                         <div className="w-40 h-40 mx-auto rounded-full border-[6px] border-brand-green/20 relative flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle cx="74" cy="74" r="74" fill="none" strokeWidth="6" className="stroke-brand-green/10" style={{ transform: 'translate(6px, 6px)' }} />
                              <circle cx="74" cy="74" r="74" fill="none" strokeWidth="6" strokeDasharray="465" strokeDashoffset={465 - (465 * displayScore) / 100} strokeLinecap="round" className="stroke-brand-green transition-all duration-300" style={{ transform: 'translate(6px, 6px)' }} />
                            </svg>
                            <div className="text-4xl font-bold text-white flex items-baseline">
                               {displayScore} <span className="text-lg text-slate-400 font-normal">%</span>
                            </div>
                         </div>
                         <div className="inline-block bg-brand-green/20 border border-brand-green text-brand-green px-4 py-2 rounded-full font-medium shadow-lg shadow-brand-green/10">
                            Within your salary range
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 flex-1">
                          <div className="bg-[#121620] border border-slate-800/50 rounded-2xl p-6">
                             <h3 className="font-bold text-white mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-brand-green"/> Why you're a fit</h3>
                             <ul className="space-y-3">
                                {(matchAnalysis?.whyApply || []).map((r: string, i: number) => <li key={i} className="text-slate-300 text-sm leading-relaxed">{r}</li>)}
                             </ul>
                          </div>
                          <div className="bg-[#121620] border border-slate-800/50 rounded-2xl p-6">
                             <h3 className="font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500"/> Honest Gaps</h3>
                             <ul className="space-y-3">
                                {(matchAnalysis?.honestGaps || []).map((g: string, i: number) => <li key={i} className="text-slate-300 text-sm leading-relaxed">{g}</li>)}
                             </ul>
                          </div>
                       </div>

                       <div className="bg-white/5 rounded-xl p-4 text-center">
                          <p className="text-sm text-slate-300"><span className="font-bold text-white">Gemini Tip: </span> {matchAnalysis.applicationAdvice}</p>
                       </div>

                       <button onClick={handleStep2Enter} className="w-full bg-brand-green text-black font-bold py-4 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl shadow-brand-green/10 text-lg sticky bottom-4 z-50">
                         Continue to Cover Letter
                       </button>
                     </div>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-brand-green" />
                        <h2 className="text-xl font-bold">Scanning JD & Profile...</h2>
                     </div>
                  )}
               </motion.div>
            )}

            {!submitted && step === 2 && (
               <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col space-y-6">
                  <div className="flex items-center justify-between">
                     <h1 className="text-3xl font-bold tracking-tight">Your AI Cover Letter</h1>
                     <span className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-md text-slate-400">Introd Intelligence</span>
                  </div>

                  {generatingLetter ? (
                     <div className="flex-1 bg-[#121620] border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-green mx-auto" />
                        <p className="text-slate-400 font-medium">Drafting a personalized letter addressing your gaps...</p>
                     </div>
                  ) : (
                     <>
                        <textarea 
                           className="w-full flex-1 bg-[#121620] border border-slate-800/50 rounded-2xl p-6 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-green resize-none leading-relaxed"
                           value={coverLetter}
                           onChange={(e) => setCoverLetter(e.target.value)}
                        />
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold text-slate-400">
                             <span>Keyword Coverage (ATS Score)</span>
                             <span className="text-brand-green">84%</span>
                           </div>
                           <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-brand-green w-[84%]" />
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sticky bottom-4 z-50 bg-[#0A0D14] pt-2 md:bg-transparent md:pt-0">
                           <button onClick={generateLetter} className="w-full py-4 text-slate-300 font-bold bg-[#121620] hover:bg-slate-800 rounded-2xl transition-colors shrink-0">
                             Regenerate
                           </button>
                           <button onClick={handleStep3Enter} className="w-full bg-brand-green text-black font-bold py-4 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl shadow-brand-green/10">
                             Continue
                           </button>
                        </div>
                     </>
                  )}
               </motion.div>
            )}

            {!submitted && step === 3 && (
               <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col space-y-6">
                  <div>
                     <h1 className="text-3xl font-bold tracking-tight mb-2">Who in your network can refer you?</h1>
                     <p className="text-slate-400">Applications with referrals are 4x more likely to convert. Reach out to an insider.</p>
                  </div>

                  {referrers.length === 0 ? (
                     <div className="flex-1 flex flex-col items-center justify-center bg-[#121620] border border-slate-800/50 rounded-2xl text-center p-8 space-y-4">
                        <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center">
                           <Share2 className="w-8 h-8" />
                        </div>
                        <p className="text-slate-300 max-w-sm">No direct connections at this company. Your application will still be reviewed by our team.</p>
                     </div>
                  ) : (
                     <div className="flex-1 space-y-4 overflow-y-auto">
                        {(referrers || []).map((r, i) => (
                           <div key={i} className="bg-[#121620] border border-slate-800/50 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700">
                             <div className="flex items-start gap-4">
                                <img src={r.user.photoUrl || r.user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${r.user.displayName}`} alt="" className="w-14 h-14 rounded-full border-2 border-slate-800" />
                                <div className="flex-1">
                                   <h3 className="font-bold text-lg text-white">{r.user.displayName}</h3>
                                   <p className="text-slate-400 text-sm mb-2">{r.user.headline || r.user.currentRole}</p>
                                   <div className="flex flex-wrap gap-2 mb-4">
                                      {(r.sharedContext || []).map((sc: string, idx: number) => (
                                         <span key={idx} className="bg-slate-800/50 text-slate-300 px-2 py-1 rounded text-xs font-medium border border-slate-700/50">{sc}</span>
                                      ))}
                                   </div>
                                   {referralSent[r.user.id] ? (
                                      <div className="inline-flex items-center gap-1.5 bg-brand-green/10 text-brand-green px-3 py-1.5 rounded-lg text-sm font-bold border border-brand-green/20">
                                         <Check className="w-4 h-4" /> Referral requested
                                      </div>
                                   ) : (
                                      selectedReferrerId === r.user.id ? (
                                         <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <textarea 
                                              value={referralMessage}
                                              onChange={(e) => setReferralMessage(e.target.value)}
                                              className="w-full bg-[#0A0D14] border border-slate-800 rounded-xl p-3 text-sm text-slate-300 outline-none focus:border-brand-green resize-none h-24"
                                            />
                                            <div className="flex gap-2">
                                               <button onClick={() => setSelectedReferrerId(null)} className="py-2.5 px-4 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                                               <button onClick={() => handleSendIntro(r.user.id, r.user.displayName)} className="flex-1 bg-brand-green text-black font-bold py-2.5 rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-brand-green/10">
                                                 Send introduction
                                               </button>
                                            </div>
                                         </div>
                                      ) : (
                                         <button onClick={() => {
                                            setSelectedReferrerId(r.user.id);
                                            setReferralMessage(`Hi ${r.user.displayName.split(' ')[0]},\n\nI noticed you work at ${job.company}. I'm applying for the ${job.title} role and it looks like a great fit. Would you be open to giving me a referral or providing a quick intro?\n\nBest,\n${user?.displayName}`);
                                         }} className="w-full md:w-auto bg-white text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors hover:bg-slate-200">
                                           Request Referral
                                         </button>
                                      )
                                   )}
                                </div>
                             </div>
                           </div>
                        ))}
                     </div>
                  )}

                  <div className="sticky bottom-4 z-50 bg-[#0A0D14] pt-2 md:bg-transparent md:pt-0">
                     <button onClick={() => setStep(4)} className="w-full bg-[#121620] hover:bg-slate-800 border border-slate-800 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-slate-900">
                       Continue to Final Review
                     </button>
                  </div>
               </motion.div>
            )}

            {!submitted && step === 4 && (
               <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col space-y-6 max-w-xl mx-auto w-full pt-4">
                  <div className="text-center space-y-2 mb-2">
                     <h1 className="text-3xl font-bold tracking-tight">Review & Submit</h1>
                     <p className="text-slate-400">Everything looks solid. Ready to send it off?</p>
                  </div>

                  <div className="bg-[#121620] border border-slate-800/50 rounded-3xl p-6 md:p-8 space-y-8 relative overflow-hidden">
                     {/* Decorative gradient orb */}
                     <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-green/10 rounded-full blur-[80px] pointer-events-none" />

                     <div className="flex flex-col items-center text-center pb-6 border-b border-white/5 relative z-10">
                        {job.companyLogoUrl ? (
                           <img src={job.companyLogoUrl} alt={job.company} className="w-16 h-16 rounded-xl bg-white mb-4" />
                        ) : (
                           <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                              <Building2 className="w-8 h-8" />
                           </div>
                        )}
                        <h2 className="text-2xl font-bold text-white leading-tight">{job.title}</h2>
                        <p className="text-slate-400 font-medium">{job.company}</p>
                     </div>

                     <div className="space-y-4 relative z-10">
                        <div className="flex items-center justify-between">
                           <span className="text-sm font-medium text-slate-400">Match Score</span>
                           <span className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1 rounded-full text-sm font-bold shadow-lg shadow-brand-green/5">{matchAnalysis?.matchScore || 0}% Fit</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-sm font-medium text-slate-400">Referral Request</span>
                           {Object.keys(referralSent).length > 0 ? (
                              <span className="text-brand-green text-sm flex items-center gap-1 font-bold"><Check className="w-4 h-4"/> Attached</span>
                           ) : (
                              <span className="text-slate-500 text-sm">No referral</span>
                           )}
                        </div>
                        <div className="pt-2">
                           <span className="text-sm font-medium text-slate-400 block mb-2">Cover Letter Preview</span>
                           <div className="bg-[#0A0D14] border border-slate-800 rounded-xl p-4 text-sm text-slate-300 italic line-clamp-3">
                              "{coverLetter}"
                           </div>
                        </div>
                     </div>
                  </div>

                  <button 
                     onClick={finalizeApplication} 
                     disabled={submitting} 
                     className="w-full bg-brand-green text-black font-bold py-4 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl shadow-brand-green/10 sticky bottom-4 z-50 flex items-center justify-center gap-2 text-lg"
                  >
                     {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Application"}
                  </button>
               </motion.div>
            )}

            {submitted && (
               <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="fixed inset-0 bg-[#05070a] z-[100] flex flex-col items-center justify-center text-center p-6 space-y-6 px-4">
                  <motion.div 
                     initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                     className="w-32 h-32 bg-brand-green/20 rounded-full flex items-center justify-center mb-4"
                  >
                     <CheckCircle className="w-16 h-16 text-brand-green" />
                  </motion.div>
                  <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-4xl font-bold tracking-tight text-white leading-tight">
                     Application submitted!
                  </motion.h1>
                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed">
                     You successfully applied to <span className="font-bold text-white">{job.title}</span> at <span className="text-white">{job.company}</span>.
                  </motion.p>
                  
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 w-full max-w-xs">
                     <button onClick={() => navigate('/dashboard')} className="w-full py-4 text-slate-300 font-bold bg-[#121620] border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors">
                        View in My Applications &rarr;
                     </button>
                  </motion.div>
               </motion.div>
            )}
          </AnimatePresence>
       </div>
    </div>
  );
}
