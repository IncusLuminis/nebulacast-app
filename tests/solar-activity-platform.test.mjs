import test from "node:test";
import assert from "node:assert/strict";
import { mountSolarActivity } from "../sites/staging/helio/widgets/solar-activity/solar-activity.js";

function createClassList() {
  const values = new Set();
  return {
    add(...names) { names.forEach(name => values.add(name)); },
    contains(name) { return values.has(name); },
  };
}

function createDocument() {
  const documentRef = {
    head: null,
    styles: new Map(),
    getElementById(id) { return this.styles.get(id) || null; },
    createElement(tagName) {
      const item = {
        ownerDocument: documentRef,
        tagName: tagName.toUpperCase(),
        classList: createClassList(),
        dataset: {},
        style: {},
        children: [],
        textContent: "",
        append(...children) { children.forEach(child => this.appendChild(child)); },
        appendChild(child) {
          child.parentElement = this;
          this.children.push(child);
          if (child.id) documentRef.styles.set(child.id, child);
          return child;
        },
        replaceChildren(...children) { this.children = []; children.forEach(child => this.appendChild(child)); },
        querySelectorAll(selector) {
          const found = [];
          const visit = node => {
            for (const child of node.children) {
              if (selector.startsWith(".") && child.classList.contains(selector.slice(1))) found.push(child);
              visit(child);
            }
          };
          visit(this);
          return found;
        },
        set id(value) { this._id = String(value); documentRef.styles.set(this._id, this); },
        get id() { return this._id || ""; },
      };
      Object.defineProperty(item, "className", {
        set(value) { String(value).split(/\s+/).filter(Boolean).forEach(name => item.classList.add(name)); },
        get() { return ""; },
      });
      return item;
    },
  };
  documentRef.head = documentRef.createElement("head");
  return documentRef;
}

function createRoot(documentRef) {
  const root = documentRef.createElement("section");
  root.replaceChildren = root.replaceChildren.bind(root);
  return root;
}

function createContext() {
  return {
    get() { return { observer: {}, time: {} }; },
    subscribe() { return () => {}; },
    update() {},
  };
}

function createData(updatedUtc = new Date().toISOString()) {
  return {
    schema_version: "helio_now/v1",
    updated_utc: updatedUtc,
    metrics: {
      xray_class: "M2.0",
      xray_flux_wm2: 0.00002,
      xray_history_1h: [{ flux: 0.00001 }, { flux: 0.00002 }],
      solar_wind_kms: 420,
      density: 4.2,
      pressure_npa: 1.5,
      imf_bz_nt: -2,
      imf_bt_nt: 5,
      wind_history_1h: [{ kms: 400 }, { kms: 420 }],
    },
    scales: { r_scale: "R1" },
    chain_panel: { sun: { label: "Elevated", severity: "moderate" } },
    observer_impacts: [{ kind: "solar_activity", summary: "<script>observer-safe</script>" }],
    timeline: [{
      event_type: "solar_flare",
      event_title: "M-class flare",
      event_time: "2026-09-15T08:00:00Z",
      level: "watch",
      severity_label: "M2",
      description: "<img src=x onerror=alert(1)>",
    }],
  };
}

async function settle() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

function textTree(node) {
  return String(node.textContent || "") + node.children.map(textTree).join("");
}

test("Solar Activity consumes helio_now/v1 and renders three safe columns", async () => {
  const documentRef = createDocument();
  const root = createRoot(documentRef);
  const states = [];
  const instance = await mountSolarActivity(root, createContext(), { data: createData(), orientation: "horizontal" }, {
    setState(state) { states.push(state); },
  });
  await settle();
  assert.equal(root.classList.contains("nc-solar-activity"), true);
  assert.equal(root.dataset.orientation, "horizontal");
  assert.equal(root.querySelectorAll(".nc-solar-activity__column").length, 3);
  assert.match(textTree(root), /<img src=x onerror=alert\(1\)>/);
  assert.deepEqual(states, ["loading", "ready"]);
  instance.update({ orientation: "vertical" });
  assert.equal(root.dataset.orientation, "vertical");
  instance.destroy();
  assert.equal(root.children.length, 0);
});

test("Solar Activity exposes stale and error states without crashing the host", async () => {
  const documentRef = createDocument();
  const staleRoot = createRoot(documentRef);
  const staleStates = [];
  const stale = await mountSolarActivity(staleRoot, createContext(), { data: createData("2020-01-01T00:00:00Z") }, {
    setState(state) { staleStates.push(state); },
  });
  await settle();
  assert.equal(textTree(staleRoot).includes("Stale data"), true);
  assert.equal(staleStates.at(-1), "stale");
  stale.destroy();

  const errorRoot = createRoot(documentRef);
  const errorStates = [];
  const error = await mountSolarActivity(errorRoot, createContext(), { data: { schema_version: "wrong" } }, {
    setState(state) { errorStates.push(state); },
  });
  await settle();
  assert.match(textTree(errorRoot), /Invalid helio_now\/v1 dataset/);
  assert.equal(errorStates.at(-1), "error");
  error.destroy();
});
