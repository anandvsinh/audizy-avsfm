/* ============================================================
   AUDIZY — animations.js
   IntersectionObserver-based reveal animations + ambient visuals
   (hero waveform bars, idle equalizer bars).
   ============================================================ */

const Animations = (() => {
  let observer = null;

  function getObserver() {
    if (observer) return observer;
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    return observer;
  }

  function observe(elements) {
    const obs = getObserver();
    elements.forEach((el) => obs.observe(el));
  }

  /**
   * Builds a row of static bars (the hero waveform / brand signature).
   * Randomized heights give it an organic, audio-shaped silhouette.
   */
  function buildWaveBars(container, count = 28) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const bar = document.createElement('div');
      bar.className = 'bar';
      const h = 14 + Math.round(Math.sin(i * 0.45) * 40 + Math.random() * 30 + 40);
      bar.style.height = `${Math.max(10, Math.min(100, h))}%`;
      bar.style.animation = `waveIdle ${1.6 + Math.random() * 1.4}s ease-in-out ${i * 0.04}s infinite`;
      container.appendChild(bar);
    }
  }

  /**
   * Small equalizer bars used in the player's right side.
   */
  function buildEqBars(container, count = 4) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.animationDelay = `${i * 0.12}s`;
      container.appendChild(bar);
    }
  }

  return { observe, buildWaveBars, buildEqBars };
})();
