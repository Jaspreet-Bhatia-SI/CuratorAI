import React, { createContext, useContext, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { supabase } from '../utils/supabase';

const AppContext = createContext();


export function AppProvider({ children }) {
  const { user, aiConfig } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingQuery, setPendingQuery] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Audio Player State
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  const handleSearch = async (query) => {
    if (!query) return;

// BYOK Key Check Interceptor
    let geminiKey = localStorage.getItem('gemini_key');
    let groqKey = localStorage.getItem('groq_key');
    
    if (!geminiKey && !groqKey) {
      setPendingQuery(query);
      toast.error("Please configure your API Key first.");
      window.dispatchEvent(new Event('open-settings'));
      return;
    }
    setIsLoading(true);
    setRoadmap(null);
    setSearchQuery(query);

    try {
      // 1. FIRST: Search Personal Cloud Library by Title!
      const { data: cloudMusic } = await supabase
        .from('media_metadata')
        .select('*')
        .ilike('title', `%${query}%`)
        .limit(20);

      if (cloudMusic && cloudMusic.length > 0) {
        const payload = {
          title: `Library Results: ${query}`,
          description: `Found ${cloudMusic.length} tracks in your personal cloud.`,
          type: "playlist",
          curriculum: cloudMusic.map((m, i) => ({
            id: i + 1,
            title: m.title,
            type: "audio",
            youtube_url: m.url || m.youtube_url, 
            cloud_url: m.cloud_url,
            duration: m.duration || "3:00"
          }))
        };
        setRoadmap(payload);
        setCurriculum(payload.curriculum);
        setIsLoading(false);
        return;
      }

      // 2. SECOND: Try Cache
      const { data: cachedData } = await supabase
        .from('queries_cache')
        .select('json_data')
        .eq('query_text', query.toLowerCase())
        .single();
        
      let payload;

      if (cachedData && cachedData.json_data) {
        payload = cachedData.json_data;
      } else {
        // Safely use the awaited keys from the Tauri store
        const activeGroq = groqKey;
        const activeGemini = geminiKey;
        const finalProvider = activeGroq ? 'groq' : 'gemini';
        const finalKey = activeGroq || activeGemini || '';

        const { data: { session } } = await supabase.auth.getSession();
        
        const res = await fetch('/api/generate-roadmap', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-AI-Provider': finalProvider,
            'X-AI-Key': finalKey.trim(),
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({ query: query, user_email: user?.email || null }),
        });
        if (!res.ok) {
          let errStr = `Failed to fetch roadmap (Status: ${res.status})`;
          try {
            const errData = await res.json();
            errStr = errData.detail || errStr;
          } catch (e) {
            errStr += " - The backend server might be offline or Nginx is misconfigured.";
          }
          throw new Error(errStr);
        }

        const data = await res.json();
        payload = data.data || data; 
        
        // Save to cache
        await supabase
          .from('queries_cache')
          .insert([{ query_text: query.toLowerCase(), json_data: payload }]);
      }
      
      if (user?.id) {
        await supabase
          .from('user_history')
          .insert([{ 
             user_id: user.id, 
             query_text: query, 
             type: 'roadmap',
             roadmap: payload 
          }]);
      }

      setRoadmap(payload);
      setCurriculum(payload.curriculum || []);
      if (payload.roadmap_overview?.length > 0) {
        setSelectedTopic(payload.roadmap_overview[0]);
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate content.");
    }
    setIsLoading(false);
  };

  
  const playTrack = (track, list = [], index = -1) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    if (list.length > 0) {
      setQueue(list);
      setQueueIndex(index);
    }
  };

  const playNext = () => {
    if (queue.length > 0 && queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      setQueueIndex(nextIndex);
      setCurrentTrack(queue[nextIndex]);
      setIsPlaying(true);
    }
  };

  const playPrev = () => {
    if (queue.length > 0 && queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      setCurrentTrack(queue[prevIndex]);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <AppContext.Provider value={{
      searchQuery, setSearchQuery,
      pendingQuery, setPendingQuery,
      roadmap, curriculum, setCurriculum,
      isLoading, selectedTopic, setSelectedTopic,
      handleSearch,
      currentTrack, isPlaying, playTrack, togglePlay, setIsPlaying, playNext, playPrev, queue, queueIndex
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
