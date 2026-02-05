# Аудит деплоймента на Staging

Цель: перечень всего, что должно попадать на стейджинг, и что мешает первому нормальному деплою после добавления TypeScript, бекенда (Functions) и новой погодной страницы.

---

## 1. Как сейчас устроен деплой

- **Корень сайта на стейджинге** = каталог `sites/staging/` (по README: «Cloudflare Pages деплоит только sites/staging/»).
- **Репозиторий** пушится в GitHub; деплой, скорее всего, идёт через Cloudflare Pages (подключённый к репо), без отдельного `wrangler.toml` в репо.
- **CI (cron)** только обновляет данные и коммитит в репо; сборки фронта или функций в CI нет:
  - `cron-news.yml` — пишет в `sites/staging/news/`, пушит.
  - `cron-calendar.yml` — пишет в `sites/staging/alerts/`, `sites/staging/calendar/`, пушит.
  - `cron-weather.yml` — пишет в `sites/staging/weather/` (и `services/weather/outputs/`), пушит.

То есть «деплой» = то, что лежит в `sites/staging/` в ветке (и при необходимости `functions/` для Pages Functions).

---

## 2. Что должно быть в репозитории для деплоя

### 2.1 Статика (корень = `sites/staging/`)

| Путь | Источник | Комментарий |
|------|----------|-------------|
| `index.html` | Сейчас **ручная правка** (iframe Weather). Шаблон в `frontend/build.py` генерирует **другой** index (инлайн-виджет). | Не запускать `make news-front` / `build.py` без доработки шаблона — перезатрёт текущий index. |
| `assets/css/base.css` | `frontend/build.py` копирует из `frontend/assets/` | |
| `assets/css/index_tabs.css` | то же | |
| `assets/css/widget_news.css` | генерируется build.py | |
| `assets/css/widget_calendar.css` | генерируется build.py | |
| `assets/css/widget_weather_poc.css` | копируется build.py (для старого виджета). Новая погода в iframe свои стили тянет из `/weather/`. | |
| `assets/js/widget_runtime.js` | копируется build.py | |
| `assets/js/widget_weather_poc.js` | копируется build.py. На текущем index не используется (погода в iframe). | |
| `assets/icons/alerts/*` | вручную / не трогается build.py | |
| `assets/icons/weather/*` | вручную | |
| `news/` (rss.xml, index.html, widget.js) | build.py + cron-news | |
| `calendar/` (daily_*.json, index.html, widget.js) | build.py + cron-calendar | |
| `alerts/rss.xml` | cron-calendar | |
| **`weather/`** | **Критично** | |
| `weather/index.html` | **Вручную** (новая SPA: вкладки Weather / Map / Astro). build.py генерирует **старую** страницу из шаблона и перезатрёт эту при `make weather-front`. | Не запускать полный build.py для weather без решения конфликта. |
| `weather/map-poc.html` | Вручную | Карта, магнитофон, ночь/луна. |
| `weather/daily_weather.json` | cron-weather (копия из `services/weather/outputs/`) или build.py копирует из outputs | Fallback для API; должен быть в репо и на деплое. |
| `weather/assets/weather.css` | Вручную | |
| `weather/core/state.js`, `utils.js` | Вручную | |
| `weather/widgets/**` (location, controls, weather, map, astro) | Вручную | JS/CSS каждого виджета. |
| `data/weather/locations.json` | weather pipeline (run_weather.py) | |
| `data/weather/loc/*.json` | weather pipeline | Статика по локациям. |
| `poc.html` | Вручную (старая POC-страница) | Опционально для стейджинга. |

Итого по статике: всё, что отдаётся по URL стейджинга, должно лежать под `sites/staging/`. Часть генерируется `frontend/build.py`, часть — пайплайнами (cron), часть — **только вручную** (новая погода: `weather/index.html`, `weather/map-poc.html`, `weather/widgets/`, `weather/core/`, `weather/assets/`).

### 2.2 Cloudflare Pages Functions (`/api/*`)

| Файл | Назначение | Зависимости |
|------|------------|-------------|
| `functions/api/astro-weather.ts` | GET `/api/astro-weather` (lat, lon, tz, hours, profile) | Импортирует из `../../services/astro_weather/` (TypeScript). |
| `functions/api/geocode.ts` | Геокодинг | |
| `functions/api/revgeo.ts` | Реверс-геокодинг | |

