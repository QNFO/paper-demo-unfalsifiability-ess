// Two-strategy evolutionary game from the paper: Falsifiable (F) vs Post-hoc (P). Pure functions, no DOM.
// pi_F = p*b - (1-p)*c ; pi_P = s ; replicator: dx/dt = x(1-x)(pi_F - pi_P), x = share playing F.
export const payoffs = ({ b, c, s, p }) => {
  const piF = p * b - (1 - p) * c, piP = s;
  return { piF, piP, gap: piF - piP };
};
/** Smallest accuracy at which F is individually rational: p* = (s+c)/(b+c). */
export const pStar = ({ b, c, s }) => (s + c) / (b + c);
/** Smallest prediction reward that makes F pay: b_flip = (s + (1-p)c)/p. */
export const bFlip = ({ c, s, p }) => (s + (1 - p) * c) / p;
export const logit = (x) => Math.log(x / (1 - x));
/** Closed-form logistic solution of the replicator equation. */
export const shareAt = (x0, gap, t) => 1 / (1 + ((1 - x0) / x0) * Math.exp(-gap * t));
/** Generations for the F share to go from x0 to x1; null when the gap points the wrong way. */
export function timeTo(x0, x1, gap) {
  if (!gap) return null;
  const t = (logit(x1) - logit(x0)) / gap;
  return t >= 0 ? t : null;
}
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Finite population of N researchers using proportional imitation: pick a random peer, copy it with
 *  probability dt * (peer payoff - own payoff) when that is positive. Mean-field limit is the replicator equation. */
export function simulate({ pay, x0, N = 1000, T = 100, dt = 0.05, seed = 1, every = 20 }) {
  const rnd = mulberry32(seed);
  const nF0 = Math.round(x0 * N);
  const isF = new Uint8Array(N);
  for (let i = 0; i < nF0; i++) isF[i] = 1;
  let nF = nF0;
  const out = [{ t: 0, x: nF / N }];
  const steps = Math.round(T / dt);
  for (let k = 1; k <= steps; k++) {
    const flips = [];
    for (let i = 0; i < N; i++) {
      const j = Math.floor(rnd() * N);
      if (isF[i] === isF[j]) continue;
      const own = isF[i] ? pay.piF : pay.piP, peer = isF[j] ? pay.piF : pay.piP;
      if (peer > own && rnd() < dt * (peer - own)) flips.push(i);
    }
    for (const i of flips) { nF += isF[i] ? -1 : 1; isF[i] ^= 1; }
    if (k % every === 0) out.push({ t: k * dt, x: nF / N });
  }
  return out;
}
export const PAPER = { b: 2, c: 1, s: 1, p: 0.6, x0: 0.1 };
export const fmt = (x, d = 3) => (Math.abs(x) < 0.001 && x !== 0 ? x.toExponential(2) : x.toFixed(d));
