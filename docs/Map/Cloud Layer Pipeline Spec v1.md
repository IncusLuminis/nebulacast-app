Cloud Layer Pipeline Spec v1

1. Purpose

Эта спека описывает практический backend pipeline для облачного слоя карты погоды.

Не “что хотим видеть в UI”, а именно:
	•	откуда берём данные
	•	как их приводим к одной временной шкале
	•	как сводим спутник и прогноз
	•	как превращаем это в render-ready assets
	•	как публикуем в dataset для карты

Цель MVP:

получить единый облачный слой [-48h … +72h], который можно сразу проигрывать общим player.

⸻

2. Pipeline responsibility

Pipeline отвечает только за облака.

Он не отвечает за:
	•	изобары
	•	ветер
	•	player
	•	frontend controls
	•	score
	•	other weather layers

То есть это отдельный подпайплайн внутри weather/map.

⸻

3. High-level flow

Полный поток для MVP:

fetch history satellite
-> fetch forecast cloud model
-> normalize time axis
-> normalize spatial grid
-> convert to canonical cloud field
-> rasterize render frames
-> publish frame assets
-> build cloud layer manifest
-> embed into weather_map_now.json


⸻

4. Recommended pipeline stages

Я бы зафиксировал 8 логических стадий.

Stage 1 — define runtime anchor

Определяем базовую временную точку генерации.

Stage 2 — fetch historical cloud observations

Забираем спутниковые кадры за -48h .. 0h.

Stage 3 — fetch forecast cloud data

Забираем модельную облачность за 0h .. +72h.

Stage 4 — build canonical hourly timeline

Строим общий список часовых слотов.

Stage 5 — normalize cloud fields

Приводим history и forecast к одному каноническому cloud field.

Stage 6 — rasterize render assets

Готовим PNG/WebP/tile overlays.

Stage 7 — publish assets

Кладём артефакты в staging/public storage.

Stage 8 — build cloud layer manifest

Собираем layers.clouds.frames[] для weather_map_now.json.

⸻

5. Stage 1 — Runtime anchor

5.1. Goal

Все данные должны собираться относительно одного anchor time, иначе timeline начнёт “плыть”.

5.2. Rule

В pipeline вычисляется:

anchor_utc = floor_to_hour(now_utc)

Именно anchor_utc считается текущим часом.

5.3. Time coverage

Далее строится диапазон:

history_start = anchor_utc - 48h
forecast_end  = anchor_utc + 72h

5.4. Why this matters

Это фиксирует:
	•	current frame
	•	split between satellite and model
	•	frame indexing
	•	filenames
	•	dataset coherence

⸻

6. Stage 2 — Fetch historical cloud observations

6.1. Input goal

Нужно получить спутниковые облачные наблюдения для каждого hour-slot в диапазоне:

[anchor_utc - 48h, anchor_utc]

6.2. Provider contract

Провайдер history должен вернуть список сырьевых snapshot records:

interface RawSatelliteSnapshot {
  t_utc: string;
  source_name: string;
  asset_ref: string;
  bbox?: {
    min_lat: number;
    min_lon: number;
    max_lat: number;
    max_lon: number;
  } | null;
  metadata?: Record<string, unknown>;
}

6.3. What the provider may return

В зависимости от реализации это могут быть:
	•	URLs исходных satellite images
	•	local cached files
	•	dataset ids
	•	raster files
	•	tile references

Главное: pipeline дальше должен уметь это прочитать и привести к канонике.

6.4. Selection policy

Исторический источник может иметь не hourly cadence.

Нужна функция выбора лучшего snapshot на каждый часовой слот:

pick_best_snapshot_for_hour(slot_utc, candidates)

6.5. Tolerance window

Рекомендуемая политика MVP:
	•	искать ближайший снимок в окне ±30 minutes
	•	если нет — frame unavailable

6.6. Output of stage

После стадии history-fetch должно получиться:

interface HistoricalCloudInput {
  slot_utc: string;
  snapshot_found: boolean;
  source_name: string | null;
  raw_asset_ref: string | null;
}

Для каждого hourly slot в history segment.

⸻

7. Stage 3 — Fetch forecast cloud data

7.1. Input goal

Получить модельную облачность для диапазона:

(anchor_utc, anchor_utc + 72h]

