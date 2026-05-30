import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldAlert, Sparkles, Send } from 'lucide-react';
import { db } from '../lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function IntroPath() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [intent, setIntent] = useState('');

  const [pathAnalyzed, setPathAnalyzed] = useState(false);
  const [scoreData, setScoreData] = useState<any>(null);

  const startAnalysis = async () => {
    setPathAnalyzed(true);
    const mockPayload = {
      requester: { displayName: "You", currentCity: "Global", originCity: "", startupName: "", startupStage: "", sector: ["tech"], lookingFor: [] },
      target: { displayName: "Target Founder", currentCity: "", originCity: "", startupName: "", startupStage: "", sector: ["tech"] },
      connectors: [{ displayName: "Connector A", currentCity: "Global", startupName: "" }]
    };
    try {
      const db = (await import('../lib/firebase/client')).db;
      const {doc, getDoc} = require('firebase/firestore');
      if (userId) {
         try {
           const snap = await getDoc(doc(db, 'users', userId));
           if (snap.exists()) {
             mockPayload.target = snap.data();
           } else {
             const MOCK_NETWORK_USERS = require('../lib/seeds/seedNetworkProfiles').MOCK_NETWORK_USERS;
             const mockUser = MOCK_NETWORK_USERS.find(u => u.id === userId);
             if (mockUser) mockPayload.target = mockUser;
           }
         } catch(err) {}
      }
      
      const res = await fetch('/api/profile/score-intro-path', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(mockPayload)
      });
      const data = await res.json();
      setScoreData(data);
    } catch(e) {
      console.error(e);
      setScoreData({
         strengthScore: 75,
         strengthLabel: "Good",
         explanation: "You share common industry background.",
         sharedContext: ["Same sector"],
         suggestedApproach: "Mention your shared background."
      });
    }
  };

  const draftMessageCall = async () => {
    if (!intent) return;
    setIsDrafting(true);
    try {
      const res = await fetch('/api/draft-intro-message', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           requester: { displayName: "You" }, 
           target: { displayName: scoreData?.target?.displayName || "Target Founder" },
           targetProfile: scoreData?.target,
           connector: { displayName: "Connector A" },
           sharedContext: scoreData?.sharedContext || ["Both in fintech", "Both in London"],
           requesterIntent: intent
         })
      });
      const data = await res.json();
      setDraftMessage(data.message);
    } catch(e) {
      console.error(e);
    } finally {
      setIsDrafting(false);
    }
  };

  const sendRequest = async () => {
    try {
       await addDoc(collection(db, 'introRequests'), {
          requesterId: "you",
          targetId: userId,
          connectorsPath: ["connectorId1"],
          pathStrength: scoreData?.strengthScore || 80,
          aiExplanation: scoreData?.explanation || "good path",
          draftMessage,
          status: "draft",
          createdAt: serverTimestamp()
       });
       alert("Intro request placed in draft status.");
       navigate('/network');
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Intro Path Analysis</h2>
        <p className="text-slate-400 mt-1">Connecting with Target Founder</p>
      </div>

      {!pathAnalyzed ? (
        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 text-center backdrop-blur-xl">
          <Sparkles className="w-8 h-8 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">Analyze connection path</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto mb-6">Our AI engine will analyze your shared background, communities, and mutual connections to score the strength of this intro.</p>
          <button onClick={startAnalysis} className="bg-white text-black px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
            Analyze Path
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col items-center">
            <div className="flex items-center gap-4 w-full justify-center relative py-4">
              
              <div className="absolute left-[30%] right-[30%] h-[1px] bg-dashed border-t border-dashed border-white/20 top-1/2 -translate-y-2"></div>

              <div className="text-center relative z-10 flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-[#05070a] border-2 border-orange-500 rounded-full flex items-center justify-center font-bold text-slate-300 p-1">
                  <div className="w-full h-full bg-slate-800 rounded-full flex justify-center items-center">Y</div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">You</span>
              </div>
              
              <div className="text-center relative z-10 flex flex-col items-center gap-2 bg-[#05070a]/80 px-4">
                <div className="w-10 h-10 border border-white/20 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-400">CA</div>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">Connector A</p>
              </div>
              
              <div className="text-center relative z-10 flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-[#05070a] border-2 border-emerald-500 rounded-full flex items-center justify-center font-bold text-slate-300 p-1">
                  <div className="w-full h-full bg-slate-800 rounded-full flex justify-center items-center">TF</div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</span>
              </div>
            </div>
            
            {scoreData ? (
               <div className="mt-8 w-full border-t border-white/5 pt-6">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="flex bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest items-center gap-1.5">
                     <CheckCircle2 className="w-3.5 h-3.5" /> {scoreData.strengthScore}% — {scoreData.strengthLabel}
                   </div>
                 </div>
                 <p className="text-sm text-slate-300 leading-relaxed mb-4 italic">"{scoreData.explanation}"</p>
                 <div className="flex flex-wrap gap-2">
                   {(scoreData?.sharedContext || []).map((ctx: string, i: number) => (
                      <span key={i} className="bg-white/5 border border-white/10 text-slate-300 text-[10px] px-2 py-1 rounded">{ctx}</span>
                   ))}
                 </div>
                 <p className="text-sm text-slate-300 mt-4 bg-white/5 p-4 rounded-xl border border-white/10">
                   <span className="font-bold text-orange-400 mr-2">Suggested Approach:</span>
                   {scoreData.suggestedApproach}
                 </p>
               </div>
            ) : (
               <p className="mt-8 text-sm text-orange-400 animate-pulse">Analyzing vector signals...</p>
            )}
          </div>

          {scoreData && (
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
               <h3 className="text-lg font-bold text-white mb-4">Draft your message</h3>
               <label className="block text-sm font-medium text-slate-300 mb-2">What is the goal of this intro?</label>
               <input 
                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white mb-4 focus:ring-2 focus:ring-orange-500 focus:outline-none placeholder:text-slate-500"
                 placeholder="E.g. Want a 15min call to get advice on expanding to Nigeria"
                 value={intent}
                 onChange={e => setIntent(e.target.value)}
               />
               <button 
                 onClick={draftMessageCall}
                 disabled={isDrafting || !intent}
                 className="bg-white text-black px-5 py-2.5 font-bold text-sm rounded-xl hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2 transition-colors"
               >
                 <Sparkles className="w-4 h-4" />
                 {isDrafting ? 'Drafting...' : 'Draft Message'}
               </button>

               {draftMessage && (
                 <div className="mt-6 border-t border-white/5 pt-6">
                   <label className="block text-sm font-medium text-slate-300 mb-2">Your Draft (Editable)</label>
                   <textarea
                     className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:ring-2 focus:ring-orange-500 focus:outline-none min-h-[120px]"
                     value={draftMessage}
                     onChange={e => setDraftMessage(e.target.value)}
                   />
                   <div className="mt-4 flex justify-end">
                     <button onClick={sendRequest} className="bg-orange-500 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-orange-400 flex items-center gap-2 transition-colors">
                       <Send className="w-4 h-4" /> Send Request to Connector
                     </button>
                   </div>
                 </div>
               )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
