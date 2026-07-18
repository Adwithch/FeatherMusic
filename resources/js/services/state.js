// state.js — Global App State

const State = (() => {
  const _state = {
    currentTrack: null,
    queue: [],
    originalQueue: [],
    history: [],
    favorites: [],
    playlists: [],
    isPlaying: false,
    shuffle: false,
    repeat: 'off',
    volume: 80,
    theme: 'dark'
  };

  const _listeners = new Set();

  async function init() {
    try {
      const data = await Neutralino.storage.getData('feathermusic_state');
      if (data) {
        const saved = JSON.parse(data);
        // Deep merge or specific keys
        _state.history = saved.history || [];
        _state.favorites = saved.favorites || [];
        _state.playlists = saved.playlists || [];
        _state.volume = saved.volume || 80;
        console.log('State: Persistence loaded');
      }
    } catch (e) {
      console.warn('State: No saved data found or storage error');
    }
  }

  async function save() {
    try {
      const toSave = {
        history: _state.history,
        favorites: _state.favorites,
        playlists: _state.playlists,
        volume: _state.volume
      };
      await Neutralino.storage.setData('feathermusic_state', JSON.stringify(toSave));
    } catch (e) {
      console.error('State: Save failed', e);
    }
  }

  function subscribe(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }

  function notify() {
    _listeners.forEach(fn => fn({ ..._state }));
    save(); // Save on every change
  }

  return {
    init,
    get: () => ({ ..._state }),
    set: (key, value) => {
      _state[key] = value;
      notify();
    },
    update: (patch) => {
      Object.assign(_state, patch);
      notify();
    },
    subscribe
  };
})();
