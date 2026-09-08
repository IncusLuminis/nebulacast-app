Ок, тогда фиксируем это как первый полноценный дизайн-артефакт + контракт UI-компонента, а не просто “картинку”.

Ниже — уже готовая спека уровня “можно отдавать в реализацию”.

⸻

IMF Bz Control — Spec v1 (LAB_1960)

1. Назначение

Отображение текущего значения IMF Bz как:
	•	знака (north/south)
	•	величины (позиция на шкале)
	•	стабильности (визуальная динамика)

Контрол должен читаться без текста.

⸻

2. Данные (без изменений контракта)

Источник — существующий JSON (alerts / helio_now):

{
  "bz": 2.6,
  "bt_total": 3.8,
  "solar_wind": 493,
  "pressure": 0.31
}

Контракт не меняем (соответствует общей политике  ￼).

⸻

3. Нормализация

const BZ_MIN = -20;
const BZ_MAX = +20;

function normalizeBz(bz: number): number {
  return Math.max(BZ_MIN, Math.min(BZ_MAX, bz));
}

function toPosition(bz: number): number {
  // 0..1
  return (bz - BZ_MIN) / (BZ_MAX - BZ_MIN);
}


⸻

4. Визуальная модель

4.1 Layout (фиксированный)

|---------------------------------------------|
| IMF BZ · COUPLING                          |
|                                             |
|   -20   -10    0    +10    +20              |
|   |-----|------|-----|------|               |
|             ▲                               |
|                                             |
|  STATUS LINE                                |
|---------------------------------------------|


⸻

5. Слои (строго разделены)

5.1 Panel Layer

Материал:
	•	тёмный металл (#1c1f22)
	•	лёгкая зернистость
	•	винты (опционально)

⸻

5.2 Scale Layer

Шкала:
	•	диапазон: -20 … +20 nT
	•	major ticks: 10 nT
	•	minor ticks: 2 nT

Цвет:
	•	base: #d8d2b0 (пожелтевший)
	•	fade к краям

Нулевая линия:
	•	толще остальных
	•	слегка подсвечена

⸻

5.3 Indicator Layer (ключевой)

Тип:
→ светящаяся вертикальная линия (НЕ стрелка)

x = toPosition(bz) * width

Цвет:

if (bz > 0) color = "#7CFFB2"     // northward
if (bz < 0) color = "#FF8A5B"     // southward

Глоу:
	•	слабый gaussian blur
	•	не размывать шкалу

⸻

5.4 Glass Layer
	•	лёгкие отражения
	•	1–2 диагональных блика
	•	opacity ~0.1–0.2

⸻

5.5 Noise Layer (аналоговый эффект)

x += random(-0.3px, +0.3px)

частота: 5–10 Hz

⸻

6. Поведение

6.1 Обновление значения

currentX = lerp(prevX, targetX, 0.1)

→ медленное “подползание”, как у прибора

⸻

6.2 Стабильность (важно)

Если |Δbz| < 0.2:
→ почти нет движения

Если скачок:
→ быстрый переход + затухание

⸻

6.3 Saturation

Если bz выходит за диапазон:
	•	индикатор упирается в край
	•	усиливается glow

⸻

7. Семантика (визуальная)

Состояние	Визуально
Bz > 0	зелёный, спокойный
Bz < 0	оранжевый, более “агрессивный”
Bz ≈ 0	центр + слабое свечение


⸻

8. Secondary Info (строка снизу)

Пример:

Northward IMF · Stable magnetosphere
Coupling: CLOSED

Правило:
	•	текст вторичен
	•	визуал первичен

⸻

9. SVG структура (реализация)

<svg viewBox="0 0 600 120">

  <defs>
    <filter id="glow">...</filter>
    <pattern id="noise">...</pattern>
  </defs>

  <!-- Panel -->
  <rect id="panel" ... />

  <!-- Scale -->
  <g id="scale">
    <g id="ticks_minor"/>
    <g id="ticks_major"/>
    <g id="labels"/>
  </g>

  <!-- Zero -->
  <line id="zero_line"/>

  <!-- Indicator -->
  <g id="indicator" transform="translate(x,0)">
    <line class="main"/>
    <line class="glow" filter="url(#glow)"/>
  </g>

  <!-- Glass -->
  <g id="glass"/>

</svg>


⸻

10. API компонента (JS)

type IMFControlProps = {
  bz: number;
  bt?: number;
  solarWind?: number;
  pressure?: number;
};

function renderIMFControl(el: HTMLElement, props: IMFControlProps): void;
function updateIMFControl(el: HTMLElement, props: IMFControlProps): void;


⸻

11. Ограничения
	•	не использовать bitmap textures
	•	всё через SVG / CSS
	•	адаптивность: min width = 300px
	•	FPS-safe (анимация лёгкая)

⸻

12. Риски
	1.	Перегруз эффектами → потеря читаемости
	2.	Слишком “UI”, а не “прибор”
	3.	Нечёткая нулевая зона

⸻

13. Расширение (будущее)
	•	добавить history overlay
	•	добавить режим “storm”
	•	добавить звук (щелчки)

⸻

14. Следующий шаг

Дальше логично:
	1.	Сделать Cockpit_23C версию этого же контрола
	2.	Затем:
	•	унифицировать design tokens
	•	собрать первую “Console”
