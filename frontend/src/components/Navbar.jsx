import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Navbar({ isHome, toggleMobileMenu }) {
  const { searchQuery, setSearchQuery } = useAppContext();
  const location = useLocation();
  const { user, setIsLoginModalOpen, setIsProfileModalOpen, isDarkMode, toggleTheme } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full bg-background/50 backdrop-blur-2xl border-b border-outline-variant/20 transition-all duration-300">
      <div className="h-[72px] w-full max-w-[1800px] mx-auto px-4 lg:px-8 grid grid-cols-3 items-center gap-4">
        
        {/* Left side: Logo & Search */}
        <div className="flex items-center gap-4 justify-start">
          <Link to="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary rounded-full pr-2 group shrink-0" aria-label="Go to Home" onClick={() => { if(typeof setRoadmap !== 'undefined') { setRoadmap(null); setSearchQuery(""); } }}>
            <img src="/logo192.png" alt="Curator AI Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:shadow-md transition-all group-hover:scale-105 group-active:scale-95" />
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight hidden sm:inline-block">
              Curator <span className="text-primary font-bold">AI</span>
            </span>
          </Link>

          {!isHome && (
            <div className="hidden md:flex items-center w-full max-w-[280px] px-4 py-2 rounded-full bg-surface-container/50 border border-outline-variant/30 text-on-surface-variant focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary focus-within:bg-surface-container transition-all" id="tour-search">
              <span className="material-symbols-outlined text-[18px] mr-2 text-primary/70" aria-hidden="true">search</span>
              <input 
                aria-label="Search Roadmap"
                className="bg-transparent flex-1 font-body-sm text-body-sm focus:outline-none text-on-surface w-full min-w-0"
                placeholder="Search or paste Spotify/YouTube link..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Center Nav Links (Animated Segmented Control) */}
        <div className="flex items-center justify-center">
          <nav className="hidden xl:flex items-center bg-surface-container/30 border border-outline-variant/20 p-1.5 rounded-full backdrop-blur-md relative shadow-inner">
          {[
            { name: 'Home', path: '/' },
            { name: 'Library', path: '/library' }
          ].map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.name}
                to={tab.path}
                className={`relative px-6 py-2 rounded-full font-label-md text-label-md transition-colors z-10 focus:outline-none ${isActive ? 'text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => { if (tab.path === '/' && setRoadmap) { setRoadmap(null); setSearchQuery(""); } }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary-container rounded-full -z-10 shadow-sm border border-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 font-bold tracking-wide">{tab.name}</span>
              </Link>
            );
          })}
          </nav>
        </div>

        {/* Right side icons */}
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} onClick={toggleTheme} className="w-10 h-10 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button onClick={() => window.dispatchEvent(new Event("open-settings"))} aria-label="Settings and API Keys" className="hidden sm:flex w-10 h-10 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">api</span>
          </button>
          <div className="h-6 w-px bg-outline-variant/50 mx-1 hidden sm:block" aria-hidden="true"></div>
          {user ? (
            <button 
              aria-label="Open Profile Menu"
              onClick={() => setIsProfileModalOpen(true)}
              className="ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-lowest"
            >
              <img 
                alt={`${user.name || 'User'} Profile`} 
                className="w-9 h-9 rounded-full object-cover shadow-sm bg-surface-container-high cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all" 
                src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}&mouth=smile,twinkle`} 
              />
            </button>
          ) : (
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="px-4 py-2 sm:px-5 sm:py-2.5 ml-1 rounded-xl bg-primary text-on-primary font-label-md text-label-md shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-lowest"
            >
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
