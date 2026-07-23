/* ============================================================
   AUDIZY — router.js
   Lightweight Vanilla JS History API Router & View Ingestion System.
   Handles dynamic fetching of HTML fragments from views/*.html,
   injecting into #app-content, updating history state, and running
   isolated page initializers.
   ============================================================ */

const Router = (() => {
  const ROUTES = {
    'home': { view: 'views/home.html', title: 'Audizy — Stream what moves you', init: () => Home.init() },
    'search': { view: 'views/search.html', title: 'Search — Audizy', init: (params) => Search.init(params) },
    'favorites': { view: 'views/favorites.html', title: 'Favorites — Audizy', init: () => Favorites.init() },
    'recently-played': { view: 'views/recently-played.html', title: 'Recently Played — Audizy', init: () => RecentlyPlayed.init() },
    'radio': { view: 'views/radio.html', title: 'Live Radio — Audizy', init: () => Radio.init() },
    'settings': { view: 'views/settings.html', title: 'Settings — Audizy', init: () => Settings.init() },
  };

  const viewCache = {};
  let currentRouteKey = null;

  function init() {
    wireLinkInterception();
    wireTopbarSearch();
    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange();
  }

  function parseLocation() {
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    // Check hash-based routing fallback (e.g. #search?q=...)
    let pathString = path;
    if (hash && hash.length > 1) {
      pathString = hash.substring(1);
    }

    const cleanPath = pathString.split('?')[0].split('#')[0].replace(/^\/+/, '');
    const searchStr = search || (pathString.includes('?') ? '?' + pathString.split('?')[1] : '');

    let routeKey = 'home';
    if (cleanPath && cleanPath !== 'index.html' && cleanPath !== 'index') {
      routeKey = cleanPath.replace('.html', '');
    }

    if (!ROUTES[routeKey]) {
      routeKey = 'home';
    }

    const params = {};
    const urlParams = new URLSearchParams(searchStr);
    urlParams.forEach((val, key) => { params[key] = val; });

    return { routeKey, params };
  }

  async function handleLocationChange() {
    const { routeKey, params } = parseLocation();
    await loadRoute(routeKey, params);
  }

  async function navigate(url, replace = false) {
    if (replace) {
      history.replaceState(null, '', url);
    } else {
      history.pushState(null, '', url);
    }
    await handleLocationChange();
  }

  async function loadRoute(routeKey, params = {}) {
    const route = ROUTES[routeKey];
    if (!route) return;

    const appContent = document.getElementById('app-content');
    if (!appContent) return;

    currentRouteKey = routeKey;

    try {
      let html = viewCache[routeKey];
      if (!html) {
        const res = await fetch(route.view);
        if (!res.ok) throw new Error(`Failed to load view fragment ${route.view}`);
        html = await res.text();
        viewCache[routeKey] = html;
      }

      appContent.innerHTML = html;
      document.title = route.title;
      document.body.dataset.page = routeKey;

      UI.setActiveNav(routeKey);

      if (typeof route.init === 'function') {
        route.init(params);
      }

      // Scroll to top of content
      window.scrollTo(0, 0);

    } catch (err) {
      console.error(`[Router] View load failed for route "${routeKey}":`, err);
      appContent.innerHTML = `
        <div class="placeholder-page fade-in">
          <h2>Could not load page</h2>
          <p>Please check your connection or try navigating again.</p>
        </div>
      `;
    }
  }

  function wireLinkInterception() {
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//') || href.startsWith('javascript:')) {
        return;
      }

      // Check if link target is internal SPA route
      const cleanHref = href.split('?')[0].split('#')[0];
      const validTargets = ['#index', '#search', '#favorites', '#recently-played', '#radio', '#settings', '', '/'];

      if (validTargets.includes(cleanHref) || cleanHref.endsWith('.html')) {
        e.preventDefault();
        navigate(href);
      }
    });
  }

  function wireTopbarSearch() {
    const input = document.querySelector('.topbar-search input');
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        if (val) {
          Storage.addRecentSearch(val);
          navigate(`#search?q=${encodeURIComponent(val)}`);
        }
      }
    });
  }

  function getCurrentRoute() {
    return currentRouteKey;
  }

  return {
    init,
    navigate,
    loadRoute,
    getCurrentRoute,
  };
})();
