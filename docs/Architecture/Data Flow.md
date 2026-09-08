// ПРИНЦИП: Как данные из JSON попадают в UI компоненты

// ============================================================
// ШАГ 1: ЗАГРУЗКА - JSON превращается в JS объект
// ============================================================

const objects = await Data.loadObjectsToday('/sky');

// Теперь objects = [
//   { name: "Jupiter", mag: -2.5, altDeg: 30, score: 85 },
//   { name: "M31", mag: 3.4, altDeg: 45, score: 72 },
//   ...
// ]


// ============================================================
// ШАГ 2: ИЗВЛЕЧЕНИЕ - Берем нужные поля
// ============================================================

// Для одного объекта:
const obj = objects[0];
const title = obj.name;        // "Jupiter"
const brightness = obj.mag;    // -2.5
const height = obj.altDeg;     // 30

// Для списка объектов:
const topObjects = objects
  .filter(o => o.score > 70)   // Фильтруем
  .sort((a, b) => b.score - a.score); // Сортируем


// ============================================================
// ШАГ 3: ФОРМАТИРОВАНИЕ - Превращаем в текст для показа
// ============================================================

// Простое форматирование:
const magText = `Mag ${brightness.toFixed(1)}`;  // "Mag -2.5"
const altText = `Alt ${height}°`;                 // "Alt 30°"

// Сложное форматирование (функция):
function formatObject(obj) {
  return {
    name: obj.name,
    details: `${obj.mag?.toFixed(1)} · ${obj.altDeg}°`,
    scorePercent: obj.score + "%"
  };
}

const formatted = formatObject(obj);
// formatted = { name: "Jupiter", details: "-2.5 · 30°", scorePercent: "85%" }


// ============================================================
// ШАГ 4: ВСТАВКА В UI - 3 способа
// ============================================================

// СПОСОБ А: Tooltip (HTML строка)
// --------------------------------
function showTooltip(obj) {
  const html = `
    <div class="tooltip">
      <div class="name">${obj.name}</div>
      <div class="mag">Mag ${obj.mag}</div>
      <div class="alt">Alt ${obj.altDeg}°</div>
    </div>
  `;
  
  tooltip.innerHTML = html; // Вставляем готовый HTML
  tooltip.style.display = 'block';
}

showTooltip(objects[0]);


// СПОСОБ Б: Popover (список объектов → HTML)
// -------------------------------------------
function buildRankingHTML(objects) {
  // Для каждого объекта строим HTML
  const rows = objects.map(obj => `
    <div class="row">
      <span class="name">${obj.name}</span>
      <div class="bar" style="width: ${obj.score}%"></div>
      <span class="value">${obj.score}</span>
    </div>
  `);
  
  // Склеиваем все строки
  return rows.join('');
}

const html = buildRankingHTML(topObjects);
popover.content = html; // Web component вставит это в Shadow DOM


// СПОСОБ В: Modal/Card (объект данных → компонент сам рендерит)
// --------------------------------------------------------------
function buildCardData(obj) {
  // Возвращаем структурированные данные
  return {
    title: obj.name,
    note: obj.note || "",
    coordsText: `RA ${obj.ra_deg}° · DEC ${obj.dec_deg}°`,
    metaText: `Mag ${obj.mag} · Alt ${obj.altDeg}°`
  };
}

const cardData = buildCardData(objects[0]);
skyCard.open(cardData); // Компонент сам разложит данные по элементам

// Внутри sky-card.js:
// this._title.textContent = cardData.title;
// this._note.textContent = cardData.note;
// this._coords.textContent = cardData.coordsText;


// ============================================================
// ПОЛНАЯ ЦЕПОЧКА (визуально)
// ============================================================

/*

objects_today.json
   │
   │ fetch("/sky/data/objects_today.json")
   ↓
[{name: "Jupiter", mag: -2.5, altDeg: 30, score: 85}]  ← JS массив объектов
   │
   │ const obj = objects[0]
   │ const name = obj.name
   │ const mag = obj.mag
   ↓
{title: "Jupiter", details: "Mag -2.5 · Alt 30°"}  ← Отформатированные данные
   │
   │ popover.content = `<div>${title}</div><div>${details}</div>`
   │ ИЛИ
   │ skyCard.open({title, details})
   ↓
<div class="tooltip">
  <div class="name">Jupiter</div>        ← Отображается в браузере
  <div class="details">Mag -2.5 · Alt 30°</div>
</div>

*/


// ============================================================
// РЕАЛЬНЫЙ ПРИМЕР ИЗ widget.js
// ============================================================

// При клике на объект на карте:
canvas.addEventListener('click', (e) => {
  const hit = findObjectAt(e.x, e.y); // Находим что кликнули
  
  if (hit) {
    const obj = hit.data; // Данные объекта из JSON
    
    // Вариант 1: Показать tooltip
    const tooltipHTML = `
      <strong>${obj.name}</strong><br>
      Mag ${obj.mag?.toFixed(1) || '—'}<br>
      Alt ${obj.altDeg?.toFixed(0)}°
    `;
    tooltip.innerHTML = tooltipHTML;
    
    // Вариант 2: Открыть card
    const cardData = {
      title: obj.name,
      note: obj.note,
      metaText: `${obj.type} · ${obj.constellation}`
    };
    skyCard.open(cardData);
  }
});

// При клике на кнопку "Best Tonight":
btnBestTonight.addEventListener('click', () => {
  // Берем ВСЕ объекты и фильтруем лучшие
  const best = objectsToday
    .filter(o => o.score > 60)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Топ 10
  
  // Строим HTML таблицу
  const rows = best.map(obj => `
    <div class="row">
      <span>${obj.name}</span>
      <span>${obj.mag?.toFixed(1)}</span>
      <div class="bar"><div style="width:${obj.score}%"></div></div>
    </div>
  `).join('');
  
  // Показываем в popover
  popover.content = `<div class="ranking">${rows}</div>`;
  popover.open(buttonElement);
});