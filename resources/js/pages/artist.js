// artist.js — FeatherMusic Artist Page

const ArtistPage = (() => {
  async function mount(params) {
    const id = params.get('id');
    const view = document.getElementById('view');
    UI.renderSkeleton(view);
    
    try {
      const data = await API.getArtist(id);
      // Guard: Only render if we are still on the Artist page
      if (Router.currentPath !== '/artist') return;
      
      render(view, data);
    } catch (err) {
      if (Router.currentPath !== '/artist') return;
      view.innerHTML = `<div class="error">Failed to load artist. ${err.message}</div>`;
    }
  }

  function render(view, data) {
    const thumb = (data.thumbnails && data.thumbnails.length > 0) ? data.thumbnails[data.thumbnails.length - 1].url : 'icons/app.png';
    
    view.innerHTML = `
      <div class="artist-hero" style="background-image: url('${thumb}');">
        <div class="artist-hero-content">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #3b82f6;">
            <i data-lucide="badge-check" style="width: 20px;"></i>
            Verified Artist
          </div>
          <h1 style="font-size: 96px; font-weight: 800; margin-bottom: 24px; line-height: 1; letter-spacing: -0.04em;">${data.name}</h1>
          <div style="font-size: 16px; font-weight: 600; color: white;">${data.subscribers || 'Popular'} monthly listeners</div>
        </div>
      </div>

      <div class="artist-content" style="padding-top: 32px;">
        <div style="display: flex; align-items: center; gap: 32px; margin-bottom: 48px;">
          <button class="play-btn-large">
            <i data-lucide="play" fill="currentColor" style="width: 24px; margin-left: 4px;"></i>
          </button>
          <button style="background: transparent; border: 1px solid var(--border); color: white; padding: 12px 32px; border-radius: 4px; font-weight: 700; cursor: pointer; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em;">Follow</button>
          <i data-lucide="more-horizontal" style="color: var(--text-dim); cursor: pointer; width: 32px; height: 32px;"></i>
        </div>

        <section style="margin-bottom: 64px;">
          <h2 class="section-title" style="margin-bottom: 32px;">Popular</h2>
          <div class="tracklist">
            ${(data.songs?.results || []).slice(0, 5).map((s, idx) => `
              <div class="track-row" data-id="${s.videoId}">
                <div class="track-num">${idx + 1}</div>
                <div class="track-main">
                  <img src="${(s.thumbnails && s.thumbnails.length > 0) ? s.thumbnails[0].url : 'icons/app.png'}" style="width: 40px; height: 40px; border-radius: 4px;" />
                  <div class="track-title">${s.title}</div>
                </div>
                <div class="track-duration">${s.duration || ''}</div>
              </div>
            `).join('')}
          </div>
        </section>

        <section>
          <div class="section-header">
            <h2 class="section-title">Albums</h2>
            <span class="show-all">See All</span>
          </div>
          <div class="standard-grid">
            ${(data.albums?.results || []).map(a => `
              <div class="standard-card album-card" data-id="${a.browseId}">
                <div class="card-art-container">
                  <img class="card-art" src="${(a.thumbnails && a.thumbnails.length > 0) ? a.thumbnails[a.thumbnails.length-1].url : 'icons/app.png'}" />
                  <div class="play-btn-overlay">
                    <i data-lucide="play" fill="currentColor" style="width: 24px; margin-left: 4px;"></i>
                  </div>
                </div>
                <div class="card-title">${a.title}</div>
                <div class="card-subtitle">${a.year || 'Album'}</div>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;

    view.querySelector('.play-btn-large').onclick = () => {
      const songs = data.songs?.results || [];
      if (songs.length > 0) {
        Playback.setQueue(songs);
        Playback.play(songs[0]);
      }
    };

    view.querySelectorAll('.track-row').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.id;
        const songs = data.songs?.results || [];
        const track = songs.find(s => s.videoId === id);
        if (track) {
          Playback.setQueue(songs);
          Playback.play(track);
        }
      };
    });

    view.querySelectorAll('.album-card').forEach(el => {
      el.onclick = () => {
        window.location.hash = `#/album?id=${el.dataset.id}`;
      };
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  return { mount };
})();
