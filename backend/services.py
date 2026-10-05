import requests
from yt_dlp import YoutubeDL as yt
import os
import time

import redis
import json

try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping()
except Exception as e:
    print("Redis not available, using in-memory cache fallback.", e)
    redis_client = None

ROADMAP_CACHE = {}
SEARCH_CACHE = {}

import json
import re
import shutil
from groq import Groq
# Global client removed for BYOK

node_path = shutil.which("node")

DOWNLOAD_PROGRESS = {}

def get_progress_hook(task_id):
    def hook(d):
        if not task_id: return
        if d['status'] == 'downloading':
            p = d.get('_percent_str', '0%').strip()
            p = re.sub(r'\x1b\[[0-9;]*m', '', p)
            DOWNLOAD_PROGRESS[task_id] = {"status": "downloading", "percent": p}
        elif d['status'] == 'finished':
            DOWNLOAD_PROGRESS[task_id] = {"status": "processing", "percent": "100%"}
    return hook

import requests
import re

def parse_spotify_url(url: str) -> str:
    try:
        res = requests.get(url, timeout=5)
        match = re.search(r'<title>(.*?)</title>', res.text)
        if match:
            title = match.group(1)
            clean_title = title.split("| Spotify")[0].strip()
            return f"ytsearch1:{clean_title}"
    except Exception as e:
        print(f"Failed to parse spotify: {e}")
    return url

def extract_url_to_roadmap(url: str):
    if "spotify.com" in url:
        url = parse_spotify_url(url)
        
    ydl_opts_fast = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": "in_playlist",
        "extractor_args": {"youtube": ["player_client=ios,web"]}
    }
    if node_path:
        ydl_opts_fast["js_runtimes"] = {'node': {'binary': node_path}}
        
    with yt(ydl_opts_fast) as yd:
        info = yd.extract_info(url, download=False)
        
        curriculum = []
        is_playlist = 'entries' in info and info.get('entries') is not None
        
        if is_playlist:
            title = info.get("title", "Curated Playlist")
            entries = list(info['entries'])
            for idx, entry in enumerate(entries):
                vid_url = entry.get("url")
                if not vid_url and entry.get("id"):
                    vid_url = f"https://www.youtube.com/watch?v={entry.get('id')}"
                if vid_url:
                    curriculum.append({
                        "search_query": vid_url,
                        "topics_covered": [entry.get("title", f"Video {idx+1}")],
                        "rationale": "Fetched from playlist URL."
                    })
        else:
            title = info.get("title", "Curated Video")
            vid_url = info.get("webpage_url", url)
            curriculum.append({
                "search_query": vid_url,
                "topics_covered": [title],
                "rationale": "Fetched from direct URL."
            })
            
        return {
            "type": "music" if "music" in title.lower() else "education",
            "title": title,
            "roadmap_overview": [
                {
                    "main_topic": "Extracted Media",
                    "sub_topics": [c["topics_covered"][0] for c in curriculum]
                }
            ],
            "curriculum": curriculum
        }

