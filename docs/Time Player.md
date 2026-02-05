Ок — вот “контракт” для времени и доступности слоёв, в виде документа/спеки. Можно просто вставлять в docs (например, docs/TIME_MODEL.md).

⸻

Nebulacast Time Model Spec (v1)

Цель

Сделать одну универсальную временную ось (timeline) и один проигрыватель (transport) для всех виджетов/слоёв (Weather, Map, Sun/Moon, Satellite, Model overlays).
Все компоненты синхронизируются через механизм сообщений (event bus).

⸻

1) Термины
	•	Timeline — глобальный диапазон времени и текущая позиция t.
	•	Transport — управление временем: шаг, play/pause, jump.
	•	Layer — любой визуальный слой/виджет, который зависит от времени (облачность, ночь, спутник, seeing и т.д.).
	•	Availability window — диапазон, в котором слой может отрисоваться по данным.

⸻

2) Нормализация времени

Единый формат времени
	•	В сообщениях и вычислениях используем UTC epoch milliseconds (number).
	•	Для отображения пользователю — конвертируем в tz выбранной локации.

Округление
	•	Базовая дискретизация timeline: 1 час.
	•	tUtcMs всегда должен быть aligned на час:
	•	tUtcMs = floorToHour(nowUtcMs) при инициализации или jump-to-now.
	•	При шаге: tUtcMs += stepHours * 3600_000.

⸻

3) Master Timeline (рекомендуемые значения)

Диапазон (по умолчанию)
	•	Past: now - 72h (3 суток назад)
	•	Future: now + 168h (7 суток вперёд)

То есть:
	•	startUtcMs = floorToHour(nowUtcMs - 72h)
	•	endUtcMs = floorToHour(nowUtcMs + 168h)

⸻

4) Transport State (единое состояние)

type TimelineState = {
  version: 1,
  nowUtcMs: number,     // текущий момент, UTC ms (не обязателен для рендера, но полезен)
  startUtcMs: number,   // начало master timeline (aligned to hour)
  endUtcMs: number,     // конец master timeline (aligned to hour)
  tUtcMs: number,       // текущая позиция (aligned to hour)
  stepHours: 1 | 3 | 6 | 12,
  playing: boolean,
  playDirection: 1 | -1,          // MVP: всегда 1 (вперёд), -1 опционально
  playIntervalMs: number,         // например 900 (0.9s) или 1200
  source: "user" | "system" | "restore" | "sync"
}

Инварианты
	•	startUtcMs <= tUtcMs <= endUtcMs
	•	tUtcMs aligned на час
	•	stepHours ограничен перечислением (можно расширить позже)

⸻

5) События шины (Event Bus Contracts)

5.1 timeline:init

Отправляется один раз при загрузке интегратора (например, weather/index.html) после определения nowUtcMs и диапазона.

{
  "type": "timeline:init",
  "v": 1,
  "timeline": { ...TimelineState }
}

5.2 timeline:changed

Отправляется при любом изменении времени (шаг, scrub, play, jump).

{
  "type": "timeline:changed",
  "v": 1,
  "timeline": { ...TimelineState },
  "reason": "step" | "scrub" | "play" | "pause" | "jump" | "bounds" | "tick"
}

5.3 timeline:tick

Опционально (если хотите отделить “тик” от “изменения параметров”).
В MVP можно не использовать и слать только timeline:changed с reason=tick.

⸻

6) Layer Metadata: Availability + Sampling

Каждый слой/виджет объявляет свои возможности. Это нужно для:
	•	UI: подсветить “data available / no data”
	•	fallback: спутник → модель, и т.п.

type LayerAvailability = {
  layerId: string, // "satellite_ir" | "cloud_model" | "night_mask" | ...
  title: string,
  kind: "raster" | "vector" | "compute" | "mixed",
  // диапазон, где слой гарантированно имеет данные
  availableFromUtcMs: number | null, // null = всегда можно посчитать
  availableToUtcMs: number | null,
  // предпочитаемая дискретизация данных слоя
  nativeStepMinutes: 60 | 15 | 10 | 5,
  // стратегия выбора кадра/значения, когда t не попадает точно
  sampling: "nearest" | "floor" | "ceil" | "interpolate",
  // поведение, если данных нет
  whenUnavailable: "hide" | "placeholder" | "fallback",
  // если fallback — к чему
  fallbackLayerId?: string
}

