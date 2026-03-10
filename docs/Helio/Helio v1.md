Ниже — рабочая v1-спека для Space Weather в формате, который уже можно отдавать в реализацию.

1. Цель компонента

Компонент Space Weather не должен быть просто витриной SWPC-метрик.
Его задача — отвечать на три вопроса:
	1.	Что происходит сейчас?
	2.	Что ожидается в ближайшие 24 часа?
	3.	Что это значит для наблюдателя?

Из этого следуют три слоя:
	•	ingest — забираем и нормализуем сырые SWPC-данные
	•	interpreter — превращаем сырой feed в понятные события и observer-oriented summary
	•	UI model — отдаем фронту уже готовые блоки для отображения

⸻

2. Архитектурное решение

2.1. Выходной артефакт

Вводим отдельный dataset:

sites/staging/sky/data/space_weather_now.json

Он должен быть самодостаточным и содержать:
	•	текущее состояние
	•	forecast по Kp
	•	нормализованные шкалы G/R/S
	•	интерпретированные события
	•	observer summary
	•	aurora hint
	•	raw-сводку только как вспомогательный слой

2.2. Принцип

UI не должен разбирать SWPC-коды.
UI должен работать только с готовой presentation model.

То есть:
	•	pipeline Python/TS собирает и нормализует feed
	•	interpreter классифицирует события
	•	виджет только рисует hero, metrics, forecast, observer_impacts, alerts_preview, alerts_all

Это минимизирует логику во фронте и упрощает дальнейшее развитие.

⸻

3. JSON contract v1

3.1. Полная структура

{
  "updated_utc": "2026-03-09T01:17:00Z",
  "source": {
    "provider": "SWPC",
    "products": [
      "planetary_k_index_1m",
      "kp_forecast_3d",
      "alerts",
      "xray_flux",
      "solar_wind"
    ]
  },
  "hero": {
    "status": "quiet",
    "label": "Quiet",
    "summary": "Quiet geomagnetic conditions. No significant observer impact.",
    "kp_latest": 2.3,
    "kp_time_utc": "2026-03-09T00:00:00Z",
    "g_scale": "G0",
    "r_scale": "R0",
    "s_scale": "S0",
    "xray_class": "B",
    "xray_flux_wm2": 6.2e-7,
    "solar_wind_kms": 503,
    "imf_bz_nt": null
  },
  "forecast": {
    "kp_max_next_24h": 3.7,
    "kp_max_at_utc": "2026-03-09T06:00:00Z",
    "trend": "steady",
    "kp_3h": [
      { "t_utc": "2026-03-09T00:00:00Z", "kp": 2.3 },
      { "t_utc": "2026-03-09T03:00:00Z", "kp": 2.7 },
      { "t_utc": "2026-03-09T06:00:00Z", "kp": 3.7 },
      { "t_utc": "2026-03-09T09:00:00Z", "kp": 3.0 }
    ]
  },
  "aurora_hint": {
    "aurora_possible": false,
    "aurora_min_lat_est": null,
    "aurora_label": "none",
    "summary": "No meaningful aurora chance at mid-latitudes."
  },
  "observer_impacts": [
    {
      "kind": "aurora",
      "level": "none",
      "label": "Aurora",
      "summary": "No meaningful aurora chance for most users."
    },
    {
      "kind": "radio",
      "level": "low",
      "label": "Radio impact",
      "summary": "No major radio blackout expected."
    },
    {
      "kind": "solar_activity",
      "level": "low",
      "label": "Solar activity",
      "summary": "Low flare activity."
    }
  ],
  "alerts_preview": [
    {
      "t_utc": "2026-03-08T14:58:00Z",
      "kind": "radio_blackout",
      "domain": "R",
      "severity": 1,
      "severity_label": "minor",
      "title": "Minor radio blackout warning",
      "summary_short": "Brief HF radio degradation possible.",
      "source_code": "WARK04",
      "relevance": 0.76
    }
  ],
  "alerts_all": [
    {
      "t_utc": "2026-03-08T14:58:00Z",
      "kind": "radio_blackout",
      "domain": "R",
      "severity": 1,
      "severity_label": "minor",
      "title": "Minor radio blackout warning",
      "summary_short": "Brief HF radio degradation possible.",
      "source_code": "WARK04",
      "raw_title": "Space Weather Message Code: WARK04",
      "relevance": 0.76
    }
  ],
  "raw": {
    "alerts_count": 101
  }
}


⸻

4. Типы данных

4.1. Status enums

export type SpaceWeatherStatus =
  | "quiet"
  | "active"
  | "elevated"
  | "storm";

