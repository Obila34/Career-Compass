import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Network, Briefcase, LayoutDashboard, Shield, LogOut } from 'lucide-react';
// We'd usually check auth state here, for demo purposes we allow passing through.
// import { auth } from '../lib/firebase/client'; 

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    // await auth.signOut();
    navigate('/auth');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Network', path: '/network', icon: Network },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Admin', path: '/admin/jobs', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 flex relative overflow-hidden">
      {/* Mesh Gradient Background Overlays */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-900/20 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-emerald-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <aside className="w-64 bg-white/5 border-r border-white/10 backdrop-blur-md flex-col hidden md:flex relative z-10">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-tr from-orange-500 to-indigo-600 rounded shadow-lg shadow-orange-500/20"></div>
            <h1 className="text-xl font-bold tracking-tight text-white">introd</h1>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
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

      <main className="flex-1 overflow-auto relative z-10">
        <header className="h-16 bg-white/5 border-b border-white/10 backdrop-blur-md flex items-center px-6 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-tr from-orange-500 to-indigo-600 rounded shadow-lg shadow-orange-500/20"></div>
            <h1 className="text-xl font-bold tracking-tight text-white">introd</h1>
          </div>
        </header>
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
