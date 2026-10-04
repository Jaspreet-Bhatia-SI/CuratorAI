with open('src/components/FloatingPlayer.jsx', 'r') as f:
    content = f.read()

import re

# Fix context extraction
content = re.sub(
    r'const \{ currentTrack, isPlaying, togglePlay \} = useAppContext\(\);',
    r'const { currentTrack, isPlaying, togglePlay, playTrack, playNext, playPrev, queue, queueIndex } = useAppContext();\n  const [isShuffle, setIsShuffle] = useState(false);\n  const [isRepeat, setIsRepeat] = useState(false);\n  const [volume, setVolume] = useState(1.0);\n  const [isMuted, setIsMuted] = useState(false);',
    content
)

with open('src/components/FloatingPlayer.jsx', 'w') as f:
    f.write(content)