export type ImpactLevel =
  | "none"
  | "low"
  | "moderate"
  | "high";

export type AuroraLabel =
  | "none"
  | "possible"
  | "good";

export type EventKind =
  | "geomagnetic_storm"
  | "radio_blackout"
  | "radiation_storm"
  | "solar_flare"
  | "cme_arrival"
  | "aurora_watch"
  | "space_weather_info"
  | "unknown";

export type EventDomain = "G" | "R" | "S" | "flare" | "cme" | "info" | "unknown";

4.2. Scale fields

export type GScale = "G0" | "G1" | "G2" | "G3" | "G4" | "G5";
export type RScale = "R0" | "R1" | "R2" | "R3" | "R4" | "R5";
export type SScale = "S0" | "S1" | "S2" | "S3" | "S4" | "S5";
export type XRayClass = "A" | "B" | "C" | "M" | "X" | null;


⸻

5. TypeScript interfaces

export interface SpaceWeatherMetricPoint {
  t_utc: string;
  kp: number;
}

export interface SpaceWeatherHero {
  status: "quiet" | "active" | "elevated" | "storm";
  label: string;
  summary: string;
  kp_latest: number | null;
  kp_time_utc: string | null;
  g_scale: "G0" | "G1" | "G2" | "G3" | "G4" | "G5";
  r_scale: "R0" | "R1" | "R2" | "R3" | "R4" | "R5";
  s_scale: "S0" | "S1" | "S2" | "S3" | "S4" | "S5";
  xray_class: "A" | "B" | "C" | "M" | "X" | null;
  xray_flux_wm2: number | null;
  solar_wind_kms: number | null;
  imf_bz_nt: number | null;
}

export interface SpaceWeatherForecast {
  kp_max_next_24h: number | null;
  kp_max_at_utc: string | null;
  trend: "falling" | "steady" | "rising" | "unknown";
  kp_3h: SpaceWeatherMetricPoint[];
}

export interface AuroraHint {
  aurora_possible: boolean;
  aurora_min_lat_est: number | null;
  aurora_label: "none" | "possible" | "good";
  summary: string;
}

export interface ObserverImpact {
  kind: "aurora" | "radio" | "solar_activity";
  level: "none" | "low" | "moderate" | "high";
  label: string;
  summary: string;
}

export interface SpaceWeatherEvent {
  t_utc: string;
  kind:
    | "geomagnetic_storm"
    | "radio_blackout"
    | "radiation_storm"
    | "solar_flare"
    | "cme_arrival"
    | "aurora_watch"
    | "space_weather_info"
    | "unknown";
  domain: "G" | "R" | "S" | "flare" | "cme" | "info" | "unknown";
  severity: number | null;
  severity_label: string | null;
  title: string;
  summary_short: string;
  source_code: string | null;
  raw_title?: string | null;
  relevance: number;
}

export interface SpaceWeatherNow {
  updated_utc: string;
  source: {
    provider: "SWPC";
    products: string[];
  };
  hero: SpaceWeatherHero;
  forecast: SpaceWeatherForecast;
  aurora_hint: AuroraHint;
  observer_impacts: ObserverImpact[];
  alerts_preview: SpaceWeatherEvent[];
  alerts_all: SpaceWeatherEvent[];
  raw: {
    alerts_count: number;
  };
}


⸻

6. Нормализация метрик

6.1. Kp

Источник:
	•	latest Kp
	•	forecast по 3 часа

Нормализация:
	•	kp.latest
	•	kp_time_utc
	•	forecast.kp_3h[]
	•	forecast.kp_max_next_24h
	•	forecast.kp_max_at_utc

6.2. G / R / S scales

Если прямых шкал нет в feed:
	•	вычислять из событий
	•	брать максимум за актуальное окно, например 24–48 часов
	•	если нет подтвержденных событий — G0 / R0 / S0

Принцип:
	•	G — geomagnetic
	•	R — radio blackout
	•	S — solar radiation storm

6.3. X-ray

Нормализуем:
	•	xray_flux_wm2
	•	xray_class

Классы:
	•	A, B, C, M, X

Для UI важен в первую очередь класс, а не полная scientific raw value.

6.4. Solar wind

Нормализуем:
	•	solar_wind_kms

6.5. IMF Bz

Если есть стабильный feed:
	•	imf_bz_nt

Если нет:
	•	поле оставляем null
	•	UI умеет скрывать ячейку

⸻

7. Интерпретатор событий

Это центральная часть.

7.1. Вход

Сырые записи alert/feed SWPC:

interface RawSwpcAlert {
  message: string;
  issued_utc: string;
  code?: string | null;
  url?: string | null;
}

7.2. Выход