7.2. Provider contract

Провайдер forecast должен вернуть hourly cloud forecast records:

interface RawForecastCloudFrame {
  t_utc: string;
  source_name: string;
  total_cloud_cover: number[][] | number[] | string;
  low_cloud_cover?: number[][] | number[] | null;
  mid_cloud_cover?: number[][] | number[] | null;
  high_cloud_cover?: number[][] | number[] | null;
  metadata?: Record<string, unknown>;
}

7.3. Canonical requirement

Для MVP достаточно, чтобы provider гарантировал:
	•	hourly step or trivially mappable to hourly
	•	consistent geographic domain
	•	stable source name
	•	total cloud cover or equivalent field

7.4. Hour alignment rule

Если прогноз не strictly hourly, pipeline обязан явно выполнить controlled alignment.

Но базовое правило для MVP:
предпочесть источник, где hourly уже есть.

7.5. Output of stage

После forecast-fetch должно получиться:

interface ForecastCloudInput {
  slot_utc: string;
  frame_found: boolean;
  source_name: string | null;
  raw_cloud_field_ref: unknown | null;
}

Для каждого hourly slot в forecast segment.

⸻

8. Stage 4 — Build canonical hourly timeline

8.1. Goal

Собрать общий master timeline для облаков.

8.2. Canonical frame index

index 0   = anchor_utc - 48h
index 48  = anchor_utc
index 120 = anchor_utc + 72h

8.3. Canonical timeline record

interface CloudTimelineSlot {
  index: number;
  t_utc: string;
  phase: "history" | "current" | "forecast";
}

8.4. Phase rule
	•	t < anchor_utc -> history
	•	t = anchor_utc -> current
	•	t > anchor_utc -> forecast

8.5. Output of stage

Полный массив из 121 слота.

Это основной spine для всех последующих стадий.

⸻

9. Stage 5 — Normalize cloud fields

Это центральная стадия.

9.1. Goal

Привести все источники к одному внутреннему формату:

interface CanonicalCloudFrame {
  index: number;
  t_utc: string;
  phase: "history" | "current" | "forecast";
  source_kind: "satellite" | "model";
  source_name: string;
  available: boolean;
  cloud_opacity_0_100: number[][] | null;
  confidence: "high" | "medium" | "low" | null;
}

9.2. Canonical cloud value

Внутренне используем только:

cloud_opacity_0_100

где:
	•	0 = clear
	•	100 = full cloud cover

9.3. History normalization rule

Для satellite slot:
	•	читаем исходный снимок
	•	приводим к единой проекции / grid
	•	извлекаем или аппроксимируем cloud intensity field
	•	преобразуем к 0..100

Practical note

Если history source изначально является именно cloud mask / cloud product — отлично.

Если это просто imagery layer, нужно отдельное правило превращения в облачность. Для MVP лучше использовать источник, где cloud product уже ближе к интерпретируемому облачному слою, а не обычную красивую RGB-картинку.

9.4. Forecast normalization rule

Для model slot:
	•	читаем total cloud cover
	•	reproject/resample to canonical grid
	•	clamp to 0..100

9.5. Confidence mapping

History/current
	•	high

Forecast +1h..+12h
	•	medium

Forecast +13h..+36h
	•	medium

Forecast +37h..+72h
	•	low

Если хотите чуть точнее:
	•	+1..12 = high/medium-high
	•	+13..36 = medium
	•	+37..72 = low

Но в v1 достаточно трех уровней.

9.6. Missing data rule

Если frame не удалось собрать:

{
  available: false,
  cloud_opacity_0_100: null,
  confidence: null
}

И timeline не ломается.

⸻

10. Stage 6 — Normalize spatial grid

Это можно считать частью Stage 5, но лучше выделить отдельно логически.

10.1. Goal

Все кадры должны быть приведены к одной spatial basis.

10.2. Canonical spatial target

Для MVP нужно выбрать один target:

Option A

fixed raster extent for current map viewport region

Option B

web-mercator aligned render canvas

Практически для MVP лучше:
	•	взять bounding region around current supported map area
	•	привести всё к одному raster size, например:
	•	1024x1024
	•	1280x720
	•	другой agreed size

10.3. Rule

Нельзя оставлять:
	•	спутник в одной сетке
	•	forecast в другой
	•	и надеяться, что frontend “как-нибудь наложит”

