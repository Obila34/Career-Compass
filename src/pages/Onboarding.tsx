import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../lib/firebase/client';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import { User } from '../types';
import { Camera, UploadCloud, ChevronRight, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [optimiseSuggestions, setOptimiseSuggestions] = useState<any>(null);
  
  const [profile, setProfile] = useState<Partial<User>>({
    displayName: '',
    photoURL: '',
    headline: '',
    currentRole: '',
    currentCompany: '',
    currentCity: '',
    originCity: '',
    bio: '',
    skills: [],
    industries: [],
    locationPreferences: [],
    salaryExpectationUSD: 20000,
    lookingFor: []
  });

  // Photo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resume
  const resumeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if auth is ready and populate default name/photo
    const currentUser = auth.currentUser;
    if (currentUser) {
      setProfile(prev => ({
        ...prev,
        displayName: currentUser.displayName || '',
        photoURL: currentUser.photoURL || ''
      }));
    } else {
      // If no current user, we can't onboard right now
      navigate('/auth');
    }
  }, [navigate]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    // Resize down to 400x400 via canvas
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 400;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      // Immediately preview
      setProfile(prev => ({ ...prev, photoURL: dataUrl }));

      // Upload to storage
      if (auth.currentUser) {
        setLoading(true);
        try {
          const storageRef = ref(storage, `profile-photos/${auth.currentUser.uid}`);
          await uploadString(storageRef, dataUrl, 'data_url');
          const finalUrl = await getDownloadURL(storageRef);
          setProfile(prev => ({ ...prev, photoURL: finalUrl }));
        } catch (err) {
          console.error("Photo upload failed", err);
        } finally {
          setLoading(false);
        }
      }
    };
  };

  const [backgroundExtracting, setBackgroundExtracting] = useState(false);

  const processResume = async (file: File) => {
    setExtracting(true);
    
    // Quick demo UX - show the cool animation for 1.5s then move on
    setTimeout(() => {
      setExtracting(false);
      setStep(3);
      setBackgroundExtracting(true);
    }, 1500);

    try {
      // 1. Upload in background
      const resumeRef = ref(storage, `resumes/${auth.currentUser?.uid || 'temp'}/${file.name}`);
      uploadBytes(resumeRef, file).then(async () => {
         const cvUrl = await getDownloadURL(resumeRef);
         setProfile(prev => ({ ...prev, cvUrl }));
      }).catch(e => console.warn(e));

      // 2. Call extraction API
      const formData = new FormData();
      formData.append('resume', file);
      const res = await fetch('/api/profile/extract-resume', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (res.ok && data) {
         setProfile(prev => ({
           ...prev,
           ...data, // merge extracted fields
           // ensure skills and industries are arrays
           skills: data.skills || prev.skills || [],
           industries: data.industries || prev.industries || []
         }));
      } else {
        console.warn("Extraction didn't yield success data", data);
      }
    } catch (e) {
      console.error("Resume Extraction Error", e);
    } finally {
      setBackgroundExtracting(false);
    }
  };

  const handleOptimise = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/optimise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });
      const data = await res.json();
      if (data && res.ok) {
        setOptimiseSuggestions({
          headline: data.optimisedHeadline || data.headline,
          bio: data.optimisedBio || data.bio,
          skillsToSuggest: data.suggestedSkillsToAdd || data.skillsToSuggest || []
        });
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestions = () => {
    if (optimiseSuggestions) {
       setProfile(prev => ({
         ...prev,
         headline: optimiseSuggestions.headline || prev.headline,
         bio: optimiseSuggestions.bio || prev.bio,
         skills: Array.from(new Set([...(prev.skills||[]), ...(optimiseSuggestions.skillsToSuggest||[])]))
       }));
       setOptimiseSuggestions(null);
    }
  };

  const handleComplete = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const uRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(uRef, {
        ...profile,
        profileCompleteness: 100,
        createdAt: new Date()
      }, { merge: true });
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processResume(e.dataTransfer.files[0]);
    }
  };

  const handleSkillAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      setProfile({
        ...profile,
        skills: [...(profile.skills || []), e.currentTarget.value.trim()]
      });
      e.currentTarget.value = '';
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-[100dvh] bg-[#0A0D14] text-white flex flex-col items-center">
      <div className="w-full max-w-xl mx-auto p-6 md:pt-12 flex-1 flex flex-col gap-8 relative z-10">
        
        {/* Progress Bar Top */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>Step {step} of 4</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
               className="h-full bg-brand-green"
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col gap-6"
            >
              <div className="text-center space-y-2 mb-4">
                <h1 className="text-3xl font-semibold tracking-tight">Welcome to Introd</h1>
                <p className="text-slate-400">Let's set up your profile properly.</p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full border-4 border-slate-800 overflow-hidden bg-slate-900 flex items-center justify-center">
                    {profile.photoURL ? (
                       <img src={profile.photoURL} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                       <Camera className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-3 bg-brand-green text-black rounded-full shadow-lg hover:scale-105 transition-transform"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="user" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                  />
                </div>

                <div className="w-full space-y-2">
                  <label className="text-sm font-medium text-slate-300">Display Name</label>
                  <input
                    type="text"
                    value={profile.displayName || ''}
                    onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                  />
                </div>
              </div>

              <div className="mt-auto pt-8">
                <button 
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="w-full py-4 bg-white text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
               <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-semibold tracking-tight">Upload Resume</h1>
                <p className="text-slate-400">We'll use AI to extract your experience instantly.</p>
              </div>

              {extracting ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                  <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-2 border-brand-green/20 animate-ping"></div>
                    <Sparkles className="w-10 h-10 text-brand-green animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-medium">Reading your resume with AI...</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto">Extracting your experience, skills, and education</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-6">
                  <label 
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-900 border-2 border-dashed border-slate-700 rounded-3xl p-8 hover:bg-slate-800/50 hover:border-slate-500 transition-all cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                      <UploadCloud className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-slate-500 mt-1">PDF or DOCX (max. 10MB)</p>
                    </div>
                    <input 
                      type="file" 
                      accept=".pdf,.docx" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) processResume(e.target.files[0]);
                      }}
                    />
                  </label>

                  <button 
                    onClick={() => setStep(3)}
                    className="py-3 text-slate-400 hover:text-white font-medium text-sm transition-colors"
                  >
                    Fill in manually instead
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col gap-6"
            >
              <div className="space-y-2 mb-2">
                <h1 className="text-3xl font-semibold tracking-tight">Profile Details</h1>
                <p className="text-slate-400">Review what we extracted or fill it in.</p>
              </div>

              <AnimatePresence>
                {backgroundExtracting && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-brand-green/10 border border-brand-green/30 p-4 rounded-xl flex items-center justify-between shadow-lg overflow-hidden relative">
                    <div className="flex items-center gap-3 relative z-10">
                      <Loader2 className="w-5 h-5 text-brand-green animate-spin" />
                      <div>
                        <h4 className="text-brand-green text-sm font-bold">Extracting in background...</h4>
                        <p className="text-xs text-brand-green/80">Fields will auto-populate momentarily.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={handleOptimise}
                disabled={loading || backgroundExtracting}
                className="w-full py-4 bg-green-900/40 border border-brand-green/50 text-brand-green rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-900/60 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Optimise with AI
              </button>

              <AnimatePresence>
                {optimiseSuggestions && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-brand-green/10 border border-brand-green p-4 rounded-xl space-y-4">
                     <div>
                       <h3 className="font-bold text-brand-green mb-1">AI Suggestions</h3>
                       <p className="text-sm text-slate-300">Here's how we'd improve your profile.</p>
                     </div>
                     <div className="space-y-2 text-sm">
                       <p><strong className="text-white">Headline:</strong> {optimiseSuggestions.headline}</p>
                       <p><strong className="text-white">Bio:</strong> {optimiseSuggestions.bio}</p>
                       {optimiseSuggestions.skillsToSuggest?.length > 0 && (
                         <p><strong className="text-white">Add Skills:</strong> {optimiseSuggestions.skillsToSuggest.join(', ')}</p>
                       )}
                     </div>
                     <div className="flex gap-3">
                       <button onClick={applySuggestions} className="flex-1 bg-brand-green text-black font-bold py-2 rounded-lg text-sm hover:bg-emerald-500">Apply suggestions</button>
                       <button onClick={() => setOptimiseSuggestions(null)} className="flex-1 bg-slate-800 text-white font-bold py-2 rounded-lg text-sm hover:bg-slate-700">Keep mine</button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Current Role</label>
                  <input type="text" value={profile.currentRole || ''} onChange={e => setProfile({...profile, currentRole: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:border-slate-600 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Current Company</label>
                  <input type="text" value={profile.currentCompany || ''} onChange={e => setProfile({...profile, currentCompany: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:border-slate-600 outline-none" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-slate-400">Headline</label>
                  <input type="text" value={profile.headline || ''} onChange={e => setProfile({...profile, headline: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:border-slate-600 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Current City</label>
                  <input type="text" value={profile.currentCity || ''} onChange={e => setProfile({...profile, currentCity: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:border-slate-600 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Origin City</label>
                  <input type="text" value={profile.originCity || ''} onChange={e => setProfile({...profile, originCity: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:border-slate-600 outline-none" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs flex justify-between font-medium text-slate-400">
                    <span>Bio</span>
                    <span>{(profile.bio||'').length}/200</span>
                  </label>
                  <textarea maxLength={200} value={profile.bio || ''} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:border-slate-600 outline-none h-24 resize-none" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-medium text-slate-400">Skills</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profile.skills?.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-800 text-sm rounded-full flex items-center gap-1">
                        {skill}
                        <button onClick={() => setProfile({...profile, skills: profile.skills?.filter((_, idx)=>idx!==i)})} className="opacity-50 hover:opacity-100">&times;</button>
                      </span>
                    ))}
                  </div>
                  <input type="text" placeholder="Type a skill and press Enter" onKeyDown={handleSkillAdd} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:border-slate-600 outline-none" />
                </div>
              </div>

              <div className="mt-auto pt-8">
                <button 
                  onClick={() => setStep(4)}
                  className="w-full py-4 bg-white text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col gap-8"
            >
              <div className="space-y-2 mb-2">
                <h1 className="text-3xl font-semibold tracking-tight">Job Preferences</h1>
                <p className="text-slate-400">What are you looking for next?</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">Location Preference</label>
                  <div className="flex flex-wrap gap-3">
                    {['Remote', 'Hybrid', 'Onsite', 'Open to all'].map(loc => {
                      const isSelected = profile.locationPreferences?.includes(loc);
                      return (
                        <button 
                          key={loc}
                          onClick={() => {
                            if (isSelected) {
                              setProfile({...profile, locationPreferences: profile.locationPreferences?.filter(l => l!==loc)});
                            } else {
                              setProfile({...profile, locationPreferences: [...(profile.locationPreferences||[]), loc]});
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${isSelected ? 'bg-white text-black border-white' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}
                        >
                          {loc}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300 flex justify-between">
                    <span>Salary Expectation (USD)</span>
                    <span className="text-white">${profile.salaryExpectationUSD?.toLocaleString() || '0'}</span>
                  </label>
                  <input 
                    type="range" 
                    min="20000" max="200000" step="5000"
                    value={profile.salaryExpectationUSD || 20000}
                    onChange={(e) => setProfile({...profile, salaryExpectationUSD: parseInt(e.target.value)})}
                    className="w-full accent-brand-green"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">Looking For</label>
                  <div className="flex flex-wrap gap-3">
                    {['New role', 'Freelance', 'Advisory', 'Co-founder'].map(type => {
                      const isSelected = profile.lookingFor?.includes(type);
                      return (
                        <button 
                          key={type}
                          onClick={() => {
                            if (isSelected) {
                              setProfile({...profile, lookingFor: profile.lookingFor?.filter(l => l!==type)});
                            } else {
                              setProfile({...profile, lookingFor: [...(profile.lookingFor||[]), type]});
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${isSelected ? 'bg-white text-black border-white' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}
                        >
                          {type}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8">
                <button 
                  onClick={handleComplete}
                  disabled={loading}
                  className="w-full py-4 bg-brand-green text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete profile"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Sheet Profile Preview */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <button onClick={() => setShowPreview(true)} className="text-sm text-slate-500 hover:text-white font-medium flex items-center justify-center gap-2 w-full">
               Preview my profile
            </button>
        </div>
      </div>

      <AnimatePresence>
        {showPreview && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowPreview(false)}
               className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", bounce: 0, duration: 0.4 }}
               className="fixed bottom-0 left-0 right-0 bg-[#121620] border-t border-slate-800 rounded-t-3xl pt-2 pb-safe px-6 z-50 flex flex-col shadow-2xl h-[70vh] md:h-[50vh] max-w-2xl mx-auto"
            >
               <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-2 shrink-0" />
               <div className="flex-1 overflow-y-auto w-full pt-4 relative">
                 <div className="flex flex-col items-center">
                    <img src={profile.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.displayName || 'U'}`} alt="Profile" className="w-24 h-24 rounded-full border-4 border-slate-800 mb-4" />
                    <h2 className="text-2xl font-bold text-white">{profile.displayName || "Your Name"}</h2>
                    <p className="text-brand-green font-medium mb-1">{profile.headline || "Your headline will appear here"}</p>
                    <p className="text-sm text-slate-400 mb-6">
                      {profile.originCity ? `${profile.originCity} → ` : ''}
                      {profile.currentCity || 'Location not set'}
                    </p>
                    <div className="w-full text-left space-y-4">
                      {profile.bio && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-2">About</h4>
                          <p className="text-sm text-slate-400 leading-relaxed">{profile.bio}</p>
                        </div>
                      )}
                      {profile.skills && profile.skills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300 mb-2">Top Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.map((s, i) => <span key={i} className="px-3 py-1 bg-slate-800 text-xs rounded-full text-white">{s}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                 </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
