Cloud Layer Source Policy v1

1. Purpose

Эта спека фиксирует политику выбора источников для облачного слоя карты в MVP.

Она отвечает на вопросы:
	•	какие источники разрешены
	•	какие источники предпочтительны
	•	какие fallback’и допустимы
	•	что нельзя смешивать
	•	по каким критериям выбирается primary provider
	•	что делать при деградации источников

Цель — не дать реализации превратиться в хаотичную смесь спутниковых картинок и модельных API.

Для Europe history разумно опираться на Meteosat/EUMETSAT, потому что EUMETSAT управляет геостационарной системой Meteosat и архивом/распространением этих данных. Для Americas — на GOES/NOAA NESDIS, где официальный viewer и imagery products доступны у NOAA/NESDIS/STAR. Для forecast-части в MVP допустим единый hourly API-слой вроде Open-Meteo, который документирует hourly forecast variables и model-specific endpoints.  ￼

⸻

2. Policy scope

Эта политика относится только к cloud layer для weather/map.

Она покрывает:
	•	history source policy
	•	forecast source policy
	•	source priority
	•	source quality criteria
	•	allowed fallback paths
	•	forbidden mixing patterns
	•	source metadata requirements

Она не покрывает:
	•	изобары
	•	ветер
	•	общую weather scoring logic
	•	frontend rendering details
	•	player behavior

⸻

3. Core source strategy

Для MVP фиксируется простая двухсегментная модель:
	•	history/current → observation-based satellite source
	•	forecast → one stable hourly forecast model source

То есть:

t <= 0h  -> satellite / observation-first
t > 0h   -> model / forecast-first

Это обязательное правило.

⸻

4. Source classes

Разрешены только два класса источников.

4.1. History class

satellite_observation

Допустимые типы:
	•	geostationary satellite imagery
	•	cloud mask / cloud product derived from geostationary satellite data
	•	official archive/distribution access to such data

4.2. Forecast class

forecast_model

Допустимые типы:
	•	hourly cloud cover model output
	•	stable API delivering hourly total cloud cover
	•	model-specific forecast endpoint
	•	one normalized aggregator path over official models

⸻

5. Primary provider policy — history

5.1. Europe / EMEA

Primary class:
	•	EUMETSAT / Meteosat-based source

Why:
	•	Meteosat is the natural geostationary operational source for Europe/Africa weather monitoring, and EUMETSAT documents Meteosat as the geostationary series for operational imagery and severe-weather monitoring. EUMETSAT also documents archive/storage and distribution through its Data Store/Data Centre services.  ￼

Preferred primary options:
	1.	EUMETSAT operational imagery product path
	2.	EUMETSAT archive / Data Store path
	3.	EUMETView-style access if suitable for controlled retrieval

5.2. Americas

Primary class:
	•	NOAA GOES-based source

Why:
	•	NOAA/NESDIS states GOES-R series provides advanced geostationary imagery for the Western Hemisphere, and the official GOES imagery viewer provides current imagery with frequent updates.  ￼

Preferred primary options:
	1.	NOAA/NESDIS GOES imagery/product path
	2.	NOAA GOES official viewer-backed product access
	3.	official archive path if available in implementation

5.3. Other regions

Use the appropriate geostationary or official regional operational satellite source if later expanded, but that is outside the MVP priority.

For MVP, the policy should be optimized around the user’s actual target region first.

⸻

6. Primary provider policy — forecast

For forecast segment, MVP should use one stable forecast path only.

Preferred strategy:
	•	one hourly cloud-cover forecast source
	•	one naming/model policy
	•	one output cadence
	•	one provider contract

Pragmatic preferred option for MVP:
	•	Open-Meteo hourly forecast path, because its docs expose hourly weather variables and model-backed APIs, with additional previous-runs support if needed.  ￼

Important:
this is a product-engineering choice, not a claim that Open-Meteo is the best atmospheric model in all cases.

