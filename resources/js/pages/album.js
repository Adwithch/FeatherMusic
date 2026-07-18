// album.js — FeatherMusic Album Page

const AlbumPage = (() => {
  async function mount(params) {
    const id = params.get('id');
    const view = document.getElementById('view');
    UI.renderSkeleton(view);
    
    try {
      const data = await API.getAlbum(id);
      // Guard: Only render if we are still on the Album page
      if (Router.currentPath !== '/album') return;
      
      render(view, data);
    } catch (err) {
      if (Router.currentPath !== '/album') return;
      view.innerHTML = `<div class="error">Failed to load album. ${err.message}</div>`;
    }
  }

  function render(view, data) {
    const thumb = (data.thumbnails && data.thumbnails.length > 0) ? data.thumbnails[data.thumbnails.length - 1].url : 'icons/app.png';
    const artist = data.artists ? data.artists.map(a => a.name).join(', ') : 'Unknown Artist';
    
    // Enrich tracks with album metadata if missing
    const enrichedTracks = (data.tracks || []).map(t => ({
      ...t,
      thumbnails: (t.thumbnails && t.thumbnails.length > 0) ? t.thumbnails : data.thumbnails,
      artist: t.artist || (t.artists ? t.artists.map(a => a.name).join(', ') : artist),
      album: data.title
    }));

    view.innerHTML = `
      <div class="detail-header">
        <img src="${thumb}" class="detail-art" />
        <div class="detail-meta">
          <div class="detail-type">Album</div>
          <h1 class="detail-title">${data.title}</h1>
          <div class="detail-info">
            <span style="color: var(--text);">${artist}</span>
            <span style="color: var(--text-muted);">•</span>
            <span style="color: var(--text-muted);">${data.year || ''}</span>
            <span style="color: var(--text-muted);">•</span>
            <span style="color: var(--text-muted);">${data.trackCount} songs</span>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 32px; display: flex; align-items: center; gap: 24px;">
        <button class="play-btn-large">
          <i data-lucide="play" fill="currentColor" style="width: 24px; margin-left: 4px;"></i>
        </button>
        <i data-lucide="heart" style="color: var(--text-dim); cursor: pointer; width: 32px; height: 32px;"></i>
        <i data-lucide="more-horizontal" style="color: var(--text-dim); cursor: pointer; width: 32px; height: 32px;"></i>
      </div>

      <div class="tracklist">
        <div class="tracklist-header" style="display: flex; padding: 12px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 12px; font-weight: 700; text-transform: uppercase;">
          <div style="width: 40px;">#</div>
          <div style="flex: 1;">Title</div>
          <div style="width: 100px; text-align: right;"><i data-lucide="clock" style="width: 14px;"></i></div>
        </div>
        ${enrichedTracks.map((t, idx) => {
          const isFav = State.get().favorites.some(f => (f.videoId || f.id) === (t.videoId || t.id));
          return `
            <div class="track-row album-track-row" data-idx="${idx}" style="display: flex; align-items: center; padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s;">
              <div class="track-num" style="width: 40px; color: var(--text-muted);">${idx + 1}</div>
              <div class="track-main" style="flex: 1; display: flex; align-items: center; gap: 12px;">
                <div>
                  <div class="track-title" style="font-weight: 600;">${t.title}</div>
                  <div class="track-artist" style="font-size: 13px; color: var(--text-muted);">${t.artist}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 16px; margin-right: 24px;">
                <button class="icon-btn row-favorite" data-idx="${idx}" title="Favorite" style="color: ${isFav ? 'var(--accent)' : 'var(--text-dim)'};">
                  <i data-lucide="heart" ${isFav ? 'fill="currentColor"' : ''} style="width: 18px;"></i>
                </button>
                <button class="icon-btn row-add" data-idx="${idx}" title="Add to Playlist">
                  <i data-lucide="plus" style="width: 20px;"></i>
                </button>
              </div>
              <div class="track-duration" style="width: 60px; text-align: right; color: var(--text-muted); font-size: 14px;">${t.duration || ''}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    view.querySelector('.play-btn-large').onclick = () => {
      if (enrichedTracks.length > 0) {
        Playback.play(enrichedTracks[0], enrichedTracks);
      }
    };

    view.querySelectorAll('.album-track-row').forEach(el => {
      el.onclick = (e) => {
        if (e.target.closest('.row-add') || e.target.closest('.row-favorite')) return;
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

    view.querySelectorAll('.row-add').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(el.dataset.idx);
        UI.showPlaylistPicker(enrichedTracks[idx]);
      };
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  return { mount };
})();
