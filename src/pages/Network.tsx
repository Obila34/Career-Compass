import React, { useEffect, useState } from 'react';
import { Search, MapPin, Building2, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { User } from '../types';

export default function Network() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/10 pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">Network</h2>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search founders, tech, cities..." 
            className="pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl w-full md:w-64 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <select className="text-sm border border-white/10 rounded-lg py-1.5 px-3 bg-white/5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 hover:bg-white/10 transition-colors">
          <option className="bg-[#05070a]">Hub: All</option>
          <option className="bg-[#05070a]">USA</option>
          <option className="bg-[#05070a]">UK</option>
          <option className="bg-[#05070a]">UAE</option>
        </select>
        <select className="text-sm border border-white/10 rounded-lg py-1.5 px-3 bg-white/5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 hover:bg-white/10 transition-colors">
          <option className="bg-[#05070a]">Sector: All</option>
          <option className="bg-[#05070a]">Fintech</option>
          <option className="bg-[#05070a]">Healthtech</option>
        </select>
        <select className="text-sm border border-white/10 rounded-lg py-1.5 px-3 bg-white/5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 hover:bg-white/10 transition-colors">
          <option className="bg-[#05070a]">Stage: All</option>
          <option className="bg-[#05070a]">Pre-seed</option>
          <option className="bg-[#05070a]">Seed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl hover:bg-white/10 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-bold text-slate-300 flex-shrink-0">
                {user.displayName?.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-white leading-tight">{user.displayName}</h3>
                <p className="text-xs text-slate-400 mt-1">{user.headline}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <MapPin className="w-3.5 h-3.5 opacity-70" /> <span>{user.originCity} → {user.currentCity}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Building2 className="w-3.5 h-3.5 opacity-70" /> <span>{user.startupName} • {(user.accelerators || []).join(', ')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Target className="w-3.5 h-3.5 opacity-70" /> <span>Looking for: {(user.coreNeeds || []).join(', ')}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium tracking-wide">{(user.connectionPaths || []).length} mutual connections</span>
              <Link to={`/network/${user.id}/intro`} className="text-sm font-semibold text-orange-400 hover:text-orange-300 hover:underline">
                Find intro path
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
