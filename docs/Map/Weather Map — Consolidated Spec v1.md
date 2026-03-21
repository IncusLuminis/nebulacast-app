Ниже — консолидированная итоговая спека Map v1, собранная из всех твоих файлов с устранением конфликтов и добавлением недостающих связок.

Я не переписывал всё с нуля — а:
	•	зафиксировал единый контракт
	•	синхронизировал pipeline ↔ render ↔ data ↔ player
	•	убрал противоречия (grid vs raster, data vs assets, sky vs weather)
	•	чётко развёл ответственность

⸻

Weather Map — Consolidated Spec v1

0. Positioning (фиксируем раз и навсегда)
	•	Компонент: weather/widgets/map
	•	Домен: weather (НЕ sky)
	•	Назначение: time-driven spatial visualization of clouds + weather context

Это согласуется с базовой Map MVP логикой  ￼

⸻

1. Core Architecture (итоговая схема)

Объединяем все спеки в одну цепочку:

Sources
  ├── Satellite (history)
  └── Forecast model

        ↓

Cloud Pipeline
  (timeline + normalization + rasterization)

        ↓

Rendered Assets (WebP/PNG frames)

        ↓

weather_map_now.json
  (timeline + layer manifests)

        ↓

Map Component (frontend)

        ↓

Global Player (shared time)

Это прямое развитие pipeline flow  ￼ + data contract  ￼ + player spec  ￼

⸻

2. Single Source of Truth

Ключевое решение

Frontend НЕ строит ничего сам.

Backend обязан выдать:

один timeline
один слой clouds
полностью синхронизированные frames

Это критическое правило из Data Contract  ￼

⸻

3. Timeline Model (единый для всей системы)

Диапазон

[-48h … +72h]

Шаг

1 hour

Размер

121 frames

Индексы

0   = -48h
48  = now
120 = +72h

Anchor

anchor_utc = floor_to_hour(now_utc)

(жёстко фиксировано pipeline)  ￼

⸻

4. Source Model (жёсткая политика)

Разделение сегментов

t <= 0h  → satellite (history/current)
t > 0h   → forecast model

Это обязательное правило  ￼

⸻

Allowed sources

History
	•	Meteosat / EUMETSAT (Europe)
	•	GOES / NOAA (Americas)

Forecast
	•	один стабильный hourly provider
	•	(Open-Meteo / ECMWF / ICON и т.д.)

⸻

Запрещено
	•	mixing providers per frame
	•	mixing satellite + model в одном слоте
	•	silent fallback
	•	красивые картинки без нормализации

⸻

5. Canonical Cloud Model

Внутренняя переменная

cloud_opacity_0_100

0   = clear
100 = overcast

Это единая переменная для:
	•	pipeline
	•	render
	•	map

(сводим всё к одному знаменателю)  ￼  ￼

⸻

6. Pipeline (итоговая версия)

Полностью принимаем pipeline как основу, но фиксируем границы.

Stages
	1.	anchor time
	2.	fetch satellite (-48h..0h)
	3.	fetch forecast (0h..+72h)
	4.	build timeline (121 frames)
	5.	normalize cloud field
	6.	normalize spatial grid
	7.	rasterize frames
	8.	publish assets
	9.	build layer manifest

￼

⸻

Ключевое уточнение (важное исправление)

👉 В pipeline НЕ остаётся grid на выходе
👉 Финальный продукт = rendered raster frames

То есть:

grid → internal only
raster → external contract

Это убирает конфликт между:
	•	grid-идеей
	•	render policy
	•	data contract

⸻

7. Spatial Model

Canonical output
	•	единый raster
	•	фиксированный размер

Рекомендуем:

1024x1024
или
1280x720

￼

⸻

Projection

Web Mercator


⸻

8. Render Model (фиксируем окончательно)

Цвет

white / light gray

НЕ цветная карта

⸻

Альфа (нелинейная)

0–10    → почти прозрачный
50      → средняя плотность
90+     → почти непрозрачный

(детали из Render Policy)  ￼

⸻

Сглаживание
	•	лёгкий gaussian blur (1–2px)
	•	без “тумана”

⸻

Ключевое правило

history == forecast visually identical

(это критично для анимации)

⸻

9. Asset Model

Формат

WebP (preferred)
PNG (fallback)


⸻

Naming

cloud_000.webp
...
cloud_120.webp


⸻

Размер

100–200 KB target
<300 KB max


⸻

Путь

/assets/weather/map/clouds/


⸻

10. Data Contract (итоговая интеграция)

Используем:

weather_map_now.json

￼

⸻

Главная структура

timeline.frames[]
layers.clouds.frames[]
layers.isobars.frames[]
layers.wind.frames[]


⸻

Ключевая синхронизация

frames[i] MUST align across:
- timeline
- clouds
- isobars
- wind


⸻

Cloud frame

{
  "index": 48,
  "t_utc": "...",
  "available": true,
  "asset_type": "image",
  "asset_url": "..."
}


⸻

11. Cloud Layer (итоговая версия)

Обязательный слой

clouds.enabled_by_default = true

Источники
	•	history → satellite
	•	forecast → model

НО:

👉 frontend этого не знает
👉 видит единый слой

⸻

12. Map Component (UI)

Состав
	•	Header
	•	MapViewport
	•	LayerControls

⸻

Слои

Layer	Default
Clouds	ON
Isobars	OFF
Wind	OFF

￼

⸻

Map behavior
	•	фиксированный регион (MVP)
	•	location marker
	•	без сложной геометрии

⸻

13. Player Integration (критическая часть)

Single global player

global_time_index

￼

⸻

Map logic

frame = clouds.frames[index]
render(frame)


⸻

Без интерполяции

step animation only


⸻

Lazy loading

load only needed frames
prefetch ±5


⸻

14. Seam (самое опасное место)

Граница:

t = 0h

Разрешено
	•	одинаковый render
	•	smoothing
	•	единый стиль

Запрещено
	•	менять palette
	•	менять opacity
	•	менять resolution

￼

⸻

15. Failure Model

Frame-level failure

available = false
asset_url = null

Timeline не ломается.

⸻

Segment failure

Case	Behavior
history missing	forecast работает
forecast missing	history работает
both missing	layer unavailable


⸻

16. Performance Strategy

Обязательно
	•	caching (3 уровня)
	•	lazy loading
	•	small assets

Target

full pipeline < 30 sec
frame switch < 50 ms

￼

⸻

17. What changed vs исходные спеки

Вот ключевые корректировки:

1. Убрана двойная модель (grid vs raster)

→ grid только внутри pipeline
→ наружу только raster

2. Жёстко зафиксирован data contract как единственный источник правды

3. Убрана любая зависимость от sky

4. Сведены в одно:
	•	pipeline
	•	render
	•	contract
	•	player

5. Уточнён seam и визуальная консистентность

⸻

18. MVP Definition of Done (финальный)

Map v1 готов если:
	•	есть unified timeline [-48h … +72h]
	•	облака анимируются по часам
	•	history + forecast stitched без скачка
	•	используется один player
	•	слои синхронизированы
	•	карта читаема (не “молочная”)
	•	нет фликера
	•	отсутствующие кадры не ломают систему

⸻

19. Главный архитектурный вывод

Это не “weather layer”.

Это:

time-driven raster animation system
с единым timeline и единым player

Cloud layer — просто первый (и главный) consumer этого механизма.