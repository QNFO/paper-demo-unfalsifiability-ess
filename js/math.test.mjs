import assert from "node:assert/strict";
import test from "node:test";
import { payoffs, pStar, bFlip, shareAt, timeTo, simulate, PAPER } from "./math.js";
const near = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);
test("abstract: threshold, payoffs, gap, flip point", () => {
  near(pStar(PAPER), 2 / 3, 1e-9);
  const pay = payoffs(PAPER);
  near(pay.piF, 0.8); near(pay.piP, 1.0); near(pay.gap, -0.2);
  near(bFlip(PAPER), 7 / 3, 1e-9);
});
test("flip point makes the payoff gap zero and p equal p*", () => {
  const b = bFlip(PAPER);
  near(payoffs({ ...PAPER, b }).gap, 0, 1e-12);
  near(pStar({ ...PAPER, b }), PAPER.p, 1e-12);
});
test("section 7(e): pilot b=2.4 gives pi_F 1.04, gap +0.04, 54.9 generations from 0.1 to 0.5", () => {
  const pay = payoffs({ ...PAPER, b: 2.4 });
  near(pay.piF, 1.04); near(pay.gap, 0.04);
  near(timeTo(0.1, 0.5, pay.gap), 54.93, 0.01);
});
test("timeTo refuses the wrong direction", () => assert.equal(timeTo(0.1, 0.5, -0.2), null));
test("closed form is the logistic solution", () => {
  near(shareAt(0.1, 0.04, 0), 0.1, 1e-12);
  near(shareAt(0.1, 0.04, Math.log(9) / 0.04), 0.5, 1e-9);
});
test("finite population follows the replicator curve", () => {
  const pay = payoffs({ ...PAPER, b: 2.4 });
  const run = simulate({ pay, x0: 0.1, N: 4000, T: 100, seed: 3 });
  near(run[run.length - 1].x, shareAt(0.1, pay.gap, 100), 0.05);
  const down = simulate({ pay: payoffs(PAPER), x0: 0.1, N: 4000, T: 50, seed: 5 });
  near(down[down.length - 1].x, shareAt(0.1, -0.2, 50), 0.03);
});
