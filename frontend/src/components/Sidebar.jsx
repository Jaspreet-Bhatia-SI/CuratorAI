import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, closeMenu }) {
  const { user, setIsLoginModalOpen, setIsProfileModalOpen } = useAuth();
  const location = useLocation();

  const getLinkClasses = (path) => {
    const isActive = location.pathname === path;
    return isActive 
      ? 'flex items-center gap-4 px-4 py-3 rounded-xl transition-all bg-primary-container text-on-primary-container font-label-md text-label-md shadow-sm'
      : 'flex items-center gap-4 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface hover:translate-x-1 transition-all font-label-md text-label-md';
  };

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 bg-surface-container-lowest/90 backdrop-blur-xl border-r border-outline-variant/30 z-50 flex-col justify-between pt-4 pb-6 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0 flex' : '-translate-x-full md:translate-x-0 hidden md:flex'}`}>
      <div className="flex flex-col gap-4">
        {/* Logo Area */}
        <div className="flex items-center justify-between px-6 h-12">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo192.png" alt="Curator AI Logo" className="w-9 h-9 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              Curator <span className="text-primary font-bold">AI</span>
            </span>
          </Link>
          <button aria-label="Close sidebar" onClick={closeMenu} className="md:hidden text-on-surface-variant p-2 rounded-full hover:bg-surface-container-high transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
        
        {/* Active Engine Box */}
        <div className="px-4 mt-2">
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5 shadow-sm">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Active Engine</span>
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface font-semibold">Curator Engine</span>
              <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse"></span>
            </div>
          </div>
        </div>
        
        {/* Navigation List */}
        <nav className="flex flex-col gap-1.5 px-3 mt-4">
          <Link to="/" className={getLinkClasses('/')}>
            <span className="material-symbols-outlined text-[20px]">explore</span>
            <span>Home</span>
          </Link>
          <Link to="/library" className={getLinkClasses('/library')}>
            <span className="material-symbols-outlined text-[20px]">video_library</span>
            <span>Library</span>
          </Link>
          <button onClick={() => window.dispatchEvent(new Event("open-settings"))} className={getLinkClasses('/settings')}>
            <span className="material-symbols-outlined text-[20px]">api</span>
            <span>API & Keys</span>
          </button>
        </nav>
      </div>

      {/* User Status Area */}
      <div className="px-4 flex flex-col gap-3">
        {user ? (
          <button 
            onClick={() => setIsProfileModalOpen(true)} 
            aria-label="Open profile modal"
            className="w-full text-left p-3.5 rounded-2xl bg-surface-container-low flex items-center justify-between shadow-sm border border-outline-variant/20 cursor-pointer hover:bg-surface-container-high hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <div className="flex items-center gap-3">
              <img alt="Profile" className="w-9 h-9 rounded-full object-cover bg-surface shadow-sm" src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}&mouth=smile,twinkle`} />
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">{user.name || user.user_metadata?.full_name || user.user_metadata?.name || 'User'}</span>
                <span className="font-label-sm text-[10px] text-primary font-bold uppercase tracking-wide">Pro Plan</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]" aria-hidden="true">verified</span>
          </button>
        ) : (
          <button 
            onClick={() => setIsLoginModalOpen(true)} 
            aria-label="Sign in"
            className="w-full p-3.5 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md cursor-pointer hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all gap-2 font-label-md font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">login</span>
            <span>Sign In to Sync</span>
          </button>
        )}
      </div>
    </aside>
  );
}
