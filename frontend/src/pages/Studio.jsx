import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import MediaGrid from '../components/MediaGrid';
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from '../utils/supabase';

export default function Studio() {
  const { roadmap, searchQuery, isLoading } = useAppContext();
  const [activeChapter, setActiveChapter] = useState(0);

  const [fetchedVideos, setFetchedVideos] = useState([]);
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);
  const prevRoadmap = React.useRef(null);

  React.useEffect(() => {
    if (!roadmap?.curriculum || roadmap.curriculum.length === 0) return;
    if (prevRoadmap.current === roadmap) return; 

    const fetchVideos = async () => {
      setIsFetchingVideos(true);
      setFetchedVideos([]); 
      
      const promises = roadmap.curriculum.map(async (item) => {
        if (item.youtube_url || item.url) {
          setFetchedVideos(prev => {
            const resolvedUrl = item.youtube_url || item.url;
            if (prev.some(v => v.url === resolvedUrl)) return prev;
            return [...prev, {
              title: item.title,
              url: resolvedUrl,
              duration: item.duration || "0:00",
              thumbnail: item.thumbnail || `https://picsum.photos/seed/${item.title}/640/360`,
              channel: item.channel || "Cloud Library",
              views: 0,
              upload_date: "Local",
              original_item: item
            }];
          });
          return;
        }
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch('/api/search', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
            },
            body: JSON.stringify({ search_query: item.search_query, type: roadmap.type || 'education' })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data) {
              setFetchedVideos(prev => {
                if (prev.some(v => v.url === data.data.url)) return prev;
                return [...prev, { ...data.data, original_item: item }];
              });
            }
          }
        } catch (e) {
        }
      });
      
      await Promise.all(promises);
      setIsFetchingVideos(false);
    };

    fetchVideos();
    prevRoadmap.current = roadmap;
  }, [roadmap]);

  const displayItems = fetchedVideos;
  const isMusic = roadmap?.type === 'music';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="w-full flex flex-col pb-24 relative min-h-screen">
      
      {/* Immersive Header Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[400px] -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-tertiary/10 to-background opacity-80" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[50px] mask-image:linear-gradient(to_bottom,transparent,black)" />
      </div>

      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 flex flex-col xl:flex-row gap-8">
        
        {/* Left Sidebar: Sticky Syllabus/Playlist */}
        <aside className="w-full xl:w-[350px] flex-shrink-0 flex flex-col gap-6 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
          
          <div className="bg-surface-container-low/60 backdrop-blur-2xl rounded-[32px] p-6 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.2)] border border-outline-variant/30 flex flex-col gap-4">
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-primary via-secondary to-tertiary p-1 shadow-lg relative overflow-hidden group">
               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
               <div className="w-full h-full bg-surface-container-lowest rounded-xl flex items-center justify-center relative overflow-hidden">
                 <span className="material-symbols-outlined text-[80px] text-primary/50 absolute -right-6 -bottom-6 rotate-12">
                   {isMusic ? 'album' : 'school'}
                 </span>
                 <h2 className="font-headline-md text-center text-on-surface p-4 relative z-10 leading-tight">
                   {searchQuery || "Curated Playlist"}
                 </h2>
               </div>
            </div>
            
            <div className="flex flex-col items-center text-center gap-1 mt-2">
              <span className="font-label-md text-primary uppercase tracking-[0.2em]">
                {isMusic ? 'Auto-Generated Playlist' : 'Structured Roadmap'}
              </span>
              <p className="font-body-sm text-on-surface-variant">
                {displayItems.length} {displayItems.length === 1 ? 'Track' : 'Tracks'} • High Quality Audio
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 bg-surface-container-lowest/50 backdrop-blur-xl rounded-[32px] p-4 shadow-sm border border-outline-variant/20">
            <h3 className="font-label-md text-on-surface-variant px-4 py-2 uppercase tracking-wider">Chapters</h3>
            {(roadmap?.curriculum || []).map((item, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveChapter(idx)}
                className={`w-full text-left px-4 py-3 rounded-2xl transition-all font-label-md text-[15px] flex items-center gap-3 ${activeChapter === idx ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface hover:bg-surface-container-high'}`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activeChapter === idx ? 'bg-white/20' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                  {idx + 1}
                </span>
                <span className="truncate">{item.topics_covered?.[0] || item.title || "Track " + (idx + 1)}</span>
              </button>
            ))}
            {(!roadmap?.curriculum || roadmap.curriculum.length === 0) && (
              <div className="px-4 py-6 text-center text-on-surface-variant font-body-sm italic opacity-75 animate-pulse">
                Structuring your content...
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col gap-8 min-w-0 pb-32">
          
          {/* Dynamic Progress Indicator */}
          <AnimatePresence>
            {(isLoading || isFetchingVideos) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                className="w-full flex flex-col gap-3 p-6 rounded-[32px] bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-tertiary/5 animate-pulse" />
                <div className="relative flex justify-between items-center z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px] animate-spin" style={{ animationDuration: '3s' }}>
                        {isLoading ? 'memory' : 'satellite_alt'}
                      </span>
                    </div>
                    <span className="font-title-md text-on-surface font-semibold">
                      {isLoading ? "AI is reasoning..." : `Fetching high-quality media...`}
                    </span>
                  </div>
                  <span className="font-headline-sm text-primary font-bold">
                    {isLoading ? "Generating" : `${Math.round((fetchedVideos.length / (roadmap?.curriculum?.length || 1)) * 100)}%`}
                  </span>
                </div>
                
                <div className="w-full h-3 rounded-full bg-surface-container-highest overflow-hidden relative z-10 shadow-inner">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary via-secondary to-tertiary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    initial={{ width: "0%" }}
                    animate={{ width: isLoading ? "25%" : `${25 + (75 * (fetchedVideos.length / (roadmap?.curriculum?.length || 1)))}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media Grid Wrapper */}
          <div className="w-full bg-surface-container-lowest/40 backdrop-blur-md rounded-[40px] p-4 sm:p-8 border border-outline-variant/20 shadow-sm">
            <MediaGrid items={displayItems} />
          </div>

        </section>
      </div>
    </motion.div>
  );
}
