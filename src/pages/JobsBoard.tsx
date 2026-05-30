import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Building2, MapPin, DollarSign, ExternalLink, Sparkles, Filter, X } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { Job } from '../types';
import { MOCK_JOBS } from '../lib/seeds/seedJobs';

export default function JobsBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const q = query(collection(db, 'jobs'), where("vetStatus", "==", "approved"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setJobs(MOCK_JOBS as unknown as Job[]);
        } else {
          const jobsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
          setJobs(jobsData);
        }
      } catch (e) {
        console.warn("Firebase fetch failed, falling back to mock jobs (user maybe not signed in)");
        setJobs(MOCK_JOBS as unknown as Job[]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Jobs Board</h2>
          <p className="text-sm text-slate-400">Fresh listings vetted for legitimacy within 72 hrs.</p>
        </div>
        <button 
          onClick={() => setIsFilterOpen(true)}
          className="md:hidden flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 min-h-[44px] text-base text-white"
        >
          <Filter className="w-5 h-5" /> Filters
        </button>
      </div>

      {/* Desktop Inline Filters */}
      <div className="hidden md:flex items-center gap-2 pb-2">
        <select className="text-sm border border-white/10 rounded-lg py-1.5 px-3 bg-white/5 text-slate-300 outline-none focus:ring-1 focus:ring-orange-500 min-h-[44px]">
          <option className="bg-[#05070a]">Type: All</option>
          <option className="bg-[#05070a]">Remote</option>
          <option className="bg-[#05070a]">Hybrid</option>
        </select>
        <select className="text-sm border border-white/10 rounded-lg py-1.5 px-3 bg-white/5 text-slate-300 outline-none focus:ring-1 focus:ring-orange-500 min-h-[44px]">
          <option className="bg-[#05070a]">Sector: All</option>
          <option className="bg-[#05070a]">Fintech</option>
          <option className="bg-[#05070a]">Logistics</option>
        </select>
      </div>

      {/* Mobile Bottom Sheet Filter */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}>
          <div className="w-full bg-[#090b10] border-t border-white/10 rounded-t-3xl p-6 pb-safe" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Filters</h3>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-white/5 rounded-full text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm text-slate-400 mb-1 block">Job Type</span>
                <select className="w-full text-base border border-white/10 rounded-xl px-4 bg-white/5 text-slate-300 outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]">
                  <option className="bg-[#05070a]">All</option>
                  <option className="bg-[#05070a]">Remote</option>
                  <option className="bg-[#05070a]">Hybrid</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-slate-400 mb-1 block">Sector</span>
                <select className="w-full text-base border border-white/10 rounded-xl px-4 bg-white/5 text-slate-300 outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]">
                  <option className="bg-[#05070a]">All</option>
                  <option className="bg-[#05070a]">Fintech</option>
                  <option className="bg-[#05070a]">Logistics</option>
                </select>
              </label>
              <button onClick={() => setIsFilterOpen(false)} className="w-full bg-indigo-600 text-white font-bold rounded-xl mt-4 min-h-[44px]">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
        {loading ? (
           <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
              <p className="text-slate-400 font-medium">Fetching verified opportunities...</p>
           </div>
        ) : jobs.length === 0 ? (
           <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] backdrop-blur-xl">
              <Briefcase className="w-12 h-12 text-slate-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Loading fresh jobs...</h3>
              <p className="text-slate-400 max-w-md">Our AI is currently scouring the web and vetting new opportunities. Check back in a few hours for the latest verified roles.</p>
           </div>
        ) : jobs.map(job => (
           <div key={job.id} className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-xl rounded-2xl p-6 shadow-sm flex flex-col h-full">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{job.title}</h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                      <Building2 className="w-4 h-4 opacity-70" /> {job.company}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-300">
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                    <MapPin className="w-3.5 h-3.5 opacity-70" /> {job.locationType}
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                    <DollarSign className="w-3.5 h-3.5 opacity-70" /> {job.salaryMin ? `${job.salaryMin/1000}k-${job.salaryMax/1000}k` : 'Unspecified'}
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs uppercase tracking-wider font-bold items-center border border-emerald-500/20">
                    {job.legitimacyScore || 0} SCORE
                  </div>
                </div>

                <p className="text-sm text-slate-400 line-clamp-3 mt-4 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                   {job.networkInsiders && job.networkInsiders.length > 0 && (
                     <>
                       <div className="flex -space-x-2">
                         <div className="w-6 h-6 rounded-full border-2 border-[#05070a] bg-slate-700" />
                         <div className="w-6 h-6 rounded-full border-2 border-[#05070a] bg-slate-600" />
                       </div>
                       <span className="text-xs font-semibold text-orange-400">{job.networkInsiders.length} connection{job.networkInsiders.length > 1 ? 's' : ''} here</span>
                     </>
                   )}
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <Link
                  to={`/jobs/${job.id}/apply`}
                  className="w-full bg-brand-green text-black text-base md:text-sm font-bold min-h-[44px] rounded-xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-black" /> Intelligent Apply
                </Link>
                <button onClick={() => window.open(job.applyUrl, '_blank')} className="w-full bg-[#121620] text-slate-300 border border-slate-800 text-base md:text-sm font-bold min-h-[44px] rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                  Direct Apply <ExternalLink className="w-4 h-4" />
                </button>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
