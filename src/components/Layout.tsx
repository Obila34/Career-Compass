import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Network, Briefcase, LayoutDashboard, Shield, LogOut, Loader2 } from 'lucide-react';
import { auth, db } from '../lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/seed', { method: 'POST' }).catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/auth');
      } else {
        try {
          const userDocSnap = await getDoc(doc(db, "users", user.uid));
          if (!userDocSnap.exists()) {
             navigate('/onboarding');
          } else {
             const data = userDocSnap.data();
             if ((data.profileCompleteness || 0) < 80) {
                navigate('/onboarding');
             }
          }
        } catch(e) {
          console.warn("Failed to fetch user doc for onboarding check");
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/auth');
  };


  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Network', path: '/network', icon: Network },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Admin', path: '/admin/jobs', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#05070a] text-slate-100 flex relative overflow-hidden">
      {/* Mesh Gradient Background Overlays */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-900/20 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-emerald-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <aside className="w-64 bg-white/5 border-r border-white/10 backdrop-blur-md flex-col hidden md:flex relative z-10 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-tr from-orange-500 to-indigo-600 rounded shadow-lg shadow-orange-500/20"></div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-5">Introd<br/><span className="text-xs font-medium text-slate-400">Career Compass</span></h1>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon className="w-5 h-5 opacity-75" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5 opacity-75" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative z-10 pb-[72px] md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-[#0A0D14]/95 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-2 pb-safe">
        {[ 
          { name: 'Jobs', path: '/jobs', icon: Briefcase },
          { name: 'Network', path: '/network', icon: Network },
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Admin', path: '/admin/jobs', icon: Shield }
        ].map(item => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${isActive ? 'text-white' : 'text-slate-500'}`}>
              <Icon className={`w-6 h-6 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
