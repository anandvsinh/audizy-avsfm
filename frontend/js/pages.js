/* ============================================================
   AUDIZY — pages.js
   Isolated page initializers for static views.
   ============================================================ */

const Favorites = (() => {
  function init() {
    const icon = document.getElementById('ph-icon');
    if (icon) icon.outerHTML = Icons.heartOutline;
  }
  return { init };
})();

const RecentlyPlayed = (() => {
  function init() {
    const icon = document.getElementById('ph-icon');
    if (icon) icon.outerHTML = Icons.clock;
  }
  return { init };
})();

const Radio = (() => {
  function init() {
    const icon = document.getElementById('ph-icon');
    if (icon) icon.outerHTML = Icons.radio;
  }
  return { init };
})();

const Settings = (() => {
  function init() {
    const icon = document.getElementById('ph-icon');
    if (icon) icon.outerHTML = Icons.settings;
  }
  return { init };
})();
