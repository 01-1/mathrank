// Drives the page in jsdom: zoom in/out, Esc, controls, nesting, true-scale references, hash routes.
// usage: node treemap.test.js [page.html]   (defaults to ../index.html)
const path = require("path");
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const html = fs.readFileSync(process.argv[2] || path.join(__dirname, "..", "index.html"), "utf8");

const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push("jsdomError: " + (e.stack || e.message)));
vc.on("error", (e) => errors.push("console.error: " + e));

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  url: "https://example.test/index.html",
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(win) {
    const W = 1100, H = 640;
    Object.defineProperty(win.HTMLElement.prototype, "clientWidth", { get() { return this.id === "map" ? W : 0; } });
    Object.defineProperty(win.HTMLElement.prototype, "clientHeight", { get() { return this.id === "map" ? H : 0; } });
    win.HTMLCanvasElement.prototype.getContext = () => ({ font: "", measureText: (t) => ({ width: t.length * 6.5 }) });
    win.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} });
    win.addEventListener("error", (e) => errors.push("window error: " + e.message));
  },
});
const { window } = dom;
const doc = window.document;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (cond, msg) => { console.log((cond ? "ok   " : "FAIL ") + msg); if (!cond) failures++; };
const layers = () => doc.querySelectorAll("#map .layer");
const top = () => layers()[layers().length - 1];
const pathText = () => [...doc.querySelectorAll("#path li")].map((li) => li.textContent).join(" > ");
const stat = () => doc.querySelector("#stat").textContent;
const legend = () => doc.querySelector("#legend").textContent.replace(/\s+/g, " ");
const click = (e) => e.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const colorBtn = (v) => doc.querySelector(`.seg[data-key="color"] button[data-v="${v}"]`);
const sizeBtn = (v) => doc.querySelector(`.seg[data-key="size"] button[data-v="${v}"]`);
const refs = () => [...top().querySelectorAll(".refs .ref")];