Нормализованный SpaceWeatherEvent.

7.3. Логика классификации

Geomagnetic

Если запись относится к geomagnetic storm / geomagnetic watch / aurora-related geomagnetic enhancement:

kind = "geomagnetic_storm"
domain = "G"
severity = 1..5 | null

Radio blackout

Если запись связана с radio blackout / X-ray flare impact on radio:

kind = "radio_blackout"
domain = "R"
severity = 1..5 | null

Radiation storm

Если запись про energetic particles / proton event / radiation storm:

kind = "radiation_storm"
domain = "S"
severity = 1..5 | null

Solar flare

Если есть явный flare class M/X и событие не лучше классифицируется как R-scale:

kind = "solar_flare"
domain = "flare"
severity = null
severity_label = "M" | "X"

CME

Если запись про CME arrival / CME expected / shock arrival:

kind = "cme_arrival"
domain = "cme"
severity = null

Generic info

Если это просто info message без явного operational impact:

kind = "space_weather_info"
domain = "info"
severity = null


⸻

8. Severity mapping

8.1. G/R/S

function severityLabel(domain: "G" | "R" | "S", severity: number | null): string | null {
  if (severity == null) return null;
  if (severity <= 1) return "minor";
  if (severity === 2) return "moderate";
  if (severity === 3) return "strong";
  if (severity === 4) return "severe";
  return "extreme";
}

8.2. X-ray class

function xrayClassFromFlux(flux: number | null): "A" | "B" | "C" | "M" | "X" | null {
  if (flux == null || flux <= 0) return null;
  if (flux < 1e-7) return "A";
  if (flux < 1e-6) return "B";
  if (flux < 1e-5) return "C";
  if (flux < 1e-4) return "M";
  return "X";
}


⸻

9. Relevance ranking для alerts

Нельзя показывать preview просто по времени.
Нужен ranking.

9.1. Базовые веса

const EVENT_BASE_RELEVANCE: Record<string, number> = {
  geomagnetic_storm: 1.00,
  cme_arrival: 0.95,
  radio_blackout: 0.90,
  radiation_storm: 0.88,
  solar_flare: 0.75,
  aurora_watch: 0.72,
  space_weather_info: 0.30,
  unknown: 0.20
};

9.2. Модификаторы
	•	severity выше → relevance выше
	•	свежее событие → relevance выше
	•	info/watch ниже warning
	•	duplicate/similar events можно дедуплицировать или понижать

Пример:

function computeRelevance(event: SpaceWeatherEvent, nowMs: number): number {
  const base = EVENT_BASE_RELEVANCE[event.kind] ?? 0.2;
  const sevBoost = event.severity != null ? event.severity * 0.08 : 0;
  const ageHours = Math.max(0, (nowMs - Date.parse(event.t_utc)) / 3600000);
  const freshness = Math.max(0.15, 1 - ageHours / 72);
  return Number((base + sevBoost) * freshness);
}

9.3. Preview

В alerts_preview показываем:
	•	top 3 на desktop compact
	•	до 5 в expanded widget mode

⸻

10. Aurora hint

Это отдельный observer-oriented вывод.

10.1. Вход
	•	latest Kp
	•	max forecast Kp next 24h
	•	при наличии — geomagnetic watch/storm events
	•	при наличии — IMF Bz

10.2. Простая v1-логика

Без Bz можно уже сделать рабочую эвристику:

function estimateAurora(maxKp24h: number | null): {
  aurora_possible: boolean;
  aurora_min_lat_est: number | null;
  aurora_label: "none" | "possible" | "good";
} {
  if (maxKp24h == null) {
    return { aurora_possible: false, aurora_min_lat_est: null, aurora_label: "none" };
  }

  if (maxKp24h < 4) {
    return { aurora_possible: false, aurora_min_lat_est: null, aurora_label: "none" };
  }

  if (maxKp24h < 6) {
    return { aurora_possible: true, aurora_min_lat_est: 60, aurora_label: "possible" };
  }

  return { aurora_possible: true, aurora_min_lat_est: 55, aurora_label: "good" };
}

Это грубая, но понятная эвристика.

10.3. Ограничения
	•	это не персональный aurora forecast
	•	не надо обещать aurora visibility для конкретной локации
	•	формулировка должна быть осторожной:
	•	Possible at high latitudes
	•	Good chance at high latitudes
	•	не You will see aurora

⸻

11. Observer impacts

Виджет должен иметь отдельный смысловой блок.

11.1. Блоки

Минимум 3 категории:
	•	aurora
	•	radio
	•	solar_activity

11.2. Правила

Aurora

Берем из aurora_hint.

