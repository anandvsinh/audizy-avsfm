/* ============================================================
   AUDIZY — expanded-player.js
   Responsive Expanded Player overlay controller featuring FLIP
   shared element transition, event-driven state syncing while open,
   and generic tab system with static frontend-only queue UI.
   ============================================================ */

const ExpandedPlayer = (() => {
  let dom = {};
  let isOpen = false;
  let isSeeking = false;
  let activeTab = 'queue';

  // Static sample queue items for frontend UI presentation
  const STATIC_QUEUE_ITEMS = [
    { videoId: 'dummy-1', title: 'Midnight Static', channel: 'Nova Field', thumbnail: '' },
    { videoId: 'dummy-2', title: 'Glasswave', channel: 'Kilo Tide', thumbnail: '' },
    { videoId: 'dummy-3', title: 'Paper Cities', channel: 'Aro Bloom', thumbnail: '' },
    { videoId: 'dummy-4', title: 'Velvet Static', channel: 'Drift Theory', thumbnail: '' },
    { videoId: 'dummy-5', title: 'Low Orbit', channel: 'Halcyon Days', thumbnail: '' },
  ];

  // SVG Icons definitions for expanded player controls
  const ExpandedIcons = {
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 014-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 01-4 4H3"/></svg>',
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  };

  /* ---------------- Public API: init ---------------- */
  function init() {
    // 1. Cache DOM elements
    cacheDom();
    if (!dom.overlay) return;

    // 2. Bind event listeners
    wireEvents();
    wireTabSystem();

    // 3. Ensure overlay is hidden initially
    dom.overlay.classList.remove('is-open');

    // 4. Return without calling synchronization or rendering
  }

  function cacheDom() {
    dom = {
      overlay: document.getElementById('expanded-player'),
      bg: document.getElementById('expanded-bg'),
      closeBtn: document.getElementById('expanded-close-btn'),
      art: document.getElementById('expanded-art'),
      title: document.getElementById('expanded-title'),
      artist: document.getElementById('expanded-artist'),
      timeCurrent: document.getElementById('expanded-time-current'),
      timeDuration: document.getElementById('expanded-time-duration'),
      seekInput: document.getElementById('expanded-seek-input'),
      seekFill: document.getElementById('expanded-seek-fill'),
      seekHandle: document.getElementById('expanded-seek-handle'),
      favBtn: document.getElementById('expanded-fav'),
      prevBtn: document.getElementById('expanded-prev'),
      playBtn: document.getElementById('expanded-play'),
      nextBtn: document.getElementById('expanded-next'),
      shuffleBtn: document.getElementById('expanded-shuffle'),
      repeatBtn: document.getElementById('expanded-repeat'),
      tabsNav: document.querySelector('.expanded-tabs'),
      tabPanels: document.querySelectorAll('.tab-panel'),
      queueList: document.getElementById('expanded-queue-list'),
      miniArt: document.querySelector('.player-art'),
      miniPlayerBar: document.querySelector('.player'),
    };

    // Inject icons into static shell elements
    if (dom.closeBtn) dom.closeBtn.innerHTML = ExpandedIcons.chevronDown;
    if (dom.prevBtn) dom.prevBtn.innerHTML = Icons.prev;
    if (dom.nextBtn) dom.nextBtn.innerHTML = Icons.next;
    if (dom.shuffleBtn) dom.shuffleBtn.innerHTML = ExpandedIcons.shuffle;
    if (dom.repeatBtn) dom.repeatBtn.innerHTML = ExpandedIcons.repeat;
    if (dom.playBtn) dom.playBtn.innerHTML = `${Icons.play}<div class="player-loader"></div>`;
  }

  function wireEvents() {
    // Mini player bar click -> open expanded player (excluding control buttons & inputs)
    dom.miniPlayerBar?.addEventListener('click', (e) => {
      if (e.target.closest('button, input, .seek-bar, .volume-group, a')) return;
      open();
    });

    // Close button & Escape key
    dom.closeBtn?.addEventListener('click', close);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });

    // Control buttons calling Player API directly
    dom.playBtn?.addEventListener('click', () => Player.togglePlay());
    dom.favBtn?.addEventListener('click', () => Player.toggleFavoriteCurrent());
    dom.prevBtn?.addEventListener('click', () => {
      const previousTrack = Queue.previous();
      if (!previousTrack) {
        UI.toast("There is no previous Track 🥀");
        UI.toast("Just like your previous ex ! 😂");
        return;
      }
      Player.playTrack(previousTrack);
    });
    dom.nextBtn?.addEventListener('click', () => {
      const nextTrack = Queue.next();
      if (!nextTrack) {
        UI.toast("Queue is empty 🥀");
        UI.toast("Just like your broken heart 💔");
        return;
      }
      Player.playTrack(nextTrack);
    });

    dom.shuffleBtn?.addEventListener('click', () => {
      const active = dom.shuffleBtn.classList.toggle('is-active');
      UI.toast(active ? 'Shuffle ON 🔀' : 'Shuffle OFF');
    });

    dom.repeatBtn?.addEventListener('click', () => {
      const active = dom.repeatBtn.classList.toggle('is-active');
      UI.toast(active ? 'Repeat ON 🔁' : 'Repeat OFF');
    });

    // Seek input
    dom.seekInput?.addEventListener('input', (e) => {
      isSeeking = true;
      const pct = Number(e.target.value);
      updateSeekVisual(pct);
    });

    dom.seekInput?.addEventListener('change', (e) => {
      const pct = Number(e.target.value);
      Player.seekTo(pct);
      isSeeking = false;
    });

    // Close overlay when clicking on any blank area (outside interactive controls/cards)
    dom.overlay?.addEventListener('click', (e) => {
      if (!isOpen) return;
      const isInteractive = e.target.closest('button, input, .seek-bar, a, .expanded-tab, .now-playing-card, .queue-item, .queue-remove-btn');
      if (!isInteractive) {
        close();
      }
    });

    // Auto-close overlay when navigating to another menu via sidebar or browser back/forward
    const sidebar = document.querySelector('.sidebar');
    sidebar?.addEventListener('click', (e) => {
      if (isOpen && e.target.closest('.nav-item, a')) {
        close();
      }
    });
    window.addEventListener('popstate', () => {
      if (isOpen) close();
    });

    // Event-driven state updates (only processed when overlay is open)
    window.addEventListener('player:trackchange', (e) => {
      if (isOpen) updateTrackMeta(e.detail.track);
    });
    window.addEventListener('player:statechange', (e) => {
      if (isOpen) updatePlayState(e.detail);
    });
    window.addEventListener('player:timeupdate', (e) => {
      if (isOpen) updateSeekState(e.detail);
    });
    window.addEventListener('player:favchange', (e) => {
      if (isOpen) updateFavState(e.detail);
    });
  }

  /* ---------------- Shared Element FLIP Transition & Open/Close ---------------- */
  function open() {
    if (isOpen) return;

    // Measure mini art position for FLIP animation before opening
    const miniRect = dom.miniArt?.getBoundingClientRect();

    isOpen = true;
    dom.overlay?.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // Synchronize metadata, playback state, seek position, and render static queue on open
    const currentTrack = Player.getCurrentTrack();
    if (currentTrack) {
      updateTrackMeta(currentTrack);
      updateFavState({ isFavorite: Storage.isFavorite(currentTrack.videoId) });
    }
    updatePlayState({ isPlaying: Player.isPlaying(), isLoading: false });
    renderStaticQueue();

    // FLIP Artwork Morphing animation
    if (miniRect && dom.art) {
      animateFlipArt(miniRect, true);
    }
  }

  function close() {
    if (!isOpen) return;

    const miniRect = dom.miniArt?.getBoundingClientRect();
    if (miniRect && dom.art) {
      animateFlipArt(miniRect, false);
    }

    isOpen = false;
    dom.overlay?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function animateFlipArt(miniRect, isOpening) {
    const targetRect = dom.art.getBoundingClientRect();
    if (!targetRect.width || !miniRect.width) return;

    const img = dom.art.querySelector('img');
    const imgSrc = img?.src || '';

    // Create temporary FLIP clone
    const clone = document.createElement('div');
    clone.className = 'art-flip-clone';

    if (imgSrc) {
      clone.innerHTML = `<img src="${imgSrc}" alt="">`;
    } else {
      clone.innerHTML = `<div class="art-fallback">${Icons.note}</div>`;
      clone.style.background = 'var(--gradient-brand)';
    }

    const startRect = isOpening ? miniRect : targetRect;
    const endRect = isOpening ? targetRect : miniRect;

    clone.style.left = `${startRect.left}px`;
    clone.style.top = `${startRect.top}px`;
    clone.style.width = `${startRect.width}px`;
    clone.style.height = `${startRect.height}px`;

    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      clone.style.left = `${endRect.left}px`;
      clone.style.top = `${endRect.top}px`;
      clone.style.width = `${endRect.width}px`;
      clone.style.height = `${endRect.height}px`;
      clone.style.borderRadius = isOpening ? 'var(--radius-lg)' : '8px';
    });

    setTimeout(() => {
      clone.remove();
    }, 360);
  }

  /* ---------------- Generic Tab System ---------------- */
  function wireTabSystem() {
    dom.tabsNav?.addEventListener('click', (e) => {
      const btn = e.target.closest('.expanded-tab');
      if (!btn) return;
      const tabId = btn.dataset.tab;
      if (tabId) switchTab(tabId);
    });
  }

  function switchTab(tabId) {
    activeTab = tabId;
    dom.tabsNav?.querySelectorAll('.expanded-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    dom.tabPanels?.forEach((panel) => {
      const match = panel.id === `panel-${tabId}`;
      panel.classList.toggle('active', match);
    });

    if (tabId === 'queue' && isOpen) {
      renderStaticQueue();
    }
  }

  /* ---------------- Static Frontend Queue UI ---------------- */
  function renderStaticQueue() {
    if (!dom.queueList) return;

    const currentTrack = Player.getCurrentTrack();

    const currentThumb = currentTrack?.thumbnail
      ? `<img src="${currentTrack.thumbnail}" alt="" onerror="this.parentElement.innerHTML='${Icons.note}'">`
      : Icons.note;

    let html = `
      <div class="queue-container">
        <div class="queue-section-title">
          <span>Now Playing</span>
        </div>
        <div class="now-playing-card">
          <div class="queue-thumb">${currentThumb}</div>
          <div class="queue-meta">
            <div class="queue-title">${UI.escapeHtml(currentTrack?.title || 'Nothing playing')}</div>
            <div class="queue-artist">${UI.escapeHtml(currentTrack?.channel || 'Pick a track to start')}</div>
          </div>
        </div>

        <div class="queue-divider"></div>

        <div class="queue-section-title">Up Next</div>
        <div class="queue-list">
    `;

    STATIC_QUEUE_ITEMS.forEach((track) => {
      const thumb = track.thumbnail
        ? `<img src="${track.thumbnail}" alt="" onerror="this.parentElement.innerHTML='${Icons.note}'">`
        : Icons.note;

      html += `
        <div class="queue-item" data-video-id="${track.videoId}">
          <div class="queue-thumb">${thumb}</div>
          <div class="queue-meta">
            <div class="queue-title">${UI.escapeHtml(track.title)}</div>
            <div class="queue-artist">${UI.escapeHtml(track.channel || '')}</div>
          </div>
          <button class="queue-remove-btn" data-action="remove" aria-label="Remove ${UI.escapeHtml(track.title)}">
            ${ExpandedIcons.trash}
          </button>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    dom.queueList.innerHTML = html;

    // Attach frontend-only UI remove handler (removes item from DOM)
    dom.queueList.querySelectorAll('.queue-remove-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = btn.closest('.queue-item');
        item?.remove();
      });
    });
  }

  /* ---------------- Event-Driven Updates (Active While Open) ---------------- */
  function updateTrackMeta(track) {
    if (!track) return;
    if (dom.title) dom.title.textContent = track.title;
    if (dom.artist) dom.artist.textContent = track.channel || '';

    if (dom.art) {
      dom.art.innerHTML = track.thumbnail
        ? `<img src="${track.thumbnail}" alt="" onerror="this.parentElement.innerHTML='${Icons.note}'">`
        : `<div class="art-fallback">${Icons.note}</div>`;
    }

    // Ambient blurred backdrop update
    if (dom.bg) {
      if (track.thumbnail) {
        dom.bg.style.backgroundImage = `url("${track.thumbnail}")`;
      } else {
        dom.bg.style.backgroundImage = '';
      }
    }

    renderStaticQueue();
  }

  function updatePlayState({ isPlaying, isLoading }) {
    if (!dom.playBtn) return;
    dom.playBtn.classList.toggle('is-playing', isPlaying);
    dom.playBtn.classList.toggle('is-loading', isLoading);
    dom.playBtn.innerHTML = `${isPlaying ? Icons.pause : Icons.play}<div class="player-loader"></div>`;
  }

  function updateSeekState({ currentTime, duration, percentage }) {
    if (!dom.timeCurrent || isSeeking) return;
    dom.timeCurrent.textContent = Player.formatTime(currentTime);
    if (dom.timeDuration) dom.timeDuration.textContent = Player.formatTime(duration);
    updateSeekVisual(percentage);
    if (dom.seekInput) dom.seekInput.value = percentage || 0;
  }

  function updateSeekVisual(pct) {
    if (dom.seekFill) dom.seekFill.style.width = `${pct}%`;
    if (dom.seekHandle) dom.seekHandle.style.left = `${pct}%`;
  }

  function updateFavState({ isFavorite }) {
    if (!dom.favBtn) return;
    dom.favBtn.classList.toggle('is-active', isFavorite);
    dom.favBtn.innerHTML = isFavorite ? Icons.heart : Icons.heartOutline;
  }

  return {
    init,
    open,
    close,
    switchTab,
  };
})();
