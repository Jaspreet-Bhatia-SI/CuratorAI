import subprocess
import os

def compress_media_background(filepath: str, format_type: str):
    """
    Compresses the media file in the background using FFmpeg.
    Replaces the original file with the compressed one to save laptop storage.
    """
    if not os.path.exists(filepath):
        return

    ext = os.path.splitext(filepath)[1]
    tmp_filepath = filepath + ".tmp" + ext

    try:
        if format_type == "audio":
            # For MP3, just ensure it's a reasonable bitrate
            cmd = ["ffmpeg", "-y", "-i", filepath, "-c:a", "libmp3lame", "-b:a", "128k", tmp_filepath]
        else:
            # For Video, use H.265 (HEVC) which is highly efficient, or H.264 if fast is needed.
            # We'll use libx264 with crf 28 (very compressed but decent quality) and preset fast
            cmd = ["ffmpeg", "-y", "-i", filepath, "-vcodec", "libx264", "-crf", "28", "-preset", "fast", "-c:a", "aac", "-b:a", "128k", tmp_filepath]
        
        # Run ffmpeg (hide output)
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        
        # If successful and file size > 0, replace original
        if os.path.exists(tmp_filepath) and os.path.getsize(tmp_filepath) > 0:
            os.replace(tmp_filepath, filepath)
            
    except Exception as e:
        print(f"Failed to compress {filepath}: {e}")
        if os.path.exists(tmp_filepath):
            os.remove(tmp_filepath)
