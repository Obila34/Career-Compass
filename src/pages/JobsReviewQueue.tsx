import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { Job } from '../types';

export default function JobsReviewQueue() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const q = query(collection(db, 'jobs'), where("vetStatus", "==", "pending"));
      const querySnapshot = await getDocs(q);
      const jobsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(jobsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (jobId: string, status: 'approved' | 'rejected') => {
      try {
          await updateDoc(doc(db, 'jobs', jobId), { vetStatus: status });
          setJobs(jobs.filter(j => j.id !== jobId));
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">Admin Review Queue</h2>
        <p className="text-sm text-slate-400 mt-1">Review AI legitimacy scores and flag combinations before jobs go live.</p>
      </div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 text-slate-300 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Job Title / Company</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Legitimacy Score</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">AI Flags</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {jobs.map(job => (
              <tr key={job.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-white">{job.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{job.company}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded w-max text-[10px] font-bold uppercase tracking-widest border border-white/10 ${(job.legitimacyScore || 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {job.legitimacyScore || 0} / 100
                  </span>
                </td>
                <td className="px-6 py-4 max-w-xs truncate">
                  {(job.legitimacyFlags || []).length > 0 ? (
                    <div className="flex items-center gap-1.5 text-red-400">
                      <AlertTriangle className="w-4 h-4 opacity-80" />
                      <span className="truncate">{(job.legitimacyFlags || []).join(', ')}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">None</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAction(job.id, 'approved')} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Approve">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleAction(job.id, 'rejected')} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Reject">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">
            No jobs in the queue.
          </div>
        )}
      </div>
    </div>
  );
}