10.4. Output

На выходе каждый canonical cloud frame уже имеет одинаковые:
	•	width
	•	height
	•	bbox/projection semantics

⸻

11. Stage 7 — Rasterize render frames

11.1. Goal

Превратить canonical cloud field в UI-ready overlay asset.

11.2. Output artifact type

Для MVP рекомендую:

transparent raster overlays

Форматы:
	•	PNG
	•	WebP

11.3. Rendering function

Логически это должно быть:

render_cloud_overlay(frame: CanonicalCloudFrame) -> RenderedCloudAsset

11.4. Canonical render contract

interface RenderedCloudAsset {
  index: number;
  t_utc: string;
  phase: "history" | "current" | "forecast";
  source_kind: "satellite" | "model";
  source_name: string;
  available: boolean;
  file_path: string | null;
  public_url: string | null;
  opacity_hint: number | null;
  confidence: "high" | "medium" | "low" | null;
}

11.5. Opacity mapping

Нужна фиксированная mapping policy.

Рекомендуемая логика:
	•	0..10 -> alpha ~ 0.00–0.08
	•	10..30 -> alpha ~ 0.08–0.22
	•	30..60 -> alpha ~ 0.22–0.50
	•	60..85 -> alpha ~ 0.50–0.75
	•	85..100 -> alpha ~ 0.75–0.92

Не обязательно буквально так, но mapping должна быть:
	•	нелинейной
	•	единой для history и forecast

11.6. Visual style

Рендеринг должен быть:
	•	grayscale / white-gray
	•	semi-transparent
	•	consistent across all phases

Нельзя:
	•	делать history одним стилем, forecast другим
	•	менять palette на boundary без причины

⸻

12. Stage 8 — Publish assets

12.1. Goal

Сделать render frames доступными карте.

12.2. Publishing target

В зависимости от вашей структуры это может быть, например:

sites/staging/assets/weather/map/clouds/

или иной agreed static path.

12.3. File naming

Нужно фиксированное именование.

Рекомендую:

cloud_000.webp
cloud_001.webp
...
cloud_120.webp

или чуть богаче:

cloud_20260308T0200Z_000.webp

Но для frontend-плеера индексная схема проще.

12.4. Rule

Файл публикуется только если available = true.

Если кадр unavailable:
	•	файла нет
	•	в manifest asset_url = null

⸻

13. Stage 9 — Build cloud layer manifest

13.1. Goal

Собрать готовый cloud layer block для weather_map_now.json.

13.2. Final cloud layer shape

interface WeatherMapCloudLayer {
  enabled_by_default: true;
  available: boolean;
  render_mode: "raster_frame";
  frames: WeatherMapCloudFrame[];
}

interface WeatherMapCloudFrame {
  index: number;
  t_utc: string;
  phase: "history" | "current" | "forecast";
  source_kind: "satellite" | "model";
  source_name: string;
  available: boolean;
  asset_url: string | null;
  opacity_hint: number | null;
  confidence: "high" | "medium" | "low" | null;
}

13.3. Layer-level availability

layers.clouds.available = true, если:
	•	существует достаточная часть timeline для нормальной работы карты

Рекомендуемое правило MVP:
	•	clouds layer считается available, если current frame доступен и есть разумное покрытие history+forecast

13.4. Frame ordering

Строго:
	•	ascending by index

⸻

14. Stitching policy at the seam

14.1. Rule

На уровне pipeline stitch простая:
	•	index <= 48 -> satellite/current-derived
	•	index > 48 -> model-derived

14.2. No fancy nowcasting

Не делаем:
	•	extrapolation of satellite cloud motion
	•	ML transition bridge
	•	blended assimilation seam

14.3. Allowed visual consistency work

Разрешается:
	•	одинаковый reprojection
	•	одинаковый raster size
	•	одинаковая opacity scale
	•	одинаковая blur/smoothing policy

Это нужно обязательно.

⸻

15. Caching policy

15.1. Why

Cloud pipeline может быть тяжелым.

15.2. What to cache

Кэшировать стоит:
	•	downloaded raw satellite snapshots
	•	normalized forecast fields
	•	rendered cloud overlays

15.3. Cache levels

L1 — raw source cache

чтобы не качать одно и то же повторно

