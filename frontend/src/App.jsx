import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Studio from './pages/Studio';
import History from './pages/History';
const Library = React.lazy(() => import('./pages/Library'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
import CookieConsent from './components/CookieConsent';
import Footer from './components/Footer';
const NotFound = React.lazy(() => import('./pages/NotFound'));
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
const Profile = React.lazy(() => import("./pages/Profile"));
import { AuthProvider, useAuth } from './context/AuthContext';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import Onboarding from './components/Onboarding';
import FloatingPlayer from './components/FloatingPlayer';
import BottomNav from './components/BottomNav';
import SyncProgressPanel from './components/SyncProgressPanel';
import StartupSyncModal from './components/StartupSyncModal';

function LayoutEngine() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, setIsLoginModalOpen, setIsProfileModalOpen } = useAuth();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col selection:bg-primary/30 transition-colors duration-300 pb-[72px] md:pb-0">
      <Navbar isHome={isHome} toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      
      <main className="w-full pt-[72px] min-h-screen flex flex-col relative z-0">
        <AnimatePresence mode="wait">
          <React.Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <Routes location={location} key={location.pathname}>              
            <Route path="/" element={<Home />} />
            <Route path="/studio" element={<Navigate to="/" replace />} />
            <Route path="/roadmap" element={<Navigate to="/" replace />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/library" element={<Library />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </React.Suspense>
        </AnimatePresence>
        <Footer />
      </main>
      
      <BottomNav 
        user={user} 
        openAuthModal={() => setIsLoginModalOpen(true)} 
        openProfileModal={() => setIsProfileModalOpen(true)} 
      />
      <CookieConsent />
      <FloatingPlayer />
      
      <StartupSyncModal />
      <SyncProgressPanel />
      <SettingsModal />
      <AuthModal />
      <ProfileModal />
      <Onboarding />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Toaster position="bottom-right" toastOptions={{ style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" } }} />
          <LayoutEngine />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
