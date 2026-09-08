Cloud Layer Render Policy v1

1. Purpose

Эта спецификация фиксирует правила визуального рендера облачного слоя.

Она отвечает на вопросы:
	•	как cloud field превращается в картинку
	•	какие цвета используются
	•	какая прозрачность
	•	как избежать “молочной карты”
	•	как избежать скачка между history и forecast
	•	как избежать мерцания между кадрами
	•	какой формат файлов используется
	•	какие размеры и проекции применяются

Цель:
сделать визуально стабильный слой облаков, который хорошо работает поверх карты и не конфликтует с другими слоями (изобары, ветер).

⸻

2. Rendering goals

Cloud layer должен:
	•	показывать структуру облаков
	•	не скрывать полностью карту
	•	не конфликтовать с изобарами
	•	не конфликтовать с ветром
	•	выглядеть одинаково в history и forecast
	•	не мерцать при анимации

⸻

3. Canonical visual variable

Pipeline работает с одной переменной:

cloud_opacity_0_100

где

0   = clear sky
100 = dense overcast

Рендер использует только эту величину.

⸻

4. Color palette

Для MVP используется монохромная облачная палитра.

Причины:
	•	не конфликтует с weather layers
	•	не конфликтует с изобарами
	•	визуально нейтральна
	•	не создаёт ложных “температурных” сигналов

⸻

4.1 Base color

Рекомендуемый цвет облаков:

RGB(255,255,255)

или

RGB(240,240,240)

Важно:

цвет должен быть почти белым, но не чисто белым.

⸻

4.2 Optional soft tint

Можно добавить лёгкий серый тон:

RGB(230,230,235)

Это уменьшает “жёсткость” белого.

⸻

5. Alpha mapping

Прозрачность — ключевой параметр.

Если сделать линейную прозрачность, карта станет либо:
	•	слишком прозрачной
	•	либо молочно-белой.

Поэтому используется нелинейная mapping функция.

⸻

5.1 Recommended opacity mapping

cloud value     alpha
-----------------------
0–10            0.00–0.06
10–20           0.06–0.12
20–30           0.12–0.20
30–40           0.20–0.32
40–50           0.32–0.45
50–60           0.45–0.60
60–70           0.60–0.72
70–80           0.72–0.82
80–90           0.82–0.90
90–100          0.90–0.95


⸻

5.2 Why non-linear

Потому что:
	•	лёгкая облачность должна быть едва заметна
	•	средняя облачность должна читаться
	•	плотная облачность должна доминировать

⸻

6. Cloud smoothing

Сырые данные часто имеют:
	•	пиксельность
	•	grid artifacts
	•	резкие границы

Нужен лёгкий smoothing.

⸻

6.1 Allowed smoothing

Gaussian blur
radius: 1–2 px

или

bilinear smoothing


⸻

6.2 Forbidden smoothing

Нельзя:
	•	размазывать на десятки пикселей
	•	превращать облака в “туман”

Цель smoothing — убрать grid artifacts, а не изменить структуру облаков.

⸻

7. Spatial resolution

Render resolution должна быть фиксированной.

Для MVP рекомендуется:

1024 x 1024

или

1280 x 720

Если карта имеет фиксированный viewport.

⸻

7.1 Tile option

Если карта использует tile pyramid:

256x256 tiles

Но это усложняет pipeline.

Для MVP чаще проще использовать single raster overlay.

⸻

8. Projection policy

Все кадры должны иметь одинаковую проекцию.

Рекомендуется:

Web Mercator

Причина:
	•	стандарт для web maps
	•	совпадает с большинством tile providers

⸻

9. Raster format

Рекомендуемый формат:

WebP

Причины:
	•	меньше размер
	•	поддерживает alpha
	•	быстрее грузится

Fallback:

PNG


⸻

10. Frame size limits

Каждый кадр должен быть:

< 300 KB

Рекомендуемый target:

100–200 KB

Это важно для анимации.

