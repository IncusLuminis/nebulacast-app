# Weather map entry point

`/weather/map-poc.html` is the supported weather-map route. The dashboard and
`/map/index.html` embed this route, so it is the single active implementation.

`/weather/map1.html` remains as a compatibility URL for existing bookmarks. It
redirects to `map-poc.html` and contains no map logic of its own.
