// search.js — FeatherMusic Search Page

const SearchPage = (() => {
  let _results = [];

  async function mount(params) {
    const query = params.get('q');
    const view = document.getElementById('view');
    
    if (!query) {
      view.innerHTML = `
        <div style="height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-dim);">
          <i data-lucide="search" style="width: 64px; height: 64px; margin-bottom: 24px; opacity: 0.2;"></i>
          <h1 style="font-size: 24px; color: var(--text);">Search FeatherMusic</h1>
          <p>Find your favorite songs, artists, and albums.</p>
        </div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    view.innerHTML = `
      <div class="section-header">
        <h1 class="section-title">Searching for "${query}"...</h1>
      </div>
      <div class="standard-grid">
        ${Array(8).fill('<div class="standard-card loading-pulse" style="height: 260px;"></div>').join('')}
      </div>
    `;

    try {
      const results = await API.search(query);
      // Guard: Only render if we are still on the Search page
      if (Router.currentPath !== '/search') return;
      
      _results = results;
      render(view, query, results);
    } catch (err) {
      if (Router.currentPath !== '/search') return;
      view.innerHTML = `<div class="error">Search failed. ${err.message}</div>`;
    }
  }

  function render(view, query, results) {
    // Compatibility Layer: If results is an array (old format), wrap it in the new structure
    if (Array.isArray(results)) {
      results = {
        songs: results,
        albums: [],
        artists: [],
        playlists: []
      };
    }

    // Defensive initialization
    const songs = results.songs || [];
    const albums = results.albums || [];
    const artists = results.artists || [];
    const playlists = results.playlists || [];

    if (songs.length === 0 && albums.length === 0 && artists.length === 0 && playlists.length === 0) {
      view.innerHTML = `<div class="empty-state"><h1>No results found for "${query}"</h1></div>`;
      return;
    }

    _results = songs; // Store songs for playback

    view.innerHTML = `
      <div class="section-header">
        <h1 class="section-title">Results for "${query}"</h1>
      </div>

      ${songs.length > 0 ? `
        <section style="margin-bottom: 48px;">
          <h2 class="section-title" style="font-size: 20px; margin-bottom: 24px;">Songs</h2>
          <div class="tracklist">
            ${songs.map((s, idx) => {
              const thumb = UI.getThumbnail(s);
              const artistName = s.artists ? s.artists.map(a => a.name).join(', ') : (s.artist || 'Unknown');
              const isFav = State.get().favorites.some(f => (f.videoId || f.id) === (s.videoId || s.id));
              return `
                <div class="track-row search-track-card" data-id="${s.videoId || s.id}" data-idx="${idx}" style="display: flex; align-items: center; padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s;">
                  <div style="width: 40px; color: var(--text-muted);">${idx + 1}</div>
                  <img src="${thumb}" style="width: 48px; height: 48px; border-radius: 4px; margin-right: 16px; object-fit: cover;" />
                  <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 15px;">${s.title}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">${artistName}</div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 16px; margin-right: 24px;">
                    <button class="icon-btn row-favorite" data-idx="${idx}" title="Favorite" style="color: ${isFav ? 'var(--accent)' : 'var(--text-dim)'};">
                      <i data-lucide="heart" ${isFav ? 'fill="currentColor"' : ''} style="width: 18px;"></i>
                    </button>
                    <button class="icon-btn row-add" data-idx="${idx}" title="Add to Playlist">
                      <i data-lucide="plus" style="width: 20px;"></i>
                    </button>
                  </div>
                  <div style="width: 60px; text-align: right; color: var(--text-muted); font-size: 14px;">${s.duration || ''}</div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      ` : ''}

      ${albums.length > 0 ? `
        <section style="margin-bottom: 48px;">
          <h2 class="section-title" style="font-size: 20px; margin-bottom: 24px;">Albums</h2>
          <div class="standard-grid">
            ${albums.map(a => {
              const thumb = (a.thumbnails && a.thumbnails.length > 0) ? a.thumbnails[a.thumbnails.length - 1].url : 'icons/app.png';
              return `
                <div class="standard-card album-card" data-id="${a.browseId}">
                  <div class="card-art-container">
                    <img class="card-art" src="${thumb}" loading="lazy" />
                    <div class="play-btn-overlay">
                      <i data-lucide="play" fill="currentColor" style="width: 24px; margin-left: 4px;"></i>
                    </div>
                  </div>
                  <div class="card-title" title="${a.title}">${a.title}</div>
                  <div class="card-subtitle">${a.artist || 'Album'} • ${a.year || ''}</div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      ` : ''}

      ${artists.length > 0 ? `
        <section style="margin-bottom: 48px;">
          <h2 class="section-title" style="font-size: 20px; margin-bottom: 24px;">Artists</h2>
          <div class="standard-grid">
            ${artists.map(a => {
              const thumb = (a.thumbnails && a.thumbnails.length > 0) ? a.thumbnails[a.thumbnails.length - 1].url : 'icons/app.png';
              return `
                <div class="standard-card artist-card" data-id="${a.browseId}">
                  <div class="card-art-container" style="border-radius: 50%;">
                    <img class="card-art" src="${thumb}" style="border-radius: 50%;" loading="lazy" />
                  </div>
                  <div class="card-title" style="text-align: center;">${a.artist || a.name || 'Artist'}</div>
                  <div class="card-subtitle" style="text-align: center;">Artist</div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      ` : ''}

      ${playlists.length > 0 ? `
        <section style="margin-bottom: 48px;">
          <h2 class="section-title" style="font-size: 20px; margin-bottom: 24px;">Playlists</h2>
          <div class="standard-grid">
            ${playlists.map(p => {
              const thumb = (p.thumbnails && p.thumbnails.length > 0) ? p.thumbnails[p.thumbnails.length - 1].url : 'icons/app.png';
              return `
                <div class="standard-card playlist-card" data-id="${p.browseId}">
                  <div class="card-art-container">
                    <img class="card-art" src="${thumb}" loading="lazy" />
                    <div class="play-btn-overlay">
                      <i data-lucide="play" fill="currentColor" style="width: 24px; margin-left: 4px;"></i>
                    </div>
                  </div>
                  <div class="card-title" title="${p.title}">${p.title}</div>
                  <div class="card-subtitle">${p.author || 'Playlist'}</div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      ` : ''}
    `;

    // Event Listeners
    view.querySelectorAll('.search-track-card').forEach(el => {
      el.onclick = (e) => {
        if (e.target.closest('.row-add') || e.target.closest('.row-favorite')) return;
        const id = el.dataset.id;
        const track = songs.find(s => (s.videoId || s.id) === id);
        if (track) Playback.play(track);
      };
    });

    view.querySelectorAll('.row-favorite').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(el.dataset.idx);
        const track = songs[idx];
        const { favorites } = State.get();
        const trackId = track.videoId || track.id;
        const isFav = favorites.some(f => (f.videoId || f.id) === trackId);
        
        if (isFav) {
          State.set('favorites', favorites.filter(f => (f.videoId || f.id) !== trackId));
        } else {
          State.set('favorites', [...favorites, track]);
        }
        
        // Update this row only for performance
        const icon = el.querySelector('i');
        const nowFav = !isFav;
        el.style.color = nowFav ? 'var(--accent)' : 'var(--text-dim)';
        if (icon) {
          icon.dataset.lucide = 'heart';
          if (nowFav) icon.setAttribute('fill', 'currentColor');
          else icon.removeAttribute('fill');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
      };
    });

    view.querySelectorAll('.row-add').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(el.dataset.idx);
        UI.showPlaylistPicker(songs[idx]);
      };
    });

    view.querySelectorAll('.album-card').forEach(el => {
      el.onclick = () => {
        window.location.hash = `#/album?id=${el.dataset.id}`;
      };
    });

    view.querySelectorAll('.artist-card').forEach(el => {
      el.onclick = () => {
        window.location.hash = `#/artist?id=${el.dataset.id}`;
      };
    });

    view.querySelectorAll('.playlist-card').forEach(el => {
      el.onclick = () => {
        window.location.hash = `#/playlist?id=${el.dataset.id}`;
      };
    });
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  return { mount };
})();