def generate_roadmap_json(user_query: str, provider: str = "groq", api_key: str = ""):
    query_lower = user_query.strip().lower()
    try:
        if redis_client:
            cached = redis_client.get(f"roadmap:{query_lower}")
            if cached:
                print(f"Returning Redis cached roadmap for: {query_lower}")
                return json.loads(cached)
        elif query_lower in ROADMAP_CACHE:
            print(f"Returning cached roadmap for: {query_lower}")
            return ROADMAP_CACHE[query_lower]
    except Exception as e:
        print(f"Redis get error: {e}")

    if user_query.startswith("http://") or user_query.startswith("https://"):
        return extract_url_to_roadmap(user_query)

    system_prompt = """You are an expert curriculum designer and curator.
Your task is to take the user's request and structure it into a logical JSON roadmap or playlist.

IMPORTANT CURATION RULES:
- NEVER invent content. If provided with REAL YOUTUBE SEARCH RESULTS in your context, you MUST use those exact titles to build your roadmap/playlist. This is crucial for surfacing brand new releases.
- VERY IMPORTANT FOR MUSIC: If the user query is a song name, an artist, or implies music (like "patola", "punjabi songs", "dua lipa"), you MUST set the "type" property to "music".
- FOR MUSIC: To ensure the correct official video is fetched, your search_query MUST be perfectly formatted as: "{Exact Track Name} {Artist Name} Official Audio" (e.g., "Dua Amrinder Gill Official Audio").
- Provide a "rationale" explaining exactly WHY you chose this item/song.
- ITEM COUNT RULES (CRITICAL):
  1. If the user DOES NOT specify a number (e.g. "punjabi songs"), you MUST return exactly 10 items in BOTH the `sub_topics` array AND the `curriculum` array. Every song MUST have a matching `curriculum` entry!
  2. If the user's request naturally implies a specific set larger than 10, you may return more than 10 results (up to 15) in the `curriculum` array.
  3. IF the user explicitly asks for a massive quantity (>15 items), leave the `curriculum` array EMPTY (e.g. "curriculum": []) to save processing time.
- However, if the array is empty due to Rule 3, you MUST still build the `roadmap_overview` on the left. Extract the individual song names from the YouTube context and list them in the `sub_topics` array so the user sees what they are getting.

Output ONLY raw JSON with this exact schema:
{
  "type": "music",
  "title": "Amrinder Gill Collection",
  "roadmap_overview": [
    {
      "main_topic": "Playlist",
      "sub_topics": ["Dildarian", "Pendu"]
    }
  ],
  "curriculum": [
    {
      "search_query": "Dildarian Amrinder Gill Official Audio",
      "topics_covered": ["Dildarian"],
      "rationale": "One of his most famous classic hits."
    }
  ]
}"""
    
    try:
        realtime_context = ""
        try:
            # UNIVERSAL YOUTUBE RAG
            # Because DuckDuckGo is rate-limited and iTunes misses brand new low-view tracks,
            # we rely on YouTube's raw search to feed the LLM with the latest real-world content.
            import yt_dlp
            ydl_opts = {"quiet": True, "extract_flat": True, "noplaylist": True}
            with yt_dlp.YoutubeDL(ydl_opts) as yd:
                # Dynamically size the RAG limit based on the user's request, capped at 30
                import re
                numbers = re.findall(r'\d+', user_query)
                rag_limit = 15
                if numbers:
                    max_requested = max([int(n) for n in numbers])
                    if max_requested > 15:
                        rag_limit = min(max_requested, 30)
                
                info = yd.extract_info(f"ytsearch{rag_limit}:{user_query}", download=False)
                if 'entries' in info and len(info['entries']) > 0:
                    realtime_context = "REAL YOUTUBE SEARCH RESULTS (USE THESE TO DISCOVER BRAND NEW OR SPECIFIC CONTENT):\n"
                    import urllib.request, json
                    needs_deep_fetch = False
                    if numbers and max([int(n) for n in numbers]) >= 20:
                        needs_deep_fetch = True
                        
                    for i, e in enumerate(info['entries']):
                        if e.get('title'):
                            desc = e.get('description', '')
                            
                            # DEEP FETCH LOGIC: If a large list is requested, fetch full descriptions of the top 3 results
                            if needs_deep_fetch and i < 3:
                                try:
                                    url = e.get('url')
                                    if not url and e.get('id'):
                                        url = f"https://www.youtube.com/watch?v={e.get('id')}"
                                    if url:
                                        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                                        with urllib.request.urlopen(req, timeout=3) as response:
                                            html = response.read().decode('utf-8')
                                            match = re.search(r'ytInitialPlayerResponse\s*=\s*(\{.*?\});', html)
                                            if match:
                                                v_data = json.loads(match.group(1))
                                                full_desc = v_data.get('videoDetails', {}).get('shortDescription', '')
                                                if full_desc: desc = full_desc
                                except Exception as ex:
                                    pass
                            
                            desc = desc[:3000].replace('\n', ' | ') if desc else ''
                            realtime_context += f"- Title: {e.get('title')} (Channel: {e.get('uploader', 'Unknown')})\n  Description: {desc}\n"
        except Exception as e:
            print(f"Universal RAG failed: {e}")
            pass
            
        # Combine user query with real-time context
        augmented_query = user_query
        if realtime_context:
            augmented_query = f"User Request: {user_query}\n\n{realtime_context}\n\nBased on the user request and the real-time internet context above, generate the JSON output."


        if not api_key:
            raise Exception("No API key provided. Please configure your API key in Settings.")

        if provider == "groq":
            local_client = Groq(api_key=api_key)
            model_name = "llama3-8b-8192"
        elif provider == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model_name = "gemini-1.5-pro"
        else:
            raise Exception("Unsupported AI provider")


        if provider == "groq":
            # DYNAMIC MODEL FETCHING: Because Groq constantly deprecates models,
            # we will ask their API for the exact list of currently active models you have access to.
            import requests
            try:
                models_resp = requests.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {api_key}"}, timeout=5)
                available_models = [m["id"] for m in models_resp.json().get("data", [])]
                # Prioritize standard models if they exist, otherwise try everything
                models_to_try = available_models
            except Exception:
                models_to_try = [
                    "llama-3.3-70b-versatile",
                    "llama-3.1-8b-instant",
                    "mixtral-8x7b-32768"
                ]

            response = None
            last_err = None
            
            for m in models_to_try:
                # Skip whisper/audio models
                if "whisper" in m.lower():
                    continue
                try:
                    response = local_client.chat.completions.create(
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": augmented_query}
                        ],
                        model=m,
                        max_tokens=8000,
                        response_format={"type": "json_object"}
                    )
                    break # Success! Break out of the loop
                except Exception as e:
                    last_err = e
                    continue # Try the next model
                    
            if response is None:
                raise last_err

            print(f"MODEL USED: {response.model}")
            print(f"RAW OUTPUT: {response.choices[0].message.content}")
            response_json = json.loads(response.choices[0].message.content)

        else:
            # Gemini implementation
            model = genai.GenerativeModel(model_name, system_instruction=system_prompt)
            response = model.generate_content(
                augmented_query,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                )
            )
            response_json = json.loads(response.text)

        
        # --- PLAYLIST INJECTION ARCHITECTURE ---
        import re as re_regex
        import urllib.request
        import urllib.parse
        import yt_dlp
        
        numbers = re_regex.findall(r'\d+', user_query)
        max_requested = max([int(n) for n in numbers]) if numbers else 0
        
        if max_requested >= 15:
            search_url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(user_query)}&sp=EgIQAw%253D%253D"
            try:
                req = urllib.request.Request(search_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    html = resp.read().decode('utf-8')
                    playlists = re_regex.findall(r'"playlistId":"(PL[a-zA-Z0-9_-]+)"', html)
                    if playlists:
                        playlist_url = f"https://www.youtube.com/playlist?list={playlists[0]}"
                        ydl_opts = {"quiet": True, "extract_flat": True}
                        with yt_dlp.YoutubeDL(ydl_opts) as yd:
                            info = yd.extract_info(playlist_url, download=False)
                            if 'entries' in info:
                                entries = info['entries'][:min(max_requested, 100)]
                                injected_curriculum = []
                                for e in entries:
                                    if e.get('title') and e.get('url'):
                                        injected_curriculum.append({
                                            "search_query": e.get('title'),
                                            "title": e.get('title'),
                                            "url": e.get('url'),
                                            "thumbnail": e.get('thumbnails', [{}])[-1].get('url') if e.get('thumbnails') else None,
                                            "uploader": e.get('uploader', 'Unknown'),
                                            "topics_covered": [response_json.get("roadmap_overview", [{}])[0].get("main_topic", "Playlist Track")],
                                            "rationale": "Extracted directly from top YouTube playlist to bypass rate limits."
                                        })
                                response_json['curriculum'] = injected_curriculum
                                # Force the Roadmap to perfectly match the injected playlist tracks
                                response_json['roadmap_overview'] = [{
                                    "main_topic": "Top 100 Tracks Collection",
                                    "sub_topics": [t['title'] for t in injected_curriculum]
                                }]
            except Exception as ex:
                print("Playlist injection failed:", ex)
                
        # Cache the result before returning
        try:
            if redis_client:
                redis_client.setex(f"roadmap:{query_lower}", 3600, json.dumps(response_json))
            else:
                ROADMAP_CACHE[query_lower] = response_json
        except Exception as e:
            print(f"Redis set error: {e}")
            
        return response_json
    except Exception as e:
        raise Exception(f"AI Error: {e}")

def search_youtube(query: str, search_type: str = "education", original_query: str = None):
    cache_key = query.strip().lower()
    try:
        if redis_client:
            cached = redis_client.get(f"search:{cache_key}")
            if cached:
                return json.loads(cached)
        elif cache_key in SEARCH_CACHE:
            return SEARCH_CACHE[cache_key]
    except Exception as e:
        print(f"Redis search get error: {e}")

    ydl_opts_fast = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": True,
        "noplaylist": True,
        ,
        "extractor_args": {"youtube": ["player_client=ios,web"]}
    }
    ydl_opts_full = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "extractor_args": {"youtube": ["player_client=ios,web"]}
    }
    
    if node_path:
        ydl_opts_fast["js_runtimes"] = {'node': {'binary': node_path}}
        ydl_opts_full["js_runtimes"] = {'node': {'binary': node_path}}
        
    try:
        with yt(ydl_opts_fast) as yd:
            if query.startswith("http://") or query.startswith("https://"):
                info = yd.extract_info(query, download=False)
                best = info
                url = info.get("webpage_url", query)
            else:
                actual_query = query
                if search_type == "music" and "audio" not in actual_query.lower():
                    actual_query = actual_query + " audio"
                info = yd.extract_info(f"ytsearch5:{actual_query}", download=False)
                if 'entries' in info and len(info['entries']) > 0:
                    entries = list(info['entries'])
                    valid_entries = [e for e in entries if e.get('view_count') is not None]
                    if not valid_entries:
                        valid_entries = entries
                    if search_type != "music":
                        valid_entries = [sorted(valid_entries, key=lambda x: x.get('view_count', 0), reverse=True)[0]]
                else:
                    raise Exception("No results found.")
                
            for best in valid_entries:
                url = best.get("url")
                full_desc = ""
                raw_date = best.get("upload_date")
                likes = best.get("like_count")
                channel = best.get("uploader") or best.get("channel")
                try:
                    with yt(ydl_opts_full) as yd_full:
                        full_info = yd_full.extract_info(url, download=False)
                        full_desc = full_info.get("description", "")
                        if full_info.get("upload_date"):
                            raw_date = full_info.get("upload_date")
                        if full_info.get("like_count"):
                            likes = full_info.get("like_count")
                        if full_info.get("uploader") or full_info.get("channel"):
                            channel = full_info.get("uploader") or full_info.get("channel")
                except:
                    full_desc = best.get("description", "")
                formatted_date = None
                if raw_date and len(raw_date) == 8:
                    try:
                        import datetime
                        formatted_date = datetime.datetime.strptime(raw_date, "%Y%m%d").strftime("%b %d, %Y")
                    except:
                        formatted_date = raw_date
                
                # Date filtering logic
                if original_query and search_type == "music":
                    orig = original_query.lower()
                    is_latest_req = "latest" in orig or "new" in orig or "recent" in orig
                    if is_latest_req and raw_date and len(raw_date) == 8:
                        try:
                            year = int(raw_date[:4])
                            import datetime
                            current_year = datetime.datetime.now().year
                            # Reject if older than 3 years when "latest" is explicitly requested
                            if current_year - year > 3:
                                continue # SKIP THIS OLD VIDEO AND TRY THE NEXT ONE
                        except:
                            pass
                            
                result = {
                    "title": best.get("title", "Unknown"),
                    "url": url,
                    "thumbnail": best.get("thumbnails", [{}])[-1].get("url") if best.get("thumbnails") else None,
                    "views": best.get("view_count"),
                    "duration": best.get("duration"),
                    "description": full_desc,
                    "upload_date": formatted_date,
                    "channel": channel,
                    "likes": likes
                }
                try:
                    if redis_client:
                        redis_client.setex(f"search:{cache_key}", 3600, json.dumps(result))
                    else:
                        SEARCH_CACHE[cache_key] = result
                        if len(SEARCH_CACHE) > 5000:
                            SEARCH_CACHE.pop(next(iter(SEARCH_CACHE)))
                except Exception as e:
                    print(f"Redis search set error: {e}")
                
                return result
            return None # All videos failed the date filter
    except Exception as e:
        print(f"Search error for {query}: {e}")
    return None

