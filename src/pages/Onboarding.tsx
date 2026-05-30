import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [rawText, setRawText] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    headline: '',
    startupName: '',
    startupStage: '',
    sector: [] as string[],
    originCity: '',
    currentCity: '',
    currentCountry: '',
    accelerators: [] as string[],
    lookingFor: [] as string[]
  });

  const handleEnrich = async () => {
    if (!rawText) return;
    setIsEnriching(true);
    try {
      const res = await fetch('/api/enrich-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText })
      });
      const data = await res.json();
      if (data) {
         setFormData(prev => ({
           ...prev,
           ...data,
           sector: data.sector || prev.sector,
           accelerators: data.accelerators || prev.accelerators,
           lookingFor: data.lookingFor || prev.lookingFor
         }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'users'), {
        ...formData,
        uid: "dummy-uid", // in a real app, from auth.currentUser
        email: "dummy@example.com",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 p-6 flex flex-col items-center relative overflow-hidden">
      {/* Mesh Gradient Background Overlays */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-emerald-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 mt-12 relative z-10">
        <h2 className="text-2xl font-bold text-white mb-6">Complete your profile</h2>
        
        <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-2">Paste your LinkedIn bio for magic auto-fill (Optional)</label>
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-orange-500 focus:outline-none placeholder:text-slate-500"
              rows={4}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="E.g. Co-founder & CEO at Spleet Africa. Ex-Paystack. YC W22..."
            />
            <button 
              onClick={handleEnrich} 
              disabled={isEnriching}
              className="mt-3 bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              {isEnriching ? 'Extracting...' : 'Auto-fill with AI'}
            </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
            <input type="text" value={formData.displayName || ''} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Headline</label>
            <input type="text" value={formData.headline || ''} onChange={e => setFormData({...formData, headline: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Startup Name</label>
              <input type="text" value={formData.startupName || ''} onChange={e => setFormData({...formData, startupName: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Origin City</label>
              <input type="text" value={formData.originCity || ''} onChange={e => setFormData({...formData, originCity: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
          </div>
          {/* We would build out the full form here for all steps... */}
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={handleSave} className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
            Complete Setup
          </button>
        </div>
      </div>
    </div>
  );
}
