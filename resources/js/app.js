// app.js — Router & App Root

const ROUTES = {
  '/': HomePage,
  '/search': SearchPage,
  '/album': AlbumPage,
  '/artist': ArtistPage,
  '/playlist': PlaylistPage,
  '/library': LibraryPage,
  '/about': AboutPage,
  '/privacy': PrivacyPage,
  '/legal': LegalPage,
};

let _currentView = null;
const Router = {
  get currentPath() {
    return (window.location.hash.replace(/^#/, '') || '/').split('?')[0];
  }
};

function parseHash() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const [path, qs] = hash.split('?');
  const params = new URLSearchParams(qs);
  return { path, params };
}

async function navigate() {
  const { path, params } = parseHash();
  const Page = ROUTES[path] || HomePage;

  const view = document.getElementById('view');
  
  // Reset scroll position to top
  view.scrollTop = 0;

  view.classList.remove('fade-in');
  void view.offsetWidth; // Trigger reflow
  view.classList.add('fade-in');

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('href') === `#${path}`);
  });

  if (Page.mount) {
    await Page.mount(params);
  }
}

async function init() {
  console.log('App starting...');
  try {
    Neutralino.init();
    console.log('Neutralino initialized');

    // Start Backend Executable
    console.log('Starting ytapi Backend...');
    let ext = NL_OS === 'Windows' ? '.exe' : '';
    Neutralino.os.execCommand(`"${NL_PATH}/ytapi${ext}"`, { background: true })
      .then(res => console.log('Backend process info:', res))
      .catch(err => console.error('Failed to start backend:', err));
    
    // Give it a moment to boot
    await new Promise(r => setTimeout(r, 2000));
    
    // Init Services
    await State.init();
    API.init();
    Playback.init();
    console.log('Services initialized');

    // Force Taskbar Icon Update
    if (typeof Neutralino !== 'undefined') {
      try {
        await Neutralino.window.setIcon('/resources/icons/app.png');
        console.log('Taskbar icon updated');
      } catch (e) {
        console.error('Failed to set taskbar icon:', e);
      }
    }

    // Lucide Icons (Initial)
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
      console.log('Icons created');
    }

    // Global State Listeners
    State.subscribe((state) => {
      UI.updateSidebar();
      const playBtn = document.getElementById('btn-play-pause');
      if (playBtn && typeof lucide !== 'undefined') {
        const icon = state.isPlaying ? 'pause' : 'play';
        playBtn.innerHTML = `<i data-lucide="${icon}" fill="currentColor" style="width: 18px; ${icon === 'play' ? 'margin-left: 2px;' : ''}"></i>`;
        lucide.createIcons();
      }
    });

    // Global Search
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = searchInput.value.trim();
          if (q) window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
        }
      });
    }

    // Router
    window.addEventListener('hashchange', navigate);
    console.log('Navigating to initial route...');
    await navigate();
    console.log('Initial navigation complete');

  } catch (err) {
    console.error('Init Error:', err);
    const boundary = document.getElementById('error-boundary');
    if (boundary) {
      boundary.style.display = 'block';
      boundary.textContent = `Init Error: ${err.message}`;
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