The reason to allow it for MVP is:
	•	simpler API integration
	•	hourly forecast structure
	•	broad model coverage
	•	faster delivery

⸻

7. Source quality criteria

A source is acceptable only if it satisfies the relevant criteria.

7.1. History source criteria

Required:
	•	observation-based
	•	timestamped in UTC or reliably mappable to UTC
	•	operationally stable
	•	retrievable for the last 48 hours
	•	usable for consistent region coverage
	•	renderable into a cloud-like field

Preferred:
	•	frequent cadence
	•	official archive/distribution path
	•	consistent spatial resolution
	•	metadata rich enough for debugging

7.2. Forecast source criteria

Required:
	•	hourly or cleanly alignable to hourly
	•	covers at least +72h
	•	provides total cloud cover or equivalent
	•	stable and documented
	•	geographically valid for target region

Preferred:
	•	previous-run access
	•	model transparency
	•	consistent data schema
	•	acceptable rate limits / availability characteristics

⸻

8. Canonical variable policy

Regardless of provider, the canonical cloud variable for MVP is:

cloud_opacity_0_100

Source variables may include:
	•	total cloud cover
	•	cloud mask
	•	satellite-derived cloud intensity proxy

But after normalization everything must become:

0..100

This is mandatory.

⸻

9. Allowed source combinations

Allowed combinations for MVP:

Combination A — preferred
	•	history: official satellite source
	•	forecast: one hourly forecast provider

Combination B — degraded but acceptable
	•	history: partial satellite coverage with some unavailable frames
	•	forecast: normal hourly forecast provider

Combination C — degraded but acceptable
	•	history: normal satellite coverage
	•	forecast: partial missing future frames from the same provider path

Not allowed:
	•	per-frame arbitrary switching between multiple forecast providers
	•	per-hour provider roulette
	•	region-dependent hidden switching without metadata
	•	history composed from reanalysis pretending to be satellite observations unless explicitly marked as fallback

⸻

10. Forbidden mixing patterns

These patterns are forbidden in MVP.

10.1. Mixed forecast models inside one timeline without explicit policy

Do not do this:

+1h  provider A
+2h  provider B
+3h  provider A

unless there is an explicit controlled fallback event and metadata marks it.

10.2. Mixing observation and forecast within the same hour-slot

One slot must have one source_kind only:
	•	satellite
or
	•	model

Not both.

10.3. Using pretty RGB imagery as a cloud field without normalization policy

A visually attractive image is not automatically a valid cloud layer.

If the source is imagery-only, there must be a documented conversion rule to cloud opacity.

10.4. Silent fallback to historical reanalysis in place of satellite history

If a fallback is used, it must be explicit in metadata and considered degraded.

⸻

11. History fallback policy

History should be observation-first.

Fallback order:
	1.	primary official satellite operational path
	2.	official archive / store path
	3.	same-source delayed archive retrieval
	4.	mark frame unavailable

Only in exceptional degraded mode:
5. model/reanalysis fallback, explicitly marked as degraded source_kind policy extension

Recommended MVP policy:
	•	do not use reanalysis fallback by default
	•	prefer unavailable frames over fake observational continuity

This preserves trust.

⸻

12. Forecast fallback policy

Forecast should be model-first and stable.

Fallback order:
	1.	primary forecast provider path
	2.	same provider previous run / last good run
	3.	mark frame unavailable

Recommended MVP policy:
	•	fallback may use previous run from the same source family if explicitly supported
	•	do not switch to a different provider silently mid-timeline

Open-Meteo explicitly documents a Previous Model Runs API, which makes same-family fallback strategy reasonable if implemented carefully.  ￼

⸻

13. Regional source policy

Because the user is in Poland / Europe, the MVP regional priority should be Europe-first.

That means:

History default region policy
	•	prefer EUMETSAT/Meteosat-derived history

Forecast default region policy
	•	prefer one Europe-suitable hourly forecast path through the chosen forecast provider