(async () => {
  await sleep(50);
  check(layers().length === 1, "one layer at start");
  check(top().querySelectorAll(".group.hit").length === 15, "root shows 15 field groups");
  check(top().querySelectorAll(".group .leaf:not(.nested)").length === 65, "65 top-level result tiles");
  check(doc.querySelector("#count").textContent === "67", "header counts all 67 results");
  check(stat() === "67 results · total Impact 103.8", "root stat (nested not double counted): " + stat());
  const rootNested = () => [...top().querySelectorAll('.leaf[data-id="079"]:not(.nested) .nested')].map((e) => e.dataset.id).sort().join(",");
  check(legend().includes("Area: Difficulty") && legend().includes("Color: Difficulty"), "default: area and color both Difficulty: " + legend());
  check(rootNested() === "074,077", "overview, Difficulty sizing: local smoothing shows its subproblems: " + rootNested());
  click(sizeBtn("impact"));
  await sleep(10);
  check(legend().includes("Area: Impact") && legend().includes("Color: Impact"), "switching size to Impact brings color along: " + legend());
  check(rootNested() === "074,077", "overview, Impact sizing: local smoothing shows its subproblems: " + rootNested());

  // Zoom into Number theory by clicking inside it.
  click(top().querySelector('.group[data-id="nt"] .leaf'));
  await sleep(30);
  check(window.location.hash === "#/nt", "hash after clicking a child: " + window.location.hash);
  await sleep(520);
  check(layers().length === 1, "old layer removed after zoom-in animation");
  check(pathText() === "All results > Number theory", "path: " + pathText());
  const ntLeaves = top().querySelectorAll(".leaf.hit");
  check(ntLeaves.length === 8 && ntLeaves[0].dataset.id === "003", "8 Number theory tiles, quasi-RH largest");

  click(ntLeaves[0]);
  await sleep(560);
  const h2 = top().querySelector(".detail h2");
  check(h2 && h2.textContent === "Quasi-Riemann hypothesis", "detail title");
  check(/#1 of 67/.test(top().textContent) && /0\.22/.test(top().textContent), "detail shows rank and absolute Difficulty 0.22");

  doc.body.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await sleep(560);
  check(window.location.hash === "#/nt" && doc.activeElement && doc.activeElement.dataset.id === "003", "Esc returns to field with focus on the tile we left");
  click(doc.querySelector("#back"));
  await sleep(560);
  check(window.location.hash === "#/" && doc.querySelector("#back").disabled, "Back to root");

  // Nesting: local smoothing contains the two Oct 6 results.
  window.location.hash = "#/an";
  await sleep(80);
  const ls = top().querySelector('.leaf.hit[data-id="079"]');
  const nested = ls ? [...ls.querySelectorAll(".leaf.nested")].map((e) => e.dataset.id).sort() : [];
  check(nested.join(",") === "074,077", "local smoothing tile contains 074 and 077: " + nested);
  check(top().querySelectorAll(".leaf.hit").length === 2, "Analysis has 2 top-level tiles (079, 073)");
  check(stat() === "4 results · total Impact 5.2", "Analysis stat counts nested results but not their Impact: " + stat());
  click(ls.querySelector(".leaf.nested"));
  await sleep(560);
  check(window.location.hash === "#/an/079", "clicking inside local smoothing zooms to it: " + window.location.hash);
  check(/Also covers/.test(top().textContent), "local smoothing card lists what it covers");
  window.location.hash = "#/074";
  await sleep(80);
  check(pathText() === "All results > Real & complex analysis > Local smoothing, Kakeya and restriction > Kakeya in 3D (maximal) and 4D",
    "nested result path: " + pathText());
  check(/Implied by a newer result/.test(top().textContent), "nested result card explains it");
  doc.body.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await sleep(560);
  check(window.location.hash === "#/an/079", "Esc from nested result goes to local smoothing");
  window.location.hash = "#/";
  await sleep(80);

  // Color follows a size change, but any color can still be picked.
  check(legend().includes("Area: Impact") && legend().includes("Color: Impact"), "color still matches Impact size");
  check(!colorBtn("impact").disabled && !colorBtn("diff").disabled, "no color option is disabled");
  click(colorBtn("diff"));
  await sleep(10);
  check(legend().includes("Area: Impact") && legend().includes("Color: Difficulty"), "a different color can still be picked");
  click(sizeBtn("diff"));
  await sleep(10);
  check(legend().includes("Area: Difficulty") && legend().includes("Color: Difficulty"), "size Difficulty brings color along: " + legend());
  check(refs().length === 2 && /Difficulty 10\.0/.test(refs()[0].textContent), "For-scale strip uses Difficulty (RH 10.0)");
  const toggle = doc.querySelector("#refs-toggle");
  check(toggle.checked && !toggle.disabled, "For-scale toggle is on by default");
  toggle.checked = false;
  toggle.dispatchEvent(new window.Event("change", { bubbles: true }));
  await sleep(10);
  check(refs().length === 0 && top().querySelectorAll(".group .leaf:not(.nested)").length === 65, "toggle off hides the strip, map keeps all tiles");
  toggle.checked = true;
  toggle.dispatchEvent(new window.Event("change", { bubbles: true }));
  await sleep(10);
  check(refs().length === 2, "toggle on brings the strip back");
  click(sizeBtn("equal"));
  await sleep(10);
  check(refs().length === 0 && toggle.disabled, "equal sizing: no strip, toggle disabled");
  click(colorBtn("lean"));
  await sleep(10);
  check(legend().includes("Lean proof"), "Lean color legend");
  click(sizeBtn("impact"));
  await sleep(10);
  check(legend().includes("Area: Impact") && legend().includes("Lean proof"), "categorical color survives size change");
  for (const [v, word] of [["review", "Review"], ["rel", "Released"], ["diff", "Difficulty"]]) {
    click(colorBtn(v));
    await sleep(10);
    check(legend().includes(word), `legend for color=${v}`);
  }
  const rh = refs()[0], fp = refs()[1];
  const area = (e) => parseFloat(e.style.width) * parseFloat(e.style.height);
  check(rh && Math.abs(area(rh) / area(fp) - 10 / Math.pow(10, 0.6)) < 0.2, "RH : Fermat/Poincaré areas follow Impact 10 : 4.0");
  // True scale when zoomed in: RH vs local smoothing, by Impact and by Difficulty.
  window.location.hash = "#/an";
  await sleep(80);
  const lsTile = () => top().querySelector('.leaf.hit[data-id="079"]');
  let ratio = area(refs()[0]) / area(lsTile());
  check(Math.abs(ratio / (10 / Math.pow(10, 0.6)) - 1) < 0.08, `zoomed, by Impact: RH is ${ratio.toFixed(2)}× local smoothing (expect ~2.51)`);
  const share = (id) => area(lsTile().querySelector(`.nested[data-id="${id}"]`)) / area(lsTile());
  check(Math.abs(share("077") / 0.501 - 1) < 0.06 && Math.abs(share("074") / 0.355 - 1) < 0.06,
    `nested tiles at true size inside local smoothing: 077 ${share("077").toFixed(3)} (0.501), 074 ${share("074").toFixed(3)} (0.355)`);
  click(sizeBtn("diff"));
  await sleep(10);
  ratio = area(refs()[0]) / area(lsTile());
  check(Math.abs(ratio / (10 / Math.pow(10, 0.4)) - 1) < 0.08, `zoomed, by Difficulty: RH is ${ratio.toFixed(2)}× local smoothing (expect ~3.98)`);
  click(sizeBtn("equal"));
  await sleep(10);
  ratio = area(lsTile()) / area(top().querySelector('.leaf.hit[data-id="073"]'));
  check(Math.abs(ratio / 3 - 1) < 0.08, `equal sizing: local smoothing holds 3 results' worth of area (${ratio.toFixed(2)})`);
  click(sizeBtn("impact"));
  await sleep(10);
  window.location.hash = "#/cv";
  await sleep(80);
  check(top().querySelectorAll(".leaf.hit").length === 3 && refs().length === 2, "small field still shows its tiles beside true-scale references");
  window.location.hash = "#/";
  await sleep(80);

  // Other routes.
  window.location.hash = "#/mp/ym";
  await sleep(80);
  check(/Not in the catalog/.test(top().textContent) && /Under expert review/.test(top().textContent), "Yang–Mills card");
  window.location.hash = "#/pde/ns";
  await sleep(80);
  check(/Disputed/.test(top().textContent), "Navier–Stokes card shows Disputed");
  window.location.hash = "#/nope/zzz";
  await sleep(80);
  check(pathText() === "All results", "unknown route falls back to root");
  window.location.hash = "#how";
  await sleep(80);
  check(pathText() === "All results", "#how anchor leaves the treemap alone");

  check(errors.length === 0, "no script errors" + (errors.length ? "\n" + errors.join("\n") : ""));
  console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
  process.exit(failures ? 1 : 0);
})();
