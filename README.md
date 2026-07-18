<div align="center">

<img src="resources/icons/app.png" width="96" alt="FeatherMusic logo" />

# FeatherMusic

**A lightweight, immersive desktop music player.**

Search, stream, and listen with synced lyrics — in a clean, minimal desktop app.

[![Platform](https://img.shields.io/badge/platform-Windows-0078D6?style=flat-square)](#downloads)
[![Built with Neutralino.js](https://img.shields.io/badge/built%20with-Neutralino.js-f7b731?style=flat-square)](https://neutralino.js.org/)
[![Made with AI](https://img.shields.io/badge/made%20with-AI%20%2F%20vibe%20coding-b983ff?style=flat-square)](#-built-with-ai--vibe-coded)
[![License](https://img.shields.io/badge/license-see%20disclaimer-lightgrey?style=flat-square)](#legal-disclaimer)

</div>

---

## Screenshots

<!-- Drop your screenshots into a folder (e.g. /screenshots) and reference them below -->
<div align="center">
  <img src="screenshots/home.png" width="80%" alt="FeatherMusic home screen" />
  <br/><br/>
  <img src="screenshots/player.png" width="80%" alt="FeatherMusic now playing view" />
</div>

---

## ✨ Features

- 🎧 **Search & Stream** — find songs, albums, artists, and playlists straight from YouTube Music
- 🖤 **Now Playing** — clean, minimal playback UI built for focus
- 📝 **Synced Lyrics** — real-time lyric sync pulled from LRCLIB
- 📚 **Library** — save favorites and build your own playlists, stored locally
- 🖥️ **Lightweight Desktop Shell** — powered by Neutralino.js, not Electron — small install size, low overhead
- 🔒 **No account, no tracking** — nothing you don't need

---

## 📥 Downloads

Grab the latest build from the **[Releases](../../releases)** page:

| File | Description |
|---|---|
| `FeatherMusic-Setup.exe` | Windows installer (recommended) |
| `FeatherMusic.msi` | MSI installer for managed/enterprise installs |
| `FeatherMusic-win.zip` | Portable version, no install required |

> Windows may show a SmartScreen warning since the app isn't code-signed yet — this is normal for an independent open-source project. Click **More info → Run anyway** if you trust the source.

---

## 🛠️ Tech Stack & Credits

FeatherMusic is a small hobby project stitched together from great open-source tools and public APIs. Full credit to the people who built and maintain them:

**App shell**
- [Neutralino.js](https://neutralino.js.org/) — lightweight cross-platform desktop runtime (the alternative to Electron)
- Vanilla JavaScript, HTML, CSS — no frontend framework
- [Lucide Icons](https://lucide.dev/) — icon set
- DM Sans — typeface

**Backend / data**
- [Python](https://www.python.org/) — local backend server bundled as a Neutralino extension
- [ytmusicapi](https://github.com/sigma67/ytmusicapi) — unofficial YouTube Music data API (search, home feed, albums, artists, playlists)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — audio stream resolution
- [LRCLIB](https://lrclib.net/) — free, open lyrics API for synced lyrics
- [PyInstaller](https://pyinstaller.org/) — bundles the Python backend into a standalone executable

**Packaging**
- Windows installer built with NSIS

This project would not exist without these tools — please check out and support their maintainers.

---

## 🤖 Built With AI / Vibe-Coded

Full transparency: **FeatherMusic was built using AI assistance ("vibe coding")** — AI tools were used throughout for writing and iterating on code, UI, and structure. It's a personal/hobby project, not a professionally audited commercial product. Expect rough edges, and please report bugs via [Issues](../../issues) rather than assuming production-grade reliability.

---

## ⚠️ Legal / Disclaimer

- FeatherMusic is an **independent, open-source** music client. It is **not affiliated with, endorsed by, or sponsored by YouTube, YouTube Music, or Google**.
- FeatherMusic **does not host, store, or distribute** any copyrighted media. All media is streamed on-demand from third-party services (YouTube/YouTube Music) and remains the property of its respective owners.
- FeatherMusic is intended for **personal and educational use only**. Users are solely responsible for complying with their local copyright laws and the terms of service of any third-party platform they access through this app.
- The developer(s) of FeatherMusic accept **no liability** for misuse of this software or for content accessed through third-party services.
- This software is provided **"as is," without warranty of any kind**, express or implied.

## 🔐 Privacy

- FeatherMusic does **not require an account** and does not intentionally collect personal information.
- Playlists, favorites, and playback preferences are stored **locally on your device only**.
- Search, playback, and lyrics requests are sent to third-party services (YouTube Music, LRCLIB) to function — those services have their own privacy policies, which apply independently.
- FeatherMusic does **not** sell or share user data, because it doesn't collect any to begin with.

---

## 👤 Developer

**Adwith** — Lead Developer & Designer

[![Instagram](https://img.shields.io/badge/Instagram-@a.dwith-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://instagram.com/a.dwith)
[![GitHub](https://img.shields.io/badge/GitHub-adwithch-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/adwithch)


---

<div align="center">
<sub>Made with ❤️ (and a lot of AI) by Adwith</sub>
</div>
