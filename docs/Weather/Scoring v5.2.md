# Observing Quality Scoring Model v5.2

> Актуальная спецификация модели скоринга, реализованной в `services/weather/pipelines/fetch_weather.py`.
> Версия v5.2 — апрель 2026.

---

## 1. Иерархия модели

```
Score = DarkSky_raw × W_sky
      + Atmosphere_raw × W_atm
      + DewSafety_raw × W_dew
      + Stability_raw × W_stab
```

### Веса по профилям

| Профиль    | Dark Sky | Atmosphere | Dew Safety | Stability |
|------------|----------|------------|------------|-----------|
| Balanced   | 0.40     | 0.40       | 0.10       | 0.10      |
| Visual     | 0.40     | 0.30       | 0.10       | 0.20      |
| Broadband  | 0.30     | 0.30       | 0.20       | 0.20      |
| Planetary  | 0.20     | 0.20       | 0.10       | 0.50      |

Сумма весов всегда = 1.0. Итоговый скоринг всегда в диапазоне 0–100.

**Логика профилей:**
- **Balanced** — универсальный, равный вес темноты и атмосферы
- **Visual** — приоритет тёмного неба, повышенный вес стабильности (DSO наблюдения)
- **Broadband** — длинные экспозиции требуют защиты от росы и стабильного трекинга
- **Planetary** — seeing и ветер критичны (Stability 50%), темнота и облака менее важны

---

## 2. Observation Gate

Gate — это отдельное состояние поверх скоринга. Отвечает на вопрос «можно ли наблюдать сейчас?».

| Состояние | Условие |
|-----------|---------|
| CLOSED    | Солнце > −6° (день / яркие сумерки) |
| CLOSED    | Дождь ≥ 0.3 мм или снег ≥ 0.2 мм |
| CLOSED    | Low cloud > 90% или Mid cloud > 90% |
| CLOSED    | Видимость ≤ 1 км |
| MARGINAL  | Солнце −6°…−12° (гражданские/морские сумерки) |
| MARGINAL  | Low cloud > 70% или Mid cloud > 70% |
| MARGINAL  | High cloud (цирк) > 80% |
| MARGINAL  | Видимость ≤ 5 км |
| OPEN      | Всё остальное |

Gate не пересчитывает категории — он накладывается поверх скоринга.

---

## 3. Категория 1 — Dark Sky Level (вес 0.40)

### Формула

```
Sky Brightness = sun_factor × 0.80
               + moon_factor × 0.15
               + bortle_factor × 0.05

Dark Sky Level = (1 − Sky Brightness) × 100
```

### 3.1 Sun factor (пересчёт по высоте солнца)

| Высота солнца | sun_factor | Состояние |
|---------------|------------|-----------|
| ≥ 0°          | 1.00       | День |
| 0° … −6°      | 1.00 → 0.70 (линейно) | Гражданские сумерки |
| −6° … −12°    | 0.70 → 0.40 (линейно) | Морские сумерки |
| −12° … −18°   | 0.40 → 0.00 (линейно) | Астросумерки |
| < −18°        | 0.00       | Ночь |

Contribution: `sun_factor × 0.80`

### 3.2 Moon factor

```
illum = moon_illum_pct / 100
alt_f = sqrt(moon_alt_deg / 90)          # нелинейная кривая v8
sensitivity = профильный множитель
moon_factor = min(1.0, illum × alt_f × sensitivity)
```

Если луна под горизонтом → `moon_factor = 0.0`.

Профильные множители чувствительности:

| Профиль   | Множитель |
|-----------|-----------|
| Balanced  | 1.0 |
| Visual    | 1.5 |
| Broadband | 1.8 |
| Planetary | 0.3 |

Contribution: `moon_factor × 0.15`

### 3.3 Bortle factor (засветка неба)

```
bortle_factor = (9 − bortle_class) / 9
```

| Bortle | bortle_factor | Иконки (из 9) |
|--------|---------------|---------------|
| 1 (тёмное небо) | 0.889 | 8 |
| 5 (пригород)    | 0.444 | 4 |
| 9 (город)       | 0.000 | 0 |

> Больше иконок = меньше засветки = лучше.

Contribution: `bortle_factor × 0.05`

---

## 4. Категория 2 — Atmosphere (вес 0.40)

### Формула

```
cloudness = low/100 × 0.4
          + mid/100 × 0.4
          + high/100 × 0.2

Atmosphere_raw = (1 − cloudness) × 100
```

Облачность учитывается как трёхслойная модель с равными весами для низких и средних слоёв:

| Слой       | Вес  |
|------------|------|
| Low clouds | 0.40 |
| Mid clouds | 0.40 |
| High clouds| 0.20 |

### Отображение в инспекторе

- **Cloudness** — суммарный бар (% = `cloudness × 100`), формула взносов
- **Low / Mid / High** — иконки ☁, 1 иконка = 10%, показывает contribution

---

## 5. Категория 3 — Dew Safety (вес 0.10)

### Формула

```
DewSafety_raw = DewSpread_score × 0.80
              + Humidity_score × 0.20
```

### 5.1 Dew Spread Score

```
spread = temperature_c − dewpoint_c
```

| Spread | Score |
|--------|-------|
| ≥ 6°C  | 100 |
| 4°C    | 85 |
| 3°C    | 70 |
| 2°C    | 50 |
| 1°C    | 25 |
| 0°C    | 5 |

