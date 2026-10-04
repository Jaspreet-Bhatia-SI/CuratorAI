with open('src/components/FloatingPlayer.jsx', 'r') as f:
    content = f.read()

# Add context variables
content = content.replace(
    "const { currentTrack, isPlaying, togglePlay, playTrack } = useAppContext();",
    "const { currentTrack, isPlaying, togglePlay, playTrack, playNext, playPrev, queue, queueIndex } = useAppContext();\n  const [isShuffle, setIsShuffle] = useState(false);\n  const [isRepeat, setIsRepeat] = useState(false);\n  const [volume, setVolume] = useState(1.0);\n  const [isMuted, setIsMuted] = useState(false);"
)

# In the loadTrack logic, fix the blob:
blob_fix_old = """        if (currentTrack.blob) {
          url = URL.createObjectURL(currentTrack.blob);
          if (active) setAudioUrl(url);
        }"""
blob_fix_new = """        if (currentTrack.blob) {
          // Fix offline audio missing MIME type
          const blobType = currentTrack.blob.type || 'audio/mpeg';
          const properBlob = new Blob([currentTrack.blob], { type: blobType });
          url = URL.createObjectURL(properBlob);
          if (active) setAudioUrl(url);
        }"""
content = content.replace(blob_fix_old, blob_fix_new)

# Apply volume to audioRef
content = content.replace(
    "  useEffect(() => {\n    if (audioRef.current) {\n      if (isPlaying) {",
    "  useEffect(() => {\n    if (audioRef.current) {\n      audioRef.current.volume = isMuted ? 0 : volume;\n      if (isPlaying) {"
)

# Update onEnded to support repeat/next
content = content.replace(
    "onEnded={() => togglePlay()}",
    "onEnded={() => { if(isRepeat && audioRef.current) { audioRef.current.currentTime=0; audioRef.current.play(); } else { playNext(); } }}"
)

# Update Buttons
import re

# Shuffle button
content = re.sub(
    r'<button aria-label="Shuffle" className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1 rounded-full">\s*<span className="material-symbols-outlined text-\[18px\]" aria-hidden="true">shuffle</span>\s*</button>',
    r'<button aria-label="Shuffle" onClick={() => setIsShuffle(!isShuffle)} className={`transition-colors flex items-center justify-center p-1 rounded-full ${isShuffle ? "text-primary bg-primary/10" : "text-on-surface-variant hover:text-on-surface"}`}><span className="material-symbols-outlined text-[18px]" aria-hidden="true">shuffle</span></button>',
    content
)

# Repeat button
content = re.sub(
    r'<button aria-label="Repeat" className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1 rounded-full">\s*<span className="material-symbols-outlined text-\[18px\]" aria-hidden="true">repeat</span>\s*</button>',
    r'<button aria-label="Repeat" onClick={() => setIsRepeat(!isRepeat)} className={`transition-colors flex items-center justify-center p-1 rounded-full ${isRepeat ? "text-primary bg-primary/10" : "text-on-surface-variant hover:text-on-surface"}`}><span className="material-symbols-outlined text-[18px]" aria-hidden="true">repeat</span></button>',
    content
)

# Skip Prev
content = re.sub(
    r'<button aria-label="Skip Previous" className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center p-1 rounded-full">\s*<span className="material-symbols-outlined text-\[22px\]" aria-hidden="true">skip_previous</span>\s*</button>',
    r'<button aria-label="Skip Previous" onClick={() => playPrev()} className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center p-1 rounded-full active:scale-95"><span className="material-symbols-outlined text-[22px]" aria-hidden="true">skip_previous</span></button>',
    content
)

# Skip Next
content = re.sub(
    r'<button aria-label="Skip Next" className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center p-1 rounded-full">\s*<span className="material-symbols-outlined text-\[22px\]" aria-hidden="true">skip_next</span>\s*</button>',
    r'<button aria-label="Skip Next" onClick={() => playNext()} className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center p-1 rounded-full active:scale-95"><span className="material-symbols-outlined text-[22px]" aria-hidden="true">skip_next</span></button>',
    content
)

# Volume controls
vol_old = """          <div className="flex items-center gap-1">
            <button className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">volume_up</span>
            </button>
            <div className="w-16 h-1 bg-surface-container-high rounded-full overflow-hidden cursor-pointer relative group">
              <div className="bg-on-surface-variant group-hover:bg-primary h-full rounded-full transition-colors" style={{ width: '75%' }}></div>
            </div>
          </div>"""

vol_new = """          <div className="flex items-center gap-1">
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
          </div>"""
content = content.replace(vol_old, vol_new)

with open('src/components/FloatingPlayer.jsx', 'w') as f:
    f.write(content)
