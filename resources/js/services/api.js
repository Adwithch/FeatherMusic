// api.js — Local HTTP Bridge Service

const API = (() => {
  const BASE_URL = 'http://127.0.0.1:9876';

  async function init() {
    console.log('API Service: Checking backend connectivity...');
    let connected = false;
    for (let i = 0; i < 5; i++) {
      try {
        await fetch(BASE_URL + '/home');
        connected = true;
        console.log('API Service: Backend connected!');
        break;
      } catch (e) {
        console.warn(`API Service: Backend not ready yet (attempt ${i+1}/5)...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    if (!connected) console.error('API Service: Could not connect to Python backend.');
  }

  async function call(endpoint, params = {}) {
    const url = new URL(BASE_URL + endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    
    console.log(`API Call: ${url}`);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      console.log(`API Response for ${endpoint}:`, data);
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      console.error(`API Call failed for ${endpoint}:`, err);
      throw err;
    }
  }

  return {
    init,
    getHome: () => call('/home'),
    search: (q) => call('/search', { q }),
    getTrackInfo: (id) => call('/track', { id }),
    getAlbum: (id) => call('/album', { id }),
    getArtist: (id) => call('/artist', { id }),
    getPlaylist: (id) => call('/playlist', { id }),
    getRelated: (id) => call('/related', { id }),
    getLyrics: (artist, title, duration) => call('/lyrics', { artist, title, duration })
  };
})();