121 кадр может иначе стать слишком тяжёлым.

⸻

11. File naming policy

Файлы должны иметь строгое индексное имя.

cloud_000.webp
cloud_001.webp
cloud_002.webp
...
cloud_120.webp

Почему:
	•	player работает по индексу
	•	не нужно парсить время

⸻

12. Directory layout

Рекомендуемая структура:

assets/
  weather/
    map/
      clouds/
         cloud_000.webp
         cloud_001.webp
         ...


⸻

13. Visual consistency rule

History и forecast должны выглядеть одинаково.

Это критично.

⸻

13.1 Must match

History и forecast должны совпадать по:
	•	palette
	•	alpha mapping
	•	smoothing
	•	projection
	•	resolution

⸻

13.2 Forbidden

Нельзя делать:

history = satellite grayscale
forecast = blue cloud blobs

Это разрушает анимацию.

⸻

14. Seam policy (0h boundary)

Стык между history и forecast:

t = 0h

Это самая опасная точка.

⸻

14.1 Visual rules

Разрешено:
	•	slight smoothing
	•	одинаковая palette
	•	одинаковая alpha mapping

⸻

14.2 Forbidden

Нельзя:
	•	менять color palette
	•	менять opacity scale
	•	менять resolution

⸻

15. Anti-flicker rules

При анимации часто возникает:

frame flicker

Причины:
	•	слишком резкие изменения opacity
	•	шум в данных
	•	резкие grid artifacts

⸻

15.1 Mitigation

Pipeline может применять:

temporal smoothing

Например:

frame[i] =
0.7 * raw[i]
+0.3 * raw[i-1]

Но только лёгкое сглаживание.

⸻

16. Missing frame rendering

Если frame unavailable:

asset_url = null

Frontend:
	•	просто не рисует cloud layer
	•	timeline не ломается

Нельзя:
	•	автоматически копировать соседний кадр
	•	создавать fake continuity

⸻

17. Opacity hint

Каждый frame может иметь:

opacity_hint

Это просто подсказка frontend.

Например:

0.85

Но frontend может её игнорировать.

⸻

18. Visual compatibility with other layers

Cloud layer должен быть совместим с:

base map

должна быть видна

isobars

не должны теряться

wind

не должны быть скрыты

⸻

18.1 Recommended stacking order

base map
cloud layer
isobars
wind vectors


⸻

19. Frame generation performance

Pipeline не должен генерировать 121 кадр слишком долго.

Рекомендуемый target:

< 30 seconds

Для всей генерации.

Если больше — нужно кэширование.

⸻

20. Render cache policy

Каждый кадр может быть кэширован по ключу:

anchor_utc + slot_index + render_version

Если параметры не изменились — кадр можно переиспользовать.

⸻

21. Render versioning

Важно иметь:

render_version

Например:

cloud_render_v1

Если меняется:
	•	palette
	•	alpha mapping
	•	smoothing

старые кадры не должны использоваться.

⸻

22. Debug mode

Pipeline должен поддерживать debug output.

Например:

cloud_debug_048.png

где видно:
	•	raw cloud field
	•	rendered field

Это помогает при настройке opacity.

⸻

23. Acceptance criteria

Cloud render policy считается выполненной если:
	1.	все кадры имеют одинаковый стиль
	2.	history и forecast выглядят одинаково
	3.	нет молочной карты
	4.	нет сильного мерцания
	5.	изобары и ветер читаются поверх облаков
	6.	карта остаётся читаемой
	7.	player анимирует облака плавно

⸻

24. Recommended next spec

Мы уже описали:
	•	Cloud Model
	•	Cloud Pipeline
	•	Cloud Source Policy
	•	Cloud Render Policy

Остался один важный кусок.

Weather Map Player Integration Spec

Потому что сейчас у вас уже:

Sky player
Weather map
Helio
Alerts

и нужно правильно описать единый timeline controller, иначе компоненты начнут рассинхронизироваться.