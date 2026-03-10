

Phase 0 — Stabilize v5

Цель: закрепить текущую архитектуру.

Что делаем:
	•	реализуем hierarchical scoring
	•	проверяем корректность:
	•	Atmosphere
	•	Sky Darkness
	•	Dew Risk
	•	Stability
	•	тестируем profile weights
	•	проверяем Gate logic

Выход:

stable scoring core

Это важно: v6 будет просто менять источники внутри категорий, не архитектуру.

⸻

Phase 1 — Data Layer Refactor

Перед подключением новых источников нужно изменить backend архитектуру.

Сейчас данные выглядят примерно так:

weather.json
sunmoon.json

Для v6 лучше сделать слойную модель.

Новый формат:

{
  "time": "...",

  "atmosphere": { ... },
  "sky": { ... },
  "transparency": { ... },
  "dew": { ... },
  "stability": { ... }
}

Это позволит:

plug new sources easily

Задачи:
	•	создать normalized internal schema
	•	написать data adapters

Например:

7timer_adapter.py
meteoblue_adapter.py
gfs_adapter.py


⸻

Phase 2 — Jet Stream Integration

Это самый простой и очень полезный апгрейд.

Источник:

NOAA GFS

Что вытаскиваем:

wind_200hPa
wind_300hPa

Новая метрика:

JetStreamScore

Алгоритм:

jet_speed < 20 m/s → excellent
20–30 → good
30–40 → moderate
>40 → poor

Использование:

SeeingScore correction

Это резко улучшает прогноз seeing.

⸻

Phase 3 — Aerosol Transparency

Подключаем Copernicus CAMS.

Параметр:

AOD550

Новая метрика:

TransparencyScore_v6

Алгоритм:

AOD	transparency
<0.05	excellent
0.05–0.1	good
0.1–0.2	moderate
>0.2	poor

После этого можно выбросить proxy transparency из v5.

⸻

Phase 4 — Moon Sky Brightness Model

Сейчас используется простая модель.

Нужно внедрить:

Krisciunas & Schaefer moonlight model

Она учитывает:

moon phase
moon altitude
angular separation
airmass

Результат:

sky brightness mag/arcsec²

Это делает DSO scoring намного точнее.

⸻

Phase 5 — Airmass Integration

Добавляем object geometry.

Новая метрика:

AirmassScore

Формула:

X = 1/(cos(z) + 0.50572*(96.07995 - z)^-1.6364)

Использование:

object visibility scoring

Например:

altitude < 25° → strong penalty

Это делает систему object-aware.

⸻

Phase 6 — Coherence Time

Источник:

Meteoblue Astronomy

Параметр:

τ₀ (coherence time)

Использование:

planetary imaging score

Потому что:

long coherence → stable wavefront


⸻

Phase 7 — Advanced Dew Model

Расширяем dew.

Добавляем:

radiative cooling model

Параметры:

dew_spread
wind
humidity
cloud cover

Результат:

dew_probability


⸻

Phase 8 — Forecast Confidence

Считаем разброс моделей.

Используем:

GFS
ECMWF
ICON

Метрика:

forecast_confidence

UI:

confidence: high / medium / low


⸻

Финальная архитектура v6

Observing Quality

  Atmosphere
      seeing
      coherence_time
      jet_stream
      turbulence

  Transparency
      AOD
      extinction

  Sky Darkness
      moon brightness model
      bortle baseline

  Dew
      dew_probability

  Stability
      wind
      pressure


⸻

Реалистичный порядок внедрения

Лучший порядок:

1 Jet Stream
2 Aerosol transparency
3 Moon brightness model
4 Airmass integration
5 Coherence time
6 Advanced dew model
7 Forecast confidence

Почему:
	•	первые четыре дают 80% улучшения
	•	остальные — refinement.

⸻

Как это реализовывать технически

Каждый новый источник должен идти через adapter layer.

Пример:

data/
  adapters/
      gfs.py
      cams.py
      meteoblue.py

Каждый возвращает:

NormalizedAtmosphereData
NormalizedSkyData

Scoring engine работает только с нормализованными данными.

⸻

Самое важное правило v6

Архитектурное:

scoring engine must not know data sources

Он должен знать только:

parameters

Это позволит:

swap data providers easily