Radio
	•	R0 => none/low
	•	R1 => low
	•	R2-R3 => moderate
	•	R4-R5 => high

Solar activity
	•	B/C class => low
	•	M => moderate
	•	X => high

11.3. Пример генерации

function buildObserverImpacts(
  aurora: AuroraHint,
  rScale: string,
  xrayClass: string | null
): ObserverImpact[] {
  const impacts: ObserverImpact[] = [];

  impacts.push({
    kind: "aurora",
    level: aurora.aurora_label === "good" ? "moderate" : aurora.aurora_label === "possible" ? "low" : "none",
    label: "Aurora",
    summary: aurora.summary
  });

  const radioLevel =
    rScale === "R0" ? "none" :
    rScale === "R1" ? "low" :
    rScale === "R2" || rScale === "R3" ? "moderate" : "high";

  impacts.push({
    kind: "radio",
    level: radioLevel,
    label: "Radio impact",
    summary:
      radioLevel === "none"
        ? "No major radio blackout expected."
        : radioLevel === "low"
        ? "Minor HF radio impact possible."
        : radioLevel === "moderate"
        ? "Noticeable HF radio degradation possible."
        : "Strong radio blackout conditions possible."
  });

  const solarLevel =
    xrayClass === "X" ? "high" :
    xrayClass === "M" ? "moderate" :
    xrayClass ? "low" : "none";

  impacts.push({
    kind: "solar_activity",
    level: solarLevel,
    label: "Solar activity",
    summary:
      solarLevel === "high"
        ? "High flare activity."
        : solarLevel === "moderate"
        ? "Elevated flare activity."
        : solarLevel === "low"
        ? "Low flare activity."
        : "No significant solar flare signal."
  });

  return impacts;
}


⸻

12. Hero status rules

Нужен один итоговый статус для верхней карточки.

12.1. Правило

function deriveHeroStatus(
  kpLatest: number | null,
  gScale: string,
  rScale: string,
  sScale: string,
  xrayClass: string | null
): "quiet" | "active" | "elevated" | "storm" {
  if (gScale >= "G3" || rScale >= "R3" || sScale >= "S3" || xrayClass === "X") {
    return "storm";
  }
  if (gScale >= "G1" || rScale >= "R1" || sScale >= "S1" || xrayClass === "M" || (kpLatest ?? 0) >= 5) {
    return "elevated";
  }
  if ((kpLatest ?? 0) >= 4) {
    return "active";
  }
  return "quiet";
}

Лучше сравнение строк заменить на нормальные numeric helpers, но логика именно такая.

12.2. Label mapping

const HERO_LABELS = {
  quiet: "Quiet",
  active: "Active",
  elevated: "Elevated",
  storm: "Storm Risk"
};


⸻

13. UI spec v1

13.1. Верхняя зона

Сейчас:
	•	большая карточка Kp
	•	справа пару метрик

Нужно:
	•	один hero summary
	•	внутри:
	•	status label
	•	summary
	•	Kp latest
	•	badges: Gx, Rx, Sx

Пример

Space Weather
Quiet
Quiet geomagnetic conditions. No significant observer impact.

Kp 2.3   G0   R0   S0

13.2. Key metrics row

4 компактные ячейки:
	•	Solar Wind
	•	X-ray
	•	IMF Bz
	•	Aurora

Если imf_bz_nt == null, ячейка скрывается.

13.3. Forecast

Не просто одинаковые прямоугольники, а:
	•	короткий summary сверху:
	•	Peak Kp next 24h: 3.7 at 06:00 UTC
	•	ниже compact trend strip / bars

13.4. Observer Impact

Новый блок:
	•	Aurora
	•	Radio impact
	•	Solar activity

Каждая строка:
	•	label
	•	badge/level
	•	short summary

13.5. Alerts

collapsed state

Показываем:
	•	заголовок SWPC Alerts (101)
	•	только alerts_preview

expanded state

Показываем:
	•	preview + full normalized list

карточка события

Не raw-код первым, а human label:

[Warning] Minor radio blackout warning
Brief HF radio degradation possible.
8 Mar, 14:58 UTC

И уже мелко:
SWPC code: WARK04

⸻

14. Правила текстов для UI

Нельзя использовать в главном слое бессмысленные для пользователя названия вроде:
	•	ALTK05
	•	WARK04
	•	Space Weather Message Code

Они должны жить только в detail level.

Главные тексты должны быть human-readable:
	•	Minor radio blackout warning
	•	Geomagnetic activity may increase
	•	Elevated flare activity
	•	Possible aurora at high latitudes

⸻

15. Дедупликация событий

В feed могут быть серии похожих сообщений.