Событие: layer:availability

Каждый слой может публиковать это при инициализации и при обновлении данных.

{
  "type": "layer:availability",
  "v": 1,
  "layer": { ...LayerAvailability }
}


⸻

7) Поведение слоя при изменении времени

Любой слой слушает timeline:changed и делает:
	1.	Проверяет tUtcMs входит ли в availability window:

	•	если входит → отрисовывает состояние на tUtcMs
	•	если не входит:
	•	hide → выключает себя
	•	placeholder → показывает “no data”
	•	fallback → запрашивает fallbackLayerId (или вызывает fallback-рендер)

	2.	Если nativeStepMinutes != 60:

	•	выбирает frame по sampling:
	•	nearest: ближайший кадр к tUtcMs
	•	floor: ближайший кадр <= tUtcMs
	•	ceil: ближайший кадр >= tUtcMs
	•	interpolate: для численных полей (не для снимков)

⸻

8) Рекомендуемые default значения по слоям

Night mask (compute)
	•	availableFromUtcMs=null, availableToUtcMs=null
	•	nativeStepMinutes=60
	•	sampling=floor (или nearest — разницы нет при 1h)

Sun/Moon “Equation” (compute)
	•	availableFromUtcMs=null, availableToUtcMs=null
	•	nativeStepMinutes=60

Weather (model/forecast)
	•	availableFromUtcMs = floorToHour(nowUtcMs)
	•	availableToUtcMs = floorToHour(nowUtcMs + 168h)
	•	nativeStepMinutes=60

Satellite IR (raster)
	•	availableFromUtcMs = floorToHour(nowUtcMs - 72h)
	•	availableToUtcMs = floorToHour(nowUtcMs) (или now-1h, зависит от провайдера)
	•	nativeStepMinutes = 15 (если есть)
	•	sampling = nearest
	•	whenUnavailable = fallback, fallbackLayerId = "cloud_model"

⸻

9) UI Transport Control (Magnetophone)

Один контрол управляет timeline:
	•	|< jump to startUtcMs
	•	<< step back stepHours
	•	>/|| toggle play/pause (ticks каждые playIntervalMs)
	•	>> step forward stepHours
	•	(опционально) Now jump to floorToHour(nowUtcMs)
	•	step selector: 1h / 3h / 6h / 12h

При каждом действии публикуется timeline:changed.

⸻

10) Совместимость виджетов
	•	Интегратор (страница) отвечает за:
	•	создание TimelineState
	•	рендер transport UI
	•	публикацию timeline:init и timeline:changed
	•	Виджеты отвечают за:
	•	подписку на timeline:*
	•	отрисовку себя (и только себя)
	•	публикацию layer:availability (по желанию)

⸻

11) Минимальный payload (если хотите ещё проще)

Если нужно урезать для MVP:
	•	достаточно tUtcMs, stepHours, playing, source
	•	диапазон можно хранить только в транспорт-контроле

Но лучше держать full state, чтобы все виджеты были “самодостаточны”.

---

Ок — тогда даю чеклист внедрения (implementation checklist), чтобы вы с Кодексом сделали один общий transport и убрали “вторые таймеры” у карты/погоды/уравнения.

⸻

Implementation checklist (для Codex)

0) Цель итерации
	•	Ввести единый Timeline/Transport на странице-интеграторе (например, site/staging/weather/index.html или poc.html).
	•	Любые слои/виджеты (Weather, Map, Sun/Moon) не создают свои таймеры и не хранят своё время — только слушают события.
	•	При play/step/jump меняется всё видимое: карта (оверлеи), графики, карточки, любые слои.

⸻

A) Event Bus: единый канал сообщений

A1) Создать минимальный bus (если ещё нет)

site/staging/assets/js/bus.js (или где у вас принято):
	•	API:
	•	bus.emit(type, payload)
	•	bus.on(type, handler)
	•	Под капотом: window.dispatchEvent(new CustomEvent(...))

A2) Контракты событий

Использовать только:
	•	timeline:init
	•	timeline:changed

Payload (MVP):