def download_video(url: str, output_dir: str, format_type: str = "video_high", task_id: str = None):
    import uuid
    os.makedirs(output_dir, exist_ok=True)
    
    outtmpl = os.path.join(output_dir, f"%(title)s_{uuid.uuid4().hex[:6]}.%(ext)s")
    
    if format_type == "audio":
        ydl_opts = {
            "outtmpl": outtmpl,
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
            "quiet": True,
            "no_warnings": True,
            "progress_hooks": [get_progress_hook(task_id)] if task_id else [],
            "extractor_args": {"youtube": ["player_client=ios,web"]}
        }
    elif format_type == "video_fast":
        ydl_opts = {
            "outtmpl": outtmpl,
            "format": "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "merge_output_format": "mp4",
            "quiet": True,
            "no_warnings": True,
            "progress_hooks": [get_progress_hook(task_id)] if task_id else [],
            "extractor_args": {"youtube": ["player_client=ios,web"]}
        }
    else:
        # video_high
        ydl_opts = {
            "outtmpl": outtmpl,
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "merge_output_format": "mp4",
            "quiet": True,
            "no_warnings": True,
            "progress_hooks": [get_progress_hook(task_id)] if task_id else [],
            "extractor_args": {"youtube": ["player_client=ios,web"]}
        }
    
    if node_path:
        ydl_opts["js_runtimes"] = {'node': {'binary': node_path}}
        
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with yt(ydl_opts) as yd:
                info = yd.extract_info(url, download=True)
                filename = yd.prepare_filename(info)
                base, _ = os.path.splitext(filename)
                
                if format_type == "audio" and os.path.exists(f"{base}.mp3"):
                    return f"{base}.mp3"
                    
                if os.path.exists(f"{base}.mp4"):
                    return f"{base}.mp4"
                if os.path.exists(f"{base}.mkv"):
                    return f"{base}.mkv"
                return filename
        except Exception as e:
            print(f"Download failed for {url} on attempt {attempt+1}: {e}")
            if attempt == max_retries - 1:
                return None
            import time
            time.sleep(3)
