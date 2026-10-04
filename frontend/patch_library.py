with open('src/pages/Library.jsx', 'r') as f:
    content = f.read()

# Fix 1: Make row clickable for Cloud tracks as well!
# From: onClick={() => !isCloud && playTrack({ ...item, source: 'local' })}
# To: onClick={() => playTrack(item, isCloud ? cloudMedia : (activeTab==='audio' ? offlineAudio : offlineVideo), isCloud ? cloudMedia.indexOf(item) : (activeTab==='audio' ? offlineAudio : offlineVideo).indexOf(item))}
# Let's just make it simpler:

import re

# Find the row onClick
# <div className="flex items-center gap-4 min-w-[240px] flex-1" onClick={() => !isCloud && playTrack({ ...item, source: 'local' })}>
# Replace with:
new_div_onclick = """<div className="flex items-center gap-4 min-w-[240px] flex-1" onClick={() => {
            const list = isCloud ? cloudMedia : (activeTab==='audio' ? offlineAudio : offlineVideo);
            const idx = list.findIndex(x => x.id === item.id);
            playTrack({ ...item, source: isCloud ? 'cloud' : 'local' }, list, idx);
          }}>"""
content = re.sub(
    r'<div className="flex items-center gap-4 min-w-\[240px\] flex-1" onClick=\{[^}]+\}>',
    new_div_onclick,
    content
)

# Fix 2: Add Play button for Cloud tracks too!
# Currently:
# {!isCloud && (
#   <button onClick={(e) => { e.stopPropagation(); isCurrentlyPlaying ? togglePlay() : playTrack({ ...item, source: 'local' }); }} ...
# )}
# {isCloud ? ( <button download> ) : ( <button delete> )}
# Let's change the play button to be visible for BOTH, but download only for cloud, delete only for local.

play_btn_old = """            {!isCloud && (
              <button 
                onClick={(e) => { e.stopPropagation(); isCurrentlyPlaying ? togglePlay() : playTrack({ ...item, source: 'local' }); }} 
                className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:scale-105 transition-transform" 
                title={isCurrentlyPlaying && isPlaying ? "Pause" : "Play"}
              >
                <span className="material-symbols-outlined">{isCurrentlyPlaying && isPlaying ? "pause" : "play_arrow"}</span>
              </button>
            )}"""

play_btn_new = """            <button 
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
            </button>"""

content = content.replace(play_btn_old, play_btn_new)

with open('src/pages/Library.jsx', 'w') as f:
    f.write(content)
