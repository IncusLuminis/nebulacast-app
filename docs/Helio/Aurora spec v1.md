Ниже — более подробная спецификация Aurora Probability Map, с учётом того, что у вас уже есть bitmap-карта авроры. Ключевая идея: не заменять её, а расширить — добавить координаты, вероятность и интерактивность для наблюдателя.

⸻

Aurora Probability Map — Spec v1

1. Purpose

Компонент Aurora Probability Map визуализирует текущий и прогнозируемый авроральный овал и показывает вероятность наблюдения сияния для выбранной точки на Земле.

Он отвечает на три вопроса:
	1.	Где сейчас проходит авроральный овал
	2.	Насколько сильна активность
	3.	Есть ли шанс увидеть аврору из моей локации

⸻

2. Relationship with existing aurora bitmap

У вас уже есть:

aurora bitmap

обычно это:

aurora oval probability map

Источник чаще всего:

NOAA OVATION Prime

Этот bitmap уже содержит:

probability field

то есть вероятность авроры по всей Земле.

⸻

Важный момент

Bitmap уже является probability map.

Поэтому новая функция не заменяет его, а добавляет:

geographic context
user interaction
location-based probability


⸻

3. Visual layers

Aurora map состоит из четырёх слоёв.

Base map
Aurora probability layer
Latitude grid
Observer marker


⸻

3.1 Base map

Минимальная карта:

polar projection

или

north hemisphere view

можно использовать:

simple earth outline

или тот же базовый стиль, что и в Weather Map.

⸻

3.2 Aurora probability layer

Используется существующий bitmap.

Он показывает:

auroral oval


⸻

Цветовая шкала

Рекомендуется использовать стандарт NOAA:

Probability	Color
0–10%	transparent
10–30%	green
30–60%	yellow
60–90%	red
90–100%	white


⸻

3.3 Latitude grid

Нужно добавить линии:

50°
60°
70°
80°

Это помогает пользователю понять где проходит овал.

⸻

3.4 Observer marker

На карте показывается:

observer location

например:

Warsaw


⸻

4. Map projection

Лучше использовать:

north polar projection

пример:

orthographic polar

или

azimuthal equidistant

Причины:
	•	аврора концентрируется у полюсов
	•	лучше читается овал

⸻

5. Data source

Основной источник:

NOAA OVATION Prime

обновляется каждые:

5 minutes

содержит:

aurora probability

по всей Земле.

⸻

6. Data format

Типичный продукт:

global raster

например:

1024 × 512

или

2048 × 1024

где каждый пиксель = вероятность.

⸻

7. Probability sampling

Чтобы показать вероятность для пользователя, нужно взять значение из растра.

Алгоритм:

lat, lon → raster coordinates

далее:

probability = raster[x,y]


⸻

Пример

Warsaw
lat 52.23
lon 21.01

результат:

probability = 6%


⸻

8. UI behavior

Opening map

Клик по блоку:

Aurora

открывает:

popover

или

modal


⸻

Default view

Показывается:

north polar map

с текущим авроральным овалом.

⸻

9. Hover interaction

При наведении на карту:

lat, lon
probability

пример:

Aurora probability
42%


⸻

10. Observer panel

Под картой отображается:

Observer location
Aurora probability
Best time tonight

пример:

Warsaw
Aurora probability: 6%
Best chance: after 23:00


⸻

11. Center on location

Кнопка:

Center on my location

центрирует карту на пользователе.

⸻

12. Timeline support (optional)

Можно добавить переключение:

now
+1h
+3h
+6h

если есть прогноз.

Но для MVP достаточно:

current aurora oval


⸻

13. Performance

Aurora bitmap небольшой.

Типичный размер:

100–300 KB

Можно обновлять:

каждые 5–10 минут


⸻

14. Integration with Helio

В Helio отображается:

Aurora: Possible

или

Aurora: Low

Клик открывает карту.

⸻

15. Integration with Sky

Если:

aurora probability > 20%

Sky console может показывать:

Aurora possible tonight
Look north


⸻

16. Edge cases

Daylight

Если солнце выше горизонта:

aurora invisible

но вероятность всё равно можно показывать.

⸻

Cloud cover

Aurora map не учитывает:

clouds

это отдельный фактор.

⸻

17. MVP scope

Для первого релиза достаточно:

existing aurora bitmap
polar map
observer marker
probability sampling
hover value


⸻

18. Why this is powerful

Большинство сайтов показывает:

aurora oval

Но почти никто не показывает:

probability at user location

Это превращает карту из красивой картинки в:

decision tool

для наблюдателя.

⸻

19. Future upgrades

Позже можно добавить:

aurora forecast
magnetic latitude
darkness overlay
cloud overlay

и тогда получится очень мощный aurora forecast tool.

⸻

Если хочешь, могу ещё показать одну очень важную вещь для этой карты, которую почти никто не реализует, но она радикально повышает точность:

Aurora visibility map = aurora probability × darkness × cloud cover.