import React, { useEffect, useState } from 'react';
import { Briefcase, Building2, MapPin, DollarSign, ExternalLink } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { Job } from '../types';

export default function JobsBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const q = query(collection(db, 'jobs'), where("vetStatus", "==", "approved"));
        const querySnapshot = await getDocs(q);
        const jobsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setJobs(jobsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/10 pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">Jobs Board</h2>
        <p className="text-sm text-slate-400">Fresh listings vetted for legitimacy within 72 hrs.</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <select className="text-sm border border-white/10 rounded-lg py-1.5 px-3 bg-white/5 text-slate-300 outline-none focus:ring-1 focus:ring-orange-500">
          <option className="bg-[#05070a]">Type: All</option>
          <option className="bg-[#05070a]">Remote</option>
          <option className="bg-[#05070a]">Hybrid</option>
        </select>
        <select className="text-sm border border-white/10 rounded-lg py-1.5 px-3 bg-white/5 text-slate-300 outline-none focus:ring-1 focus:ring-orange-500">
          <option className="bg-[#05070a]">Sector: All</option>
          <option className="bg-[#05070a]">Fintech</option>
          <option className="bg-[#05070a]">Logistics</option>
        </select>
      </div>

      <div className="space-y-4">
         {jobs.map(job => (
           <div key={job.id} className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-xl rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 md:items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{job.title}</h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                      <Building2 className="w-4 h-4 opacity-70" /> {job.company}
                    </p>
                  </div>
                  <div className="hidden md:flex bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold items-center border border-emerald-500/20">
                    {job.score} Legitimacy
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 opacity-70" /> {job.location} ({job.locationType})
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 opacity-70" /> {job.salaryMin ? `${job.salaryCurrency} ${job.salaryMin} - ${job.salaryMax}` : 'Unspecified'}
                  </div>
                </div>

                <p className="text-sm text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                   <div className="flex -space-x-2">
                     <div className="w-6 h-6 rounded-full border-2 border-[#05070a] bg-slate-700" />
                     <div className="w-6 h-6 rounded-full border-2 border-[#05070a] bg-slate-600" />
                   </div>
                   <span className="text-xs font-semibold text-orange-400">2 connections work here</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[140px]">
                <button className="w-full bg-orange-500 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-orange-400 transition-colors flex items-center justify-center gap-2">
                  Find Warm Path
                </button>
                <button onClick={() => window.open(job.applyUrl, '_blank')} className="w-full bg-white/5 text-slate-200 border border-white/10 text-sm font-bold py-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                  Apply <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
