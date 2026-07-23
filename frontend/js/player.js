/* ============================================================
   AUDIZY — player.js
   Single shared <audio> instance. Handles play/pause, seeking,
   volume, favorites, and a Web-Audio-powered visualizer with a
   CSS-only fallback when the stream can't be analysed (CORS).
   ============================================================ */

const Player = (() => {
  let audio = null;
  let currentTrack = null;
  let isSeeking = false;
  let audioCtx = null;
  let analyser = null;
  let sourceNode = null;
  let rafId = null;
  let dom = {};


  function init() {
    audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';

    dom = {
      bar: document.querySelector('.player'),
      art: document.querySelector('.player-art'),
      artImg: document.querySelector('.player-art img'),
      title: document.querySelector('.player-title'),
      channel: document.querySelector('.player-channel'),
      favBtn: document.querySelector('.player-fav'),
      playToggle: document.querySelector('.play-toggle'),
      prevBtn: document.querySelector('.player-prev'),
      nextBtn: document.querySelector('.player-next'),
      seekInput: document.querySelector('.seek-input'),
      seekFill: document.querySelector('.seek-fill'),
      seekHandle: document.querySelector('.seek-handle'),
      timeCurrent: document.querySelector('.time-current'),
      timeDuration: document.querySelector('.time-duration'),
      volumeInput: document.querySelector('.volume-slider'),
      muteBtn: document.querySelector('.mute-btn'),
      eq: document.querySelector('.eq-visualizer'),
    };

    if (!dom.bar) return; // page has no player markup

    Animations.buildEqBars(dom.eq, 4);
    wireControls();
    restoreSession();
  }

  function wireControls() {
    dom.playToggle?.addEventListener('click', togglePlay);
    dom.favBtn?.addEventListener('click', toggleFavoriteCurrent);
    dom.muteBtn?.addEventListener('click', toggleMute);

    dom.seekInput?.addEventListener("input", (e) => {
      if (!audio.duration) return;
      isSeeking = true;
      const pct = Number(e.target.value);
      updateSeekVisual(pct);
    });

    dom.seekInput?.addEventListener("change", (e) => {
      if (!audio.duration) return;
      const pct = Number(e.target.value);
      audio.currentTime = (pct / 100) * audio.duration;
      isSeeking = false;
    });

    dom.volumeInput?.addEventListener('input', (e) => {
      const v = Number(e.target.value) / 100;
      audio.volume = v;
      audio.muted = v === 0;
      updateVolumeIcon();
    });

    // Prev / Next are UI-only per spec (no queue wired to backend yet)
    dom.prevBtn?.addEventListener('click', () => {
      const previousTrack = Queue.previous();
      if (!previousTrack) {
        UI.toast("There is no previous Track 🥀");
        UI.toast("Just like your ex ! 😂");
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

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', () => setLoading(true));
    audio.addEventListener('playing', () => setLoading(false));
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    window.addEventListener('pagehide', persistSession);
  }

  /* ---------------- Public: play a track ---------------- */
  async function playTrack(track) {
    if (currentTrack?.videoId === track.videoId && !audio.paused) {
      audio.pause();
      return;
    }
    if (currentTrack?.videoId === track.videoId && audio.paused && audio.src) {
      audio.play().catch(onError);
      return;
    }

    currentTrack = track;
    showPlayerBar();
    renderTrackMeta(track);
    setLoading(true);

    try {
      audio.src = `http://localhost:3000/api/stream?id=${track.videoId}`;
      audio.addEventListener("loadedmetadata", () => {
        audio.currentTime = pendingResumeTime;
      });
      await audio.play();
      Storage.addRecentlyPlayed(track);
      ensureVisualizer();
    } catch (err) {
      console.error('Playback failed:', err);
      setLoading(false);
      UI.toast('Could not play this track. Try another?');
    }
  }

  async function togglePlay() {
    console.log(audio.paused);
    if (!audio.src) {
      if (!currentTrack) return;
      await playTrack(currentTrack);
      return;
    }
    if (audio.ended) {
      audio.currentTime = 0;
    }
    if (audio.paused) {
      audio.play().catch(onError);
    }
    else {
      audio.pause();
    }
  }

  let pendingResumeTime = 0;
  let pendingWasPlaying = false;

  function dispatchEvent(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function seekTo(pct) {
    if (!audio || !audio.duration) return;
    audio.currentTime = (pct / 100) * audio.duration;
    updateSeekVisual(pct);
  }

  function getCurrentTrack() {
    return currentTrack;
  }

  function isPlaying() {
    return audio ? !audio.paused : false;
  }

  function showPlayerBar() {
    dom.bar?.classList.add('is-visible');
  }

  function renderTrackMeta(track) {
    if (dom.title) dom.title.textContent = track.title;
    if (dom.channel) dom.channel.textContent = track.channel || '';
    if (dom.art) {
      dom.art.innerHTML = track.thumbnail
        ? `<img src="${track.thumbnail}" alt="" onerror="this.parentElement.innerHTML='${Icons.note}'">`
        : Icons.note;
    }
    updateFavIcon();
    UI.markActiveCard(track.videoId);
    dispatchEvent('player:trackchange', { track });
  }

  function toggleFavoriteCurrent() {
    if (!currentTrack) return;
    const added = Storage.toggleFavorite(currentTrack);
    updateFavIcon();
    UI.toast(added ? 'Added to Favorites ❤️' : 'Removed from Favorites');
  }
  function updateFavIcon() {
    if (!dom.favBtn || !currentTrack) return;
    const fav = Storage.isFavorite(currentTrack.videoId);
    dom.favBtn.classList.toggle('is-active', fav);
    dom.favBtn.innerHTML = fav ? Icons.heart : Icons.heartOutline;
    dispatchEvent('player:favchange', { isFavorite: fav, track: currentTrack });
  }

  /* ---------------- Audio element events ---------------- */
  function onPlay() {
    dom.playToggle?.classList.add('is-playing');
    if (dom.playToggle) dom.playToggle.innerHTML = `${Icons.pause}<div class="player-loader"></div>`;
    dom.art?.classList.add('is-spinning');
    dom.eq?.classList.add('is-active');
    UI.markActiveCard(currentTrack?.videoId);
    resumeVisualizer();
    dispatchEvent('player:statechange', { isPlaying: true, isLoading: false });
  }
  function onPause() {
    if (dom.playToggle) dom.playToggle.innerHTML = `${Icons.play}<div class="player-loader"></div>`;
    dom.art?.classList.remove('is-spinning');
    dom.eq?.classList.remove('is-active');
    dispatchEvent('player:statechange', { isPlaying: false, isLoading: false });
  }
  function onEnded() {
    onPause();
    dom.seekFill && (dom.seekFill.style.width = '0%');
  }
  function onError() {
    setLoading(false);
    UI.toast('Playback error — stream unavailable.');
  }
  function setLoading(isLoading) {
    dom.playToggle?.classList.toggle('is-loading', isLoading);
    dispatchEvent('player:statechange', { isPlaying: !audio.paused, isLoading });
  }

  function onLoadedMetadata() {
    if (dom.timeDuration) dom.timeDuration.textContent = formatTime(audio.duration);
    dispatchEvent('player:timeupdate', {
      currentTime: audio.currentTime,
      duration: audio.duration,
      percentage: audio.duration ? (audio.currentTime / audio.duration) * 100 : 0,
    });
  }
  function onTimeUpdate() {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (!isSeeking) {
      updateSeekVisual(pct);
      if (dom.seekInput)
        dom.seekInput.value = pct;
    }
    if (dom.timeCurrent)
      dom.timeCurrent.textContent = formatTime(audio.currentTime);
    dispatchEvent('player:timeupdate', {
      currentTime: audio.currentTime,
      duration: audio.duration,
      percentage: pct,
    });
  }
  function updateSeekVisual(pct) {
    if (dom.seekFill) dom.seekFill.style.width = `${pct}%`;
    if (dom.seekHandle) dom.seekHandle.style.left = `${pct}%`;
  }

  function toggleMute() {
    audio.muted = !audio.muted;
    updateVolumeIcon();
  }
  function updateVolumeIcon() {
    if (!dom.muteBtn) return;
    dom.muteBtn.innerHTML = audio.muted || audio.volume === 0 ? Icons.mute : Icons.volume;
  }

  function formatTime(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /* ---------------- Web Audio visualizer (best-effort) ---------------- */
  function ensureVisualizer() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      sourceNode = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      resumeVisualizer();
    } catch (err) {
      // Cross-origin streams without CORS headers will throw here.
      // The CSS-only eqBounce animation (.is-active) still runs, so
      // the UI stays lively without real frequency data.
      console.warn('Visualizer unavailable (likely CORS):', err.message);
    }
  }
  function resumeVisualizer() {
    if (!analyser) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    cancelAnimationFrame(rafId);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const bars = dom.eq ? [...dom.eq.querySelectorAll('.bar')] : [];
    function tick() {
      if (audio.paused) return;
      analyser.getByteFrequencyData(data);
      bars.forEach((bar, i) => {
        const v = data[i % data.length] / 255;
        bar.style.height = `${4 + v * 18}px`;
        bar.style.animation = 'none';
      });
      rafId = requestAnimationFrame(tick);
    }
    tick();
  }

  /* ---------------- Cross-page session continuity ---------------- */
  function persistSession() {
    if (!currentTrack) return;
    Storage.saveSession({
      track: currentTrack,
      time: audio.currentTime,
      wasPlaying: !audio.paused,
    });
  }
  function restoreSession() {
    const session = Storage.loadSession();
    if (!session?.track) return;
    currentTrack = session.track;
    showPlayerBar();
    renderTrackMeta(session.track);
    pendingResumeTime = session.time;
    pendingWasPlaying = session.wasPlaying;
    // Paused restore only — avoids surprise autoplay across page loads.
  }

  return {
    init,
    playTrack,
    togglePlay,
    toggleFavoriteCurrent,
    seekTo,
    getCurrentTrack,
    isPlaying,
    formatTime,
  };
})();

