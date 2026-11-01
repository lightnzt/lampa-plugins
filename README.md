# Lampa plugins

Small fixes for [Lampa](https://lampa.mx).

## nzt.js

`https://lightnzt.github.io/lampa-plugins/nzt.js`

- **Season fix.** Lampa splits season 1 into parts when there is a break of more than 90 days between episodes
  (meant for anime where everything is in one season). Regular shows with a mid-season break lose the episodes
  after the break: no thumbnails, titles or ratings in the episode list. The plugin keeps seasons of up to
  30 episodes whole; longer ones are split as before.
- **Key 5 → sources.** In the online episode list, key 5 on the remote opens the source (balancer) list,
  press 5 again to close it. Not active inside the player.
- **Real-Debrid source.** A "Real-Debrid" button in the movie/series card: Russian releases from RuTracker and
  Rutor via [Torrentio](https://torrentio.strem.fun), only those already cached on Real-Debrid, without Dolby Vision,
  REMUX and disc images; releases with DTS/TrueHD audio go last with a mark (many TV browsers can't play them).
  Series: season → episode → release (or straight to episodes from Lampa's own episode list).
  Put your Real-Debrid API token into the plugin URL: `https://lightnzt.github.io/lampa-plugins/nzt.js?rd=YOUR_TOKEN`
  (kept in Lampa storage after the first start). Without a token the button is not shown.

## check/

`https://lightnzt.github.io/lampa-plugins/check/` — a phone page that checks ~3000 popular sites
(by category and by country, Chrome UX Report top lists) for a connection and exports the result as JSON.