Для работы `astro-weather` нужна вся папка **`services/astro_weather/`** (TypeScript):

- `types.ts`, `merge.ts`, `score.ts`, `derived.ts`
- `providers/open_meteo.ts`, `providers/seven_timer.ts`

В Cloudflare Pages при деплое из репо папка `functions/` обрабатывается отдельно. Импорты вида `../../services/astro_weather/...` **вне** `functions/` по умолчанию не резолвятся.

**Сделано:** в репо добавлены сборка и make-таргет:

- **`package.json`** + devDependency **esbuild** + скрипт **`npm run build:functions`** (вызов из `scripts/build-functions.mjs`).
- Скрипт бандлит `functions/api/astro-weather.ts`, `geocode.ts`, `revgeo.ts` в **`functions/api/*.js`** (ESM, target es2020), все импорты из `services/astro_weather` вшиты в бандл.
- **`make functions-build`** — выполняет `npm ci` и `npm run build:functions`.
- **`make weather-front`** — сначала `make functions-build`, затем `python frontend/build.py` (с соблюдением preserve list).

Перед деплоем нужно один раз выполнить **`make functions-build`** (или в Cloudflare Build: `npm ci && npm run build:functions`), чтобы в репо/артефакте были актуальные `functions/api/*.js`. Тогда 500 на `/api/astro-weather` пропадают при наличии этих .js в деплое.

---

## 3. Конфликт устранён: preserve list в build.py

В **`frontend/build.py`** добавлен список путей, которые **не перезаписываются**:

- **`index.html`** — интегратор (iframe на `/weather/index.html`) сохраняется.
- **`weather/`** — весь каталог (SPA: weather/index.html, map-poc.html, widgets/, core/, assets/) не трогается.

При запуске `make weather-front` или `python frontend/build.py` генерируются только: news/, calendar/, assets/. Проверка: после `make weather-front` новая SPA погоды не пропадает.

---

## 4. Сводка: что нужно для «нормального» деплоя

1. **Конфликт build.py устранён** — preserve list: не перезаписываются `index.html` и `weather/**`.

2. **Деплой статики**
   - Убедиться, что в Cloudflare Pages в качестве output directory указан `sites/staging` (или эквивалент).
   - После этого всё перечисленное в п. 2.1 должно попадать на стейджинг из репо (и при необходимости из артефактов сборки, если решите генерировать часть через build).

3. **Деплой Functions (и устранение 500)** — сделано: `make functions-build` (или в CF Build: `npm ci && npm run build:functions`) собирает `functions/api/*.js`. Убедиться, что в деплое присутствуют эти .js и папка `functions/` обрабатывается Cloudflare.

4. **Данные**
   - Уже закрыты кронами: news, calendar, weather обновляются и коммитятся в репо. Нужно только убедиться, что после деплоя доступны:
     - `/weather/daily_weather.json`
     - `/data/weather/locations.json` и `data/weather/loc/*.json` (если используете мульти-локацию).

5. **Чек-лист перед следующим деплоем**
   - [x] build.py не перезаписывает index.html и weather/ (preserve list).
   - [x] Сборка Functions: `make functions-build` или в CF Build: `npm ci && npm run build:functions`.
   - [ ] Убедиться, что в репо/деплое есть актуальные: `sites/staging/index.html`, `sites/staging/weather/`, `functions/api/*.js`.
   - [ ] После деплоя проверить: главная, News, Calendar, вкладка Weather (iframe), Map, API без 500 на `/api/astro-weather`.

---

## 5. Файлы по категориям (краткий список)

**Генерируются build.py (index.html и weather/ не трогаются — preserve list):**  
`news/`, `calendar/`, `assets/css/*`, `assets/js/widget_runtime.js`, `assets/js/widget_weather_poc.js`.

**Генерируются только пайплайнами (cron):**  
`news/rss.xml`, `calendar/daily_*.json`, `alerts/rss.xml`, `weather/daily_weather.json` (cron-weather), `data/weather/` (run_weather.py).

**Только вручную (новая погода и текущий index):**  
`index.html` (с iframe), `weather/index.html` (SPA с вкладками), `weather/map-poc.html`, `weather/core/*`, `weather/widgets/**`, `weather/assets/weather.css`, `poc.html` (по желанию).

**Нужны для работы API:**  
`functions/api/*.ts` (исходники), `functions/api/*.js` (артефакт `make functions-build`), `services/astro_weather/**/*.ts` (вшиваются в бандл).
