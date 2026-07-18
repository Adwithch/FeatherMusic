// playback.js — Audio Engine

const Playback = (() => {
  let _audio = null;
  let _lyrics = [];
  let _currentLyricIndex = -1;
  let _isLyricsLoading = false;
  let _wasFs = false;

  function init() {
    _audio = document.getElementById('main-audio');
    
    _audio.addEventListener('play', () => State.set('isPlaying', true));
    _audio.addEventListener('pause', () => State.set('isPlaying', false));
    _audio.addEventListener('ended', () => {
      const { repeat } = State.get();
      if (repeat === 'one') {
        _audio.currentTime = 0;
        _audio.play();
      } else {
        next();
      }
    });

    _audio.addEventListener('timeupdate', () => {
      const current = _audio.currentTime;
      UI.updateProgress(current, _audio.duration);
      syncLyrics(current);
    });

    // Volume Control
    const volumeBar = document.getElementById('volume-bar');
    if (volumeBar) {
      let isDraggingVol = false;
      const handleVolume = (e) => {
        const rect = volumeBar.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        _audio.volume = pos;
        document.getElementById('volume-fill').style.width = `${pos * 100}%`;
        State.set('volume', pos * 100);
      };
      volumeBar.addEventListener('mousedown', (e) => { isDraggingVol = true; handleVolume(e); });
      window.addEventListener('mousemove', (e) => { if (isDraggingVol) handleVolume(e); });
      window.addEventListener('mouseup', () => { isDraggingVol = false; });
    }

    // Global Player Bar Listeners (Indestructible via delegation)
    document.addEventListener('click', async (e) => {
      const shuffleBtn = e.target.closest('#btn-shuffle, #fs-btn-shuffle');
      const prevBtn = e.target.closest('#btn-prev, #fs-btn-prev');
      const playPauseBtn = e.target.closest('#btn-play-pause, #fs-btn-play-pause');
      const nextBtn = e.target.closest('#btn-next, #fs-btn-next');
      const repeatBtn = e.target.closest('#btn-repeat, #fs-btn-repeat');
      const lyricsBtn = e.target.closest('#btn-lyrics');
      const lyricsCloseBtn = e.target.closest('#btn-lyrics-close');
      const lyricsFsBtn = e.target.closest('#btn-lyrics-fullscreen');
      const queueBtn = e.target.closest('#btn-queue');
      const fullscreenBtn = e.target.closest('#btn-fullscreen');
      const npArt = e.target.closest('#np-art, .np-info');
      const closeFsBtn = e.target.closest('#btn-fs-close');
      const closeQueueBtn = e.target.closest('.close-overlay');
      const favoriteBtn = e.target.closest('#btn-favorite, #fs-btn-favorite');
      const addToPlaylistBtn = e.target.closest('#btn-add-to-playlist, #fs-btn-add-to-playlist');

      if (shuffleBtn) toggleShuffle();
      else if (prevBtn) prev();
      else if (playPauseBtn) togglePlay();
      else if (nextBtn) next();
      else if (repeatBtn) toggleRepeat();
      else if (lyricsBtn) toggleLyrics();
      else if (lyricsCloseBtn) toggleLyrics(false);
      else if (lyricsFsBtn) toggleLyricsFullscreen();
      else if (queueBtn) toggleQueue();
      else if (fullscreenBtn || npArt) {
        toggleLyrics(true);
        toggleLyricsFullscreen(true);
      }
      else if (closeFsBtn) toggleFullscreen(false);
      else if (closeQueueBtn) document.getElementById('queue-overlay').classList.remove('active');
      else if (favoriteBtn) toggleFavorite();
      else if (addToPlaylistBtn) {
        const { currentTrack } = State.get();
        if (currentTrack) UI.showPlaylistPicker(currentTrack);
      }
    });

    // Main Seek Bar
    const seekBar = document.getElementById('seek-bar');
    if (seekBar) {
      let isDragging = false;
      const handleSeek = (e) => {
        const rect = seekBar.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (isDragging) {
          UI.updateProgress(pos * _audio.duration, _audio.duration);
        } else {
          _audio.currentTime = pos * _audio.duration;
        }
      };
      seekBar.addEventListener('mousedown', (e) => { isDragging = true; handleSeek(e); });
      window.addEventListener('mousemove', (e) => { if (isDragging) handleSeek(e); });
      window.addEventListener('mouseup', (e) => { 
        if (isDragging) {
          const rect = seekBar.getBoundingClientRect();
          const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          _audio.currentTime = pos * _audio.duration;
          isDragging = false; 
        }
      });
      // Support simple click too
      seekBar.addEventListener('click', (e) => {
        if (!isDragging) handleSeek(e);
      });
    }

    // Fullscreen Seek Bar
    const fsSeekBar = document.getElementById('fs-seek-bar');
    if (fsSeekBar) {
      let isDraggingFs = false;
      const handleFsSeek = (e) => {
        const rect = fsSeekBar.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (isDraggingFs) {
          UI.updateProgress(pos * _audio.duration, _audio.duration);
        } else {
          _audio.currentTime = pos * _audio.duration;
        }
      };
      fsSeekBar.addEventListener('mousedown', (e) => { isDraggingFs = true; handleFsSeek(e); });
      window.addEventListener('mousemove', (e) => { if (isDraggingFs) handleFsSeek(e); });
      window.addEventListener('mouseup', (e) => { 
        if (isDraggingFs) {
          const rect = fsSeekBar.getBoundingClientRect();
          const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          _audio.currentTime = pos * _audio.duration;
          isDraggingFs = false; 
        }
      });
      fsSeekBar.addEventListener('click', (e) => {
        if (!isDraggingFs) handleFsSeek(e);
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', async (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.code === 'ArrowRight' && e.ctrlKey) next();
      else if (e.code === 'ArrowLeft' && e.ctrlKey) prev();
      else if (e.code === 'Escape') { 
        // Escape now correctly closes lyrics and exits native fullscreen
        if (document.getElementById('lyrics-overlay')?.classList.contains('active')) {
          await toggleLyrics(false);
        }
        
        toggleFullscreen(false); 
        const queueOverlay = document.getElementById('queue-overlay');
        if (queueOverlay) queueOverlay.classList.remove('active'); 
      }
    });

    // Native Window Resize - Fullscreen State Sync
    window.addEventListener('resize', async () => {
      if (typeof Neutralino !== 'undefined') {
        try {
          const isFs = await Neutralino.window.isFullScreen();
          
          // Fix for taskbar overflow: If we just exited fullscreen, ensure the window is correctly bounded
          if (_wasFs && !isFs) {
            const isMax = await Neutralino.window.isMaximized();
            if (isMax) {
              // Re-maximize to force the OS to respect the work area (avoiding taskbar overlap)
              await Neutralino.window.unmaximize();
              await Neutralino.window.maximize();
            }
          }
          _wasFs = isFs;

          // Sync lyrics fullscreen state
          const lyricsOverlay = document.getElementById('lyrics-overlay');
          if (lyricsOverlay && !isFs && lyricsOverlay.classList.contains('is-fs')) {
            lyricsOverlay.classList.remove('is-fs');
            const fsBtn = document.getElementById('btn-lyrics-fullscreen');
            if (fsBtn) {
              fsBtn.innerHTML = `<i data-lucide="maximize" style="width: 24px; height: 24px;"></i>`;
              if (typeof lucide !== 'undefined') lucide.createIcons();
            }
          }
          
          // Sync main player fullscreen state
          const mainPlayer = document.getElementById('fullscreen-player');
          if (mainPlayer && !isFs && mainPlayer.classList.contains('active')) {
             mainPlayer.classList.remove('active');
          }
        } catch (e) {}
      }
    });

    // Subscribe UI to state changes
    State.subscribe(state => {
      UI.updateControls(state);
      // Sync play/pause icons
      const icons = document.querySelectorAll('#btn-play-pause i, #fs-btn-play-pause i');
      icons.forEach(icon => {
        icon.dataset.lucide = state.isPlaying ? 'pause' : 'play';
      });
      
      // Update favorite icons
      const favBtns = document.querySelectorAll('#btn-favorite, #fs-btn-favorite');
      if (favBtns.length) {
        const currentId = state.currentTrack?.videoId || state.currentTrack?.id;
        const isFav = state.favorites.some(f => (f.videoId || f.id) === currentId);
        favBtns.forEach(btn => {
          btn.style.color = isFav ? 'var(--accent)' : 'var(--text-dim)';
          btn.innerHTML = `<i data-lucide="heart" ${isFav ? 'fill="currentColor"' : ''} style="width: 18px;"></i>`;
        });
      }

      // Sync Lyrics Button state
      const lyricsBtn = document.getElementById('btn-lyrics');
      if (lyricsBtn) {
        const isLyricsActive = document.getElementById('lyrics-overlay')?.classList.contains('active');
        lyricsBtn.style.color = isLyricsActive ? 'var(--accent)' : 'var(--text-dim)';
      }

      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  }

  function toggleFavorite() {
    const { currentTrack, favorites } = State.get();
    if (!currentTrack) return;

    const trackId = currentTrack.videoId || currentTrack.id;
    const isFav = favorites.some(f => (f.videoId || f.id) === trackId);
    
    if (isFav) {
      State.set('favorites', favorites.filter(f => (f.videoId || f.id) !== trackId));
    } else {
      State.set('favorites', [...favorites, currentTrack]);
    }
  }

  function toggleOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active');
  }

  async function toggleLyrics(force) {
    const el = document.getElementById('lyrics-overlay');
    if (!el) return;

    const isCurrentlyActive = el.classList.contains('active');
    const active = (typeof force === 'boolean') ? force : !isCurrentlyActive;
    
    console.log('toggleLyrics called. Target active:', active);

    if (active) {
      el.classList.add('active');
      if (_isLyricsLoading) {
        UI.renderLyrics('loading', 'lyrics-content');
      } else {
        UI.renderLyrics(_lyrics, 'lyrics-content', (time) => {
          _audio.currentTime = time;
        });
        UI.updateActiveLyric(_currentLyricIndex, 'lyrics-content');
      }
    } else {
      el.classList.remove('active');
      
      // Automatic Un-fullscreen: Always exit fullscreen when leaving lyrics
      el.classList.remove('is-fs');
      if (typeof Neutralino !== 'undefined') {
        try {
          await Neutralino.window.exitFullScreen();
          
          // Reset the fullscreen button icon
          const fsBtn = document.getElementById('btn-lyrics-fullscreen');
          if (fsBtn) {
            fsBtn.innerHTML = `<i data-lucide="maximize" style="width: 24px; height: 24px;"></i>`;
          }
        } catch (e) {
          console.error('Error exiting fullscreen on lyrics close:', e);
        }
      }

      // Force a layout recalculation to fix any rendering glitches
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }

    // Update main lyrics button style
    const lyricsBtn = document.getElementById('btn-lyrics');
    if (lyricsBtn) {
      lyricsBtn.style.color = active ? 'var(--accent)' : 'var(--text-dim)';
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  async function toggleLyricsFullscreen(force) {
    const el = document.getElementById('lyrics-overlay');
    if (!el) return;

    const isFs = el.classList.contains('is-fs');
    const targetFs = (typeof force === 'boolean') ? force : !isFs;
    
    console.log('toggleLyricsFullscreen called. Target fullscreen:', targetFs);

    if (typeof Neutralino !== 'undefined') {
      try {
        if (targetFs) {
          await Neutralino.window.setFullScreen();
        } else {
          await Neutralino.window.exitFullScreen();
        }
      } catch (e) {
        console.error('Failed to toggle native fullscreen:', e);
      }
    }

    if (targetFs) {
      el.classList.add('is-fs');
      // If we are making it fullscreen, ensure the overlay is active
      if (!el.classList.contains('active')) {
        await toggleLyrics(true);
      }
    } else {
      el.classList.remove('is-fs');
    }

    // Reliable button icon update
    const btn = document.getElementById('btn-lyrics-fullscreen');
    if (btn) {
      btn.innerHTML = `<i data-lucide="${targetFs ? 'minimize-2' : 'maximize'}" style="width: 24px; height: 24px;"></i>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  function toggleQueue() {
    const el = document.getElementById('queue-overlay');
    if (el) {
      el.classList.toggle('active');
      if (el.classList.contains('active')) {
        const { queue, currentTrack } = State.get();
        UI.renderQueue(queue, currentTrack, (t) => play(t));
      }
    }
  }

  async function toggleFullscreen(active) {
    const el = document.getElementById('fullscreen-player');
    if (!el) return;

    if (active) {
      el.classList.add('active');
      if (typeof Neutralino !== 'undefined') {
        try {
          await Neutralino.window.setFullScreen();
        } catch (e) {}
      }
    } else {
      el.classList.remove('active');
      if (typeof Neutralino !== 'undefined') {
        try {
          // Only exit fullscreen if lyrics aren't also holding it
          const lyricsEl = document.getElementById('lyrics-overlay');
          if (!lyricsEl || !lyricsEl.classList.contains('is-fs')) {
            await Neutralino.window.exitFullScreen();
          }
        } catch (e) {}
      }
    }
  }

  function togglePlay() {
    if (_audio.paused) _audio.play();
    else _audio.pause();
  }

  async function play(track, newQueue = null) {
    if (!track) return;
    const vId = track.videoId || track.id;
    console.log('--- Real Playback Change Start ---');
    
    // 1. Queue Management
    if (newQueue) {
      // If a specific queue is provided (from playlist/album), set it
      State.set('originalQueue', [...newQueue]);
      const { shuffle } = State.get();
      State.set('queue', shuffle ? [...newQueue].sort(() => Math.random() - 0.5) : [...newQueue]);
    } else {
      // If playing a single track (search/home)
      const { queue, currentTrack } = State.get();
      const isInQueue = queue.some(t => (t.videoId || t.id) === vId);
      
      if (!isInQueue) {
        // Clear queue and play just this track (standard behavior for single play)
        // or prepend? Prepended caused collision issues.
        // User expected "Up Next" to be just this song or related songs.
        State.set('queue', [track]);
        State.set('originalQueue', [track]);
      }
    }

    State.set('currentTrack', track);
    UI.updateNowPlaying(track);
    UI.updateProgress(0, 0);

    // Refresh queue UI if open
    const queueOverlay = document.getElementById('queue-overlay');
    if (queueOverlay && queueOverlay.classList.contains('active')) {
      const { queue } = State.get();
      UI.renderQueue(queue, track, (t) => play(t));
    }

    // 2. Stop current audio
    _audio.pause();
    _audio.removeAttribute('src');
    _audio.load();

    // 3. Clear lyrics
    _lyrics = [];
    _currentLyricIndex = -1;
    _isLyricsLoading = true;
    UI.renderLyrics('loading', 'lyrics-content');

    try {
      const info = await API.getTrackInfo(vId);
      if (info && info.url) {
        console.log('Stream URL obtained, initializing audio...');
        _audio.src = info.url;
        _audio.load();
        
        const playPromise = _audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Audio playback failed or was blocked:', error);
          });
        }

        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist || (track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist'),
            artwork: [{ src: (track.thumbnails && track.thumbnails.length > 0) ? track.thumbnails[track.thumbnails.length - 1].url : 'icons/app.png', sizes: '512x512', type: 'image/png' }]
          });
        }
        
        fetchLyrics(info.artist, info.title, info.duration);
        
        const { history } = State.get();
        if (!history.length || (history[0].videoId || history[0].id) !== vId) {
          State.set('history', [track, ...history.slice(0, 50)]);
        }

        // If we only have this song or it's the last one, fetch related to keep the vibe going
        const { queue: currentQueue } = State.get();
        const currentIndex = currentQueue.findIndex(t => (t.videoId || t.id) === vId);
        if (currentQueue.length <= 1 || currentIndex === currentQueue.length - 1) {
          fetchRelated(vId);
        }
      }
    } catch (err) { console.error('CRITICAL Playback Error:', err); }
  }

  function setQueue(tracks) {
    const { shuffle } = State.get();
    State.set('originalQueue', [...tracks]);
    State.set('queue', shuffle ? [...tracks].sort(() => Math.random() - 0.5) : [...tracks]);
    
    // Update queue UI if visible
    const queueOverlay = document.getElementById('queue-overlay');
    if (queueOverlay && queueOverlay.classList.contains('active')) {
      UI.renderQueue(State.get().queue, State.get().currentTrack, (t) => play(t));
    }
  }

  function next() {
    const { currentTrack, queue, repeat } = State.get();
    if (!queue.length) return;

    const currentIndex = queue.findIndex(t => (t.videoId || t.id) === (currentTrack?.videoId || currentTrack?.id));
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      play(queue[currentIndex + 1]);
    } else if (repeat === 'all') {
      play(queue[0]);
    }
  }

  function prev() {
    const { currentTrack, queue } = State.get();
    if (!queue.length) return;

    if (_audio.currentTime > 3) {
      _audio.currentTime = 0;
      return;
    }

    const currentIndex = queue.findIndex(t => (t.videoId || t.id) === (currentTrack?.videoId || currentTrack?.id));
    if (currentIndex > 0) {
      play(queue[currentIndex - 1]);
    } else {
      play(queue[queue.length - 1]);
    }
  }

  function toggleShuffle() {
    const { shuffle, originalQueue, currentTrack } = State.get();
    const newState = !shuffle;
    State.set('shuffle', newState);

    if (newState) {
      // Shuffle: Keep current track at index 0, shuffle the rest
      const remaining = originalQueue.filter(t => (t.videoId || t.id) !== (currentTrack?.videoId || currentTrack?.id));
      const shuffled = [currentTrack, ...remaining.sort(() => Math.random() - 0.5)].filter(Boolean);
      State.set('queue', shuffled);
    } else {
      // Un-shuffle: Return to original order
      State.set('queue', [...originalQueue]);
    }
  }

  function toggleRepeat() {
    const { repeat } = State.get();
    const modes = ['off', 'all', 'one'];
    const nextMode = modes[(modes.indexOf(repeat) + 1) % modes.length];
    State.set('repeat', nextMode);
  }

  // --- Lyrics & Related (Existing Logic) ---
  async function fetchRelated(videoId) {
    try {
      const data = await API.getRelated(videoId);
      if (data && data.tracks) {
        const { queue, originalQueue } = State.get();
        const newTracks = data.tracks.map(t => {
          // Normalize thumbnails: can be 'thumbnails' (list) or 'thumbnail' (list or object)
          let thumbs = t.thumbnails;
          if (!thumbs && t.thumbnail) {
            thumbs = Array.isArray(t.thumbnail) ? t.thumbnail : [t.thumbnail];
          }
          if (!thumbs) thumbs = [];

          return {
            videoId: t.videoId,
            title: t.title,
            artist: t.artist || (t.artists ? t.artists.map(a => a.name).join(', ') : 'Unknown'),
            thumbnails: thumbs,
            duration: t.duration
          };
        });
        
        const updatedQueue = [...queue];
        const updatedOriginal = [...originalQueue];
        
        newTracks.forEach(nt => {
          if (!updatedQueue.some(qt => (qt.videoId || qt.id) === nt.videoId)) {
            updatedQueue.push(nt);
            updatedOriginal.push(nt);
          }
        });
        
        State.set('queue', updatedQueue);
        State.set('originalQueue', updatedOriginal);
      }
    } catch (err) { console.warn('Related fetch failed:', err); }
  }

  async function fetchLyrics(artist, title, duration) {
    try {
      const data = await API.getLyrics(artist, title, duration);
      if (data && data.syncedLyrics) {
        _lyrics = parseLRC(data.syncedLyrics);
      } else {
        _lyrics = [];
      }
    } catch (err) { 
      console.error('Lyrics fetch failed:', err);
      _lyrics = [];
    } finally {
      _isLyricsLoading = false;
      UI.renderLyrics(_lyrics, 'lyrics-content', (time) => {
        _audio.currentTime = time;
      });
    }
  }


  function parseLRC(lrc) {
    const lines = lrc.split('\n');
    const result = [];
    const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    lines.forEach(line => {
      const match = timeReg.exec(line);
      if (match) {
        const t = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / (match[3].length === 2 ? 100 : 1000);
        const text = line.replace(timeReg, '').trim();
        if (text) result.push({ time: t, text });
      }
    });
    return result;
  }

  function syncLyrics(time) {
    if (!_lyrics.length) return;
    let index = -1;
    for (let i = 0; i < _lyrics.length; i++) { if (time >= _lyrics[i].time) index = i; else break; }
    if (index !== _currentLyricIndex) {
      _currentLyricIndex = index;
      UI.updateActiveLyric(index, 'lyrics-content');
    }
  }

  return { init, play, setQueue, next, prev, toggleShuffle, toggleRepeat, togglePlay };
})();
