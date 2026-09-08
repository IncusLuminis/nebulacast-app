Архитектурно имеет смысл сразу зафиксировать паттерн, который потом масштабируется на все метрики (IMF Bz, Kp, Seeing, Clouds и т.д.).

⸻

Architecture — Cockpit Control Pattern (IMF Bz)

1. Концепт

Cockpit ≠ “карточка с данными”
Cockpit = индикатор состояния системы + поток среды

Для IMF Bz это:
	•	не просто число
	•	а ориентация межпланетного магнитного поля
	•	которая напрямую влияет на coupling

Значит UI должен показывать:
	1.	направление (north/south)
	2.	величину
	3.	состояние coupling
	4.	динамику (implicit)

⸻

2. Визуальная метафора

Ближайший аналог:
	•	авионика / spaceflight HUD
	•	горизонтальный “energy channel”
	•	поток частиц
	•	фиксированная ось (Earth ↔ Sun)

⸻

3. Компоненты контрола

Base Layer (Static Frame)
	•	горизонтальная шкала: -20 ... 0 ... +20 nT
	•	центр (0) — жестко выделен
	•	левый сектор — “Southward”
	•	правый — “Northward”

Field Indicator (Primary Signal)
	•	маркер (caret / triangle / notch)
	•	позиция = значение Bz
	•	цвет:
	•	green → northward
	•	red → southward
	•	neutral → около 0

Flow Layer (Critical UX)
	•	анимированный поток частиц слева направо (Sun → Earth)
	•	интенсивность = solar wind speed
	•	деформация линии = Bz

Coupling Gate (Key Differentiator)
	•	overlay-индикатор состояния:
	•	CLOSED → тонкая линия, поток “скользит”
	•	OPEN → поток “впитывается” (визуально уходит вниз/в магнитосферу)

⸻

4. Варианты визуализации

Variant A — Clean Cockpit (baseline)

Минималистичный, пригоден как дефолт:

[====----|----====]
        ▲
       +2.6

	•	поток — subtle
	•	подходит для встраивания

⸻

Variant B — Plasma Channel (рекомендуемый)

Идея: “магнитный канал”
	•	шкала превращается в полупрозрачный туннель
	•	внутри:
	•	движущиеся частицы
	•	slight turbulence
	•	маркер — как “магнитная стрелка”

При southward:
	•	поток усиливается
	•	добавляется “втягивание”

⸻

Variant C — Split Field (наиболее выразительный)

Разделение:
	•	верх: Bz orientation
	•	низ: coupling interaction

[ Bz Axis ]
   ▲

[ Interaction Layer ]
<<<< plasma flow >>>>

Используется для detail view

⸻

5. Цветовая система (Cockpit)

Состояние	Цвет
Northward Bz	teal/green
Southward Bz	amber/red
Neutral	grey
Coupling open	bright accent
Coupling closed	dimmed


⸻

6. Данные → UI mapping

Bz          → marker position
Bt          → glow intensity (optional)
Solar Wind  → flow speed
Pressure    → channel thickness (optional)
Coupling    → gate state


⸻

7. Поведение

Idle
	•	слабый поток
	•	маркер статичен

Active (high wind)
	•	ускорение частиц
	•	легкая вибрация канала

Southward (critical)
	•	усиление контраста
	•	возможно предупреждающий оттенок

⸻

8. API контрола

type IMFControlProps = {
  bz: number;          // nT
  bt: number;          // nT
  solarWind: number;   // km/s
  pressure: number;    // nPa
  coupling: "open" | "closed" | "marginal";
};


⸻

9. Расширяемость

Этот же паттерн можно использовать для:
	•	Kp → шкала активности
	•	Seeing → turbulence channel
	•	Clouds → opacity layer
	•	Light pollution → background glow

⸻

10. Риски
	1.	Перегруз анимацией → потеря читаемости
	2.	Слишком sci-fi → теряется “научность”
	3.	Непонятность coupling → нужна легенда

⸻

11. Рекомендация

