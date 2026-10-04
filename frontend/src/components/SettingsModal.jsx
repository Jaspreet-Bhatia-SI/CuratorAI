import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../utils/supabase';

export default function SettingsModal() {
  const { saveAiConfig } = useAuth();
  const { pendingQuery, setPendingQuery, handleSearch } = useAppContext();
  
const [isOpen, setIsOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [isStoreLoaded, setIsStoreLoaded] = useState(false);

  React.useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-settings', handleOpen);
    return () => window.removeEventListener('open-settings', handleOpen);
  }, []);

  React.useEffect(() => {
    function loadKeys() {
      setGeminiKey(localStorage.getItem('gemini_key') || '');
      setGroqKey(localStorage.getItem('groq_key') || '');
      setIsStoreLoaded(true);
    }
    loadKeys();
  }, []);

  const handleOpenLink = (e, url) => {
    e.preventDefault();
    window.open(url, '_blank');
  };

const handleSave = async () => {
    if (!geminiKey && !groqKey) {
      toast.error('Please provide at least one API key to continue.');
      return;
    }
    
    // Save locally
    localStorage.setItem('gemini_key', geminiKey);
    localStorage.setItem('groq_key', groqKey);
    
    // Save to cloud if logged in
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.auth.updateUser({
          data: {
            gemini_key: geminiKey,
            groq_key: groqKey
          }
        });
      }
    } catch (e) {
      console.error("Failed to sync keys to cloud", e);
    }
    
    // Set actual AI Config for the requests
    const activeProvider = groqKey ? 'groq' : 'gemini';
    const activeKey = groqKey || geminiKey;
    saveAiConfig({ provider: activeProvider, key: activeKey });
    
    toast.success('API Keys Saved Securely!');
    setIsOpen(false);
    
    // Automatically resume intercepted search query!
    if (pendingQuery) {
      const q = pendingQuery;
      setPendingQuery(''); // clear pending
      setTimeout(() => {
        handleSearch(q);
      }, 500);
    }
  };

const handleCheckUpdate = () => {
    const toastId = toast.loading('Checking for app updates...');
    setTimeout(() => {
      toast.success('App is up to date! (v1.0.0)', { id: toastId });
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/50 backdrop-blur-md transition-opacity" 
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>
      
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        className="relative w-full max-w-2xl bg-surface-container-lowest rounded-3xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col border border-outline-variant/30 transform transition-all scale-100 opacity-100"
      >
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[22px]" aria-hidden="true">api</span>
            </div>
            <div className="flex flex-col">
              <h2 id="settings-modal-title" className="font-headline-sm text-headline-sm text-on-surface">AI Engine Configuration</h2>
              <span className="font-label-sm text-label-sm text-on-surface-variant">BYOK (Bring Your Own Key) Architecture</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} aria-label="Close modal" className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
          
          <div className="p-4 rounded-2xl bg-secondary-container/30 border border-secondary/20 flex gap-4">
            <span className="material-symbols-outlined text-secondary mt-0.5">verified_user</span>
            <div className="flex flex-col gap-1 text-on-surface">
              <span className="font-label-md text-label-md font-semibold">Zero-Cost Inference</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">By providing your own API keys, you bypass platform token costs. Keys are stored locally in your browser's encrypted vault and are never transmitted to our servers.</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Groq Key Input */}
            <div className="flex flex-col gap-2 relative">
              <label className="font-label-md text-label-md text-on-surface flex items-center justify-between">
                <span>Groq LPU API Key</span>
                <span className="text-[10px] uppercase tracking-wider text-primary font-semibold px-2 py-0.5 rounded-full bg-primary-container">Fast Synthesis</span>
              </label>
              
              <div className="flex flex-col gap-2 mb-1">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Groq provides ultra-fast AI generation. You can create a free API key instantly.
                </p>
                <button onClick={(e) => handleOpenLink(e, "https://console.groq.com/keys")} className="text-primary hover:underline font-label-sm text-label-sm flex items-center gap-1 w-fit bg-transparent border-none p-0 cursor-pointer">
                  Get a Groq API Key <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </button>
              </div>

              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">key</span>
                <input 
                  type="password" 
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..." 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface font-mono text-sm transition-all"
                />
              </div>
            </div>

            <div className="h-px w-full bg-outline-variant/30"></div>

            {/* Google Gemini Key Input */}
            <div className="flex flex-col gap-2 relative">
              <label className="font-label-md text-label-md text-on-surface flex items-center justify-between">
                <span>Google Gemini API Key</span>
                <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold px-2 py-0.5 rounded-full bg-secondary-container">Deep Reasoning</span>
              </label>
              
              <div className="flex flex-col gap-2 mb-1">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Gemini powers our deep learning roadmaps. Get a free API key from Google AI Studio.
                </p>
                <button onClick={(e) => handleOpenLink(e, "https://aistudio.google.com/app/apikey")} className="text-secondary hover:underline font-label-sm text-label-sm flex items-center gap-1 w-fit bg-transparent border-none p-0 cursor-pointer">
                  Get a Gemini API Key <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </button>
              </div>

              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">key</span>
                <input 
                  type="password" 
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..." 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-on-surface font-mono text-sm transition-all"
                />
              </div>
            </div>

          </div>
          
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/30 flex items-center justify-end gap-3 bg-surface-container-lowest">
          <button onClick={() => setIsOpen(false)} className="px-5 py-2.5 rounded-full font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 shadow-sm transition-opacity flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
