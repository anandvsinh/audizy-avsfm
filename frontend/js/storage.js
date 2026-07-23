/* ============================================================
   AUDIZY — storage.js
   localStorage-backed persistence: favorites, recently played,
   recent searches. All data is namespaced under "audizy:".
   ============================================================ */

const Storage = (() => {
  const KEYS = {
    favorites: 'audizy:favorites',
    recentlyPlayed: 'audizy:recentlyPlayed',
    recentSearches: 'audizy:recentSearches',
    lastSession: 'audizy:lastSession',
  };

  const LIMITS = {
    recentlyPlayed: 24,
    recentSearches: 8,
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable / quota exceeded — fail silently */
    }
  }

  /* ---------------- Favorites ---------------- */
  function getFavorites() {
    return read(KEYS.favorites, []);
  }
  function isFavorite(videoId) {
    return getFavorites().some((t) => t.videoId === videoId);
  }
  function toggleFavorite(track) {
    const favs = getFavorites();
    const idx = favs.findIndex((t) => t.videoId === track.videoId);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.unshift(track);
    }
    write(KEYS.favorites, favs);
    return idx < 0; // true if just added
  }

  /* ---------------- Recently played ---------------- */
  function getRecentlyPlayed() {
    return read(KEYS.recentlyPlayed, []);
  }
  function addRecentlyPlayed(track) {
    let list = getRecentlyPlayed().filter((t) => t.videoId !== track.videoId);
    list.unshift({ ...track, playedAt: Date.now() });
    list = list.slice(0, LIMITS.recentlyPlayed);
    write(KEYS.recentlyPlayed, list);
  }

  /* ---------------- Recent searches ---------------- */
  function getRecentSearches() {
    return read(KEYS.recentSearches, []);
  }
  function addRecentSearch(query) {
    const q = query.trim();
    if (!q) return;
    let list = getRecentSearches().filter((s) => s.toLowerCase() !== q.toLowerCase());
    list.unshift(q);
    list = list.slice(0, LIMITS.recentSearches);
    write(KEYS.recentSearches, list);
  }
  function clearRecentSearches() {
    write(KEYS.recentSearches, []);
  }

  /* ---------------- Session continuity (for multi-page nav) ---------------- */
  function saveSession(state) {
    write(KEYS.lastSession, state);
  }
  function loadSession() {
    return read(KEYS.lastSession, null);
  }

  return {
    getFavorites,
    isFavorite,
    toggleFavorite,
    getRecentlyPlayed,
    addRecentlyPlayed,
    getRecentSearches,
    addRecentSearch,
    clearRecentSearches,
    saveSession,
    loadSession,
  };
})();