Начать с:

Variant B — Plasma Channel

Причина:
	•	хорошо передает физику
	•	масштабируется
	•	выглядит “как система”, а не просто UI

===
Ниже — визуальные wireframes для трёх вариантов. Без лишней графики, но уже в стилистике cockpit (XXIII century console).

⸻

Variant A — Clean Cockpit (Baseline)

┌────────────────────────────────────────────────────────────┐
│ IMF Bz · COUPLING                                          │
│                                                            │
│  -20      -10        0        +10        +20 nT             │
│  ──────────┬─────────┼─────────┬──────────                  │
│            │         │         │                            │
│            │         ▲         │                            │
│            │       +2.6        │                            │
│                                                            │
│  Bz: +2.6 nT     Bt: 3.8 nT                                │
│  Wind: 493 km/s  Pressure: 0.31 nPa                        │
│                                                            │
│  STATUS: NORTHWARD · MAGNETOSPHERE STABLE                  │
│  COUPLING: CLOSED                                          │
└────────────────────────────────────────────────────────────┘

Особенности:
	•	Чистая шкала
	•	Минимум “шума”
	•	Маркер — основной фокус
	•	Почти без анимации

⸻

Variant B — Plasma Channel (Recommended)

┌────────────────────────────────────────────────────────────┐
│ IMF Bz · SOLAR WIND CHANNEL                                │
│                                                            │
│  ╭──────────────────────────────────────────────────────╮  │
│  │  >>>>>> >>> >>>>>>> >>>>> >>>>>> >>> >>>>>>>         │  │
│  │                                                      │  │
│  │        ▲                                             │  │
│  │      +2.6                                            │  │
│  │                                                      │  │
│  │  >>>>> >>>>>>> >>> >>>>>> >>>>> >>>>>>> >>>>>>>       │  │
│  ╰──────────────────────────────────────────────────────╯  │
│     -20      -10       0       +10       +20 nT            │
│                                                            │
│  FLOW: 493 km/s   PRESSURE: 0.31 nPa                       │
│                                                            │
│  COUPLING GATE: CLOSED  ▒▒▒▒▒▒▒▒▒                          │
│  (flow glides along boundary)                              │
└────────────────────────────────────────────────────────────┘

Особенности:
	•	Канал (туннель)
	•	Поток частиц (анимируемый)
	•	Маркер “внутри среды”
	•	Coupling визуально влияет на поток

⸻

Variant C — Split Field (Advanced / Detail View)

┌────────────────────────────────────────────────────────────┐
│ IMF Bz · FIELD INTERACTION VIEW                            │
│                                                            │
│  [ Bz AXIS ]                                               │
│                                                            │
│  -20      -10        0        +10        +20 nT             │
│  ──────────┬─────────┼─────────┬──────────                  │
│            │         ▲         │                            │
│            │       +2.6        │                            │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  [ SOLAR WIND INTERACTION ]                                │
│                                                            │
│  >>>>>> >>>>>>> >>>>>>> >>>>>>> >>>>>>> >>>>>>             │
│             ↓↓↓↓↓                                          │
│         (absorption / coupling zone)                       │
│                                                            │
│  >>>>>>> >>>>>>> >>>>>>> >>>>>>> >>>>>>> >>>>>>            │
│                                                            │
│  COUPLING: CLOSED                                          │
│  MODE: STABLE MAGNETOSPHERE                                │
└────────────────────────────────────────────────────────────┘

Особенности:
	•	Разделение на:
	•	сигнал (Bz)
	•	физический процесс (interaction)
	•	Лучше объясняет физику
	•	Подходит для “Details / Drill-down”

⸻

Быстрое сравнение

Variant	Назначение	Сложность	Вау-эффект
A	Compact widget	Low	Medium
B	Main cockpit control	Medium	High
C	Detailed panel	High	Very High


⸻

Рекомендация

Для текущего этапа:
	•	В прод: Variant B
	•	В fallback/embedded: Variant A
	•	В “Details”: Variant C

⸻