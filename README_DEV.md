# Local Development Setup

## Quick Start

### Option 1: Dev Server with API (Recommended)

Запускает локальный сервер с поддержкой API endpoints:

```bash
make server-api
# или
python3 infra/scripts/dev_api_server.py 8080
```

Открой: http://localhost:8080/poc.html

**Что работает:**
- ✅ `/api/astro-weather` - использует существующий Python код из `services/weather/pipelines/fetch_weather.py`
- ✅ `/api/geocode` - поиск городов через Nominatim
- ✅ `/api/revgeo` - обратная геокодировка через Nominatim
- ✅ Статичные файлы из `sites/staging/`

### Option 2: Static Files Only (Fallback)

Если API не нужен, используй обычный сервер:

```bash
make server
# или
bash infra/scripts/serve_local.sh
```

В этом случае `poc.html` автоматически использует fallback на статичные JSON из `/data/weather/loc/`.

## Cloudflare Pages Functions (Production)

Для полной функциональности на Cloudflare Pages:

1. Установи Wrangler: `npm install -g wrangler`
2. Запусти локально: `wrangler pages dev sites/staging`
3. Или задеплой: `wrangler pages deploy sites/staging`

## Troubleshooting

**API возвращает 404:**
- Убедись, что запущен `make server-api` (не просто `make server`)
- Проверь, что установлены зависимости: `make deps-weather`

**Geocode не работает:**
- Проверь интернет-соединение (использует Nominatim API)
- Если Nominatim недоступен, используй presets или Advanced (ручной ввод координат)
