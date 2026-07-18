// home.js — FeatherMusic Home Page

const HomePage = (() => {
  async function mount() {
    const view = document.getElementById('view');
    renderSkeleton(view);
    
    try {
      const data = await API.getHome();
      // Guard: Only render if we are still on the Home page
      if (Router.currentPath !== '/') return;
      
      render(view, data);
    } catch (err) {
      if (Router.currentPath !== '/') return;
      view.innerHTML = `<div class="error">Failed to load home. ${err.message}</div>`;
    }
  }

  function renderSkeleton(view) {
    view.innerHTML = `
      <h1 class="section-title loading-pulse" style="width: 200px; height: 32px; border-radius: 4px; margin-bottom: 24px;"></h1>
      <div class="hero-grid">
        ${Array(6).fill('<div class="hero-card loading-pulse" style="height: 80px;"></div>').join('')}
      </div>
      <div class="section-header" style="margin-top: 48px;">
        <div class="loading-pulse" style="width: 150px; height: 28px; border-radius: 4px;"></div>
      </div>
      <div class="standard-grid">
        ${Array(4).fill('<div class="standard-card loading-pulse" style="height: 260px;"></div>').join('')}
      </div>
    `;
  }

  function render(view, data) {
    console.log('Rendering FeatherMusic Home:', data);
    
    const trending = (data.songs?.items || data.trending?.items || []).filter(i => i.videoId || i.id);
    const releases = (data.albums?.items || []).filter(i => i.browseId || i.id);
    const { history } = State.get();

    const hour = new Date().getHours();
    let greeting = "Good morning";
    if (hour >= 12) greeting = "Good afternoon";
    if (hour >= 18) greeting = "Good evening";

    view.innerHTML = `
      <h1 class="section-title" style="margin-bottom: 24px;">${greeting}</h1>
      
      <div class="hero-grid">
        ${trending.slice(0, 6).map(s => renderHeroCard(s)).join('')}
      </div>

      <div class="section-header" style="margin-top: 48px;">
        <h2 class="section-title" style="font-size: 20px;">Made for you</h2>
        <span class="show-all" data-type="trending">Show All</span>
      </div>

      <div class="standard-grid">
        ${releases.slice(0, 8).map(a => renderStandardCard(a)).join('')}
      </div>

      ${history.length > 0 ? `
        <div class="section-header" style="margin-top: 48px;">
          <h2 class="section-title" style="font-size: 20px;">Recently Played</h2>
          <span class="show-all" data-type="history">Show All</span>
        </div>
        <div class="standard-grid">
          ${history.slice(0, 8).map(s => renderStandardCard(s)).join('')}
        </div>
      ` : ''}
    `;

    // Listeners
    view.querySelectorAll('.hero-card, .standard-card').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.id;
        const track = [...trending, ...releases, ...history].find(item => (item.videoId || item.id || item.browseId) === id);
        
        if (track) {
          if (track.videoId || track.id) {
            Playback.play(track);
          } else if (track.browseId) {
            window.location.hash = `#/album?id=${id}`;
          }
        }
      };
    });

    view.querySelectorAll('.show-all').forEach(el => {
      el.onclick = () => {
        const type = el.dataset.type;
        if (type === 'trending') {
          window.location.hash = `#/search?q=Trending`;
        } else if (type === 'history') {
          window.location.hash = `#/library?tab=history`;
        }
      };
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderHeroCard(s) {
    const thumb = (s.thumbnails && s.thumbnails.length > 0) ? s.thumbnails[s.thumbnails.length - 1].url : 'icons/app.png';
    return `
      <div class="hero-card" data-id="${s.videoId || s.id}">
        <img class="hero-img" src="${thumb}" />
        <span class="hero-title">${s.title}</span>
      </div>
    `;
  }

  function renderStandardCard(item) {
    const thumb = (item.thumbnails && item.thumbnails.length > 0) ? item.thumbnails[item.thumbnails.length - 1].url : 'icons/app.png';
    const artist = item.artists ? item.artists.map(a => a.name).join(', ') : (item.artist || 'Various Artists');
    return `
      <div class="standard-card" data-id="${item.videoId || item.id || item.browseId}">
        <div class="card-art-container">
          <img class="card-art" src="${thumb}" loading="lazy" />
          <div class="play-btn-overlay">
            <i data-lucide="play" fill="currentColor" style="width: 24px; margin-left: 4px;"></i>
          </div>
        </div>
        <div class="card-title">${item.title}</div>
        <div class="card-subtitle">${artist}</div>
      </div>
    `;
  }

  return { mount };
})();
