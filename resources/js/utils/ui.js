// ui.js — UI Utilities

const UI = (() => {
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function getThumbnail(track) {
    let thumb = 'icons/app.png';
    const thumbs = track.thumbnails || (track.thumbnail ? (Array.isArray(track.thumbnail) ? track.thumbnail : [track.thumbnail]) : []);
    if (thumbs && thumbs.length > 0) {
      const bestThumb = thumbs[thumbs.length - 1];
      thumb = typeof bestThumb === 'string' ? bestThumb : (bestThumb.url || bestThumb.src || thumb);
    } else if (track.artwork) {
      thumb = track.artwork;
    }
    return thumb;
  }

  function renderPlaylistArt(tracks = []) {
    if (!tracks || tracks.length === 0) {
      return `<div class="playlist-collage single"><img src="icons/app.png" /></div>`;
    }
    if (tracks.length < 4) {
      return `<div class="playlist-collage single"><img src="${getThumbnail(tracks[0])}" /></div>`;
    }
    
    return `
      <div class="playlist-collage">
        <img src="${getThumbnail(tracks[0])}" />
        <img src="${getThumbnail(tracks[1])}" />
        <img src="${getThumbnail(tracks[2])}" />
        <img src="${getThumbnail(tracks[3])}" />
      </div>
    `;
  }

  function updateNowPlaying(track) {
    const art = document.getElementById('np-art');
    const title = document.getElementById('np-title');
    const artist = document.getElementById('np-artist');

    const thumb = getThumbnail(track);
    
    // Mini player
    if (art) art.src = thumb;
    if (title) title.textContent = track.title || 'Unknown';
    if (artist) artist.textContent = track.artist || (track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist');
    
    // Fullscreen player
    const fsArt = document.getElementById('fs-art');
    const fsTitle = document.getElementById('fs-title');
    const fsArtist = document.getElementById('fs-artist');
    const fsBg = document.getElementById('fs-bg');

    if (fsArt) fsArt.src = thumb;
    if (fsTitle) fsTitle.textContent = track.title || 'Unknown';
    if (fsArtist) fsArtist.textContent = track.artist || (track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist');
    if (fsBg) fsBg.style.backgroundImage = `url('${thumb}')`;

    // Lyrics overlay art
    const lyricsArt = document.getElementById('lyrics-art');
    const lyricsTitle = document.getElementById('lyrics-title');
    const lyricsArtist = document.getElementById('lyrics-artist');
    const lyricsBg = document.getElementById('lyrics-bg');
    if (lyricsArt) lyricsArt.src = thumb;
    if (lyricsTitle) lyricsTitle.textContent = track.title || 'Unknown';
    if (lyricsArtist) lyricsArtist.textContent = track.artist || (track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist');
    if (lyricsBg) lyricsBg.style.backgroundImage = `url('${thumb}')`;

    // Update document title
    document.title = `${track.title} - FeatherMusic`;
  }

  function updateProgress(current, total) {
    const format = (t) => formatTime(t);
    const percent = (current / total) * 100 || 0;

    // Mini Player
    const currentEl = document.getElementById('time-current');
    const totalEl = document.getElementById('time-total');
    const fill = document.getElementById('seek-fill');
    if (currentEl) currentEl.textContent = format(current);
    if (totalEl) totalEl.textContent = format(total);
    if (fill) fill.style.width = `${percent}%`;

    // Fullscreen Player
    const fsCurrentEl = document.getElementById('fs-time-current');
    const fsTotalEl = document.getElementById('fs-time-total');
    const fsFill = document.getElementById('fs-seek-fill');
    if (fsCurrentEl) fsCurrentEl.textContent = format(current);
    if (fsTotalEl) fsTotalEl.textContent = format(total);
    if (fsFill) fsFill.style.width = `${percent}%`;
  }

  function renderQueue(queue, currentTrack, onSelect) {
    const container = document.getElementById('queue-content');
    if (!container) return;

    const currentId = currentTrack?.videoId || currentTrack?.id;
    
    container.innerHTML = queue.map((t, idx) => {
      const isPlaying = (t.videoId || t.id) === currentId;
      const thumb = getThumbnail(t);

      return `
        <div class="queue-item ${isPlaying ? 'active' : ''}" data-idx="${idx}">
          <img src="${thumb}" onerror="this.src='icons/app.png'" />
          <div class="queue-item-info">
            <div class="queue-item-title" style="${isPlaying ? 'color: var(--accent);' : ''}">${t.title}</div>
            <div class="queue-item-artist">${t.artist || 'Unknown'}</div>
          </div>
          ${isPlaying ? '<i data-lucide="volume-2" style="width: 14px; color: var(--accent);"></i>' : ''}
        </div>
      `;
    }).join('');

    container.querySelectorAll('.queue-item').forEach(el => {
      el.onclick = () => onSelect(queue[parseInt(el.dataset.idx)]);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderLyrics(lyrics, targetContainerId = 'lyrics-content', onSeek = null) {
    const container = document.getElementById(targetContainerId);
    if (!container) return;

    if (lyrics === 'loading') {
      container.innerHTML = '<div class="lyrics-placeholder loading-pulse">Searching for lyrics...</div>';
      return;
    }

    if (!lyrics || lyrics.length === 0) {
      container.innerHTML = '<div class="lyrics-placeholder">Lyrics not available</div>';
      return;
    }

    container.innerHTML = lyrics.map((l, i) => `
      <div class="lyric-line" data-index="${i}" data-time="${l.time}">${l.text}</div>
    `).join('');

    if (onSeek) {
      container.querySelectorAll('.lyric-line').forEach(el => {
        el.onclick = () => onSeek(parseFloat(el.dataset.time));
      });
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function updateActiveLyric(index, targetContainerId = 'lyrics-content') {
    const container = document.getElementById(targetContainerId);
    if (!container) return;

    const lines = container.querySelectorAll('.lyric-line');
    lines.forEach((l, i) => {
      l.classList.remove('current', 'passed');
      if (i < index) l.classList.add('passed');
    });
    
    if (index !== -1 && lines[index]) {
      const activeLine = lines[index];
      activeLine.classList.add('current');
      
      const containerHeight = container.offsetHeight;
      const lineOffset = activeLine.offsetTop;
      const scrollPos = lineOffset - (containerHeight * 0.4);
      
      container.scrollTo({
        top: scrollPos,
        behavior: 'smooth'
      });
    }
  }

  function renderSkeleton(container, count = 8) {
    container.innerHTML = Array(count).fill(`
      <div class="card loading-pulse" style="height: 240px; opacity: 0.1; background: white;"></div>
    `).join('');
  }

  function showPlaylistPicker(track) {
    const { playlists } = State.get();

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="centered-modal">
        <div class="modal-header">
          <h3 class="modal-title">Add to Playlist</h3>
          <button class="icon-btn close-modal"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-list">
          ${playlists.length === 0 ? `
            <div style="padding: 40px 24px; text-align: center; color: var(--text-muted);">
              <i data-lucide="list-music" style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
              <p>No playlists found</p>
            </div>
          ` : playlists.map(p => `
            <div class="modal-item" data-id="${p.id}">
              <div class="modal-item-art">
                ${renderPlaylistArt(p.tracks)}
              </div>
              <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 15px;">${p.title}</div>
                <div style="font-size: 12px; color: var(--text-dim);">${p.tracks?.length || 0} tracks</div>
              </div>
              <i data-lucide="plus" style="width: 18px; opacity: 0.5;"></i>
            </div>
          `).join('')}
        </div>
        <button class="btn-create-playlist-modal" id="btn-create-playlist-new">
          <i data-lucide="plus" style="width: 18px;"></i>
          Create New Playlist
        </button>
      </div>
    `;

    document.body.appendChild(backdrop);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(() => backdrop.classList.add('active'), 10);

    const close = () => {
      backdrop.classList.remove('active');
      setTimeout(() => backdrop.remove(), 300);
    };

    backdrop.querySelector('.close-modal').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };

    backdrop.querySelectorAll('.modal-item').forEach(el => {
      el.onclick = () => {
        const pId = el.dataset.id;
        const updated = playlists.map(p => {
          if (p.id === pId) {
            const alreadyIn = (p.tracks || []).some(t => (t.videoId || t.id) === (track.videoId || track.id));
            if (!alreadyIn) {
              return { ...p, tracks: [...(p.tracks || []), track] };
            }
          }
          return p;
        });
        State.set('playlists', updated);
        close();
      };
    });

    backdrop.querySelector('#btn-create-playlist-new').onclick = () => {
      const name = prompt("Enter playlist name:");
      if (name) {
        const newPlaylist = {
          id: 'local-' + Date.now(),
          title: name,
          tracks: [track],
          thumbnails: [{ url: getThumbnail(track) }]
        };
        State.set('playlists', [...playlists, newPlaylist]);
        close();
      }
    };
  }

  function updateSidebar() {
    const { playlists } = State.get();
    const container = document.querySelector('.playlist-list');
    if (!container) return;

    container.innerHTML = playlists.map(p => `
      <a href="#/playlist?id=${p.id}" class="playlist-item" style="display: flex; align-items: center; gap: 12px; padding: 8px 12px;">
        <div style="width: 24px; height: 24px; border-radius: 4px; overflow: hidden; flex-shrink: 0;">
          ${renderPlaylistArt(p.tracks)}
        </div>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.title}</span>
      </a>
    `).join('');
  }

  function updateControls(state) {
    const shuffleBtn = document.getElementById('btn-shuffle');
    const repeatBtn = document.getElementById('btn-repeat');

    if (shuffleBtn) {
      shuffleBtn.style.color = state.shuffle ? 'var(--accent)' : 'var(--text-dim)';
    }

    if (repeatBtn) {
      const repeatIcon = repeatBtn.querySelector('i');
      if (state.repeat === 'off') {
        repeatBtn.style.color = 'var(--text-dim)';
        if (repeatIcon) repeatIcon.dataset.lucide = 'repeat';
      } else if (state.repeat === 'all') {
        repeatBtn.style.color = 'var(--accent)';
        if (repeatIcon) repeatIcon.dataset.lucide = 'repeat';
      } else if (state.repeat === 'one') {
        repeatBtn.style.color = 'var(--accent)';
        if (repeatIcon) repeatIcon.dataset.lucide = 'repeat-1';
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  return { 
    formatTime, 
    updateNowPlaying, 
    updateProgress, 
    renderSkeleton, 
    updateControls,
    renderQueue,
    renderLyrics,
    updateActiveLyric,
    showPlaylistPicker,
    updateSidebar,
    renderPlaylistArt,
    getThumbnail
  };
})();