This avoids over-generalizing the first release.

⸻

14. Provider transparency requirements

Every normalized cloud frame should preserve at least:
	•	source_kind
	•	source_name
	•	phase
	•	confidence

Recommended values:

source_kind
	•	satellite
	•	model

source_name

Examples:
	•	meteosat
	•	goes
	•	open-meteo/ecmwf
	•	open-meteo/ukmo
	•	open-meteo/auto

This is not primarily for UI; it is for QA and debugging.

⸻

15. Confidence policy

Confidence is not just based on the provider name.
It is based on segment type and horizon.

Recommended policy:

History/current from official satellite source
	•	high

Forecast +1h to +12h
	•	medium

Forecast +13h to +36h
	•	medium

Forecast +37h to +72h
	•	low

If a degraded fallback is used:
	•	confidence should not increase
	•	it may decrease one level if appropriate

⸻

16. Provider selection criteria for MVP implementation

If implementation must choose just one immediate path, selection should favor:
	1.	officialness or documented stability
	2.	easy hourly access
	3.	predictable integration effort
	4.	UTC-consistent timestamps
	5.	sufficient region coverage
	6.	reproducibility of runs
	7.	simple failure modes

This means a slightly less “perfect” meteorological source may be better for MVP than a theoretically better but operationally messy one.

⸻

17. Recommended MVP source set

For MVP in Europe, the cleanest policy is:

History/current
	•	Meteosat / EUMETSAT-derived imagery or cloud product path

Forecast
	•	one hourly forecast provider path, preferably through one documented integration interface such as Open-Meteo hourly forecast/model APIs

This keeps the stack simple enough to ship while remaining grounded in official/operational data on the history side and stable hourly forecast data on the future side.  ￼

⸻

18. Discouraged source patterns

These are not forbidden forever, but should be avoided in MVP:
	•	scraping viewer pages as the main production data path
	•	mixing multiple unofficial image mirrors
	•	mixing forecast APIs with different semantics per hour
	•	using only reanalysis for the whole -48h..+72h timeline
	•	using purely visual satellite imagery with no normalization strategy
	•	frequent provider switching based on transient availability

⸻

19. Operational source states

Each source should conceptually be in one of these states:
	•	healthy
	•	degraded
	•	unavailable

Recommended use:

healthy

Use normally.

degraded

Use with warnings/metadata and possibly lower confidence.

unavailable

Do not attempt hidden hacks; mark frames unavailable or segment unavailable.

This is useful later even if not exposed in UI.

⸻

20. Source-switch policy

If a source must change, it should happen only at controlled boundaries.

Allowed boundary:
	•	full pipeline configuration change
	•	full run-level fallback decision
	•	segment-level fallback decision

Not allowed:
	•	random per-frame switching with no traceability

A good rule:
one run should have one declared primary history source and one declared primary forecast source.

⸻

21. Documentation requirements for chosen providers

For the actually selected providers, implementation should document:
	•	provider name
	•	endpoint/path type
	•	variables used
	•	cadence
	•	regional coverage assumptions
	•	fallback behavior
	•	known limitations

This can be a README or internal note, but it should exist.

⸻

22. Acceptance criteria

Source policy is acceptable when:
	1.	history and forecast sources are clearly separated
	2.	history remains observation-first
	3.	forecast remains single-path and stable
	4.	provider selection is explainable
	5.	fallback behavior is explicit
	6.	forbidden mixing patterns are avoided
	7.	every frame can be traced back to source metadata
	8.	MVP stays simple enough to ship

⸻

23. Recommended next spec block

The next useful block would be:

Cloud Layer Render Policy v1

That would pin down:
	•	exact opacity mapping
	•	raster size strategy
	•	projection choice
	•	grayscale palette rules
	•	seam consistency rules
	•	anti-flicker rules
	•	file format and naming rules

That would finish the cloud layer specs from source to final visual artifact.