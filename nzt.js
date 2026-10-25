/* Lampa: не резать 1-й сезон по перерыву в показе (25.10.2026).
   Лампа (app.min.js, Utils.splitEpisodesIntoSeasons, вызов в sources.tmdb.get для tv/<id>/season/1)
   делит 1-й сезон на «сезоны» по разрыву дат выхода > 90 дней и оставляет только первую часть.
   У обычных сериалов с зимним перерывом (Побег: 13-я серия 28.11.2005, 14-я 20.03.2006) пропадают
   серии после перерыва: нет картинок, названий, рейтингов в списке серий у всех балансеров.
   Фикс: короткие сезоны (до 30 серий) не делим; длинные «склеенные» (аниме) делим как раньше. */
(function () {
  'use strict';
  if (window.nzt_season_fix) return;
  window.nzt_season_fix = true;
  var U = window.Lampa && window.Lampa.Utils;
  if (!U || typeof U.splitEpisodesIntoSeasons !== 'function') return;
  var orig = U.splitEpisodesIntoSeasons;
  U.splitEpisodesIntoSeasons = function (episodes) {
    if (Array.isArray(episodes) && episodes.length > 0 && episodes.length <= 30) {
      return { 1: episodes.slice().sort(function (a, b) { return a.episode_number - b.episode_number; }) };
    }
    return orig.apply(this, arguments);
  };
})();
