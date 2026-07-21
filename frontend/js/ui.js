/* ============================================================
   AUDIZY — ui.js
   Shared DOM rendering helpers, icon set, toasts, sidebar toggle.
   ============================================================ */

const Icons = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5l9 7-9 7V5zM17 5h2v14h-2z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 5l-9 7 9 7V5zM5 5h2v14H5z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2.2 4.7 5.5 4.2c2-.3 3.7.6 4.7 2.1.9.3 1.8.6 1.8.6s.9-.3 1.8-.6c1-1.5 2.7-2.4 4.7-2.1 3.3.5 5 3.8 3.5 7.5C19.5 16.4 12 21 12 21z"/></svg>',
  volume: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 9v6h4l5 5V4L9 9H5z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 9v6h4l5 5V4L9 9H5zm11.5 3l2.5-2.5-1-1L15.5 11 13 8.5l-1 1L14.5 12 12 14.5l1 1 2.5-2.5 2.5 2.5 1-1z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  heartOutline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2.2 4.7 5.5 4.2c2-.3 3.7.6 4.7 2.1.9.3 1.8.6 1.8.6s.9-.3 1.8-.6c1-1.5 2.7-2.4 4.7-2.1 3.3.5 5 3.8 3.5 7.5C19.5 16.4 12 21 12 21z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  radio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="15" r="3"/><path d="M5 12a7 7 0 0114 0M2.5 9.5a10.5 10.5 0 0119 0"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.97 7.97 0 000-2l2-1.6-2-3.4-2.4.6a8.1 8.1 0 00-1.7-1l-.4-2.5h-4l-.4 2.5a8.1 8.1 0 00-1.7 1l-2.4-.6-2 3.4L4.6 11a7.97 7.97 0 000 2l-2 1.6 2 3.4 2.4-.6a8.1 8.1 0 001.7 1l.4 2.5h4l.4-2.5a8.1 8.1 0 001.7-1l2.4.6 2-3.4z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l12-2v13M9 18a3 3 0 11-3-3 3 3 0 013 3zm12-2a3 3 0 11-3-3 3 3 0 013 3z"/></svg>',
};

const UI = (() => {
  /* ---------------- Toasts ---------------- */
  function toast(message, ms = 2600) {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = 'toast fade-in';
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, ms);
  }

  /* ---------------- Sidebar / mobile nav ---------------- */
  function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const hamburger = document.querySelector('.hamburger');
    if (!sidebar || !hamburger) return;

    const open = () => { sidebar.classList.add('is-open'); overlay?.classList.add('is-open'); };
    const close = () => { sidebar.classList.remove('is-open'); overlay?.classList.remove('is-open'); };

    hamburger.addEventListener('click', open);
    overlay?.addEventListener('click', close);
    sidebar.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', close));
  }

  /* ---------------- Song card (grid) ---------------- */
  function renderSongCard(track) {
    const card = document.createElement('div');
    card.className = 'song-card reveal';
    card.dataset.videoId = track.videoId;

    const thumb = track.thumbnail
      ? `<img src="${escapeAttr(track.thumbnail)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'art-fallback\\'>${Icons.note}</div>'">`
      : `<div class="art-fallback">${Icons.note}</div>`;

    card.innerHTML = `
      <div class="song-card-art">
        ${thumb}
        <button class="song-card-play" aria-label="Play ${escapeAttr(track.title)}">${Icons.play}</button>
      </div>
      <div class="song-card-title">${escapeHtml(track.title)}</div>
      <div class="song-card-channel">${escapeHtml(track.channel || '')}</div>
    `;

    const play = () => Player.playTrack(track);
    card.addEventListener('click', play);
    return card;
  }

  /* ---------------- Result row (list) ---------------- */
  function renderResultRow(track) {
    const row = document.createElement('div');
    row.className = 'result-row reveal';
    row.dataset.videoId = track.videoId;

    const thumb = track.thumbnail
      ? `<img src="${escapeAttr(track.thumbnail)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${Icons.note}'">`
      : Icons.note;

    row.innerHTML = `
      <div class="result-thumb">${thumb}</div>
      <div class="result-meta">
        <div class="result-title">${escapeHtml(track.title)}</div>
        <div class="result-channel">${escapeHtml(track.channel || '')}</div>
      </div>
      <button class="result-action" aria-label="Play ${escapeAttr(track.title)}">${Icons.play}</button>
    `;

    const play = () => Player.playTrack(track);
    row.addEventListener('click', play);
    return row;
  }

  function renderShimmerRows(count = 6) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'shimmer-row';
      row.innerHTML = `
        <div class="shimmer-block" style="width:48px;height:48px;"></div>
        <div>
          <div class="shimmer-block" style="width:60%;height:13px;margin-bottom:8px;"></div>
          <div class="shimmer-block" style="width:35%;height:11px;"></div>
        </div>
      `;
      frag.appendChild(row);
    }
    return frag;
  }

  function renderEmptyState(container, { icon = Icons.search, title, desc }) {
    container.innerHTML = `
      <div class="empty-state fade-in">
        ${icon}
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(desc)}</p>
      </div>
    `;
  }

  function markActiveCard(videoId) {
    document.querySelectorAll('.song-card, .result-row').forEach((el) => {
      el.classList.toggle('is-playing', el.dataset.videoId === videoId);
      const playIcon = el.querySelector('.song-card-play, .result-action');
      if (playIcon) playIcon.innerHTML = el.dataset.videoId === videoId ? Icons.pause : Icons.play;
    });
  }

  /* ---------------- Reveal-on-scroll wiring ---------------- */
  function staggerReveal(container, baseDelay = 35) {
    const items = container.querySelectorAll('.reveal');
    items.forEach((el, i) => {
      el.style.setProperty('--delay', `${i * baseDelay}ms`);
    });
    Animations.observe(items);
  }

  function escapeHtml(str = '') {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  function escapeAttr(str = '') {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  return {
    toast,
    initSidebar,
    renderSongCard,
    renderResultRow,
    renderShimmerRows,
    renderEmptyState,
    markActiveCard,
    staggerReveal,
    escapeHtml,
  };
})();
