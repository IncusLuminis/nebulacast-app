Подход разумный. Для MVP лучше добавить функциональность без изменения архитектуры.
Тогда Map остаётся частью weather, и мы просто расширяем её возможностями.

Ниже аккуратная MVP-спека для Map, согласованная с тем, что вы описали.

⸻

Weather Map Component — MVP Spec v1

1. Scope

Компонент Map остаётся внутри домена:

weather

Его задача в MVP — визуализировать облачность и погодные условия во времени вокруг текущей локации.

Без сложной пространственной аналитики, без decision-engine.

Цель:
	•	показать динамику облаков
	•	дать пространственный контекст погоде
	•	синхронизироваться по времени с другими компонентами (hourly cards, sky)

⸻

2. Temporal Coverage

Карта должна покрывать 5 суток во времени.

-48h   historical satellite imagery
  0h   current conditions
+72h   forecast

Итого:

[-2 days … +3 days]


⸻

Источники

прошлое (−48h)

используется:

satellite cloud imagery

например:
	•	EUMETSAT
	•	NOAA GOES / Meteosat
	•	любой используемый сейчас слой

⸻

будущее (+72h)

используется:

forecast cloud model

например:
	•	ICON
	•	ECMWF
	•	GFS
	•	Meteoblue

(конкретный провайдер — не часть UI спеки)

⸻

3. Time Model

Time step

рекомендуемый шаг:

1 hour

Это идеально совпадает с:

hourly weather cards


⸻

Time axis

t = -48h … +72h


⸻

Time index

0 = current hour


⸻

4. Player System

Карта должна использовать тот же плеер, что и компонент Sky.

Не отдельный.

⸻

Причина

В интерфейсе появляется единое время системы.

Все компоненты синхронно реагируют:

Sky
Weather
Map
Alerts


⸻

Player behavior

Player управляет:

global_time_index

Все компоненты читают его.

⸻

Player controls

Минимально:

play
pause
step forward
step backward
scrub timeline


⸻

Playback speed

пример:

1 frame / second

но это уже implementation detail.

⸻

5. Cloud Animation

Главная новая функция.

⸻

Cloud layer

Карта должна показывать:

cloud coverage


⸻

Animation

При воспроизведении player:

cloud layer changes per hour

Получается:

cloud motion animation


⸻

Требования
	•	визуально плавно
	•	не обязательно физически интерполировать
	•	допустимо step animation

⸻

Важное требование

Модель должна быть достаточно точной, потому что это ключевой слой для наблюдателей.

⸻

6. Map Layers

Добавляем два дополнительных слоя.

⸻

Layer 1 — Isobars

Тип:

pressure isobars


⸻

Purpose

Помогает понять:

cyclones
fronts
weather systems

Это полезно для понимания:
	•	устойчивости атмосферы
	•	движения облаков

⸻

Visualization

тонкие линии давления:

1000 hPa
1005
1010
1015
1020


⸻

Default

OFF

включается пользователем.

⸻

Layer 2 — Wind

Тип:

wind vectors


⸻

What to show

direction
speed


⸻

Visualization

например:

arrows
barbs
particles

Минимально:

arrows


⸻

Default

OFF

потому что визуально перегружает карту.

⸻

7. Layer Control

Пользователь должен иметь возможность включать слои.

⸻

UI control

простая панель:

Layers


⸻

Available layers

Clouds      (default ON)
Isobars     (OFF)
Wind        (OFF)


⸻

8. Map Layout

Компонент состоит из:

MapCard

внутри:

Header
MapViewport
LayerControls


⸻

Header

Weather Map

	•	возможно freshness indicator.

⸻

MapViewport

основная карта.

Содержит:

cloud layer
optional layers


⸻

LayerControls

минимальная панель:

Clouds
Isobars
Wind


⸻

9. Synchronization with Other Components

Map должен синхронизироваться с:

Sky
Weather hourly cards
Alerts

через:

shared player time


⸻

Example

Если player установлен на:

+5h

то:

Map → показывает облачность +5h
Weather cards → показывают +5h
Sky → показывает sky +5h


⸻

10. Zoom Behavior

Для MVP:

фиксированный региональный zoom.

Например:

Europe scale
или
500–800 km radius around location

Без сложной геопространственной логики.

⸻

11. Location Marker

На карте должна быть видна:

current observing location


⸻

Marker

small crosshair or dot


⸻

12. Performance Requirements

Map animation может быть тяжелой.

Поэтому:
	•	использовать тайлы
	•	избегать heavy vector overlays
	•	не загружать все 120 кадров сразу

⸻

Recommended approach

lazy loading:

frames loaded on demand


⸻

13. MVP Feature Summary

Итого Map MVP должен иметь:

Animation

✔ облачность
✔ 72h forecast
✔ 48h history

⸻

Time integration

✔ общий player
✔ синхронизация с Sky

⸻

Layers

✔ clouds (default)
✔ isobars
✔ wind vectors

⸻

Map basics

✔ location marker
✔ simple layer toggle

⸻

14. Explicitly Out of Scope (Release 1)

Для первого релиза не делаем:
	•	composite observing map
	•	best nearby observing zones
	•	spatial weather scoring
	•	cloud motion vectors
	•	precipitation animation
	•	humidity overlays
	•	pressure tendency fields
	•	mobility hints
	•	route suggestions

⸻

15. Release Strategy

Release 1 включает:

Helio
Weather Map improvements
existing Sky
existing Alerts

После этого можно выходить в production.

⸻

Release 2 (later)

Во втором релизе:

Scoring v6
Sky improvements
Map spatial reasoning
advanced alerts


⸻

16. MVP Definition of Done

Map считается готовой для релиза если:

✔ облака анимируются на [-48h … +72h]
✔ player синхронизирован со Sky
✔ можно включить изобары
✔ можно включить ветер
✔ карта стабильна
✔ нет визуального перегруза

⸻

Если хотите, в следующем шаге я могу сделать очень важную вещь для Map, которую обычно забывают:

Weather Map Data Contract v1
