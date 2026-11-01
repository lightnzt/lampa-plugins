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

## check/

`https://lightnzt.github.io/lampa-plugins/check/` — a phone page that checks ~3000 popular sites
(by category and by country, Chrome UX Report top lists) for a connection and exports the result as JSON.
