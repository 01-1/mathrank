// Checks the data and every detail card: unique ids, valid fields, sources and attribution for
// results outside OpenAI's catalog, color legends, and tooltips, in a light desktop view and a
// dark phone-width view.
// usage: node results.test.js [page.html]   (defaults to ../index.html)
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const assert = require("node:assert/strict");
const { JSDOM, VirtualConsole } = require("jsdom");
const html = fs.readFileSync(process.argv[2] || path.join(__dirname, "..", "index.html"), "utf8");

/* Evaluate the page's data block on its own, without the rendering code. */
function pageData(page) {
  const code = page.split("<script>")[1].split("</script>")[0];
  const data = code.slice(code.indexOf("const FIELDS"), code.indexOf("/* Paper links"));
  return vm.runInNewContext(data + ";({ FIELDS, RESULTS })");
}
const { FIELDS, RESULTS } = pageData(html);
const external = RESULTS.filter((r) => r.system);  // results from outside OpenAI's catalog

assert.equal(new Set(RESULTS.map((r) => r.id)).size, RESULTS.length, "result ids are unique");
for (const r of RESULTS) {
  assert(FIELDS.some(([id]) => id === r.f), `${r.id}: unknown field ${r.f}`);
  assert(Number.isFinite(r.sig) && Number.isFinite(r.diff), `${r.id}: scores are numbers`);
  if (r.implied) assert(RESULTS.some((x) => x.id === r.implied), `${r.id}: implied by a missing result`);
}
for (const r of external) assert(r.date && r.papers && r.papers.length, `${r.id}: has a date and sources`);
console.log(`ok   data: ${RESULTS.length} results, ${external.length} from outside OpenAI's catalog`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run({ dark, width }) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message));
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      Object.defineProperty(w.HTMLElement.prototype, "clientWidth", { get() { return this.id === "map" ? width : 0; } });
      Object.defineProperty(w.HTMLElement.prototype, "clientHeight", { get() { return this.id === "map" ? 640 : 0; } });
      w.HTMLCanvasElement.prototype.getContext = () => ({ measureText: (t) => ({ width: t.length * 6.5 }) });
      w.matchMedia = (q) => ({ matches: dark, media: q, addEventListener() {} });
      w.addEventListener("error", (e) => errors.push(e.message));
    },
  });
  const w = dom.window, d = w.document;
  const top = () => [...d.querySelectorAll("#map .layer")].at(-1);
  const click = (e) => e.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  const route = async (id) => { w.location.hash = "#/" + id; await sleep(18); };
  const pickColor = async (v) => { click(d.querySelector(`.seg[data-key="color"] button[data-v="${v}"]`)); await sleep(5); };
  const view = `${dark ? "dark" : "light"}, ${width}px`;
  await sleep(30);

  assert.equal(d.querySelector("#count").textContent, String(RESULTS.length), "header count");
  for (const r of RESULTS) {
    await route(r.id);
    const card = top().querySelector(".detail");
    assert(card, `${r.id}: detail card`);
    assert.equal(card.querySelectorAll(".sc").length, 2, `${r.id}: Impact and Difficulty`);
    assert(!/undefined|NaN/.test(card.textContent), `${r.id}: no undefined/NaN`);
    assert(card.querySelector(".links a") || ["ym", "ns"].includes(r.id), `${r.id}: links its papers`);
    if (r.system) {
      assert(card.textContent.includes(r.system) && card.textContent.includes(r.date), `${r.id}: attribution and date`);
      assert(!card.querySelector(".kicker").textContent.includes("catalog"), `${r.id}: no OpenAI catalog claim`);
      assert.equal(card.querySelector(".links").children.length, r.papers.length, `${r.id}: its own sources`);
    }
  }
  console.log(`ok   all ${RESULTS.length} detail cards (${view})`);

  // Claims stay scoped to what was actually shown.
  await route("jacobian");
  assert.match(top().textContent, /does not settle the two-dimensional/);
  await route("alphaevolve-kissing");
  assert.match(top().textContent, /not the exact kissing number/);

  // Tooltips carry attribution and date. jsdom's MouseEvent has no pointerType, so set it.
  await route("ag");
  const ev = new w.MouseEvent("pointermove", { bubbles: true, clientX: 50, clientY: 50 });
  Object.defineProperty(ev, "pointerType", { value: "mouse" });
  top().querySelector('.leaf[data-id="jacobian"]').dispatchEvent(ev);
  assert.match(d.querySelector(".tip").textContent, /Claude Fable/);
  assert.match(d.querySelector(".tip").textContent, /Jul 19, 2026/);

  for (const color of ["diff", "impact", "lean", "review", "rel"]) {
    await pickColor(color);
    assert(!/undefined|NaN/.test(d.querySelector("#legend").textContent), `legend for color=${color}`);
    if (color === "rel") assert.match(d.querySelector("#legend").textContent, /Before Sep 2026/);
    for (const r of external) {
      await route(r.id);
      assert(top().querySelector(".dband").style.background, `${r.id}: color band for color=${color}`);
    }
  }
  console.log(`ok   provenance, tooltips and every color legend (${view})`);

  assert.equal(errors.length, 0, errors.join("\n"));
  dom.window.close();
}

(async () => {
  await run({ dark: false, width: 1100 });
  await run({ dark: true, width: 390 });
  console.log("\nALL PASSED");
})().catch((e) => { console.error(e); process.exit(1); });
