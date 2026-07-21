/* ============================================================
   AUDIZY — api.js
   Thin wrapper around the Express backend endpoints.
   ============================================================ */

const API = (() => {
  // Same-origin by default. Change if the frontend is hosted separately
  // from the Express backend.
  const BASE_URL = 'http://localhost:3000';

  /**
   * GET /api/search?q=<query>
   * Returns { query, results: [{ videoId, title, channel, thumbnail }] }
   */
  async function search(query) {
    const url = `${BASE_URL}/api/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    return res.json();
  }

  /**
   * GET /api/stream?id=<videoId>
   * Returns { success, streamUrl }
   */
  async function getStreamUrl(videoId) {
    const url = `${BASE_URL}/api/stream?id=${encodeURIComponent(videoId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Stream lookup failed (${res.status})`);
    const data = await res.json();
    if (!data.success || !data.streamUrl) throw new Error('No stream URL returned');
    return data.streamUrl;
  }

  return { search, getStreamUrl };
})();

/**
 * Generic debounce helper, used by search.js (400ms per spec).
 */
function debounce(fn, delay = 400) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
