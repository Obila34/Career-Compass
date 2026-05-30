import React, { useEffect, useState } from 'react';
import { Search, MapPin, Building2, Target, X, Briefcase, GraduationCap, Link2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { User } from '../types';
import { MOCK_NETWORK_USERS } from '../lib/seeds/seedNetworkProfiles';

export default function Network() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        if (querySnapshot.empty) {
          setUsers(MOCK_NETWORK_USERS as unknown as User[]);
        } else {
          const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
          setUsers(usersData);
        }
      } catch (e) {
        console.warn("Firebase fetch failed, falling back to mock users");
        setUsers(MOCK_NETWORK_USERS as unknown as User[]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/10 pb-6 shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-white">Network</h2>
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search founders, tech, cities..." 
            className="pl-10 pr-4 py-3 min-h-[44px] text-base md:text-sm bg-white/5 border border-white/10 rounded-xl w-full md:w-64 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0 snap-x">
        <select className="min-h-[44px] text-base md:text-sm border border-white/10 rounded-lg py-1.5 px-3 bg-white/5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-green hover:bg-white/10 transition-colors snap-start">
          <option className="bg-[#05070a]">Hub: All</option>
          <option className="bg-[#05070a]">USA</option>
          <option className="bg-[#05070a]">UK</option>
          <option className="bg-[#05070a]">UAE</option>
        </select>
        <select className="min-h-[44px] text-base md:text-sm border border-white/10 rounded-lg py-1.5 px-3 bg-white/5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-green hover:bg-white/10 transition-colors snap-start">
          <option className="bg-[#05070a]">Sector: All</option>
          <option className="bg-[#05070a]">Fintech</option>
          <option className="bg-[#05070a]">Healthtech</option>
        </select>
        <select className="min-h-[44px] text-base md:text-sm border border-white/10 rounded-lg py-1.5 px-3 bg-white/5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-green hover:bg-white/10 transition-colors snap-start">
          <option className="bg-[#05070a]">Stage: All</option>
          <option className="bg-[#05070a]">Pre-seed</option>
          <option className="bg-[#05070a]">Seed</option>
        </select>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        {users.map(user => (
          <div key={user.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl hover:bg-white/10 transition-colors flex flex-col h-full cursor-pointer" onClick={() => setSelectedUser(user)}>
            <div className="flex items-start gap-4">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-full object-cover shrink-0 border border-white/10" />
              ) : (
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-bold text-slate-300 flex-shrink-0">
                  {user.displayName?.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-white leading-tight pr-2 hover:text-brand-green transition-colors">{user.displayName}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{user.headline}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2 flex-1">
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300">
                <MapPin className="w-4 h-4 opacity-70 shrink-0" /> <span className="line-clamp-1">{user.originCity} → {user.currentCity}</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300">
                <Building2 className="w-4 h-4 opacity-70 shrink-0" /> <span className="line-clamp-1">{user.currentRole} @ {user.currentCompany || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300">
                <Target className="w-4 h-4 opacity-70 shrink-0" /> <span className="line-clamp-1">Looking for: {(user.lookingFor || []).join(', ') || 'Opportunities'}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between shrink-0" onClick={e => e.stopPropagation()}>
              <span className="text-xs text-slate-400 font-medium tracking-wide">3 mutual connections</span>
              <Link to={`/network/${user.id}/intro`} className="text-sm font-semibold text-brand-green hover:text-green-400 hover:underline min-h-[44px] flex items-center justify-center -my-2 py-2">
                Find intro path
              </Link>
            </div>
          </div>
        ))}
        {users.length === 0 && !loading && (
           <div className="col-span-full py-12 text-center text-slate-400">
             No users found in the network yet.
           </div>
        )}
      </div>

      {/* User Profile Overlay */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-5 border-b border-slate-800 pb-6">
                 {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt={selectedUser.displayName} className="w-20 h-20 rounded-full object-cover shrink-0 border-2 border-brand-green/20" />
                  ) : (
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-300 flex-shrink-0 text-3xl">
                      {selectedUser.displayName?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white leading-tight">{selectedUser.displayName}</h2>
                    <p className="text-brand-green font-medium mt-1">{selectedUser.headline}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-400">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedUser.currentCity}, {selectedUser.currentCountry || 'N/A'}</span>
                      </div>
                      {selectedUser.originCity && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-400 border-l border-slate-700 pl-4">
                          <span className="opacity-70">From:</span> {selectedUser.originCity}
                        </div>
                      )}
                    </div>
                  </div>
              </div>

              <div className="py-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">About</h3>
                  <p className="text-slate-300 leading-relaxed">{selectedUser.bio || "No bio provided."}</p>
                </div>
                
                {selectedUser.skills && selectedUser.skills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Skills & Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedUser.experience && selectedUser.experience.length > 0) ? (
                   <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                       <Briefcase className="w-4 h-4" /> Experience
                    </h3>
                    <div className="space-y-4">
                       {selectedUser.experience.map((exp: any, idx: number) => (
                          <div key={idx} className="relative pl-4 border-l-2 border-slate-800">
                            <div className="absolute w-2 h-2 bg-brand-green rounded-full -left-[5px] top-1.5"></div>
                            <h4 className="font-semibold text-slate-200">{exp.title}</h4>
                            <div className="text-sm text-brand-green/80 font-medium">{exp.company}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{exp.startYear} - {exp.isCurrent ? 'Present' : exp.endYear}</div>
                            {exp.description && <p className="text-sm text-slate-400 mt-2">{exp.description}</p>}
                          </div>
                       ))}
                    </div>
                   </div>
                ) : (
                  selectedUser.currentRole && (
                     <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Current Role</h3>
                      <p className="text-slate-300">{selectedUser.currentRole} at {selectedUser.currentCompany}</p>
                     </div>
                  )
                )}

                {selectedUser.education && selectedUser.education.length > 0 && (
                    <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                       <GraduationCap className="w-4 h-4" /> Education
                    </h3>
                    <div className="space-y-4">
                       {selectedUser.education.map((edu: any, idx: number) => (
                          <div key={idx}>
                            <h4 className="font-semibold text-slate-200">{edu.institution}</h4>
                            <div className="text-sm text-slate-400">{edu.degree} {edu.graduationYear ? `(${edu.graduationYear})` : ''}</div>
                          </div>
                       ))}
                    </div>
                   </div>
                )}
                
              </div>
              
              <div className="border-t border-slate-800 pt-6 mt-6 flex justify-end gap-3 rounded-b-xl">
                 <Link onClick={e => e.stopPropagation()} to={`/network/${selectedUser.id}/intro`} className="px-5 py-2.5 bg-brand-green text-green-950 font-bold rounded-xl hover:bg-brand-green/90 transition-colors flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Request Intro
                 </Link>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
