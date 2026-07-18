// library.js — Library & Collections Page

const LibraryPage = (() => {
  let _currentTab = 'favorites';

  async function mount(params) {
    const view = document.getElementById('view');
    _currentTab = params.get('tab') || 'favorites';
    render(view);
  }

  function render(view) {
    const { favorites, history, playlists } = State.get();
    let items = [];
    if (_currentTab === 'favorites') items = favorites;
    else if (_currentTab === 'history') items = history;
    else if (_currentTab === 'playlists') items = playlists;

    view.innerHTML = `
      <h1 class="section-title" style="margin-bottom: 24px;">Your Library</h1>

      <div class="tabs-container">
        <div class="tab-item ${_currentTab === 'favorites' ? 'active' : ''}" data-tab="favorites">Favorites</div>
        <div class="tab-item ${_currentTab === 'history' ? 'active' : ''}" data-tab="history">Recently Played</div>
        <div class="tab-item ${_currentTab === 'playlists' ? 'active' : ''}" data-tab="playlists">Playlists</div>
      </div>

      <div class="library-content">
        ${_currentTab === 'playlists' ? `
          <div style="margin-bottom: 24px; display: flex; justify-content: flex-end;">
            <button class="play-btn-large" id="btn-new-playlist" style="width: auto; padding: 0 24px; border-radius: 20px; font-size: 14px; height: 40px;">+ New Playlist</button>
          </div>
        ` : ''}

        ${items.length > 0 ? `
          <div class="standard-grid">
            ${items.map(item => _currentTab === 'playlists' ? renderPlaylistItem(item) : renderLibraryItem(item)).join('')}
          </div>
        ` : renderEmptyState()}
      </div>
    `;

    // Tab Listeners
    view.querySelectorAll('.tab-item').forEach(el => {
      el.onclick = () => {
        const tab = el.dataset.tab;
        window.location.hash = `#/library?tab=${tab}`;
      };
    });

    // Item Listeners
    view.querySelectorAll('.standard-card').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.id;
        if (_currentTab === 'playlists') {
           window.location.hash = `#/playlist?id=${id}`;
           return;
        }
        const track = items.find(i => (i.videoId || i.id) === id);
        if (track) Playback.play(track);
      };
    });

    const newBtn = document.getElementById('btn-new-playlist') || document.getElementById('btn-create-playlist');
    if (newBtn) {
      newBtn.onclick = () => {
        const name = prompt("Enter playlist name:");
        if (name) {
          const newPlaylist = {
            id: 'local-' + Date.now(),
            title: name,
            tracks: [],
            thumbnails: [{ url: 'icons/app.png' }]
          };
          State.set('playlists', [...playlists, newPlaylist]);
          render(view);
        }
      };
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderPlaylistItem(p) {
    return `
      <div class="standard-card" data-id="${p.id}">
        <div class="card-art-container">
          ${UI.renderPlaylistArt(p.tracks)}
          <div class="play-btn-overlay">
            <i data-lucide="play" fill="currentColor" style="width: 24px; margin-left: 4px;"></i>
          </div>
        </div>
        <div class="card-title">${p.title}</div>
        <div class="card-subtitle">${p.tracks?.length || 0} tracks</div>
      </div>
    `;
  }

  function renderLibraryItem(item) {
    const thumb = (item.thumbnails && item.thumbnails.length > 0) ? item.thumbnails[item.thumbnails.length - 1].url : 'icons/app.png';
    return `
      <div class="standard-card" data-id="${item.videoId || item.id}">
        <div class="card-art-container">
          <img class="card-art" src="${thumb}" />
          <div class="play-btn-overlay">
            <i data-lucide="play" fill="currentColor" style="width: 24px; margin-left: 4px;"></i>
          </div>
        </div>
        <div class="card-title">${item.title}</div>
        <div class="card-subtitle">${item.artist || 'Unknown Artist'}</div>
      </div>
    `;
  }

  function renderEmptyState() {
    let msg = "No favorites yet.";
    let icon = "heart";
    if (_currentTab === 'history') { msg = "Your listening history will appear here."; icon = "clock"; }
    if (_currentTab === 'playlists') { msg = "You haven't created any playlists."; icon = "list-music"; }

    return `
      <div class="empty-state">
        <i data-lucide="${icon}" style="width: 64px; height: 64px; color: var(--text-muted);"></i>
        <p>${msg}</p>
        ${_currentTab === 'playlists' ? '<button class="play-btn-large" id="btn-create-playlist" style="width: auto; padding: 0 24px; border-radius: 20px; font-size: 14px; height: 40px; margin-top: 12px;">Create Playlist</button>' : ''}
      </div>
    `;
  }

  return { mount };
})();
