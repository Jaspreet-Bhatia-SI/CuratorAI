import re

with open('src/context/AppContext.jsx', 'r') as f:
    content = f.read()

# Add playlist state
content = content.replace(
    "const [isPlaying, setIsPlaying] = useState(false);",
    "const [isPlaying, setIsPlaying] = useState(false);\n  const [queue, setQueue] = useState([]);\n  const [queueIndex, setQueueIndex] = useState(-1);"
)

# Update playTrack
new_play_track = """
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
"""
content = re.sub(
    r"const playTrack = \(track\) => \{[\s\S]*?\};\n",
    new_play_track,
    content
)

# Export the new functions
content = content.replace(
    "currentTrack, isPlaying, playTrack, togglePlay, setIsPlaying",
    "currentTrack, isPlaying, playTrack, togglePlay, setIsPlaying, playNext, playPrev, queue, queueIndex"
)

with open('src/context/AppContext.jsx', 'w') as f:
    f.write(content)
