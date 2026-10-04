import React, { useEffect, useState } from 'react';
import { getLibrarySongs, removeSongFromLibrary, saveSongToLibrary } from '../utils/db';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { supabase } from '../utils/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Library() {
  const [activeTab, setActiveTab] = useState('audio'); // 'audio', 'video', 'cloud'
  const [dbSongs, setDbSongs] = useState([]);
  const [cloudMedia, setCloudMedia] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const { startBatchSync } = useSync();
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [customSyncCount, setCustomSyncCount] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const { playTrack, currentTrack, isPlaying, togglePlay } = useAppContext();
  const { user } = useAuth();

  useEffect(() => {
    loadOfflineMedia();
    loadCloudMedia();

    const handleUpdate = () => {
      loadOfflineMedia();
      loadCloudMedia();
    };

    window.addEventListener('library-updated', handleUpdate);
    return () => window.removeEventListener('library-updated', handleUpdate);
  }, []);

  useEffect(() => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  }, [activeTab]);

  const loadOfflineMedia = async () => {
    try {
      const songs = await getLibrarySongs();
      setDbSongs(songs);
    } catch (e) {
      toast.error('Failed to load local device library');
    }
  };

  const loadCloudMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('media_metadata')
        .select('*');
        
      if (error) throw error;
      setCloudMedia(data || []);
    } catch (e) {
      toast.error('Failed to load cloud media');
    }
  };

  const handleRemoveDb = async (item) => {
    try {
      await removeSongFromLibrary(item.id);
      setDbSongs(prev => prev.filter(s => s.id !== item.id));
      toast.success("Removed from device storage");
    } catch (e) {
      toast.error("Failed to remove file");
    }
  };

  const downloadFromCloud = async (file) => {
    if (isDownloading) return toast.error("Already downloading a file...");
    setIsDownloading(true);
    const toastId = toast.loading(`Downloading ${file.title} to device...`);
    
    try {
      // Direct fetch without Authorization header to avoid CORS preflight failures on third-party URLs
      const res = await fetch(file.url);
      if (!res.ok) throw new Error("Failed to fetch from cloud");
      
      const blob = await res.blob();
      await saveSongToLibrary({
        id: file.id,
        title: file.title,
        artist: "Cloud Import",
        blob: blob,
        type: file.type,
        coverUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${file.title}`
      });
      
      toast.success("Saved to device for offline play!", { id: toastId });
      loadOfflineMedia(); // Refresh offline lists
    } catch (e) {
      toast.error("Download failed", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  // Filter lists based on tabs
  const handleSelectAll = (items) => {
    if (selectedItems.size === items.length && items.length > 0) {
      setSelectedItems(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
      setIsSelectionMode(true);
    }
  };

  const toggleSelection = (id, e) => {
    e.stopPropagation();
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
      if (newSet.size === 0) setIsSelectionMode(false);
    } else {
      newSet.add(id);
      setIsSelectionMode(true);
    }
    setSelectedItems(newSet);
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) return;
    
    const ids = Array.from(selectedItems);
    if (activeTab === 'cloud') {
       const { error } = await supabase.from('media_metadata').delete().in('id', ids);
       if (error) {
         toast.error("Failed to delete cloud items. (Check RLS policies)");
       } else {
         setCloudMedia(prev => prev.filter(c => !selectedItems.has(c.id)));
         toast.success(`Deleted ${selectedItems.size} cloud items`);
       }
    } else {
       for (let id of ids) {
          await removeSongFromLibrary(id);
       }
       setDbSongs(prev => prev.filter(s => !selectedItems.has(s.id)));
       toast.success(`Removed ${selectedItems.size} items from device`);
    }
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const offlineAudio = dbSongs.filter(s => s.type === 'audio' || !s.type);
  const offlineVideo = dbSongs.filter(s => s.type === 'video');

  const renderMediaRow = (item, isCloud = false) => {
    const isCurrentlyPlaying = (currentTrack?.id && currentTrack?.id === item.id) || (currentTrack?.filename && currentTrack?.filename === item.filename);
    
    return (
      <tr key={item.id} className={`hover:bg-surface-container-low/50 transition-colors group cursor-pointer ${isCurrentlyPlaying ? 'bg-primary-container/20' : ''}`}>
        <td className="py-4 px-6 flex items-center gap-3">
          <div onClick={(e) => toggleSelection(item.id, e)} className="cursor-pointer text-on-surface-variant hover:text-primary transition-colors flex-shrink-0 mt-2 mr-2">
            <span className="material-symbols-outlined text-[22px]">
              {selectedItems.has(item.id) ? 'check_box' : 'check_box_outline_blank'}
            </span>
          </div>
          <div className="flex items-center gap-4 min-w-[240px] flex-1" onClick={() => !isCloud && playTrack({ ...item, source: 'local' })}>
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-secondary-container flex items-center justify-center shadow-inner">
              {isCurrentlyPlaying && isPlaying ? (
                <div className="flex items-end justify-center gap-0.5 w-full h-full opacity-80 pb-3">
                  <div className="w-1.5 bg-primary rounded-t-sm h-3 animate-pulse" style={{animationDuration: '0.6s'}}></div>
                  <div className="w-1.5 bg-primary rounded-t-sm h-5 animate-pulse" style={{animationDuration: '0.8s'}}></div>
                  <div className="w-1.5 bg-primary rounded-t-sm h-4 animate-pulse" style={{animationDuration: '0.5s'}}></div>
                </div>
              ) : (
                <span className="material-symbols-outlined text-on-secondary-container text-[22px] drop-shadow">
                  {item.type === 'video' ? 'videocam' : 'graphic_eq'}
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0 max-w-[250px]">
              <span className={`font-label-lg text-label-lg font-semibold truncate group-hover:text-primary transition-colors ${isCurrentlyPlaying ? 'text-primary' : 'text-on-surface'}`}>
                {item.title}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                {item.artist || 'Unknown'}
              </span>
            </div>
          </div>
        </td>
        <td className="py-4 px-4 hidden md:table-cell">
          <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm inline-flex items-center gap-1 font-semibold">
            {isCloud ? '☁️ Cloud' : '📱 Device'}
          </span>
        </td>
        <td className="py-4 px-6 text-right">
          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (isCurrentlyPlaying) {
                  togglePlay();
                } else {
                  const list = isCloud ? cloudMedia : (activeTab==='audio' ? offlineAudio : offlineVideo);
                  const idx = list.findIndex(x => x.id === item.id);
                  playTrack({ ...item, source: isCloud ? 'cloud' : 'local' }, list, idx);
                }
              }} 
              className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:scale-105 transition-transform" 
              title={isCurrentlyPlaying && isPlaying ? "Pause" : "Play"}
            >
              <span className="material-symbols-outlined">{isCurrentlyPlaying && isPlaying ? "pause" : "play_arrow"}</span>
            </button>
            
            {isCloud ? (
              <button 
                onClick={(e) => { e.stopPropagation(); downloadFromCloud(item); }}
                disabled={isDownloading}
                className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50" 
                title="Import to Device"
              >
                <span className="material-symbols-outlined">download</span>
              </button>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); handleRemoveDb(item); }}
                className="w-10 h-10 rounded-full hover:bg-error-container text-error flex items-center justify-center transition-colors"
                title="Remove from Device"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const [cloudSearchQuery, setCloudSearchQuery] = useState('');

  const getActiveList = () => {
    let list = [];
    if (activeTab === 'audio') list = offlineAudio;
    else if (activeTab === 'video') list = offlineVideo;
    else list = cloudMedia;
    
    if (activeTab === 'cloud' && cloudSearchQuery.trim()) {
      return list.filter(item => item.title?.toLowerCase().includes(cloudSearchQuery.toLowerCase()) || item.artist?.toLowerCase().includes(cloudSearchQuery.toLowerCase()));
    }
    return list;
  };

  const activeList = getActiveList();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col p-4 md:p-8 max-w-[1600px] mx-auto w-full gap-8 mb-24"
    >
      {/* Header & Tabs */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start flex-col md:flex-row gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Media Library</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Manage your offline downloads and browse the cloud server.
            </p>
          </div>
          {activeTab === 'cloud' && (
            <div className="flex items-center gap-2 bg-surface-container-high rounded-full px-4 py-2 w-full md:w-auto shadow-sm">
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
              <input 
                type="text"
                placeholder="Search cloud library..."
                value={cloudSearchQuery}
                onChange={(e) => setCloudSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-on-surface w-full md:w-64 placeholder:text-on-surface-variant/70"
              />
            </div>
          )}
        </div>

        {/* Animated Segmented Control Tabs */}
        <div className="flex p-1.5 bg-surface-container/40 backdrop-blur-md rounded-2xl w-fit border border-outline-variant/30 shadow-inner relative">
          {[
            { id: 'audio', label: 'Offline Audio', icon: 'headphones', color: 'primary' },
            { id: 'video', label: 'Offline Video', icon: 'videocam', color: 'primary' },
            { id: 'cloud', label: 'Cloud Server', icon: 'cloud', color: 'secondary' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-2.5 rounded-xl font-label-md transition-colors z-10 flex items-center gap-2 focus:outline-none ${isActive ? `text-on-${tab.color}` : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="library-tab-pill"
                    className={`absolute inset-0 bg-${tab.color} rounded-xl -z-10 shadow-sm`}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="material-symbols-outlined text-[18px] relative z-10">{tab.icon}</span>
                <span className="relative z-10 font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-6 border-b border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-3 text-on-surface">
            <span className="material-symbols-outlined text-primary">
              {activeTab === 'cloud' ? 'cloud_sync' : 'sd_storage'}
            </span>
            <span className="font-title-md text-title-md font-semibold">
              {activeTab === 'audio' && 'Device Audio Cache'}
              {activeTab === 'video' && 'Device Video Cache'}
              {activeTab === 'cloud' && 'Central Server Library'}
            </span>
          </div>
<div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-surface-container rounded-full text-on-surface font-label-sm">
              {activeList.length} items
            </span>
            {selectedItems.size > 0 ? (
              <button 
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-3 py-1.5 bg-error-container text-on-error-container rounded-lg font-label-sm hover:bg-error hover:text-on-error transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete {selectedItems.size} Selected
              </button>
            ) : (
              activeTab === 'cloud' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSyncModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg font-label-sm hover:bg-secondary hover:text-on-secondary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                    Sync Library
                  </button>
                  <button 
                    onClick={() => {
                      toast.success("Syncing with cloud server...");
                      loadCloudMedia();
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary-container text-on-primary-container rounded-lg font-label-sm hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                    Update Library
                  </button>
                </div>
              )
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold flex items-center gap-3">
                  <div onClick={() => handleSelectAll(activeList)} className="cursor-pointer hover:text-primary transition-colors mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">
                      {selectedItems.size === activeList.length && activeList.length > 0 ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                  </div>
                  Media Details
                </th>
                <th className="py-4 px-4 font-semibold hidden md:table-cell">Storage Location</th>
                <th className="py-4 px-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-0 text-body-sm font-body-sm text-on-surface">
              <AnimatePresence mode="popLayout">
                {activeList.map(item => renderMediaRow(item, activeTab === 'cloud'))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {activeList.length === 0 && (
            <div className="w-full py-16 flex flex-col items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] opacity-50 mb-4">
                {activeTab === 'cloud' ? 'cloud_off' : 'folder_off'}
              </span>
              <p className="font-label-lg text-label-lg">
                {activeTab === 'cloud' 
                  ? "No media found on the central server." 
                  : "No downloaded media on this device."}
              </p>
              <p className="font-body-sm text-body-sm mt-1 opacity-70">
                {activeTab === 'cloud'
                  ? "Generate a roadmap and download videos to populate the cloud."
                  : "Switch to the Cloud Server tab to import files for offline play."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sync Modal */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-outline-variant/30">
            <h3 className="text-xl font-semibold mb-4 text-on-surface">Sync Cloud Library</h3>
            <p className="text-sm text-on-surface-variant mb-4">Select how many recent items to sync to your device.</p>
            
            <div className="flex flex-col gap-2 mb-4">
              <button 
                onClick={() => { startBatchSync(cloudMedia, 100); setSyncModalOpen(false); }}
                className="w-full py-2 bg-primary-container text-on-primary-container rounded-lg hover:bg-primary hover:text-on-primary transition"
              >
                Latest 100
              </button>
              <button 
                onClick={() => { startBatchSync(cloudMedia, 200); setSyncModalOpen(false); }}
                className="w-full py-2 bg-primary-container text-on-primary-container rounded-lg hover:bg-primary hover:text-on-primary transition"
              >
                Latest 200
              </button>
              <button 
                onClick={() => { startBatchSync(cloudMedia, 500); setSyncModalOpen(false); }}
                className="w-full py-2 bg-primary-container text-on-primary-container rounded-lg hover:bg-primary hover:text-on-primary transition"
              >
                Latest 500
              </button>
              
              <div className="flex gap-2 mt-2">
                <input 
                  type="number" 
                  value={customSyncCount}
                  onChange={(e) => setCustomSyncCount(e.target.value)}
                  placeholder="Custom amount"
                  className="flex-1 bg-surface-container-high rounded-lg px-3 py-2 text-on-surface outline-none"
                />
                <button 
                  onClick={() => { 
                    const count = parseInt(customSyncCount, 10);
                    if (count > 0) {
                      startBatchSync(cloudMedia, count); 
                      setSyncModalOpen(false); 
                    }
                  }}
                  className="px-4 py-2 bg-secondary text-on-secondary rounded-lg hover:bg-secondary-container hover:text-on-secondary-container transition"
                >
                  Sync
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setSyncModalOpen(false)}
              className="w-full py-2 mt-2 text-on-surface-variant hover:text-on-surface transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
