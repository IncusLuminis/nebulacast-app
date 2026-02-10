	1.	Как добавить кнопку на канвас (и чтобы она нормально жила с layout/resize)

Мини-архитектура.
Кнопки/оверлеи физически создаются в widget.js (там есть доступ к root, modal, текущим prepared массивам и к hit->modal логике). Стили должны жить централизованно в core/sky.ui.js (через injectStyles()), чтобы UI не расползался по проекту. sky.css трогаем только если это “глобальная” раскладка stage/mount; для мелких UI-элементов лучше sky.ui.js.

Шаги.

A) core/sky.ui.js
	1.	В injectStyles() добавляешь CSS классы кнопки и поповера (например .sky-best-btn, .sky-best-popover, .sky-best-item, …).
	2.	Если нужен DOM-генератор (поповер/панель/список), добавляешь функцию вида buildXxxPopover(data, onPick) и экспортируешь её через export const SkyUI = { ..., buildXxxPopover }.

B) widget.js
	1.	В init() сразу после создания tooltip/modal создаёшь кнопку:

	•	const btn = document.createElement("button")
	•	btn.className = "sky-best-btn"
	•	btn.type = "button"

	2.	Позиционируешь как overlay относительно root:

	•	btn.style.position = "absolute"; right/bottom; zIndex
(у тебя root уже position: relative, это критично; иначе absolute будет привязан не туда).

	3.	root.appendChild(btn)
	4.	Делаешь контроллер видимости (open/close) и обработчики:

	•	btn.onclick toggles popover
	•	click outside/ESC закрывают

	5.	Данные для поповера берёшь из подготовленных массивов, которые уже в widget.js (например objectsPrepared), чтобы UI всегда соответствовал текущему времени/конфигу.
	6.	Клик по элементу поповера должен открывать модал через уже существующую механику:

	•	modal.showFromHit(toUIHit(obj))
а не напрямую генерировать HTML.

C) sky.css / index.html
Обычно не нужны. Исключение: если #skyMount/контейнер не даёт высоту и overlay “уплывает”. Тогда правится stage/mount sizing в sky.css или контейнер в index.html. Но кнопка как таковая добавляется без правок там.

Типовой минимальный блок (куда вставлять):
widget.js → init() → после:
const tooltip = SkyUI.createTooltip(...); const modal = SkyUI.createModal(...);
	2.	Как добавить что-то в модал (и в тултип, если нужно)

Мини-архитектура.
Разметка тултипа и модала генерируется в core/sky.ui.js в одном месте: buildInfoCardHTML(hit, mode) (или эквивалент). Модал в createModal.showFromHit(hit) просто вызывает этот шаблон. Поэтому любые новые поля/секции добавляются именно в buildInfoCardHTML.

Шаги.

A) Убедись, что поле доезжает до UI
Поле должно быть в hit.data (в объекте, который возвращает toUIHit() в widget.js). Обычно ничего делать не надо: toUIHit отдаёт preparedItem как data. Если поле называется note, оно просто доступно как hit.data.note.

B) core/sky.ui.js
	1.	Добавляешь CSS для секции (например .skyui-card__note) в injectStyles().
	2.	В buildInfoCardHTML добавляешь блок:

	•	Для модала только: if (isModal && d.note) ...
	•	Или для обоих (тултип+модал), если ок показывать всегда.

	3.	Важно: экранируй текст через esc().

Пример логики (словами):
“Если у объекта есть note, добавь внизу карточки разделитель и текст note. В модале это особенно полезно; в тултипе можно оставить, но следить за высотой.”

C) Никаких правок widget.js для контента модала не нужно
Пока ты не меняешь схему hit-объекта. Модал сам перерисуется, потому что showFromHit() строит HTML через общий шаблон.

Практические границы/риски
	•	Если показываешь note и в тултипе, он может стать слишком большим и “липнуть” к краям; тогда включай note только для mode === "modal".
	•	Любые новые вычисляемые поля лучше добавлять на backend/prepare-стадии, а не в UI (UI должен быть “тупым” рендерером).
	•	Не добавляй inline-styles в разные файлы: стили UI держи в sky.ui.js, а геометрию stage/mount — в sky.css.