L2 — normalized cloud frame cache

чтобы не пересчитывать grid normalization

L3 — rendered asset cache

чтобы быстро публиковать готовые overlays

15.4. Cache key basis

Ключ должен зависеть от:
	•	anchor_utc
	•	slot_utc
	•	source_name
	•	render config version

⸻

16. Failure handling

16.1. Principle

Один плохой кадр не должен валить весь cloud pipeline.

16.2. Frame-level fault tolerance

Если конкретный slot не обработался:
	•	mark unavailable
	•	continue building full timeline

16.3. Segment-level failure

History source unavailable

Можно оставить forecast часть и current if exists, но history frames unavailable.

Forecast source unavailable

Можно оставить history/current, но forecast unavailable.

Both dead

Cloud layer becomes globally unavailable.

16.4. Logging

Нужно логировать отдельно:
	•	fetch failures
	•	time alignment misses
	•	reprojection failures
	•	rasterization failures
	•	publication failures

Но без остановки на одиночных frame errors.

⸻

17. Quality gates

Перед публикацией полезно делать простые sanity checks.

17.1. Timeline integrity

Проверить:
	•	121 slots exist
	•	indexes contiguous
	•	current index present

17.2. Asset integrity

Проверить:
	•	every available=true frame has asset_url
	•	history/current/forecast split valid

17.3. Seam sanity

Проверить boundary:
	•	current frame exists or explicitly unavailable
	•	+1h forecast exists or explicitly unavailable

17.4. Value sanity

Проверить cloud values:
	•	all normalized values in 0..100

⸻

18. Recommended implementation split

Логически pipeline можно разложить так.

Option A — more modular

services/weather/
  providers/
    satellite_clouds.py
    forecast_clouds.py
  normalizers/
    cloud_history.py
    cloud_forecast.py
  models/
    cloud_timeline.py
  renderers/
    cloud_overlay.py

Option B — compact MVP

services/weather/
  providers/
    satellite_clouds.py
    forecast_clouds.py
  normalizers/
    weather_map_clouds.py

Где внутри weather_map_clouds.py есть функции:
	•	build_cloud_timeline(...)
	•	normalize_history_frame(...)
	•	normalize_forecast_frame(...)
	•	render_cloud_overlay(...)
	•	build_cloud_layer_manifest(...)

⸻

19. Suggested pipeline entrypoint contract

Если нужен внутренний orchestration API:

interface BuildCloudLayerParams {
  anchor_utc: string;
  center_lat: number;
  center_lon: number;
  bbox: {
    min_lat: number;
    min_lon: number;
    max_lat: number;
    max_lon: number;
  };
  width: number;
  height: number;
}

Выход:

interface BuildCloudLayerResult {
  layer: WeatherMapCloudLayer;
  timeline_frames: number;
  available_frames: number;
  unavailable_frames: number;
}


⸻

20. MVP acceptance criteria

Cloud Layer Pipeline считается готовым, если:
	1.	pipeline строит unified hourly timeline [-48h … +72h]
	2.	history собирается из observation-based source
	3.	forecast собирается из одного stable model source
	4.	все кадры нормализованы к одной spatial basis
	5.	все кадры рендерятся в единый visual style
	6.	layer manifest готов для прямого потребления картой
	7.	unavailable frames не ломают layer
	8.	frontend не занимается stitching/history-forecast logic

⸻

21. Explicit non-goals

В v1 pipeline не делает:
	•	optical flow
	•	storm-motion extrapolation
	•	AI nowcasting
	•	multi-model cloud blending
	•	confidence heatmap rendering
	•	cloud type classification for UI
	•	location-specific observing advice from cloud map

⸻

22. Practical MVP recommendation

Самый прагматичный вариант для релиза:
	•	history = nearest-hour satellite cloud frame
	•	forecast = hourly total cloud cover
	•	normalize = one raster grid
	•	render = transparent grayscale overlays
	•	publish = indexed static frame assets
	•	playback = step-by-step hourly through shared player

Это даёт контролируемый MVP без лишней магии.

Следующим шагом логично сделать ещё один прикладной блок:

Cloud Layer Source Policy v1 — то есть зафиксировать, какие источники разрешены, какие нежелательны, какие fallback’и допустимы, и по каким критериям мы выбираем primary provider.