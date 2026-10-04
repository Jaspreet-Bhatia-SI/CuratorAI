# Curator AI 🎵📚

Transform any topic, artist, or vibe into a structured learning path or a curated music mix in seconds. Curator AI is a **100% serverless, cloud-first Progressive Web App (PWA)** that sits at the intersection of AI generation, cloud-synced media, and offline playback.

## 🌐 Live Application
Try the live web app directly: **[https://curator.foodzie.store](http://curator.foodzie.store)**

*(Note: Curator AI is a fully installable PWA. Just click "Install App" in your browser's address bar to install it on your Android, iOS, Windows, or Mac device. It works entirely offline!)*

## ✨ Features
- **Progressive Web App (PWA):** Installs natively on any device. Downloaded music is saved safely in your browser's IndexedDB for complete offline playback, while also giving you a standard MP3 file in your device's Downloads folder.
- **Serverless Architecture:** Completely decoupled from the legacy Python backend. Uses Supabase directly for authentication, history, caching, and media storage.
- **Personal Cloud Library:** A script is provided (`scripts/upload_music_to_cloud.py`) to easily upload your local MP3s directly to your Supabase storage, with automatic ID3 duration/metadata extraction via `mutagen`.
- **Intelligent Querying:** The app intercepts searches to prioritize your Cloud Library tracks instantly before falling back to the Gemini/Groq APIs.
- **Global Redis Caching:** AI roadmap generation and YouTube queries are cached globally using Redis, resulting in instant 0-latency responses for duplicate searches.
- **Bring Your Own API Key:** Uses your personal Gemini or Groq keys for completely free, unlimited AI generations.

## 🛠️ Developer Setup (Run from Source)

If you want to edit the code and run the app locally:

```bash
# 1. Clone the repository
git clone https://github.com/Jaspreet-Bhatia-SI/CuratorAI.git
cd CuratorAI

# 2. Setup Frontend
cd frontend
npm install

# 3. Start Web Environment (with PWA support)
npm run dev
```

### Architecture

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/architecture/curator-architecture.visual-check.1440x900.dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/architecture/curator-architecture.visual-check.1440x900.light.png">
  <img alt="Curator AI Architecture Diagram" src="docs/architecture/curator-architecture.visual-check.1440x900.light.png" width="100%">
</picture>

*(For an interactive, animated version of this map, **[click here to view the live interactive preview](https://htmlpreview.github.io/?https://github.com/Jaspreet-Bhatia-SI/CuratorAI/blob/main/docs/architecture/curator-architecture.html)**).*
- **Frontend UI:** React + Vite + TailwindCSS (Material 3 Design)
- **PWA Integration:** `vite-plugin-pwa` with IndexedDB offline storage
- **Database/Auth/Storage:** Supabase (PostgreSQL)
- **Caching Layer:** Redis
- **AI Integrations:** Gemini & Groq APIs
