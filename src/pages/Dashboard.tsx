import React from 'react';
import { Users, Briefcase, FileText } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back, Founder</h2>
          <p className="text-slate-400 text-sm mt-1">Profile completion: 85%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-slate-400" />
            <h3 className="font-medium text-slate-200">Your Network</h3>
          </div>
          <p className="text-3xl font-bold text-white mt-2">124</p>
          <p className="text-sm text-slate-400 mt-1">Founders in your 1st degree</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-slate-400" />
            <h3 className="font-medium text-slate-200">Pending Intros</h3>
          </div>
          <p className="text-3xl font-bold text-white mt-2">3</p>
          <p className="text-sm text-slate-400 mt-1">Waiting for your response</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-5 h-5 text-slate-400" />
            <h3 className="font-medium text-slate-200">Recommended Jobs</h3>
          </div>
          <p className="text-3xl font-bold text-white mt-2">12</p>
          <p className="text-sm text-slate-400 mt-1">Vetted matches this week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-4">People you should meet</h3>
          <div className="space-y-4">
             {/* Mock mapping of vector search results */}
             {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-3 border border-white/5 rounded-xl hover:bg-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-medium text-slate-300">
                      F{i}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Founder Name {i}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Fintech • YC • Lagos → SF</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 min-h-[44px] px-2 flex items-center justify-center">View path</button>
                </div>
             ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-4">New vetted jobs</h3>
          <div className="space-y-4">
             {/* Mock mapping of recent jobs */}
             {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col p-4 border border-white/5 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                   <p className="text-sm font-bold text-white">Senior Product Engineer</p>
                   <p className="text-xs text-slate-400 mt-1">Paystack • Remote (EMEA) • ₦40M - ₦60M</p>
                   <div className="mt-3 flex items-center gap-2">
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">98 Score</span>
                     <span className="text-xs text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" /> 2 warm paths</span>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
