/* ============================================================
   AUDIZY — app.js
   Powers Home view: hero search redirect, trending (dummy data),
   recently played (from localStorage), recent search chips.
   ============================================================ */

const TRENDING_DUMMY = [
  { videoId: 'dummy-1', title: 'Midnight Static', channel: 'Nova Field', thumbnail: '' },
  { videoId: 'dummy-2', title: 'Glasswave', channel: 'Kilo Tide', thumbnail: '' },
  { videoId: 'dummy-3', title: 'Paper Cities', channel: 'Aro Bloom', thumbnail: '' },
  { videoId: 'dummy-4', title: 'Velvet Static', channel: 'Drift Theory', thumbnail: '' },
  { videoId: 'dummy-5', title: 'Low Orbit', channel: 'Halcyon Days', thumbnail: '' },
  { videoId: 'dummy-6', title: 'Afterglow Room', channel: 'Sundown Set', thumbnail: '' },
  { videoId: 'dummy-7', title: 'Echo Parade', channel: 'North Static', thumbnail: '' },
  { videoId: 'dummy-8', title: 'Saltwater Loop', channel: 'Mile Marker', thumbnail: '' },
];

const Home = (() => {
  function init() {
    wireHeroSearch();
    renderTrending();
    renderRecentlyPlayed();
    renderRecentSearchChips();
    Animations.buildWaveBars(document.querySelector('.hero-wave'), 26);
  }

  function wireHeroSearch() {
    const form = document.querySelector('.hero-search');
    const input = form?.querySelector('input');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      goToSearch(input.value);
    });
  }

  function goToSearch(query) {
    const q = query.trim();
    if (!q) return;
    Storage.addRecentSearch(q);
    Router.navigate(`#search?q=${encodeURIComponent(q)}`);
  }

  function renderTrending() {
    const grid = document.querySelector('.trending-grid');
    if (!grid) return;
    grid.innerHTML = '';
    TRENDING_DUMMY.forEach((track) => grid.appendChild(UI.renderSongCard(track)));
    UI.staggerReveal(grid, 40);
  }

  function renderRecentlyPlayed() {
    const grid = document.querySelector('.recent-grid');
    const section = document.querySelector('.recent-played-section');
    if (!grid || !section) return;
    const recents = Storage.getRecentlyPlayed();
    if (!recents.length) {
      section.classList.add('hidden-section');
      return;
    }
    section.classList.remove('hidden-section');
    grid.innerHTML = '';
    recents.slice(0, 8).forEach((track) => grid.appendChild(UI.renderSongCard(track)));
    UI.staggerReveal(grid, 40);
  }

  function renderRecentSearchChips() {
    const row = document.querySelector('.recent-search-chips');
    const section = document.querySelector('.recent-search-section');
    if (!row || !section) return;
    const recents = Storage.getRecentSearches();
    if (!recents.length) {
      section.classList.add('hidden-section');
      return;
    }
    section.classList.remove('hidden-section');
    row.innerHTML = '';
    recents.forEach((q) => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = q;
      chip.addEventListener('click', () => goToSearch(q));
      row.appendChild(chip);
    });
  }

  return { init, goToSearch };
})();

// Backward compatibility alias for any existing code expecting App
const App = Home;
