import { payoffs, pStar, bFlip, shareAt, timeTo, simulate, PAPER, fmt } from "./math.js";
const $ = (id) => document.getElementById(id);
const pct = (x) => (x * 100).toFixed(x < 0.1 ? 1 : 0) + "%";
const PRESETS = {
  paper: { b: 2, c: 1, s: 1, p: 60, x0: 10 },
  flip: { b: 2.35, c: 1, s: 1, p: 60, x0: 10 },
  pilot: { b: 2.4, c: 1, s: 1, p: 60, x0: 10 },
  harsh: { b: 2, c: 3, s: 1, p: 60, x0: 10 },
};
const read = () => ({ b: +$("b").value, c: +$("c").value, s: +$("s").value, p: +$("p").value / 100, x0: +$("x0").value / 100 });
const clearPresets = () => document.querySelectorAll("[data-preset]").forEach((e) => e.setAttribute("aria-pressed", "false"));

function trajectory(v, pay) {
  const W = 640, H = 260, L = 44, R = 12, T = 12, B = 34, tMax = 100;
  const x = (t) => L + (t / tMax) * (W - L - R), y = (q) => T + (1 - q) * (H - T - B);
  let s = "";
  for (const g of [0, 0.25, 0.5, 0.75, 1]) s += `<line x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}" stroke="var(--line)"/><text x="4" y="${y(g) + 4}">${g * 100}%</text>`;
  for (const t of [0, 25, 50, 75, 100]) s += `<text x="${x(t) - 8}" y="${H - 16}">${t}</text>`;
  s += `<text x="${W / 2 - 40}" y="${H - 2}">generations</text>`;
  const pts = Array.from({ length: 101 }, (_, t) => `${t ? "L" : "M"}${x(t)},${y(shareAt(v.x0, pay.gap, t))}`).join("");
  s += `<path d="${pts}" fill="none" stroke="var(--acc)" stroke-width="3"/>`;
  const sim = simulate({ pay, x0: v.x0, N: 1000, T: tMax, every: 100, seed: 7 });
  for (const q of sim) s += `<circle cx="${x(q.t)}" cy="${y(q.x)}" r="3" fill="var(--fg)" opacity=".75"/>`;
  $("traj").innerHTML = s;
}

function lever(v) {
  const W = 640, H = 240, L = 44, R = 12, T = 12, B = 34, bMax = 6, bMin = 0.5;
  const x = (b) => L + ((b - bMin) / (bMax - bMin)) * (W - L - R), y = (q) => T + (1 - q) * (H - T - B);
  let s = "";
  for (const g of [0, 0.5, 1]) s += `<line x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}" stroke="var(--line)"/><text x="4" y="${y(g) + 4}">${g * 100}%</text>`;
  for (const b of [1, 2, 3, 4, 5, 6]) s += `<text x="${x(b) - 4}" y="${H - 16}">${b}</text>`;
  s += `<text x="${W / 2 - 60}" y="${H - 2}">reward for a correct prediction</text>`;
  const pts = [];
  for (let b = bMin; b <= bMax + 1e-9; b += 0.05) pts.push(`${pts.length ? "L" : "M"}${x(b)},${y(Math.min(1, pStar({ ...v, b })))}`);
  s += `<path d="${pts.join("")}" fill="none" stroke="var(--acc)" stroke-width="3"/>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${y(v.p)}" y2="${y(v.p)}" stroke="var(--mut)" stroke-dasharray="6 5"/>`;
  s += `<circle cx="${x(v.b)}" cy="${y(Math.min(1, v.p))}" r="6" fill="var(--acc)"/>`;
  $("lever").innerHTML = s;
}

function render() {
  const v = read(), pay = payoffs(v), ps = pStar(v), bf = bFlip(v);
  $("bo").textContent = v.b.toFixed(2); $("co").textContent = v.c.toFixed(1); $("so").textContent = v.s.toFixed(1);
  $("po").textContent = pct(v.p); $("xo").textContent = pct(v.x0);
  const win = pay.gap > 0, tie = Math.abs(pay.gap) < 1e-9;
  const end = shareAt(v.x0, pay.gap, 100);
  $("head").innerHTML = `After 100 generations, <span class="${tie ? "warn" : win ? "good" : "bad"}">${pct(end)}</span> are testable`;
  const t = timeTo(v.x0, 0.5, pay.gap);
  $("verdict").innerHTML = tie ? `<span class="chip warn">Exactly balanced: nobody has a reason to switch.</span>`
    : win ? `<span class="chip good">Testing pays.</span> Half the field is testable after ${t === null ? "never" : t.toFixed(1)} generations.`
      : `<span class="chip bad">Untestable stories pay more.</span> Testable research dies out unless the reward rises above ${bf.toFixed(2)}.`;
  $("sF").textContent = fmt(pay.piF, 2); $("sP").textContent = fmt(pay.piP, 2);
  $("sT").textContent = ps > 1 ? "above 100%" : pct(ps);
  $("sB").textContent = fmt(bf, 3);
  trajectory(v, pay); lever(v);
}

function checks() {
  const pay = payoffs(PAPER), pilot = payoffs({ ...PAPER, b: 2.4 });
  const rows = [
    ["Threshold p* (abstract)", pStar(PAPER), 0.6667],
    ["Payoff, testable (4.2)", pay.piF, 0.8],
    ["Payoff, untestable (4.2)", pay.piP, 1.0],
    ["Payoff gap (4.4)", pay.gap, -0.2],
    ["Flip point b (4.5)", bFlip(PAPER), 2.3333],
    ["Pilot payoff at b 2.4 (7e)", pilot.piF, 1.04],
    ["Pilot gap (7e)", pilot.gap, 0.04],
    ["Generations 10% to 50% (7e)", timeTo(0.1, 0.5, pilot.gap), 54.9],
  ];
  $("chkT").innerHTML = "<tr><th>Result</th><th>Paper</th><th>This page</th><th></th></tr>" + rows.map(([n, got, want]) => {
    const ok = Math.abs(got - want) < 0.05 * Math.max(Math.abs(want), 0.01) + 1e-4;
    return `<tr><td>${n}</td><td>${want}</td><td>${fmt(got, 4)}</td><td class="${ok ? "good" : "warn"}">${ok ? "matches" : "differs"}</td></tr>`;
  }).join("");
}

function apply(name) {
  const p = PRESETS[name];
  for (const k of Object.keys(p)) $(k).value = p[k];
  clearPresets();
  document.querySelector(`[data-preset="${name}"]`).setAttribute("aria-pressed", "true");
  render();
}
document.querySelectorAll("[data-preset]").forEach((e) => e.addEventListener("click", () => apply(e.dataset.preset)));
for (const id of ["b", "c", "s", "p", "x0"]) $(id).addEventListener("input", () => { clearPresets(); render(); });
apply("paper");
checks();