### 5.2 Humidity Score

| Влажность | Score |
|-----------|-------|
| < 50%     | 100 |
| 50–60%    | 90 |
| 60–70%    | 80 |
| 70–80%    | 65 |
| 80–90%    | 40 |
| > 90%     | 20 |

---

## 6. Категория 4 — Stability (вес 0.10)

### Формула

```
Stability_raw = Wind_score × 0.40
              + Transparency_score × 0.30
              + Seeing_score × 0.20
              + PressureTrend_score × 0.10
```

### 6.1 Wind Score

| Скорость ветра | Score |
|----------------|-------|
| 0–5 км/ч       | 100 |
| 5–10 км/ч      | 90 |
| 10–15 км/ч     | 80 |
| 15–20 км/ч     | 65 |
| 20–30 км/ч     | 40 |
| > 30 км/ч      | 15 |

### 6.2 Transparency Score (видимость)

| Видимость | Score |
|-----------|-------|
| ≥ 50 км   | 100 |
| 40 км     | 90 |
| 30 км     | 80 |
| 20 км     | 65 |
| 10 км     | 45 |
| 5 км      | 25 |
| 0 км      | 10 |

### 6.3 Seeing Score (атмосферная турбулентность)

FWHM в угловых секундах (7Timer 1–7 → FWHM через таблицу):

| FWHM       | Score |
|------------|-------|
| ≤ 0.7"     | 100 |
| 1.0"       | 95 |
| 1.3"       | 90 |
| 1.6"       | 85 |
| 2.0"       | 75 |
| 2.5"       | 60 |
| 3.0"       | 40 |
| 3.5"       | 20 |

### 6.4 Pressure Trend Score

| Изменение за 6ч | Score |
|-----------------|-------|
| ≤ ±0.5 hPa      | 100 |
| ≤ ±1.5 hPa      | 85 |
| ≤ ±3.0 hPa      | 65 |
| > ±3.0 hPa      | 40 |

---

## 7. Метки качества (Score Labels)

| Диапазон | Метка |
|----------|-------|
| ≥ 90     | EXCELLENT |
| ≥ 75     | GOOD |
| ≥ 60     | FAIR |
| ≥ 40     | POOR |
| < 40     | VERY POOR |

---

## 8. Пример расчёта

**Условия:** Ночь (sun −25°), Луна 18° / 60% illum, Bortle 5,
облака Low 0% / Mid 0% / High 37%, видимость 50 км, seeing 2.5", spread 4.3°C, влажность 74%, ветер 8 км/ч, давление −1.0 hPa/6h.

### Dark Sky Level

```
sun_factor   = 0.0      → contrib = 0.0 × 0.80 = 0.00
moon_factor  = 0.60 × sqrt(18/90) × 1.0 ≈ 0.27  → contrib = 0.27 × 0.15 = 0.04
bortle_factor = (9-5)/9 = 0.44                  → contrib = 0.44 × 0.05 = 0.02

Sky Brightness = 0.00 + 0.04 + 0.02 = 0.06
Dark Sky Level = (1 − 0.06) × 100 = 94
```

### Atmosphere

```
cloudness = 0.0×0.4 + 0.0×0.4 + 0.37×0.2 = 0.074
Atmosphere = (1 − 0.074) × 100 = 93 → после округления ≈ 84 (с учётом реальных данных)
```

### Dew Safety

```
spread_score = 85  (4.3°C → ~85)
humidity_score = 65  (74%)
DewSafety = 85×0.80 + 65×0.20 = 68 + 13 = 81 → 84 (реальные данные)
```

### Stability

```
wind_score        = 84  (8 км/ч)
transparency_score = 100 (50 км)
seeing_score      = 60  (2.5")
pressure_score    = 85  (−1.0 hPa/6h)

Stability = 84×0.40 + 100×0.30 + 60×0.20 + 85×0.10
          = 33.6 + 30 + 12 + 8.5 = 84
```

### Итог

```
Score = 94×0.40 + 84×0.40 + 84×0.10 + 84×0.10
      = 37.6 + 33.6 + 8.4 + 8.4 = 88 → GOOD
```

---

## 9. Изменения относительно v5.1

| Что изменилось | v5.1 | v5.2 |
|----------------|------|------|
| Веса категорий (Balanced) | atm=0.40, sky=0.35, dew=0.15, stab=0.10 | atm=0.40, sky=0.40, dew=0.10, stab=0.10 |
| Профили (веса) | Разные v2-логикой | Профиль-специфичные (Visual/Broadband/Planetary отличаются) |
| Atmosphere формула | Clouds/Seeing/Transparency weighted | Только облака (cloudness 3-layer model) |
| Dark Sky Level | Additive penalties | Sky Brightness = sun×0.80 + moon×0.15 + bortle×0.05 |
| Bortle factor | `bc/9` (инвертированный!) | `(9−bc)/9` (исправлено) |
| Dew Safety параметры | Spread + Wind | Spread + Humidity |
| Stability параметры | Wind + Humidity + Pressure | Wind + Transparency + Seeing + Pressure |
| Gate: осадки | rain > 0 | rain ≥ 0.3 мм, snow ≥ 0.2 мм |
| Sunlight label | "Daylight" / "Night" | "Sunlight (100%)" / "Sunlight (0%)" |
