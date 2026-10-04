import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

export default function FloatingPlayer() {
  const { currentTrack, isPlaying, togglePlay, playTrack, playNext, playPrev, queue, queueIndex } = useAppContext();
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!currentTrack) return;
    
    let active = true;
    let url = null;

    const loadTrack = async () => {
      if (currentTrack.source === 'server' || currentTrack.source === 'cloud') {
        url = currentTrack.url || `/api/stream/${encodeURIComponent(currentTrack.filename)}`;
        if (active) setAudioUrl(url);
      } else if (currentTrack.source === 'local') {
        if (currentTrack.blob) {
          // Fix offline audio missing MIME type
          const blobType = currentTrack.blob.type || 'audio/mpeg';
          const properBlob = new Blob([currentTrack.blob], { type: blobType });
          url = URL.createObjectURL(properBlob);
          if (active) setAudioUrl(url);
        } else if (currentTrack.url) {
          url = currentTrack.url;
          if (active) setAudioUrl(url);
        }
      }
    };

    loadTrack();
    
    return () => {
      active = false;
      if (currentTrack.source === 'local' && url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack, audioUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(cur);
      setDuration(dur);
      if (dur > 0) {
        setProgress((cur / dur) * 100);
      }
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * duration;
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-[88px] md:bottom-6 inset-x-0 mx-auto w-[96%] max-w-5xl z-40 transition-all duration-300">
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => { if(isRepeat && audioRef.current) { audioRef.current.currentTime=0; audioRef.current.play(); } else { playNext(); } }}
        />
      )}
      
      <div className="relative bg-surface-container-lowest/85 backdrop-blur-2xl shadow-[0_20px_45px_-10px_rgba(15,23,42,0.18)] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <button 
          onClick={() => playTrack(null)}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-surface shadow-md flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors border border-outline-variant/20 z-50"
          aria-label="Close player"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
        {/* Left Section */}
        <div className="flex items-center gap-4 w-full md:w-1/3 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md bg-gradient-to-br from-primary via-secondary to-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[24px]" aria-hidden="true">graphic_eq</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-label-md text-label-md text-on-surface font-semibold truncate" title={currentTrack.title || currentTrack.filename}>
              {(currentTrack.title || currentTrack.filename || 'Unknown Track').replace('.mp3', '')}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
              {currentTrack.size ? `${currentTrack.size} • ` : ''} {currentTrack.category || 'Offline Track'}
            </span>
          </div>
          <button aria-label="Favorite track" className="text-on-surface-variant hover:text-secondary transition-colors shrink-0 ml-auto md:ml-2">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">favorite</span>
          </button>
        </div>
        
        {/* Center Section (Controls) */}
        <div className="flex flex-col items-center gap-1.5 w-full md:w-5/12">
          <div className="flex items-center gap-4">
            <button aria-label="Shuffle" onClick={() => setIsShuffle(!isShuffle)} className={`transition-colors flex items-center justify-center p-1 rounded-full ${isShuffle ? "text-primary bg-primary/10" : "text-on-surface-variant hover:text-on-surface"}`}><span className="material-symbols-outlined text-[18px]" aria-hidden="true">shuffle</span></button>
            <button aria-label="Skip Previous" onClick={() => playPrev()} className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center p-1 rounded-full active:scale-95"><span className="material-symbols-outlined text-[22px]" aria-hidden="true">skip_previous</span></button>
            <button 
              aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={togglePlay}
              className="bg-gradient-to-r from-primary to-secondary text-on-primary w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>
            <button aria-label="Skip Next" onClick={() => playNext()} className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center p-1 rounded-full active:scale-95"><span className="material-symbols-outlined text-[22px]" aria-hidden="true">skip_next</span></button>
            <button aria-label="Repeat" onClick={() => setIsRepeat(!isRepeat)} className={`transition-colors flex items-center justify-center p-1 rounded-full ${isRepeat ? "text-primary bg-primary/10" : "text-on-surface-variant hover:text-on-surface"}`}><span className="material-symbols-outlined text-[18px]" aria-hidden="true">repeat</span></button>
          </div>
          
          <div className="flex items-center gap-2 w-full">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden relative cursor-pointer group" onClick={handleSeek}>
              <div className="bg-gradient-to-r from-primary to-secondary h-full rounded-full relative" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-surface-container-lowest rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center justify-end gap-4 w-full md:w-1/3">
          {isPlaying && (
            <div className="flex items-center gap-1 h-5 px-1">
              <span className="w-1 bg-primary rounded-full h-3 animate-pulse"></span>
              <span className="w-1 bg-secondary rounded-full h-5 animate-pulse" style={{animationDelay:'0.1s'}}></span>
              <span className="w-1 bg-primary-container rounded-full h-2 animate-pulse" style={{animationDelay:'0.2s'}}></span>
            </div>
          )}
          <button className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-sm text-label-sm font-semibold transition-colors">
            1.0x
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMuted(!isMuted)} className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">{isMuted || volume === 0 ? 'volume_off' : (volume < 0.5 ? 'volume_down' : 'volume_up')}</span>
            </button>
            <div 
              className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden cursor-pointer relative group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                let newVol = (e.clientX - rect.left) / rect.width;
                if(newVol < 0) newVol = 0;
                if(newVol > 1) newVol = 1;
                setVolume(newVol);
                setIsMuted(false);
              }}
            >
              <div className="bg-on-surface-variant group-hover:bg-primary h-full rounded-full transition-colors" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}></div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