{
  v: 1,
  timeline: {
    nowUtcMs, startUtcMs, endUtcMs,
    tUtcMs,
    stepHours, playing,
    playIntervalMs
  },
  reason: "init" | "step" | "jump" | "play" | "pause" | "tick"
}


⸻

B) Timeline state: один источник истины

B1) Инициализация

В интеграторе:
	•	вычислить:
	•	nowUtcMs = Date.now()
	•	startUtcMs = floorToHour(nowUtcMs - 72h)
	•	endUtcMs = floorToHour(nowUtcMs + 168h)
	•	tUtcMs = floorToHour(nowUtcMs)
	•	stepHours = 6 (или 1 по умолчанию, но для карты удобно 3/6)
	•	playing=false

Сразу после старта:
	•	bus.emit("timeline:init", {...})
	•	bus.emit("timeline:changed", {...reason:"init"})

B2) Утилиты времени

Добавить локально (в интегратор или общий util):
	•	floorToHour(ms)
	•	clamp(ms, start, end)

⸻

C) Transport UI (“магнитофон”) — только в интеграторе

C1) Кнопки и поведение

Реализовать:
	•	|< → tUtcMs = startUtcMs
	•	<< → tUtcMs -= stepHours
	•	>/||:
	•	если playing=false: стартовать setInterval на playIntervalMs
	•	если playing=true: остановить interval
	•	>> → tUtcMs += stepHours
	•	(опционально) Now → tUtcMs = floorToHour(nowUtcMs)
	•	выбор шага: 1h/3h/6h/12h

После каждого изменения:
	•	clamp
	•	emit timeline:changed

C2) Единственный таймер
	•	Таймер (setInterval) существует только в интеграторе.
	•	На каждом tick:
	•	tUtcMs += stepHours
	•	если вышли за endUtcMs: либо stop, либо wrap на startUtcMs (выберите одну стратегию, по умолчанию wrap).
	•	emit timeline:changed с reason=tick

⸻

D) Подключение виджетов (важное)

D1) Weather widget
	•	Удалить/отключить любые локальные таймеры и внутренние “selectedHour”.
	•	Подписаться на:
	•	timeline:init (установить локальный currentTUtcMs)
	•	timeline:changed (обновлять UI)
	•	Внутри виджета:
	•	найти ближайший час в hours[] к tUtcMs (по UTC ms) и показать как “Now/Current”.
	•	подсветку карточек часов сделать от tUtcMs.

D2) Map widget
	•	Удалить второй таймер и отдельный scrubber-тайм.
	•	Map widget:
	•	слушает timeline:changed
	•	пересчитывает все активные оверлеи под tUtcMs (night mask, moon overlay, cloud overlay, etc.)
	•	Если слой имеет данные только в прошлом:
	•	если tUtcMs > availableTo: либо hide, либо fallback на модель.

D3) Sun/Moon widget (“Sun Equation”)
	•	Никаких таймеров.
	•	Слушает timeline и двигает маркеры по синусоидам по tUtcMs.
	•	День для графика выбирается как localDate(tUtcMs, tz).

⸻

E) Data availability (MVP без сложной меты)

E1) Самый простой вариант

В каждом слое:
	•	canRender(tUtcMs) → true/false
	•	если false → “No data for this time” или fallback.

E2) Чуть лучше (но всё ещё быстро)

Каждый слой публикует:
	•	layer:availability (опционально)
Интегратор может отображать “иконки доступности” рядом с чекбоксами.

⸻

F) Удаление дублирующих контролов

F1) Убрать “второй scrubber”
	•	Карта и погода не рисуют свои timeline-контролы.
	•	Оставить один общий магнитофон + (опционально) один общий “time slider”.

Если вы хотите оставить ползунок:
	•	Он должен менять tUtcMs в интеграторе и слать timeline:changed.

⸻

G) Проверки (acceptance criteria)
	1.	Нажимаю >> — всё меняется синхронно:
	•	время в статусе,
	•	карта (night mask / moon / любой включенный слой),
	•	погода (текущий час, чипы, графики/карточки),
	•	sun/moon (позиции).
	2.	Нажимаю Play — один таймер в системе (проверяем в коде/логах).
	3.	Никаких “двойных” проигрывателей на странице.
	4.	При смене локации — timeline не ломается (может остаться тот же tUtcMs, просто данные обновятся).