Нужна простая дедупликация:
	•	если same kind + same severity + within 6h
	•	оставлять наиболее свежую или наиболее содержательную запись

Иначе alerts_preview будет забит повторами.

⸻

16. Пайплайн реализации

Phase 1 — быстрый выигрыш
	1.	Собрать space_weather_now.json
	2.	Реализовать interpreter raw alerts -> normalized events
	3.	Сделать alerts_preview
	4.	Заменить raw codes в UI на human-readable title

Phase 2 — observer layer
	1.	Добавить hero.status
	2.	Добавить observer_impacts
	3.	Добавить aurora_hint

Phase 3 — polish
	1.	Переделать forecast rendering
	2.	Добавить imf_bz_nt, если feed стабилен
	3.	Дедупликация и ranking событий
	4.	Ввести цветовую семантику уровней

⸻

17. Риски и границы

Риски
	•	SWPC raw feed может быть неоднородным
	•	коды сообщений могут приходить в разных форматах
	•	imf_bz может оказаться нестабильным по источнику
	•	простая aurora-эвристика не должна подаваться как точный прогноз

Границы v1
	•	не делаем персонализированный aurora forecast
	•	не строим научный dashboard для space weather experts
	•	не добавляем десятки solar-plasma метрик
	•	не пытаемся объяснить всю heliophysics внутри виджета

⸻
18. Recommended file structure

The Space Weather domain should be isolated under a dedicated internal namespace:
	•	internal domain name: helio
	•	user-facing label: Space Weather

This keeps the architecture clean:
	•	sky → observable sky, targets, visibility, object scoring
	•	weather → terrestrial atmospheric conditions
	•	helio → solar-terrestrial activity, geomagnetic conditions, aurora, SWPC alerts

Recommended structure:

services/helio/
  pipelines/
    run_phase1.py
  providers/
    noaa_swpc.py
  normalizers/
    helio_now.py

sites/staging/data/
  helio_now.json

sites/staging/js/widgets/
  helio/
    helio.types.ts
    helio.model.ts
    helio.render.ts
    helio.interpret.ts

During transition, legacy and new datasets may coexist temporarily:

sites/staging/data/
  space_weather_now.json   # legacy
  helio_now.json           # new

After migration, the legacy dataset and old component should be removed.

Naming convention:
	•	internal service/module/dataset prefix: helio
	•	UI title shown to users: Space Weather

Examples:
	•	pipeline: services/helio/pipelines/gen_helio.py
	•	provider: services/helio/providers/noaa_swpc.py
	•	normalizer: services/helio/normalizers/helio_now.py
	•	dataset: sites/staging/data/helio_now.json
	•	widget folder: sites/staging/js/widgets/helio/

⸻

19. Minimal presentation-model API for frontend

To keep the frontend simple, the widget should consume a ready-to-render presentation model derived from helio_now.json.

export interface HelioCardModel {
  updatedUtc: string;
  hero: {
    label: string;
    summary: string;
    kp: number | null;
    g: string;
    r: string;
    s: string;
  };
  metrics: Array<{
    key: "solar_wind" | "xray" | "imf_bz" | "aurora";
    label: string;
    value: string;
    tone: "quiet" | "low" | "moderate" | "high";
  }>;
  forecastSummary: string;
  forecastPoints: Array<{
    tUtc: string;
    kp: number;
  }>;
  impacts: Array<{
    label: string;
    level: "none" | "low" | "moderate" | "high";
    summary: string;
  }>;
  alertsPreview: Array<{
    title: string;
    summary: string;
    tUtc: string;
    level: "info" | "watch" | "warning";
  }>;
  alertsAllCount: number;
}

Recommended module split:
	•	helio.types.ts — raw domain types and enums
	•	helio.model.ts — mapper from helio_now.json to HelioCardModel
	•	helio.interpret.ts — alert/event interpretation helpers
	•	helio.render.ts — DOM rendering only

Frontend rule:
	•	rendering code must not parse SWPC raw codes directly
	•	all interpretation must happen in helio.interpret.ts or upstream in backend normalization

This preserves a clean separation:
	•	backend/domain layer → ingest + normalize + interpret
	•	frontend/model layer → adapt normalized data to UI
	•	frontend/render layer → paint the widget only

⸻

20. Что делать следующим сообщением

Логично идти так:
	1.	я пишу mapping spec для интерпретатора SWPC alerts
	2.	потом — готовый TypeScript file space_weather.types.ts + space_weather.model.ts
	3.	потом — Python/TS generator skeleton для space_weather_now.json

Следующий шаг лучше сделать как полный рабочий блок: space_weather.types.ts и space_weather.model.ts.