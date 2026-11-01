/* Lampa plugins by lightnzt (25.10.2026)
   1) Season fix. Lampa (Utils.splitEpisodesIntoSeasons, called from sources.tmdb.get for tv/<id>/season/1)
      splits season 1 into parts when episodes are more than 90 days apart and keeps only the first part.
      Regular shows with a mid-season break (Prison Break: ep 13 on 2005-11-28, ep 14 on 2006-03-20) lose the
      episodes after the break: no thumbnails, titles or ratings in the episode list of every source.
      Fix: seasons of up to 30 episodes are kept whole; longer "merged" ones (anime) are split as before.
   2) Key 5 on the remote in the online episode list opens the source (balancer) list; press 5 again to close it.
      Works wherever the page has the "Source" filter button (.filter--sort), not inside the player. */
(function () {
  'use strict';
  if (window.nzt_lampa_plugins) return;
  window.nzt_lampa_plugins = true;

  // 1) Season fix
  var U = window.Lampa && window.Lampa.Utils;
  if (U && typeof U.splitEpisodesIntoSeasons === 'function') {
    var orig = U.splitEpisodesIntoSeasons;
    U.splitEpisodesIntoSeasons = function (episodes) {
      if (Array.isArray(episodes) && episodes.length > 0 && episodes.length <= 30) {
        return { 1: episodes.slice().sort(function (a, b) { return a.episode_number - b.episode_number; }) };
      }
      return orig.apply(this, arguments);
    };
  }

  // 2) Key 5 -> source list
  var KEYS = [53, 101]; // "5" on the remote / numpad

  function playerOpen() {
    try { return !!(Lampa.Player && typeof Lampa.Player.opened === 'function' && Lampa.Player.opened()); }
    catch (e) { return false; }
  }

  function onKey(e) {
    if (KEYS.indexOf(e.keyCode) === -1) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (playerOpen()) return;
    var body = document.body;
    if (body.classList.contains('selectbox--open')) {
      if (Lampa.Select && typeof Lampa.Select.close === 'function') {
        Lampa.Select.close();
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }
    var btn = document.querySelector('.activity--active .filter--sort');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var ev = document.createEvent('Event');
    ev.initEvent('hover:enter', false, true);
    btn.dispatchEvent(ev);
  }

  document.addEventListener('keydown', onKey);
})();
