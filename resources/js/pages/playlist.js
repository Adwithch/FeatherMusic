// playlist.js — Playlist View

const PlaylistPage = (() => {
  let _currentPlaylist = null;

  async function mount(params) {
    const id = params.get('id');
    const view = document.getElementById('view');
    view.innerHTML = '<div class="loading">Loading playlist...</div>';

    try {
      // Check local state first
      const { playlists } = State.get();
      const local = playlists.find(p => p.id === id);
      
      if (local) {
        // Guard: Only render if we are still on the Playlist page with same ID
        if (Router.currentPath !== '/playlist') return;
        _currentPlaylist = local;
        render(view, local, true);
      } else {
        const data = await API.getPlaylist(id);
        // Guard: Only render if we are still on the Playlist page with same ID
        if (Router.currentPath !== '/playlist') return;
        _currentPlaylist = data;
        render(view, data, false);
      }
    } catch (err) {
      if (Router.currentPath !== '/playlist') return;
      view.innerHTML = `<div class="error">Playlist not found. ${err.message}</div>`;
    }
  }

  function render(view, data, isLocal) {
    const author = data.author ? (data.author.name || data.author) : (isLocal ? 'You' : 'Various');

    // Enrich tracks with collection metadata if missing
    const enrichedTracks = (data.tracks || []).map(t => ({
      ...t,
      thumbnails: (t.thumbnails && t.thumbnails.length > 0) ? t.thumbnails : data.thumbnails,
      artist: t.artist || (t.artists ? t.artists.map(a => a.name).join(', ') : author)
    }));

    view.innerHTML = `
      <div class="detail-header">
        <div class="detail-art" style="overflow: hidden; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          ${UI.renderPlaylistArt(enrichedTracks)}
        </div>
        <div class="detail-meta">
          <div class="detail-type">Playlist</div>
          <h1 class="detail-title">${data.title}</h1>
          <div class="detail-info">
            <span>${enrichedTracks.length} tracks</span>
            <span style="opacity:0.5">•</span>
            <span>By ${author}</span>
          </div>
          <div style="margin-top: 24px; display: flex; gap: 12px;">
            <button class="play-btn-large" id="btn-playlist-play" style="width: auto; padding: 0 32px; border-radius: 30px;">
              <i data-lucide="play" fill="currentColor" style="width: 24px; margin-left: 4px;"></i>
              Play
            </button>
            ${isLocal ? `
              <button class="icon-btn" id="btn-delete-playlist" style="width: 56px; height: 56px; background: var(--surface); color: #ff4444;">
                <i data-lucide="trash-2"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="tracklist">
        <div class="tracklist-header" style="display: flex; padding: 12px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 12px; font-weight: 700; text-transform: uppercase;">
          <div style="width: 40px;">#</div>
          <div style="flex: 2;">Title</div>
          <div style="flex: 1;">Album</div>
          <div style="width: 100px; text-align: right;"><i data-lucide="clock" style="width: 16px;"></i></div>
        </div>
        ${enrichedTracks.map((t, idx) => {
          const trackThumb = UI.getThumbnail(t);
          const isFav = State.get().favorites.some(f => (f.videoId || f.id) === (t.videoId || t.id));

          return `
            <div class="track-row playlist-track-row" data-idx="${idx}" style="display: flex; align-items: center; padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s;">
              <div class="track-num" style="width: 40px; color: var(--text-muted);">${idx + 1}</div>
              <div class="track-main" style="flex: 2; display: flex; align-items: center; gap: 12px;">
                <img src="${trackThumb}" style="width: 48px; height: 48px; border-radius: 4px; object-fit: cover;" />
                <div>
                  <div class="track-title" style="font-weight: 600;">${t.title}</div>
                  <div class="track-artist" style="font-size: 13px; color: var(--text-muted);">${t.artist}</div>
                </div>
              </div>
              <div class="track-album" style="flex: 1; color: var(--text-muted); font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 16px;">${t.album ? (t.album.name || t.album) : ''}</div>
              <div style="display: flex; align-items: center; gap: 16px; margin-right: 24px;">
                <button class="icon-btn row-favorite" data-idx="${idx}" title="Favorite" style="color: ${isFav ? 'var(--accent)' : 'var(--text-dim)'};">
                  <i data-lucide="heart" ${isFav ? 'fill="currentColor"' : ''} style="width: 18px;"></i>
                </button>
                <div class="icon-btn row-action" data-action="${isLocal ? 'remove' : 'add'}" data-idx="${idx}" title="${isLocal ? 'Remove from Playlist' : 'Add to Playlist'}">
                  <i data-lucide="${isLocal ? 'minus' : 'plus'}" style="width: 20px;"></i>
                </div>
              </div>
              <div class="track-duration" style="width: 60px; text-align: right; color: var(--text-muted); font-size: 14px;">${t.duration || ''}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Listeners
    document.getElementById('btn-playlist-play').onclick = () => {
      if (enrichedTracks.length > 0) {
        Playback.play(enrichedTracks[0], enrichedTracks);
      }
    };

    if (isLocal) {
      document.getElementById('btn-delete-playlist').onclick = () => {
        if (confirm(`Delete playlist "${data.title}"?`)) {
          const { playlists } = State.get();
          State.set('playlists', playlists.filter(p => p.id !== data.id));
          window.location.hash = '#/library?tab=playlists';
        }
      };
    }

    view.querySelectorAll('.playlist-track-row').forEach(el => {
      el.onclick = (e) => {
        if (e.target.closest('.row-action') || e.target.closest('.row-favorite')) return;
        const idx = parseInt(el.dataset.idx);
        Playback.play(enrichedTracks[idx], enrichedTracks);
      };
    });

    view.querySelectorAll('.row-favorite').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(el.dataset.idx);
        const track = enrichedTracks[idx];
        const { favorites } = State.get();
        const trackId = track.videoId || track.id;
        const isFav = favorites.some(f => (f.videoId || f.id) === trackId);
        
        if (isFav) {
          State.set('favorites', favorites.filter(f => (f.videoId || f.id) !== trackId));
        } else {
          State.set('favorites', [...favorites, track]);
        }
        
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

    view.querySelectorAll('.row-action').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const action = el.dataset.action;
        const idx = parseInt(el.dataset.idx);
        const track = enrichedTracks[idx];

        if (action === 'add') {
          UI.showPlaylistPicker(track);
        } else if (action === 'remove') {
          const { playlists } = State.get();
          const updated = playlists.map(p => {
            if (p.id === data.id) {
              return { ...p, tracks: p.tracks.filter((_, i) => i !== idx) };
            }
            return p;
          });
          State.set('playlists', updated);
          mount(new URLSearchParams(`?id=${data.id}`)); // Re-mount
        }
      };
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  return { mount };
})();
