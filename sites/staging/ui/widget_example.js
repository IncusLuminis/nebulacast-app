// widget.js (пример интеграции)
import "./ui/components.js";

export function mountSkyUI(rootEl, api) {
  // api — это твой слой бизнес-логики (включить слой, включить overlay, play/pause и т.д.)
  // тут нет вымышленных методов: просто пример, подставишь свои реальные функции.

  const side = document.createElement("ui-sidepanel");
  side.title = "Layers";
  side.items = [
    { id: "objects", label: "Objects", checked: true, group: "Content" },
    { id: "messier", label: "Messier", checked: true, group: "Content" },
    { id: "ngc", label: "NGC", checked: false, group: "Content" },
    { id: "alerts", label: "Alerts", checked: true, group: "Content" },
    { id: "ranking", label: "Ranking", checked: false, group: "Content" },
    { id: "planets", label: "Planets", checked: true, group: "Content" },
    { id: "sunMoon", label: "Sun/Moon", checked: true, group: "Content" },
  ];
  side.addEventListener("layers:toggle", (e) => {
    const { id, checked } = e.detail;
    // api.setContentLayerEnabled(id, checked);
  });

  const bottom = document.createElement("ui-bottomtoolbar");
  bottom.setAttribute("dense", "");
  bottom.items = [
    { id: "azGrid", title: "Az grid", kind: "toggle", pressed: true, icon: "⌁" },
    { id: "eqGrid", title: "Eq grid", kind: "toggle", pressed: true, icon: "≋" },
    { id: "meridian", title: "Meridian", kind: "toggle", pressed: true, icon: "│" },
    { id: "equator", title: "Equator", kind: "toggle", pressed: true, icon: "—" },
    { id: "ecliptic", title: "Ecliptic", kind: "toggle", pressed: true, icon: "／" },
    { id: "cardinals", title: "Cardinals", kind: "toggle", pressed: true, icon: "🧭" },
  ];
  bottom.addEventListener("toolbar:toggle", (e) => {
    const { id, pressed } = e.detail;
    // api.setOverlayEnabled(id, pressed);
  });

  const pop = document.createElement("ui-popover");
  const modal = document.createElement("ui-modal");
  const player = document.createElement("ui-player");

  player.addEventListener("player:toggle", (e) => {
    const { playing } = e.detail;
    // playing ? api.play() : api.pause();
  });
  player.addEventListener("player:seek", (e) => {
    const { position01 } = e.detail;
    // api.seek01(position01);
  });
  player.addEventListener("player:mute", (e) => {
    const { muted } = e.detail;
    // api.setMuted(muted);
  });

  // Пример: показать popover на кнопке (anchor — реальный элемент в хосте)
  // pop.content = "<b>Hint</b><div>Some text</div>";
  // pop.open(anchorButtonEl, { placement: "top", offset: 10 });

  // Пример: открыть модалку
  // modal.open({ title: "Settings", content: "<div>...</div>" });

  // Монтирование: ты сам решаешь, куда позиционировать (absolute/fixed на стороне хоста)
  rootEl.append(side, bottom, pop, modal, player);

  return { side, bottom, pop, modal, player };
}