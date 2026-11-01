/* Lampa plugins by lightnzt (25.10.2026)
   1) Season fix. Lampa (Utils.splitEpisodesIntoSeasons, called from sources.tmdb.get for tv/<id>/season/1)
      splits season 1 into parts when episodes are more than 90 days apart and keeps only the first part.
      Regular shows with a mid-season break (Prison Break: ep 13 on 2005-11-28, ep 14 on 2006-03-20) lose the
      episodes after the break: no thumbnails, titles or ratings in the episode list of every source.
      Fix: seasons of up to 30 episodes are kept whole; longer "merged" ones (anime) are split as before.
   2) Key 5 on the remote in the online episode list opens the source (balancer) list; press 5 again to close it.
      Works wherever the page has the "Source" filter button (.filter--sort), not inside the player.
   3) "Real-Debrid" source in the card (01.11.2026): Russian releases from RuTracker/Rutor via Torrentio, only
      those already cached on Real-Debrid, without Dolby Vision/REMUX/discs; DTS/TrueHD ones go last with a mark.
      Needs your Real-Debrid API token in the plugin URL: nzt.js?rd=TOKEN (kept in Lampa storage after that). */
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

  // 3) Real-Debrid source (streams from Torrentio, cached on Real-Debrid only).
  // The token is never stored in this public file: it comes from the plugin URL (nzt.js?rd=TOKEN,
  // set in the private CUB plugin list) and is kept in Lampa storage.
  var RD_KEY = 'nzt_rd_token';
  var TIO = 'https://torrentio.strem.fun/';
  var TIO_FILTER = 'qualityfilter=brremux,dolbyvision,dolbyvisionwithhdr,threed,cam,scr,unknown%7Csizefilter=30GB' +
    '%7Cdebridoptions=nodownloadlinks%7Crealdebrid=';
  var TIO_RU = 'providers=rutor,rutracker%7Clanguage=russian%7C';
  var TIO_ALL = 'language=russian%7C';
  var BAD_AUDIO = /\b(DTS|TrueHD|Atmos)\b/i;
  var BAD_FILE = /blu-?ray disc|\bBDMV\b|\.iso\b|\.m2ts\b/i;

  function scriptToken() {
    var list = [];
    if (document.currentScript) list.push(document.currentScript);
    var all = document.getElementsByTagName('script');
    for (var i = 0; i < all.length; i++) list.push(all[i]);
    for (var j = 0; j < list.length; j++) {
      var src = list[j].src || '';
      if (src.indexOf('nzt.js') === -1) continue;
      var m = src.match(/[?&]rd=([A-Za-z0-9]+)/);
      if (m) return m[1];
    }
    return '';
  }

  var rdToken = scriptToken();
  try {
    if (rdToken) Lampa.Storage.set(RD_KEY, rdToken);
    else rdToken = Lampa.Storage.get(RD_KEY, '') + '';
  } catch (e) {}

  function rdLoad(path, ok, fail) {
    var net = new Lampa.Reguest();
    net.timeout(25000);
    Lampa.Loading.start(function () { net.clear(); Lampa.Loading.stop(); });
    var done = function (json) { Lampa.Loading.stop(); ok(json && json.streams || []); };
    // Torrentio sometimes answers with an empty body on the first request: one retry after 2 s.
    var get = function (url, success, error, retry) {
      net.silent(url, success, function () {
        if (retry) setTimeout(function () { get(url, success, error, false); }, 2000);
        else error();
      });
    };
    var tryAll = function () {
      get(TIO + TIO_ALL + TIO_FILTER + rdToken + path, done, function () { Lampa.Loading.stop(); fail(); }, true);
    };
    get(TIO + TIO_RU + TIO_FILTER + rdToken + path, function (json) {
      if (json && json.streams && json.streams.length) done(json);
      else tryAll();
    }, tryAll, true);
  }

  // Release names come from torrent trackers: escape them, Lampa puts Select items into HTML.
  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function rdItems(streams) {
    var good = [], bad = [];
    streams.forEach(function (s) {
      var lines = (s.title || '').split('\n');
      var meta = '', text = [];
      lines.forEach(function (l) { if (l.indexOf('💾') !== -1) meta = l; else if (l) text.push(l); });
      var all = text.join(' ');
      if (!/^https:\/\/torrentio\.strem\.fun\//.test(s.url || '') || BAD_FILE.test(all)) return;
      var size = (meta.match(/💾\s*([\d.,]+\s*[GMK]B)/) || [])[1] || '';
      var tracker = (meta.match(/⚙️\s*([^\/]+)/) || [])[1] || '';
      var seeds = (meta.match(/👤\s*(\d+)/) || [])[1] || '';
      var quality = (s.name || '').replace(/\[RD\+?\]/, '').replace(/Torrentio/i, '').replace(/\s+/g, ' ').trim();
      var warn = BAD_AUDIO.test(all);
      var item = {
        title: esc((warn ? '⚠ ' : '') + [quality, size].filter(Boolean).join(' · ')),
        subtitle: esc([text[0] || '', text[1] ? '(' + text[1] + ')' : '', tracker.trim(), seeds ? '👤 ' + seeds : '',
          warn ? '— звук DTS/TrueHD, на ТВ может не пойти' : ''].filter(Boolean).join(' ')),
        url: s.url
      };
      (warn ? bad : good).push(item);
    });
    return good.concat(bad);
  }

  function rdPlay(movie, item, season, episode) {
    var name = movie.title || movie.name || '';
    var orig = movie.original_title || movie.original_name || name;
    var data = { url: item.url, title: season ? name + ' — S' + season + 'E' + episode : name };
    try {
      var hash = Lampa.Utils.hash(season ? [season, season > 10 ? ':' : '', episode, orig].join('') : orig);
      data.timeline = Lampa.Timeline.view(hash);
    } catch (e) {}
    Lampa.Player.play(data);
    Lampa.Player.playlist([data]);
  }

  function rdStreams(movie, season, episode, back) {
    var path = season ? '/stream/series/' + movie.imdb_id + ':' + season + ':' + episode + '.json'
      : '/stream/movie/' + movie.imdb_id + '.json';
    rdLoad(path, function (streams) {
      var items = rdItems(streams);
      if (!items.length) {
        Lampa.Noty.show('Real-Debrid: готовых раздач нет');
        return back();
      }
      Lampa.Select.show({
        title: 'Real-Debrid' + (season ? ' · S' + season + 'E' + episode : ''),
        items: items,
        onSelect: function (a) { rdPlay(movie, a, season, episode); },
        onBack: back
      });
    }, function () {
      Lampa.Noty.show('Real-Debrid: Torrentio не ответил');
      back();
    });
  }

  function rdEpisodes(movie, season, back) {
    var info = (movie.seasons || []).filter(function (s) { return s.season_number === season; })[0];
    var count = info && info.episode_count || 30;
    var items = [];
    for (var i = 1; i <= count; i++) items.push({ title: 'Серия ' + i, episode: i });
    var show = function () {
      Lampa.Select.show({
        title: 'Сезон ' + season,
        items: items,
        onSelect: function (a) { rdStreams(movie, season, a.episode, show); },
        onBack: back
      });
    };
    show();
  }

  function rdSeasons(movie, back) {
    var seasons = (movie.seasons || []).filter(function (s) { return s.season_number > 0; });
    if (!seasons.length) return rdEpisodes(movie, 1, back);
    var show = function () {
      Lampa.Select.show({
        title: 'Real-Debrid',
        items: seasons.map(function (s) {
          return { title: s.name || 'Сезон ' + s.season_number, subtitle: (s.episode_count || '') + ' сер.', season: s.season_number };
        }),
        onSelect: function (a) { rdEpisodes(movie, a.season, show); },
        onBack: back
      });
    };
    show();
  }

  var RD_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 19h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  try {
    Lampa.Listener.follow('full', function (e) {
      if (e.type !== 'complite' || !rdToken) return;
      var render = e.object && e.object.activity && e.object.activity.render();
      if (!render || render.find('.view--nzt-rd').length) return;
      var movie = e.data && e.data.movie;
      if (!movie || !movie.imdb_id) return;
      var btn = $('<div class="full-start__button selector view--nzt-rd" data-subtitle="RuTracker, Rutor через Real-Debrid">' +
        RD_ICON + '<span>Real-Debrid</span></div>');
      btn.on('hover:enter', function (ev, context) {
        context = context || {};
        var back = function () {
          if (context.onBack) context.onBack();
          else Lampa.Controller.toggle('content');
        };
        var isTv = e.object.method === 'tv' || !!(movie.number_of_seasons || movie.first_air_date);
        if (!isTv) rdStreams(movie, 0, 0, back);
        else if (typeof context.season === 'number') rdEpisodes(movie, context.season, back);
        else rdSeasons(movie, back);
      });
      var torrent = render.find('.view--torrent');
      if (torrent.length) torrent.last().after(btn);
      else render.find('.buttons--container').append(btn);
    });
  } catch (e) {}
})();
