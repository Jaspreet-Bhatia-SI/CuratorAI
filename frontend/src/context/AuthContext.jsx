import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../utils/supabase';

import { syncUserProfile } from '../utils/syncUser';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // AI Provider Settings
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [aiConfig, setAiConfig] = useState({
    provider: 'gemini', 
    key: ''
  });

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        syncUserProfile(session.user);
        const meta = session.user.user_metadata;
        if (meta?.gemini_key) {
          localStorage.setItem('gemini_key', meta.gemini_key);
        }
        if (meta?.groq_key) {
          localStorage.setItem('groq_key', meta.groq_key);
        }
      }
      setLoading(false);
    });

    // Listen for changes on auth state (login, signout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        syncUserProfile(session.user);
        
        // SYNC API KEYS TO LOCALSTORAGE
        const meta = session.user.user_metadata;
        if (meta?.gemini_key) {
          localStorage.setItem('gemini_key', meta.gemini_key);
        }
        if (meta?.groq_key) {
          localStorage.setItem('groq_key', meta.groq_key);
        }
      }
    });

    // Load theme & AI config from local storage
    const savedTheme = localStorage.getItem('curator_theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    const savedConfig = localStorage.getItem('curator_ai_config');
    if (savedConfig) {
      setAiConfig(JSON.parse(savedConfig));
    }

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    // Optional: Fetch additional metadata from your 'users' table if needed
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('curator_theme', newMode ? 'dark' : 'light');
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  const saveAiConfig = (config) => {
    setAiConfig(config);
    localStorage.setItem('curator_ai_config', JSON.stringify(config));
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error.message || "Failed to login with Google");
    }
  };

  const loginWithEmail = async (email, password, isSignUp, name = '') => {
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || email}&mouth=smile,twinkle`
            }
          }
        });
        if (error) throw error;
        toast.success("Signup successful! Please check your email to verify.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Successfully logged in!");
        setIsLoginModalOpen(false);
      }
    } catch (error) {
      toast.error(error.message || "Authentication failed");
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile`,
      });
      if (error) throw error;
      toast.success("Password reset email sent!");
    } catch (error) {
      toast.error(error.message || "Failed to send reset email");
    }
  };

  const updateProfile = async (updates) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      });
      if (error) throw error;
      toast.success("Profile updated!");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Successfully logged out.");
      setIsProfileModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to logout");
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading,
      loginWithGoogle, loginWithEmail, logout, 
      resetPassword, updateProfile,
      isLoginModalOpen, setIsLoginModalOpen,
      isProfileModalOpen, setIsProfileModalOpen,
      isSettingsModalOpen, setIsSettingsModalOpen,
      isDarkMode, toggleTheme,
      aiConfig, saveAiConfig
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
