/* ============================================================
   AUDIZY — search.js
   Powers Search view: debounced live search hitting /api/search,
   recent searches chips, shimmer states.
   ============================================================ */

const Search = (() => {
  let resultsEl, input, recentEl;
  let lastQuery = '';

  function init(queryParams = {}) {
    input = document.querySelector('.search-page-input');
    resultsEl = document.querySelector('.search-results');
    recentEl = document.querySelector('.recent-searches');
    if (!input || !resultsEl) return;

    lastQuery = '';
    const initialQuery = queryParams.q || new URLSearchParams(location.search).get('q') || '';

    renderRecentSearches();

    input.addEventListener('input', debounce((e) => runSearch(e.target.value), 400));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runSearch(input.value, true);
    });

    if (initialQuery) {
      input.value = initialQuery;
      runSearch(initialQuery, true);
    } else {
      UI.renderEmptyState(resultsEl, {
        icon: Icons.search,
        title: 'Search for something to play',
        desc: 'Try an artist, a song title, or a vibe — results stream in instantly.',
      });
    }
  }

  async function runSearch(query, commit = false) {
    const q = query.trim();
    if (!q) {
      UI.renderEmptyState(resultsEl, {
        icon: Icons.search,
        title: 'Search for something to play',
        desc: 'Try an artist, a song title, or a vibe — results stream in instantly.',
      });
      return;
    }
    if (q === lastQuery && !commit) return;
    lastQuery = q;

    resultsEl.innerHTML = '';
    resultsEl.appendChild(UI.renderShimmerRows(6));

    try {
      const data = await API.search(q);
      if (q !== lastQuery && !commit) return; // stale response guard

      resultsEl.innerHTML = '';
      if (!data.results?.length) {
        UI.renderEmptyState(resultsEl, {
          icon: Icons.note,
          title: 'No results found',
          desc: `Nothing matched "${q}". Try a different spelling or artist name.`,
        });
        return;
      }

      const list = document.createElement('div');
      list.className = 'result-list';
      data.results.forEach((track) => list.appendChild(UI.renderResultRow(track)));
      resultsEl.appendChild(list);
      UI.staggerReveal(list, 30);

      if (commit) {
        Storage.addRecentSearch(q);
        renderRecentSearches();
        history.replaceState(null, '', `#search?q=${encodeURIComponent(q)}`);
      }
    } catch (err) {
      console.error(err);
      resultsEl.innerHTML = '';
      UI.renderEmptyState(resultsEl, {
        icon: Icons.note,
        title: 'Something went wrong',
        desc: 'We could not reach the search service. Please try again.',
      });
    }
  }

  function renderRecentSearches() {
    if (!recentEl) return;
    const recents = Storage.getRecentSearches();
    if (!recents.length) {
      recentEl.innerHTML = '';
      recentEl.parentElement?.classList.add('hidden-section');
      return;
    }
    recentEl.parentElement?.classList.remove('hidden-section');
    recentEl.innerHTML = '';
    recents.forEach((q) => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = q;
      chip.addEventListener('click', () => {
        input.value = q;
        runSearch(q, true);
      });
      recentEl.appendChild(chip);
    });
  }

  return { init, runSearch };
})();
